// Rubies invoices are a Shopify-adjacent tabular PDF where every page repeats
// the full company/address letterhead above the item table. pdf-parse's
// default text extraction just concatenates each page's text items in
// content-stream order, which for this invoice's generator is NOT visual
// left-to-right order — columns come out interleaved/scrambled. We instead
// supply a custom `pagerender` that buckets text items by Y position (row)
// and sorts each bucket by X (column), which reconstructs clean
// `field | field | field` rows — verified against the real Rubies invoice
// PDF (Invoice 0000087969) before writing the row regex below.
import fs from 'node:fs';
import pdfParse from 'pdf-parse';
import type { InvoiceLine } from './types';

type TextItem = { transform: number[]; str: string };
type TextContent = { items: TextItem[] };
type PageData = { getTextContent: (opts: unknown) => Promise<TextContent> };

async function renderRowAware(pageData: unknown): Promise<string> {
  const page = pageData as PageData;
  const textContent = await page.getTextContent({
    normalizeWhitespace: false,
    disableCombineTextItems: true,
  });

  const rows = new Map<number, { x: number; str: string }[]>();
  for (const item of textContent.items) {
    const y = Math.round(item.transform[5]);
    const x = item.transform[4];
    let bucketY = y;
    for (const existingY of rows.keys()) {
      if (Math.abs(existingY - y) <= 2) {
        bucketY = existingY;
        break;
      }
    }
    if (!rows.has(bucketY)) rows.set(bucketY, []);
    rows.get(bucketY)!.push({ x, str: item.str });
  }

  const sortedYs = [...rows.keys()].sort((a, b) => b - a); // top to bottom
  return sortedYs
    .map((y) => rows.get(y)!.sort((a, b) => a.x - b.x).map((i) => i.str).join(' | '))
    .join('\n');
}

// A matched item row looks like (after the row-aware reconstruction):
//   "23024M | 1 | 6104430000 | CN | 31.20 | 0.00 | 31.20 | 0.00 | 31.20 | €"
//   "1000636XS000 | 1 | 6211339000 | 14.49 | 0.00 | 14.49 | 0.00 | 14.49 | €"
// i.e. itemCode, qty, [10-digit commodity code]?, [2-letter country]?, then
// exactly 5 decimals (unit price, disc%, net price, VAT rate%, line value)
// before a trailing "€". The commodity code and country are each optional —
// the "please quote shipping" placeholder line has neither.
function parseItemRow(line: string): (InvoiceLine & { hasCommodityCode: boolean }) | null {
  const parts = line.split('|').map((s) => s.trim()).filter(Boolean);
  if (parts.length < 6) return null;

  const itemCode = parts[0].replace(/\s+/g, '');
  if (!itemCode || !/^\d+$/.test(parts[1])) return null;
  const qty = Number(parts[1]);

  let idx = 2;
  let hasCommodityCode = false;
  if (/^\d{6,12}$/.test(parts[idx])) {
    hasCommodityCode = true;
    idx++;
  }
  if (/^[A-Z]{2}$/.test(parts[idx])) idx++; // country of origin, unused

  const nums = parts.slice(idx, idx + 5).map((p) => Number.parseFloat(p));
  if (nums.length < 5 || nums.some((n) => Number.isNaN(n))) return null;
  const [unitPriceEur, , , , lineValueEur] = nums;

  return {
    itemCode,
    qty,
    unitPriceEur,
    lineValueEur,
    referenceDescription: '',
    hasCommodityCode,
  };
}

export type ParsedInvoice = {
  invoiceNo: string | null;
  lines: InvoiceLine[];
  skipped: { itemCode: string; reason: string }[];
};

export async function parseInvoicePdf(pdfPath: string): Promise<ParsedInvoice> {
  const buf = fs.readFileSync(pdfPath);
  const { text } = await pdfParse(buf, { pagerender: renderRowAware });
  const rawLines = text.split('\n').map((l) => l.trim());

  const invoiceNoMatch = text.match(/Invoice No\s*\|\s*(\d+)/);
  const invoiceNo = invoiceNoMatch ? invoiceNoMatch[1] : null;

  const lines: InvoiceLine[] = [];
  const skipped: { itemCode: string; reason: string }[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const parsed = parseItemRow(rawLines[i]);
    if (!parsed) continue;

    // The description is the very next line, unless it's blank, itself an
    // item row, or the repeated page letterhead (a new page starts right
    // after the last item row of the previous page).
    const next = rawLines[i + 1] ?? '';
    const nextIsAnotherRow = parseItemRow(next) != null;
    const nextIsBoilerplate = /^(Rubies Netherlands|Bank Details:)/.test(next);
    const referenceDescription = !nextIsAnotherRow && !nextIsBoilerplate ? next : '';

    const { hasCommodityCode, ...line } = parsed;
    line.referenceDescription = referenceDescription;

    // Zero-value lines are non-product placeholders (e.g. "please quote and
    // charge for shipping") — no commodity code either, confirming it's not
    // a real catalog item.
    if (line.lineValueEur <= 0 && !hasCommodityCode) {
      skipped.push({ itemCode: line.itemCode, reason: 'zero-value / non-product line' });
      continue;
    }

    lines.push(line);
  }

  return { invoiceNo, lines, skipped };
}
