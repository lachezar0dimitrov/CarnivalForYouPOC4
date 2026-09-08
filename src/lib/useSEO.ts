import { useEffect } from 'react';

type SEOParams = {
  title: string;
  description: string;
  image?: string;
  url?: string;
  // Canonical URL for this page. Defaults to the current path with no query
  // string — right for most pages, since query params here are almost
  // always filters/pagination/search rather than distinct content. Pages
  // that DO want a query param to be part of the canonical identity (e.g.
  // a single-category product listing) should pass it explicitly.
  canonical?: string;
  type?: string;
  // Suppresses the hreflang alternate tags below. Used for a product page
  // whose English content doesn't really exist yet (falls back to Bulgarian
  // text) — advertising a same-content "English" alternate for those would
  // be a thin/duplicate signal Google doesn't need, and it self-corrects
  // once the description is written (see src/pages/ProductDetailPage.tsx).
  suppressAlternates?: boolean;
  // Arbitrary Schema.org JSON-LD object(s) for this page (e.g. Product).
  // Injected as a single <script type="application/ld+json"> and removed
  // again when absent, so a page type without structured data (or a route
  // change away from one that had it) never leaves stale schema behind.
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
};

const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
const defaultImage = `${siteUrl}/og-default.jpg`;
const JSON_LD_ID = 'seo-json-ld';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(
    `meta[${attr}="${key}"]`
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setAlternate(hreflang: string, href: string | null) {
  const selector = `link[rel="alternate"][hreflang="${hreflang}"]`;
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (href == null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// Every public route mirrors 1:1 under /en, so the BG/EN pair can always be
// derived from whichever URL this page is calling canonical — no per-page
// wiring needed. x-default points at the Bulgarian version (the site's
// actual default/primary market).
function setLangAlternates(canonicalHref: string) {
  const url = new URL(canonicalHref);
  const isEn = url.pathname === '/en' || url.pathname.startsWith('/en/');
  const bgPath = isEn ? url.pathname.slice(3) || '/' : url.pathname;
  const enPath = isEn ? url.pathname : `/en${bgPath === '/' ? '' : bgPath}`;
  const bgHref = `${url.origin}${bgPath}${url.search}`;
  const enHref = `${url.origin}${enPath}${url.search}`;

  setAlternate('bg', bgHref);
  setAlternate('en', enHref);
  setAlternate('x-default', bgHref);
}

function setStructuredData(data: Record<string, unknown> | Record<string, unknown>[] | undefined) {
  const existing = document.getElementById(JSON_LD_ID);
  if (!data) {
    existing?.remove();
    return;
  }
  const el = (existing as HTMLScriptElement | null) ?? document.createElement('script');
  el.id = JSON_LD_ID;
  el.setAttribute('type', 'application/ld+json');
  el.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(el);
}

// Dynamic SEO + OpenGraph head management. Updates <title>, meta description,
// OG tags and (optionally) JSON-LD structured data on route/language changes
// for proper social sharing and search rich results.
export function useSEO({
  title,
  description,
  image,
  url,
  canonical,
  type,
  suppressAlternates,
  structuredData,
}: SEOParams) {
  useEffect(() => {
    document.title = title;
    const finalUrl = url ?? window.location.href;
    const finalImage = image ?? defaultImage;
    const canonicalHref = canonical ?? `${siteUrl}${window.location.pathname}`;

    setCanonical(canonicalHref);
    if (suppressAlternates) {
      setAlternate('bg', null);
      setAlternate('en', null);
      setAlternate('x-default', null);
    } else {
      setLangAlternates(canonicalHref);
    }
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', finalImage);
    setMeta('property', 'og:url', finalUrl);
    setMeta('property', 'og:type', type ?? 'website');
    setMeta('property', 'og:site_name', 'CarnivalForYou');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', finalImage);
    setStructuredData(structuredData);

    return () => {
      // Only this page's own structured data should be torn down on
      // unmount — otherwise a fast route change could clear the next
      // page's freshly-set schema instead of this one's.
      if (structuredData) setStructuredData(undefined);
    };
  }, [title, description, image, url, canonical, type, suppressAlternates, structuredData]);
}
