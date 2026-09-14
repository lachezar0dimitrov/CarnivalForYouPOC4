import ExcelJS from 'exceljs';
import path from 'node:path';
import type { ImportRow } from './types';
import type { CategoryOption } from './categories';

const FIXED_COLUMNS: { header: string; key: keyof ImportRow | 'thumbnail'; width: number }[] = [
  { header: 'catalog_number', key: 'catalogNumber', width: 16 },
  { header: 'match_status', key: 'matchStatus', width: 12 },
  { header: 'thumbnail', key: 'thumbnail', width: 14 },
  { header: 'name_en', key: 'nameEn', width: 32 },
  { header: 'name_bg', key: 'nameBg', width: 32 },
  { header: 'description_en', key: 'descriptionEn', width: 40 },
  { header: 'description_bg', key: 'descriptionBg', width: 40 },
  { header: 'sizes', key: 'sizes', width: 16 },
  { header: 'cost_price_eur', key: 'costPriceEur', width: 14 },
  { header: 'rental_price_eur', key: 'rentalPriceEur', width: 16 },
  { header: 'image_file', key: 'imageFile', width: 24 },
  { header: 'product_url', key: 'productUrl', width: 40 },
];

const THUMBNAIL_COL_INDEX = FIXED_COLUMNS.findIndex((c) => c.key === 'thumbnail');
const CATALOG_NUMBER_COL = FIXED_COLUMNS.findIndex((c) => c.key === 'catalogNumber') + 1;
const ROW_HEIGHT = 80;
const CHECK_MARK = 'x';

export async function writeImportWorkbook(
  rows: ImportRow[],
  categories: CategoryOption[],
  thumbDir: string,
  outPath: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Import');

  // One checkbox-style column per active category (name as header, "x" to
  // mark) instead of a single dropdown — a product can genuinely belong to
  // several categories at once (matches the DB's category_ids array).
  const columns = [
    ...FIXED_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width })),
    ...categories.map((c) => ({ header: c.nameBg, key: `cat_${c.id}`, width: 12 })),
  ];
  sheet.columns = columns;
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { wrapText: true, vertical: 'bottom' };

  sheet.getRow(1).getCell(CATALOG_NUMBER_COL).note =
    'Първоначално съдържа кода от фактурата на производителя — презапишете го с истинския номер на физическия етикет преди качване.';

  // Keep the identifying columns in view while scrolling right through the
  // (many) category checkbox columns.
  sheet.views = [{ state: 'frozen', xSplit: FIXED_COLUMNS.length, ySplit: 1 }];

  for (const row of rows) {
    const checkedCols: Record<string, string> = {};
    for (const c of categories) {
      if (row.categories.includes(c.nameBg)) checkedCols[`cat_${c.id}`] = CHECK_MARK;
    }

    const excelRow = sheet.addRow({
      catalogNumber: row.catalogNumber,
      matchStatus: row.matchStatus,
      nameEn: row.nameEn,
      nameBg: row.nameBg,
      descriptionEn: row.descriptionEn,
      descriptionBg: row.descriptionBg,
      sizes: row.sizes,
      costPriceEur: row.costPriceEur,
      rentalPriceEur: row.rentalPriceEur ?? '',
      imageFile: row.imageFile ?? '',
      productUrl: row.productUrl ?? '',
      ...checkedCols,
    });
    excelRow.height = ROW_HEIGHT;
    excelRow.alignment = { wrapText: true, vertical: 'top' };

    if (row.matchStatus !== 'matched') {
      excelRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      });
    }

    if (row.imageFile) {
      const imagePath = path.join(thumbDir, row.imageFile);
      try {
        const imageId = workbook.addImage({ filename: imagePath, extension: 'jpeg' });
        sheet.addImage(imageId, {
          tl: { col: THUMBNAIL_COL_INDEX, row: excelRow.number - 1 },
          ext: { width: 80, height: 80 },
          editAs: 'oneCell',
        });
      } catch {
        // Missing/unreadable thumbnail — the row still has image_file
        // pointing at the original, just no inline preview.
      }
    }
  }

  await workbook.xlsx.writeFile(outPath);
}
