// Chrome on Android renders the hero banner title/subtitle noticeably
// larger than iOS at the same CSS clamp() values — neither
// `text-size-adjust: none` (index.css) nor giving the overlay block an
// explicit max-height (the standard fixes for Chromium's font-boosting
// text-autosizer) changed it, so whatever's inflating it isn't either of
// those known mechanisms. There's no CSS-only way to target "Android", so
// this is a plain UA sniff used to force a smaller size on that platform
// specifically, rather than fight an unidentified cause.
export const isAndroid =
  typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
