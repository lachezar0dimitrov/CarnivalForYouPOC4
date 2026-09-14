import * as cheerio from 'cheerio';
import type { ScrapedProduct } from './types';

const USER_AGENT = 'CarnivalForYou-InvoiceImport/1.0 (+internal catalog tool)';

async function get(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Rubies' invoice item codes are the manufacturer's own SKU + a trailing
// size/pack suffix (e.g. "23024M" -> site SKU "23024", "3015463-4000" ->
// site SKU "3015463") that doesn't appear in the site's own product slug —
// confirmed against rubiesuk.com/products/23024 and its search endpoint.
// The exact suffix convention isn't documented anywhere, so rather than one
// "correct" strip rule, we generate several candidates (most-specific
// first) and let the direct-URL / search lookups below settle which one is
// real. A wrong guess just falls through to the next candidate or ends up
// "not_found" — never a silent wrong match, since the admin review sheet
// always includes the matched product_url to double-check against.
export function baseSkuCandidates(itemCode: string): string[] {
  const candidates = new Set<string>();
  candidates.add(itemCode);

  const noTrailingZeros = itemCode.replace(/000$/, '');
  candidates.add(noTrailingZeros);

  const sizeSuffixRe = /(XXL|STD|OS|NS|XS|XL|[SML])$/;
  candidates.add(noTrailingZeros.replace(sizeSuffixRe, ''));
  candidates.add(itemCode.replace(sizeSuffixRe, ''));

  const noDashSuffix = itemCode.replace(/-\d+$/, '');
  candidates.add(noDashSuffix);
  candidates.add(noDashSuffix.replace(/000$/, ''));

  const leadingNum = itemCode.match(/^\d+/);
  if (leadingNum) candidates.add(leadingNum[0]);

  return [...candidates].filter(Boolean).sort((a, b) => b.length - a.length);
}

async function trySearch(site: string, candidate: string): Promise<string | null> {
  const html = await get(`https://www.${site}/search?q=${encodeURIComponent(candidate)}`);
  if (!html) return null;
  const $ = cheerio.load(html);
  const link = $('a[href*="/products/"]').first().attr('href');
  if (!link) return null;
  return new URL(link, `https://www.${site}`).toString();
}

export async function findProductUrl(site: string, itemCode: string): Promise<string | null> {
  const candidates = baseSkuCandidates(itemCode);

  for (const candidate of candidates) {
    const url = `https://www.${site}/products/${encodeURIComponent(candidate)}`;
    const html = await get(url);
    await sleep(300);
    // A missing/unknown Shopify product slug still returns a 200 themed
    // 404 page rather than a real HTTP error, so confirm it actually looks
    // like a product page (an <h1> and an og:image) before trusting it.
    if (html && /og:image/.test(html) && /<h1/i.test(html)) {
      return url;
    }
  }

  for (const candidate of candidates) {
    const found = await trySearch(site, candidate);
    await sleep(300);
    if (found) return found;
  }

  return null;
}

function cleanHtmlText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// This theme's Liquid template leaves a trailing comma when the JSON-LD
// block's last conditional field (e.g. "offers") renders empty — technically
// invalid JSON, so a plain JSON.parse throws on real product pages. Confirmed
// against a live rubiesuk.com page before adding this fallback.
function lenientJsonParse(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    try {
      return JSON.parse(text.replace(/,(\s*[}\]])/g, '$1'));
    } catch {
      return null;
    }
  }
}

type LdProduct = {
  name: string;
  description: string;
  imageUrl: string | null;
  sku: string | null;
};

