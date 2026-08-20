import { Menu, X, Globe } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter, type Route } from '@/lib/router';
import { useI18n, type Lang } from '@/lib/i18n';
import Logo from '@/components/Logo';

export default function Header() {
  const { route, navigate } = useRouter();
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const activeId: Route = route === 'product-detail' ? 'products' : route;

  const navItems: { id: Route; label: string }[] = [
    { id: 'home', label: t('nav.home') },
    { id: 'products', label: t('nav.products') },
    { id: 'about', label: t('nav.about') },
    { id: 'services', label: t('nav.services') },
    { id: 'news', label: t('nav.news') },
    { id: 'contacts', label: t('nav.contacts') },
    { id: 'terms', label: t('nav.terms') },
  ];

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeaderHeight = () => {
      document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
    };

    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--header-height');
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const go = (r: Route) => {
    navigate(r);
    setOpen(false);
  };

  const toggleLang = () => {
    setLang(lang === 'bg' ? 'en' : 'bg');
  };

  return (
    <header ref={headerRef} className="site-header fixed inset-x-0 top-0 z-50">
      <div className="site-header-surface glass border-b border-gold-400/15">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 2xl:max-w-[1680px]">
          <Logo onClick={() => go('home')} />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`relative rounded-full px-3.5 py-2 text-sm transition-colors duration-300 ${
                  activeId === item.id
                    ? 'text-gold-100'
                    : 'text-gray-300 hover:text-gold-200'
                }`}
              >
                {item.label}
                {activeId === item.id && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-px bg-gold-grad shadow-glow-sm" />
                )}
              </button>
            ))}

            {/* Language switcher - Desktop Direct Toggle */}
            <button
              onClick={toggleLang}
              className="ml-3 flex cursor-pointer items-center gap-1.5 rounded-full border border-gold-400/25 bg-ink-800/60 px-3 py-1.5 text-xs font-medium transition hover:border-gold-400/50 hover:bg-gold-400/10"
              aria-label="Switch language"
            >
              <Globe size={14} className="text-gold-300" />
              <span className={lang === 'bg' ? 'font-bold text-gold-100' : 'text-gray-400 hover:text-gray-200'}>
                BG
              </span>
              <span className="text-gray-600">/</span>
              <span className={lang === 'en' ? 'font-bold text-gold-100' : 'text-gray-400 hover:text-gray-200'}>
                EN
              </span>
            </button>
          </nav>

          {/* Mobile: lang + hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 rounded-full border border-gold-400/25 px-3 py-1.5 text-xs font-medium text-gold-200 transition hover:border-gold-400/50"
              aria-label="Switch language"
            >
              <Globe size={14} />
              {lang.toUpperCase()}
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg p-2 text-gold-200 transition hover:bg-gold-400/10"
              aria-label={open ? t('nav.close') : t('nav.open')}
              aria-expanded={open}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 top-[60px] z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <nav className="glass relative mx-3 mt-2 flex flex-col gap-1 rounded-2xl p-4 shadow-card animate-fadeUp">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-left text-base transition ${
                  activeId === item.id
                    ? 'bg-gold-400/10 text-gold-100 shadow-glow-sm'
                    : 'text-gray-200 hover:bg-white/5'
                }`}
              >
                {item.label}
                {activeId === item.id && (
                  <span className="h-2 w-2 rounded-full bg-gold-grad shadow-glow-sm" />
                )}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}