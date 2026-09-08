// Shared server-side OG/meta composition for /product-detail/:id and
// /en/product-detail/:id — extracted from the original BG-only
// product-detail/[id].js so both language routes stay in sync instead of
// duplicating ~160 lines. See functions/product-detail/[id].js and
// functions/en/product-detail/[id].js, the two thin route files that call
// handleProductDetail() below.
//
// Social/messenger link-preview crawlers (Facebook, WhatsApp, Viber,
// Messenger, X, ...) fetch a URL's raw HTML and read its <meta> tags; they do
// NOT execute JavaScript. The React app's own SEO hook (src/lib/useSEO.ts)
// only edits the DOM after mount, so without this, every shared product link
// would show the generic site-wide OG tags instead of that product's
// photo/title. This rewrites the static index.html's tags with the real
// product data before the response ever leaves the edge.
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

// Kept in sync by hand with SEO_CATEGORY_PHRASE in src/lib/products.ts (that
// file can't be imported here — it pulls in Vite/React-only modules that
// don't run in the Functions runtime).
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

const CATEGORY_PHRASE_EN = {
  2: "women's costume rental",
  3: "men's costume rental",
  4: "girls' costume rental",
  17: "boys' costume rental",
  19: 'kids costume rental',
  10: 'Halloween costume rental',
  20: 'Christmas costume rental',
  5: 'carnival mask rental',
  6: 'party hat rental',
  7: 'wig rental',
  8: 'carnival accessory rental',
};

// Same "is this real English text" threshold as the client-side check in
// src/lib/products.ts's hasMeaningfulEnglishDescription. A product without
// it doesn't get hreflang alternate tags here — its /en/ page still renders
// (falling back to Bulgarian text, same as the client), it just isn't
// advertised as a genuine language pair yet.
function hasMeaningfulEnglishDescription(product) {
  const en = cleanText(product.description_en);
  return en.length > 3 && /[a-zA-Z]/.test(en);
}

function buildMeta(product, origin, pathname, lang) {
  const name =
    lang === 'en'
      ? cleanText(product.name_en) || cleanText(product.name_bg) || `#${product.id}`
      : cleanText(product.name_bg) || cleanText(product.name_en) || `#${product.id}`;
  const phraseTable = lang === 'en' ? CATEGORY_PHRASE_EN : CATEGORY_PHRASE_BG;
  const qualifier = phraseTable[product.category_id] ?? (lang === 'en' ? 'carnival costume rental' : 'карнавален костюм под наем');
  const title = `${name} — ${qualifier} | CarnivalForYou`;

  const bodyText =
    lang === 'en'
      ? cleanText(product.description_en) || cleanText(product.description_bg)
      : cleanText(product.description_bg) || cleanText(product.description_en);
  const price = Number(product.price) > 0 ? `${bgnToEur(Number(product.price))} EUR` : '';
  const parts = [bodyText || `${name} — ${qualifier}.`];
  if (price) {
    parts.push(lang === 'en' ? `From ${price}/day.` : `Наем от ${price}/ден.`);
  }
  parts.push(lang === 'en' ? 'Pick up at our shop in Sofia.' : 'Вземете от магазина в София.');

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

// useSEO sets a canonical client-side, which Google does pick up, but a
// crawler that skips JS sees none at all on the site's most-crawled pages.
// Built from the parsed numeric id rather than the raw path, so it also
// collapses variants like /product-detail/007 onto one canonical URL.
class CanonicalAppender {
  constructor(href) {
    this.href = href;
  }
  element(element) {
    element.append(`<link rel="canonical" href="${this.href}">`, { html: true });
  }
}

// index.html carries a static hreflang pair for the homepage (added for
// non-JS crawlers on / itself) — left in place on every other server-
// rendered page, it would misreport this product page's alternate as the
// homepage. React overwrites it correctly once it mounts, but a non-JS
// crawler reading the raw response never gets that far, so it must be
// stripped here before any product-specific pair is appended.
class ElementRemover {
  element(element) {
    element.remove();
  }
}

// Mirrors useSEO.ts's setLangAlternates for non-JS crawlers — only appended
// when the product has real English content (see
// hasMeaningfulEnglishDescription above), same suppression logic as the
// client.
class AlternateAppender {
  constructor(bgHref, enHref) {
    this.bgHref = bgHref;
    this.enHref = enHref;
  }
  element(element) {
    element.append(`<link rel="alternate" hreflang="bg" href="${this.bgHref}">`, { html: true });
    element.append(`<link rel="alternate" hreflang="en" href="${this.enHref}">`, { html: true });
    element.append(`<link rel="alternate" hreflang="x-default" href="${this.bgHref}">`, { html: true });
  }
}

export async function handleProductDetail(context, lang) {
  const { request, env, params } = context;
  const url = new URL(request.url);

  // Ask the asset layer for "/", not "/index.html": Pages serves clean URLs
  // and answers a request for /index.html with a 301 to /. That redirect came
  // back as `assetResponse`, failed the `.ok` check below, and got returned
  // verbatim — so every direct load of a product page bounced to the home
  // page. Requesting "/" hands back the same index.html with a 200.
  const htmlUrl = new URL(url);
  htmlUrl.pathname = '/';
  htmlUrl.search = '';
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

  const pathname = lang === 'en' ? `/en/product-detail/${numericId}` : `/product-detail/${numericId}`;
  const meta = buildMeta(product, url.origin, pathname, lang);

  const rewriter = new HTMLRewriter()
    .on('link[rel="alternate"]', new ElementRemover())
    .on('head', new CanonicalAppender(meta.url))
    .on('title', new TitleSetter(meta.title))
    .on('meta[name="description"]', new MetaContentSetter(meta.description))
    .on('meta[property="og:title"]', new MetaContentSetter(meta.title))
    .on('meta[property="og:description"]', new MetaContentSetter(meta.description))
    .on('meta[property="og:image"]', new MetaContentSetter(meta.image))
    .on('meta[property="og:url"]', new MetaContentSetter(meta.url))
    .on('meta[property="og:type"]', new MetaContentSetter('product'))
    .on('meta[name="twitter:title"]', new MetaContentSetter(meta.title))
    .on('meta[name="twitter:description"]', new MetaContentSetter(meta.description))
    .on('meta[name="twitter:image"]', new MetaContentSetter(meta.image));

  if (hasMeaningfulEnglishDescription(product)) {
    const bgHref = `${url.origin}/product-detail/${numericId}`;
    const enHref = `${url.origin}/en/product-detail/${numericId}`;
    rewriter.on('head', new AlternateAppender(bgHref, enHref));
  }

  return rewriter.transform(assetResponse);
}
