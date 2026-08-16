import { RouterProvider, useRouter } from '@/lib/router';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/Toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Fireflies from '@/components/Fireflies';
import Butterflies from '@/components/Butterflies';
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
  const { route } = useRouter();

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

  if (route === 'admin') {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-[#0b0d0b] text-gray-100">
        <AdminPage />
      </div>
    );
  }

  return (
    <div className="app-shell relative min-h-screen overflow-hidden">
      <div className="site-background pointer-events-none fixed inset-0 z-0" />
      <Fireflies count={26} />
      <Butterflies count={5} />

      <Header />
      <main className="site-main relative z-10">
        <CurrentPage />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}
