const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

let loaded = false;

function gtag(...args: unknown[]) {
  window.dataLayer.push(args);
}

// Called once, unconditionally, before consent is known — sets the default
// to denied so no request fires until loadAnalytics() runs on 'accepted'.
export function initConsentDefaults() {
  if (!MEASUREMENT_ID) return;
  window.dataLayer = window.dataLayer || [];
  gtag('consent', 'default', {
    analytics_storage: 'denied',
  });
}

export function loadAnalytics() {
  if (!MEASUREMENT_ID || loaded) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  gtag('consent', 'update', { analytics_storage: 'granted' });
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}
