// Cloudflare Pages Function — runs server-side, before the SPA ever loads.
// Social/messenger link-preview crawlers (Facebook, WhatsApp, Viber,
// Messenger, X, ...) fetch a URL's raw HTML and read its <meta> tags; they do
// NOT execute JavaScript. The React app's own SEO hook (src/lib/useSEO.ts)
// only edits the DOM after mount, so without this function every shared
// product link would show the generic site-wide OG tags instead of that
// product's photo/title. This rewrites the static index.html's tags with the
// real product data before the response ever leaves the edge.
//
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from Cloudflare Pages'
// "Variables and secrets" (already configured there for the build step) —
// Pages exposes that same dashboard config to Functions at request time via
// context.env, so nothing extra needs to be added for this to work.

const BGN_TO_EUR_RATE = 1.95583;
const MARKUP = 1.2;

function bgnToEur(bgn) {
  return Math.round((bgn * MARKUP) / BGN_TO_EUR_RATE);
}

function cleanText(raw) {
  return (raw ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Kept in sync by hand with the bg side of SEO_CATEGORY_PHRASE in
// src/lib/products.ts (that file can't be imported here — it pulls in
// Vite/React-only modules that don't run in the Functions runtime).
const CATEGORY_PHRASE_BG = {
  2: 'дамски костюм под наем',
  3: 'мъжки костюм под наем',
  4: 'костюм за момичета под наем',
  17: 'костюм за момчета под наем',
  19: 'детски костюм под наем',
  10: 'костюм за Хелоуин под наем',
  20: 'коледен костюм под наем',
  5: 'карнавална маска под наем',
  6: 'парти шапка под наем',
  7: 'перука под наем',
  8: 'карнавален аксесоар под наем',
};

function buildMeta(product, origin, pathname) {
  const name = cleanText(product.name_bg) || cleanText(product.name_en) || `#${product.id}`;
  const qualifier = CATEGORY_PHRASE_BG[product.category_id] ?? 'карнавален костюм под наем';
  const title = `${name} — ${qualifier} | CarnivalForYou`;

  const bodyText = cleanText(product.description_bg) || cleanText(product.description_en);
  const price = Number(product.price) > 0 ? `${bgnToEur(Number(product.price))} EUR` : '';
  const parts = [bodyText || `${name} — ${qualifier}.`];
  if (price) parts.push(`Наем от ${price}/ден.`);
  parts.push('Вземете от магазина в София.');

  return {
    title: title.length <= 70 ? title : `${name} — ${qualifier}`,
    description: parts.join(' ').slice(0, 200),
    image: product.image_url,
    url: `${origin}${pathname}`,
  };
}

async function fetchProduct(env, id) {
  const restUrl =
    `${env.VITE_SUPABASE_URL}/rest/v1/products` +
    `?id=eq.${id}&is_active=eq.true&select=id,name_bg,name_en,description_bg,description_en,category_id,price,image_url`;

  const res = await fetch(restUrl, {
    headers: {
      apikey: env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  const product = rows[0];
  if (!product || !product.image_url) return null;
  return product;
}

class MetaContentSetter {
  constructor(value) {
    this.value = value;
  }
  element(element) {
    element.setAttribute('content', this.value);
  }
}

class TitleSetter {
  constructor(value) {
    this.value = value;
  }
  element(element) {
    element.setInnerContent(this.value);
  }
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);

  const htmlUrl = new URL(url);
  htmlUrl.pathname = '/index.html';
  const assetResponse = await env.ASSETS.fetch(new Request(htmlUrl.toString(), request));

  const numericId = Number(params.id);
  if (!assetResponse.ok || !Number.isFinite(numericId)) return assetResponse;

  let product;
  try {
    product = await fetchProduct(env, numericId);
  } catch {
    return assetResponse;
  }
  if (!product) return assetResponse;

  const meta = buildMeta(product, url.origin, url.pathname);

  return new HTMLRewriter()
    .on('title', new TitleSetter(meta.title))
    .on('meta[name="description"]', new MetaContentSetter(meta.description))
    .on('meta[property="og:title"]', new MetaContentSetter(meta.title))
    .on('meta[property="og:description"]', new MetaContentSetter(meta.description))
    .on('meta[property="og:image"]', new MetaContentSetter(meta.image))
    .on('meta[property="og:url"]', new MetaContentSetter(meta.url))
    .on('meta[property="og:type"]', new MetaContentSetter('product'))
    .on('meta[name="twitter:title"]', new MetaContentSetter(meta.title))
    .on('meta[name="twitter:description"]', new MetaContentSetter(meta.description))
    .on('meta[name="twitter:image"]', new MetaContentSetter(meta.image))
    .transform(assetResponse);
}
