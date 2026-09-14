// "Loader" half of the Rubies-invoice import tool (see scripts/import-invoice
// for the other half, which scrapes rubiesuk.com and produces the .xlsx this
// panel reads). Validates the reviewed sheet's structure — required fields,
// a real category, a matching image file — and only uploads to the site
// when every row is clean, per the client's "check first, only upload if no
// errors" requirement. New rows get is_active + is_new (with new_since, so
// the badge auto-expires after 6 months — see fetchNewProducts in
// src/lib/products.ts) exactly like a manually-created product would.
import { useState } from 'react';
import { Upload, FolderOpen, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { eurToBgn } from '@/lib/products';
import { uploadImage } from '@/lib/r2';
import { fetchAllCategoriesAdmin } from '@/lib/categories';
import { useToast } from '@/components/Toast';

// Everything past product_url is one checkbox column per category — headers
// are the category's Bulgarian name, cell value is "x" (or anything
// truthy) when checked. Modeled with an index signature since the column
// set is dynamic (whatever categories exist in the DB when the sheet was
// generated).
// Every text-ish field is typed `string | number` (not just `string`) —
// SheetJS returns a JS `number` for any cell Excel auto-detected as
// numeric (catalog numbers, item codes, and sizes can all be plain
// digits), and pretending otherwise here is exactly what caused the
// "x.trim is not a function" crash below. Always read these through str().
type SheetRow = {
  catalog_number?: string | number;
  match_status?: string;
  name_en?: string | number;
  name_bg?: string | number;
  description_en?: string | number;
  description_bg?: string | number;
  sizes?: string | number;
  cost_price_eur?: number;
  rental_price_eur?: number | string;
  image_file?: string | number;
  product_url?: string;
} & Record<string, string | number | undefined>;

type RowResult = {
  row: SheetRow;
  rowNumber: number;
  errors: string[];
};

type UploadOutcome = { catalogNumber: string; status: 'ok' | 'error'; message?: string };

// SheetJS gives back a JS `number` (not `string`) for any cell Excel
// auto-detected as numeric — a real problem here since catalog numbers,
// item codes, and sizes can all be plain digits (e.g. "3001059"). Calling
// .trim() straight on row.field crashes with "x.trim is not a function"
// the moment a value happens to be numeric. Always read cells through this.
function str(value: string | number | undefined): string {
  return value == null ? '' : String(value).trim();
}

export default function ImportInvoicePanel() {
  const { lang } = useI18n();
  const { notify } = useToast();

  const [sheetRows, setSheetRows] = useState<SheetRow[] | null>(null);
  const [imageFiles, setImageFiles] = useState<Map<string, File>>(new Map());
  const [validated, setValidated] = useState<RowResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<UploadOutcome[] | null>(null);
  const [categoryIdByName, setCategoryIdByName] = useState<Map<string, number>>(new Map());

  const t = (bg: string, en: string) => (lang === 'bg' ? bg : en);

  const handleXlsx = async (file: File) => {
    // Dynamically imported so the ~500KB xlsx parser only ever loads for an
    // admin who opens this tab, instead of bundling into the main chunk
    // every site visitor downloads (AdminPage is statically imported in
    // App.tsx, so anything imported at this file's top level would ship to
    // the public homepage too).
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet);
    setSheetRows(rows);
    setValidated(null);
    setResults(null);
  };

  const handleImageFolder = (files: FileList) => {
    const map = new Map<string, File>();
    for (const file of Array.from(files)) map.set(file.name, file);
    setImageFiles(map);
    setValidated(null);
  };

  const runValidation = async () => {
    if (!sheetRows) return;
    setChecking(true);
    try {
      const categories = await fetchAllCategoriesAdmin();
      const catIdByName = new Map(categories.map((c) => [c.nameBg, c.id]));
      setCategoryIdByName(catIdByName);

      const catalogNumbers = sheetRows.map((r) => str(r.catalog_number)).filter(Boolean);
      const { data: existing, error } = await supabase
        .from('products')
        .select('old_catalog_number')
        .in('old_catalog_number', catalogNumbers);
      if (error) throw error;
      const existingCatalogNumbers = new Set((existing ?? []).map((r) => r.old_catalog_number as string));

      const seenCatalogNumbers = new Set<string>();
      const rowResults: RowResult[] = sheetRows.map((row, i) => {
        const errors: string[] = [];
        const catalogNumber = str(row.catalog_number);

        if (!catalogNumber) {
          errors.push(t('липсва catalog_number', 'missing catalog_number'));
        } else {
          if (existingCatalogNumbers.has(catalogNumber)) {
            errors.push(t(`каталожен № ${catalogNumber} вече съществува`, `catalog number ${catalogNumber} already exists`));
          }
          if (seenCatalogNumbers.has(catalogNumber)) {
            errors.push(t('дублиран catalog_number в таблицата', 'duplicate catalog_number in sheet'));
          }
          seenCatalogNumbers.add(catalogNumber);
        }

        if (!str(row.name_bg)) errors.push(t('липсва name_bg', 'missing name_bg'));
        if (!str(row.name_en)) errors.push(t('липсва name_en', 'missing name_en'));

        const rentalPrice = Number(row.rental_price_eur);
        if (!row.rental_price_eur || !Number.isFinite(rentalPrice) || rentalPrice <= 0) {
          errors.push(t('липсва/невалидна rental_price_eur', 'missing/invalid rental_price_eur'));
        }

        const checkedCount = [...catIdByName.keys()].filter((name) => Boolean(row[name])).length;
        if (checkedCount === 0) {
          errors.push(t('няма отметната категория', 'no category checked'));
        }

        const imageFile = str(row.image_file);
        if (!imageFile) {
          errors.push(t('липсва image_file', 'missing image_file'));
        } else if (!imageFiles.has(imageFile)) {
          errors.push(t(`файлът ${imageFile} не е сред избраните снимки`, `${imageFile} not found in selected images`));
        }

        return { row, rowNumber: i + 2, errors };
      });

      setValidated(rowResults);
    } catch (err) {
      notify('error', t('Грешка при проверката.', 'Validation failed.'));
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  const hasErrors = validated?.some((r) => r.errors.length > 0) ?? true;

  const runUpload = async () => {
    if (!validated || hasErrors) return;
    setUploading(true);
    setProgress({ done: 0, total: validated.length });
    const outcomes: UploadOutcome[] = [];
    const nowIso = new Date().toISOString();

    for (const { row } of validated) {
      const catalogNumber = str(row.catalog_number);
      try {
        const file = imageFiles.get(str(row.image_file))!;
        const { url: imageUrl } = await uploadImage('product-images', file);

        const catIds = [...categoryIdByName.entries()]
          .filter(([name]) => Boolean(row[name]))
          .map(([, id]) => id);

        const payload = {
          name_bg: str(row.name_bg) || null,
          name_en: str(row.name_en) || null,
          description_bg: str(row.description_bg) || null,
          description_en: str(row.description_en) || null,
          category_id: catIds[0],
          category_ids: catIds,
          price: eurToBgn(Number(row.rental_price_eur)),
          image_url: imageUrl,
          sizes: str(row.sizes) || null,
          is_active: true,
          is_new: true,
          new_since: nowIso,
          old_catalog_number: catalogNumber || null,
          tags: [],
        };

        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        outcomes.push({ catalogNumber, status: 'ok' });
      } catch (err) {
        outcomes.push({ catalogNumber, status: 'error', message: String(err) });
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setResults(outcomes);
    setUploading(false);
    const okCount = outcomes.filter((o) => o.status === 'ok').length;
    notify(
      okCount === outcomes.length ? 'success' : 'error',
      t(`Качени ${okCount}/${outcomes.length} продукта.`, `Uploaded ${okCount}/${outcomes.length} products.`)
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gold-400/15 bg-ink-900/40 p-5">
        <h2 className="mb-1 font-display text-lg font-semibold text-gold-100">
          {t('Импорт от фактура (Rubies UK)', 'Invoice import (Rubies UK)')}
        </h2>
        <p className="mb-4 text-sm text-gray-400">
          {t(
            'Генерирайте таблицата локално с "npm run import:invoice", прегледайте/редактирайте я (включително catalog_number — презапишете го с реалния номер на етикета), после я качете тук заедно с папката със снимки.',
            'Generate the sheet locally with "npm run import:invoice", review/edit it (including catalog_number — overwrite it with the real tag number), then upload it here together with the images folder.'
          )}
        </p>

        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gold-400/25 px-4 py-2.5 text-sm text-gold-200 transition hover:bg-gold-400/10">
            <Upload size={16} />
            {sheetRows ? t(`Таблица: ${sheetRows.length} реда`, `Sheet: ${sheetRows.length} rows`) : t('Избери .xlsx', 'Choose .xlsx')}
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleXlsx(e.target.files[0])}
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gold-400/25 px-4 py-2.5 text-sm text-gold-200 transition hover:bg-gold-400/10">
            <FolderOpen size={16} />
            {imageFiles.size > 0
              ? t(`Снимки: ${imageFiles.size} файла`, `Images: ${imageFiles.size} files`)
              : t('Избери папка images/original', 'Choose images/original folder')}
            <input
              type="file"
              // @ts-expect-error non-standard attribute, supported by Chromium browsers
              webkitdirectory="true"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleImageFolder(e.target.files)}
            />
          </label>

          <button
            type="button"
            disabled={!sheetRows || imageFiles.size === 0 || checking}
            onClick={runValidation}
            className="flex items-center gap-2 rounded-lg bg-gold-400/20 px-4 py-2.5 text-sm font-medium text-gold-100 transition hover:bg-gold-400/30 disabled:opacity-40"
          >
            {checking ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {t('Провери', 'Validate')}
          </button>
        </div>
      </div>

      {validated && (
        <div className="rounded-xl border border-gold-400/15 bg-ink-900/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-gold-100">
              {hasErrors
                ? t('Намерени грешки — нищо не е качено', 'Errors found — nothing uploaded')
                : t('Всичко е наред', 'Everything checks out')}
            </h3>
            <button
              type="button"
              disabled={hasErrors || uploading}
              onClick={runUpload}
              className="flex items-center gap-2 rounded-lg bg-emerald-600/80 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-40"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading
                ? `${progress.done}/${progress.total}`
                : t('Качи в сайта', 'Upload to site')}
            </button>
          </div>

          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-400">
                  <th className="pb-2 pr-4">{t('Ред', 'Row')}</th>
                  <th className="pb-2 pr-4">catalog_number</th>
                  <th className="pb-2">{t('Грешки', 'Errors')}</th>
                </tr>
              </thead>
              <tbody>
                {validated.map((r) => (
                  <tr key={r.rowNumber} className="border-t border-gold-400/10">
                    <td className="py-2 pr-4 text-gray-500">{r.rowNumber}</td>
                    <td className="py-2 pr-4 text-gray-300">{r.row.catalog_number}</td>
                    <td className="py-2">
                      {r.errors.length === 0 ? (
                        <span className="text-emerald-400">{t('ОК', 'OK')}</span>
                      ) : (
                        <span className="flex items-start gap-1.5 text-red-400">
                          <AlertCircle size={14} className="mt-0.5 shrink-0" />
                          {r.errors.join('; ')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results && (
        <div className="rounded-xl border border-gold-400/15 bg-ink-900/40 p-5">
          <h3 className="mb-3 font-display text-base font-semibold text-gold-100">
            {t('Резултат от качването', 'Upload results')}
          </h3>
          <ul className="space-y-1 text-sm">
            {results.map((r) => (
              <li key={r.catalogNumber} className={r.status === 'ok' ? 'text-emerald-400' : 'text-red-400'}>
                {r.catalogNumber}: {r.status === 'ok' ? t('качен', 'uploaded') : r.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
