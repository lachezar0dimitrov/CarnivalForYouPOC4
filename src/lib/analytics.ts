const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let configured = false;

// Called once, unconditionally, at app boot — before consent is known.
// Loads the gtag.js runtime and sets analytics_storage to 'denied' by
// default, matching Google's documented Consent Mode setup: the library
// itself must be present and initialized on every page load, gating on
// consent state internally. Delaying the script tag until 'accepted' (the
// first version of this file) left gtag.js processing a backlog of queued
// commands from a container that never fully initialized — it loaded (200)
// and appeared to run, but never actually dispatched a hit. No 'config'
// command is issued here, so no measurement starts and no cookies are set
// until loadAnalytics() runs.
export function initConsentDefaults() {
  if (!MEASUREMENT_ID) return;

  window.dataLayer = window.dataLayer || [];
  // Must push the `arguments` object, not a rest-parameter array: gtag.js
  // only recognises queued entries whose shape is [object Arguments] as
  // commands. A plain array is ignored, so 'config' never runs — the script
  // loads and the container bootstraps, but no hit is ever sent.
  // eslint-disable-next-line prefer-rest-params
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('consent', 'default', { analytics_storage: 'denied' });
  window.gtag('js', new Date());

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function loadAnalytics() {
  if (!MEASUREMENT_ID || configured || !window.gtag) return;
  configured = true;

  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  window.gtag('config', MEASUREMENT_ID);
}
