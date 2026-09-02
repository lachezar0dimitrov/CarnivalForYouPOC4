import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchSiteSettings } from '@/lib/siteSettings';

const SEEN_KEY = 'cfy-splash-seen';
// Safety net only — the video's own 'ended' event normally fires first.
// This exists for stalled playback / a blocked autoplay, not to cap the
// clip's length, so it must stay generous relative to the real duration
// (SplashVideo reschedules it to actual-duration+3s once metadata loads).
const DEFAULT_FALLBACK_TIMEOUT_MS = 20000;

export function useSplashState() {
  const [show, setShow] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const alreadySeen = localStorage.getItem(SEEN_KEY);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (alreadySeen || reducedMotion) return;

    // Admin → Theme's "first-visit intro video" toggle — a DB-backed kill
    // switch so it can be turned off site-wide without a deploy. Checked
    // after the free local checks above so a returning/reduced-motion
    // visitor never even waits on the network round trip.
    let cancelled = false;
    fetchSiteSettings()
      .then((settings) => {
        if (!cancelled && (settings?.splashVideoEnabled ?? true)) setShow(true);
      })
      .catch(() => {
        if (!cancelled) setShow(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(SEEN_KEY, '1');
    setFadingOut(true);
    setTimeout(() => setShow(false), 500);
  }, []);

  return { show, fadingOut, dismiss, fallbackTimeoutMs: DEFAULT_FALLBACK_TIMEOUT_MS };
}

// Lets other components (e.g. BannerCarousel) freeze their own auto-advance
// timers while the splash overlay is covering them, so whatever was on
// screen underneath is still on screen — at its starting position — the
// moment the splash fades away.
const SplashActiveContext = createContext(false);
export const SplashActiveProvider = SplashActiveContext.Provider;
export function useSplashActive() {
  return useContext(SplashActiveContext);
}
