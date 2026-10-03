import { useEffect, useState } from 'react';

// Same breakpoint as the `@media (max-width: 768px)` rule at the bottom of
// index.css that hides .firefly / .hero-firefly / .butterfly-drift /
// .snowflake — keep the two in sync. That rule only hid them: every
// particle was still created, styled and laid out (~100 animated nodes on
// the homepage), which on a mid-range phone is main-thread time spent right
// while the banner photo (the LCP element) is waiting to paint. The
// particle components now skip rendering entirely at this width instead.
const HIDDEN_QUERY = '(max-width: 768px)';

function particlesHidden() {
  return typeof window !== 'undefined' && window.matchMedia(HIDDEN_QUERY).matches;
}

export function useParticlesEnabled(): boolean {
  const [enabled, setEnabled] = useState(() => !particlesHidden());

  useEffect(() => {
    const mql = window.matchMedia(HIDDEN_QUERY);
    const onChange = () => setEnabled(!mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return enabled;
}
