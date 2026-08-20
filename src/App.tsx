import { useEffect, useLayoutEffect, useState } from 'react';
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
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import AboutPage from '@/pages/AboutPage';
import ServicesPage from '@/pages/ServicesPage';
import NewsPage from '@/pages/NewsPage';
import ContactsPage from '@/pages/ContactsPage';
import TermsPage from '@/pages/TermsPage';
import AdminPage from '@/pages/AdminPage';

function CurrentPage() {
  const { route, productId } = useRouter();

  // Runs synchronously right after the new route's DOM commits, before the
  // browser paints — scrolling relative to what's actually about to be shown
  // instead of whatever page we're navigating away from. Keyed on productId
  // too, since navigating between two product-detail pages (e.g. clicking a
  // "similar product") keeps route === 'product-detail' but should still
  // reset scroll.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [route, productId]);

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
    default:
      return <HomePage />;
  }
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider>
            <AppShell />
          </RouterProvider>
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
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

  if (route === 'admin') {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-[#0b0d0b] text-gray-100">
        <AdminPage />
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
    </div>
  );
}
