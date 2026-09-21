import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { RouterProvider, useRouter } from '@/lib/router';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/Toast';
import { getCurrentSeason, loadThemeOverride } from '@/lib/season';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Fireflies from '@/components/Fireflies';
import Butterflies from '@/components/Butterflies';
import Snowflakes from '@/components/Snowflakes';
import CookieConsent from '@/components/CookieConsent';
import SplashVideo from '@/components/SplashVideo';
import { SplashActiveProvider, useSplashState } from '@/lib/splash';
import HomePage from '@/pages/HomePage';

// Everything below is lazy: HomePage is what PageSpeed/real visitors hit
// first (and it's already got its own Supabase + image fetches to compete
// with), so every byte of JS that only ever runs on some other route --
// ProductsPage, product detail, the static content pages, and especially
// AdminPage, which a public visitor never touches at all -- is dead weight
// on that initial bundle. React.lazy defers the fetch to first navigation
// instead, with no change to what actually renders once it arrives.
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ServicesPage = lazy(() => import('@/pages/ServicesPage'));
const NewsPage = lazy(() => import('@/pages/NewsPage'));
const ContactsPage = lazy(() => import('@/pages/ContactsPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));

function CurrentPage() {
  const { route, productId, pendingScrollRestore } = useRouter();

  // Runs synchronously right after the new route's DOM commits, before the
  // browser paints — scrolling relative to what's actually about to be shown
  // instead of whatever page we're navigating away from. Keyed on productId
  // too, since navigating between two product-detail pages (e.g. clicking a
  // "similar product") keeps route === 'product-detail' but should still
  // reset scroll. Skipped when a goBack() left a scroll position to restore
  // (see the router's pendingScrollRestore) — that page restores it itself
  // once its content has loaded, instead of snapping to the top first.
  useLayoutEffect(() => {
    if (pendingScrollRestore == null) {
      window.scrollTo(0, 0);
    }
    // pendingScrollRestore intentionally omitted — only route/productId
    // changing should re-run this; re-checking it if it later clears would
    // undo the restoring page's own scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, productId]);

  const page = (() => {
    switch (route) {
      case 'home':
        return <HomePage />;
      case 'products':
        return <ProductsPage />;
      case 'product-detail':
        return <ProductDetailPage />;
      case 'about':
        return <AboutPage />;
      case 'services':
        return <ServicesPage />;
      case 'news':
        return <NewsPage />;
      case 'contacts':
        return <ContactsPage />;
      case 'terms':
        return <TermsPage />;
      case 'privacy':
        return <PrivacyPage />;
      default:
        return <HomePage />;
    }
  })();

  // Only HomePage is eager (see the lazy() calls above) -- every other
  // branch needs a Suspense boundary for its chunk to load into. No visible
  // fallback UI: these are same-tab client-side navigations onto a page that
  // has its own async data fetches anyway, so a blank beat before content
  // arrives matches the existing feel rather than flashing a spinner.
  return <Suspense fallback={null}>{page}</Suspense>;
}

export default function App() {
  // RouterProvider wraps I18nProvider (not the reverse, as before) because
  // content language is now derived from the URL's /en prefix — I18nProvider
  // reads the current route via useRouter() to do that. RouterProvider has
  // no dependency the other way, so this is safe.
  return (
    <RouterProvider>
      <I18nProvider>
        <AuthProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </AuthProvider>
      </I18nProvider>
    </RouterProvider>
  );
}

function AppShell() {
  const { route } = useRouter();
  // Forces one re-render once the admin's theme override finishes loading,
  // since getCurrentSeason() reads it from a synchronous module-level cache
  // (see src/lib/season.ts) that starts out defaulting to calendar behavior.
  const [, setThemeLoaded] = useState(false);

  useEffect(() => {
    loadThemeOverride().then(() => setThemeLoaded(true));
  }, []);

  // Called unconditionally (before the admin-route early return below) so
  // hook order stays stable across renders — the admin panel just never
  // renders <SplashVideo>, so the fetch/state it holds sits unused there.
  const splash = useSplashState();

  if (route === 'admin') {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-[#0b0d0b] text-gray-100">
        <Suspense fallback={null}>
          <AdminPage />
        </Suspense>
      </div>
    );
  }

  const season = getCurrentSeason();
  const isChristmas = season === 'christmas';

  return (
    <div
      className="app-shell relative min-h-screen overflow-hidden"
      data-theme={isChristmas ? 'christmas' : undefined}
    >
      <SplashVideo
        show={splash.show}
        fadingOut={splash.fadingOut}
        onDismiss={splash.dismiss}
        fallbackTimeoutMs={splash.fallbackTimeoutMs}
      />
      {/* Components under here (e.g. BannerCarousel) can read this to freeze
          their own auto-advance timers while the splash covers them, so
          whatever was showing underneath is still at its starting position
          once the splash fades away instead of having silently rotated on. */}
      <SplashActiveProvider value={splash.show}>
        <div className="site-background pointer-events-none fixed inset-0 z-0" />
        {!isChristmas && (
          <>
            <Fireflies count={26} />
            <Butterflies count={5} />
          </>
        )}

        <Header />
        <main className="site-main relative z-10">
          <CurrentPage />
        </main>
        <Footer />
        <CookieConsent />
        {/* Rendered last (and highest z-index) so falling snow drifts over the
            whole site — header, hero, cards — like real snowfall, not just in
            the .site-background layer's negative space. */}
        {isChristmas && <Snowflakes count={50} />}
      </SplashActiveProvider>
    </div>
  );
}
