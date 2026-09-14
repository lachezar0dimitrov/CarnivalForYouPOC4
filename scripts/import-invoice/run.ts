import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import sharp from 'sharp';
import { parseInvoicePdf } from './invoicePdf';
import { pickPdfFile } from './pickFile';
import { findProductUrl, scrapeProduct, downloadImage } from './rubiesSite';
import { fetchCategories } from './categories';
import { guessCategoryNames } from './category';
import { translateBatch, type TranslationInput } from './translate';
import { writeImportWorkbook } from './excel';
import type { ImportRow } from './types';

// override: true so project/.env always wins over any same-named variable
// already sitting in the shell/system environment (e.g. VITE_SUPABASE_URL),
// which is what fetchCategories() below needs to reach the real DB.
dotenv.config({ override: true });

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      args[key] = value;
    }
  }
  return args;
}

function extFromContentType(contentType: string | null, fallbackUrl: string): string {
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return 'jpg';
  const urlExt = fallbackUrl.split('?')[0].split('.').pop();
  return urlExt && /^[a-z0-9]{2,4}$/i.test(urlExt) ? urlExt.toLowerCase() : 'jpg';
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const site = args.site ?? 'rubiesuk.com';

  // --pdf stays available for advanced/scripted use, but the default flow
  // is a native "Open File" dialog so no command-line typing is needed.
  let pdfPath = args.pdf;
  if (!pdfPath) {
    console.log('Отваря се диалог за избор на фактура (PDF)...');
    pdfPath = pickPdfFile() ?? undefined;
    if (!pdfPath) {
      console.error('Не е избран файл — прекратено.');
      process.exit(1);
    }
  }
  if (!fs.existsSync(pdfPath)) {
    console.error(`Файлът не е намерен: ${pdfPath}`);
    process.exit(1);
  }

  console.log('Зареждане на категориите от сайта...');
  const categories = await fetchCategories();

  const dateStr = new Date().toISOString().slice(0, 10);
  const outDir = args.out ?? path.join('imports', dateStr);
  const originalDir = path.join(outDir, 'images', 'original');
  const thumbDir = path.join(outDir, 'images', 'thumb');
  fs.mkdirSync(originalDir, { recursive: true });
  fs.mkdirSync(thumbDir, { recursive: true });

  console.log(`Чета фактура: ${pdfPath}`);
  const { invoiceNo, lines, skipped } = await parseInvoicePdf(pdfPath);
  console.log(`Намерени ${lines.length} артикула (пропуснати ${skipped.length} непродуктови реда).`);

  const rows: ImportRow[] = [];
  const translationInputs: TranslationInput[] = [];

  for (const line of lines) {
    process.stdout.write(`  ${line.itemCode} ... `);
    let row: ImportRow = {
      // Seeded with the manufacturer's invoice code — the admin overwrites
      // this in place with the shop's real physical tag number before
      // upload (see catalogNumber's doc comment in types.ts).
      catalogNumber: line.itemCode,
      matchStatus: 'not_found',
      productUrl: null,
      nameEn: line.referenceDescription,
      nameBg: '',
      descriptionEn: '',
      descriptionBg: '',
      sizes: '',
      categories: [],
      costPriceEur: line.unitPriceEur,
      rentalPriceEur: null,
      imageFile: null,
    };

    try {
      const productUrl = await findProductUrl(site, line.itemCode);
      const scraped = productUrl ? await scrapeProduct(productUrl) : null;

      if (!productUrl) {
        console.log('не е намерен на сайта');
      } else if (!scraped) {
        console.log('намерен URL, но страницата не се извлече');
        row.productUrl = productUrl;
      } else {
        const invoiceNum = line.itemCode.match(/^\d+/)?.[0];
        const siteNum = scraped.sku?.match(/^\d+/)?.[0];
        if (invoiceNum && siteNum && invoiceNum !== siteNum) {
          console.log(`\n    ⚠ SKU от сайта (${scraped.sku}) не съвпада с кода от фактурата — провери ${productUrl}`);
        }

        const guessedCategories = guessCategoryNames(categories, scraped.title, scraped.tags, scraped.descriptionEn);

        row = {
          ...row,
          productUrl,
          nameEn: scraped.title || line.referenceDescription,
          descriptionEn: scraped.descriptionEn,
          sizes: scraped.sizes.join(', '),
          categories: guessedCategories,
          matchStatus: scraped.imageUrl ? 'matched' : 'no_image',
        };

        if (scraped.imageUrl) {
          const downloaded = await downloadImage(scraped.imageUrl);
          if (downloaded) {
            const ext = extFromContentType(downloaded.contentType, scraped.imageUrl);
            const filename = `${line.itemCode}.${ext}`;
            fs.writeFileSync(path.join(originalDir, filename), downloaded.buffer);
            const thumbFilename = `${line.itemCode}.jpg`;
            await sharp(downloaded.buffer).resize({ width: 240 }).jpeg({ quality: 80 }).toFile(
              path.join(thumbDir, thumbFilename)
            );
            row.imageFile = filename;
          } else {
            row.matchStatus = 'no_image';
          }
        }

        console.log(row.matchStatus === 'matched' ? 'ОК' : `частично (${row.matchStatus})`);
      }
    } catch (err) {
      console.log(`грешка: ${String(err)}`);
    }

    // Reached for every row, including "not_found" ones — the invoice's own
    // reference description is still worth translating so the admin isn't
    // staring at a blank Bulgarian name for the couple of items the site
    // match failed on.
    if (row.nameEn) {
      translationInputs.push({ index: rows.length, title: row.nameEn, description: row.descriptionEn });
    }
    rows.push(row);
  }

  if (translationInputs.length > 0) {
    console.log(`Превод на ${translationInputs.length} продукта (през claude CLI)...`);
    const translations = await translateBatch(translationInputs);
    for (const [index, t] of translations) {
      rows[index].nameBg = t.nameBg;
      rows[index].descriptionBg = t.descriptionBg;
    }
  }

  const invoiceLabel = invoiceNo ?? path.basename(pdfPath, path.extname(pdfPath));
  const xlsxPath = path.join(outDir, `invoice-${invoiceLabel}.xlsx`);
  await writeImportWorkbook(rows, categories, thumbDir, xlsxPath);
  const absoluteXlsxPath = path.resolve(xlsxPath);

  const matched = rows.filter((r) => r.matchStatus === 'matched').length;
  const needsReview = rows.length - matched;
  console.log('');
  console.log(`Готово: ${absoluteXlsxPath}`);
  console.log(`  ${matched} напълно съвпаднали, ${needsReview} за ръчен преглед.`);
  if (skipped.length > 0) {
    console.log(`  Пропуснати непродуктови редове: ${skipped.map((s) => s.itemCode).join(', ')}`);
  }
  console.log('Попълнете catalog_number (задължително), rental_price_eur и чекбоксовете за категории в Excel-а, преди да го подадете в Админ → Импорт.');

  // Open the sheet in whatever app is associated with .xlsx (Excel, etc.) —
  // best-effort, never fails the run if there's no GUI/no default app. The
  // empty "" is start's window-title argument, required when the target
  // path itself needs quoting.
  exec(`start "" "${absoluteXlsxPath}"`, () => {});
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