// rubiesuk.com (Shopify) injects a schema.org Product <script type=
// "application/ld+json"> block with the full untruncated description, the
// manufacturer's own SKU, and the canonical image — far more reliable than
// scraping theme-specific DOM classes or the (often truncated-to-~300-char)
// og:description meta tag. This is the primary source; og:/DOM selectors
// below are only a fallback for pages where it's missing.
function extractLdProduct($: cheerio.CheerioAPI): LdProduct | null {
  let result: LdProduct | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (result) return;
    const data = lenientJsonParse($(el).contents().text());
    if (!data || data['@type'] !== 'Product') return;
    const image = data.image;
    const imageUrl = Array.isArray(image) ? (image[0] as string) : typeof image === 'string' ? image : null;
    result = {
      name: typeof data.name === 'string' ? data.name : '',
      description: typeof data.description === 'string' ? data.description : '',
      imageUrl: imageUrl ?? null,
      sku: typeof data.sku === 'string' ? data.sku : null,
    };
  });
  return result;
}

function toHttps(url: string): string {
  return (url.startsWith('http') ? url : `https:${url}`).replace(/^http:/, 'https:');
}

export async function scrapeProduct(url: string): Promise<ScrapedProduct | null> {
  const html = await get(url);
  if (!html) return null;
  const $ = cheerio.load(html);
  const ld = extractLdProduct($);

  // A bare `$('h1').first()` risks matching the site header's logo h1 (which
  // can contain an inline SVG <style> block — cheerio's .text() doesn't
  // skip <style>/<script> content, so that reads back as raw CSS/JS, not a
  // title). og:title is Shopify-guaranteed and clean, so it's the next
  // fallback after the JSON-LD name above.
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() ?? '';
  let domTitle = '';
  for (const sel of ['.product__title', '.product-single__title', 'h1.product-title', 'h1[itemprop="name"]']) {
    const t = $(sel).first().clone().find('script, style').remove().end().text().trim();
    if (t && t.length < 200) {
      domTitle = t;
      break;
    }
  }
  const title = ld?.name || domTitle || ogTitle;
  if (!title) return null;

  const ogImage = $('meta[property="og:image"]').attr('content')?.trim() || null;
  const imageUrl = ld?.imageUrl ? toHttps(ld.imageUrl) : ogImage ? toHttps(ogImage) : null;

  const descriptionSelectors = [
    '.product__description',
    '.product-single__description',
    '[data-product-description]',
    '.product-description',
    '.rte',
  ];
  let descriptionEn = ld?.description ?? '';
  if (!descriptionEn) {
    for (const sel of descriptionSelectors) {
      const text = cleanHtmlText($(sel).first().html() ?? '');
      if (text.length > 10) {
        descriptionEn = text;
        break;
      }
    }
  }
  if (!descriptionEn) {
    descriptionEn = $('meta[property="og:description"]').attr('content')?.trim() ?? '';
  }

  // Only trust a <select> that is clearly labeled "size" — Shopify storefronts
  // always carry a country/currency localization <select> too (confirmed
  // against a real rubiesuk.com product page), which would otherwise get
  // mistaken for the variant picker and pollute this field with country
  // names instead of real sizes.
  const sizes: string[] = [];
  $('select').each((_, el) => {
    if (sizes.length > 0) return;
    const $select = $(el);
    const nameId = `${$select.attr('name') ?? ''} ${$select.attr('id') ?? ''}`.toLowerCase();
    if (/country|currency|locale/.test(nameId)) return;
    const labelText =
      $(`label[for="${$select.attr('id')}"]`).text() +
      ' ' +
      ($select.closest('.product-form__input, .product-form__option').find('label, legend').text() || '');
    if (!/size/i.test(labelText + nameId)) return;
    $select.find('option').each((__, opt) => {
      const val = $(opt).text().trim();
      if (val && !/please select|select/i.test(val)) sizes.push(val);
    });
  });

  const tags: string[] = [];
  $('nav[aria-label="breadcrumb"] a, .breadcrumb a, .breadcrumbs a').each((_, el) => {
    const text = $(el).text().trim();
    if (text) tags.push(text);
  });

  return { url, title, descriptionEn, sizes, tags, imageUrl, sku: ld?.sku ?? null };
}

export async function downloadImage(
  url: string
): Promise<{ buffer: Buffer; contentType: string | null } | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, contentType: res.headers.get('content-type') };
  } catch {
    return null;
  }
}
