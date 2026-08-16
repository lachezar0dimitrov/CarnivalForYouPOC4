import { useEffect } from 'react';

type SEOParams = {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
};

const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
const defaultImage = `${siteUrl}/og-default.jpg`;

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

// Dynamic SEO + OpenGraph head management. Updates <title>, meta description,
// and OG tags on route/language changes for proper social sharing.
export function useSEO({ title, description, image, url, type }: SEOParams) {
  useEffect(() => {
    document.title = title;
    const finalUrl = url ?? window.location.href;
    const finalImage = image ?? defaultImage;

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
  }, [title, description, image, url, type]);
}
