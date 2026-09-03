import { useEffect, useState } from 'react';
import { Instagram, Facebook, Phone, Mail, MapPin } from 'lucide-react';
import { useRouter, type Route } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { fetchSiteSettings } from '@/lib/siteSettings';
import { storeInfo } from '@/data/catalog';
import Logo from '@/components/Logo';
import HalloweenCountdown from '@/components/HalloweenCountdown';

export default function Footer() {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [pageVisibility, setPageVisibility] = useState({ services: true, news: true });

  useEffect(() => {
    fetchSiteSettings()
      .then((s) => {
        if (s) setPageVisibility({ services: s.servicesPageEnabled, news: s.newsPageEnabled });
      })
      .catch(() => {});
  }, []);

  const footerNav: { id: Route; label: string }[] = [
    { id: 'home', label: t('nav.home') },
    { id: 'products', label: t('nav.products') },
    { id: 'about', label: t('nav.about') },
    ...(pageVisibility.services ? [{ id: 'services' as Route, label: t('nav.services') }] : []),
    ...(pageVisibility.news ? [{ id: 'news' as Route, label: t('nav.news') }] : []),
    { id: 'contacts', label: t('nav.contacts') },
    { id: 'terms', label: t('nav.terms') },
  ];

  return (
    <footer className="relative z-10 border-t border-gold-400/15 bg-ink-800/80">
      <HalloweenCountdown />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 2xl:max-w-[1680px]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo onClick={() => navigate('home')} />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
              {lang === 'bg'
                ? 'Магически костюми под наем за всяко събитие. Венециански маски, фантастични образи и нещо за най-малките.'
                : 'Magical costume rentals for every event. Venetian masks, fantasy looks and something for the little ones.'}
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://www.instagram.com/carnivalforyou/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-lg border border-gold-400/25 p-2 text-gold-200 transition hover:bg-gold-400/10 hover:shadow-glow-sm"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.facebook.com/CarnivalForYou"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="rounded-lg border border-gold-400/25 p-2 text-gold-200 transition hover:bg-gold-400/10 hover:shadow-glow-sm"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Nav */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-gold-300">
              {lang === 'bg' ? 'Навигация' : 'Navigation'}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {footerNav.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => navigate(item.id)}
                    className="text-sm text-gray-400 transition hover:text-gold-200"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-gold-300">
              {t('contacts.title')}
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gold-300" />
                <span>{lang === 'bg' ? storeInfo.address : storeInfo.addressEn}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-gold-300" />
                <a
                  href={`tel:${storeInfo.phone.replace(/\s/g, '')}`}
                  className="transition hover:text-gold-200"
                >
                  {storeInfo.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-gold-300" />
                <a
                  href={`mailto:${storeInfo.email}`}
                  className="transition hover:text-gold-200"
                >
                  {storeInfo.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-gold-300">
              {t('contacts.workingHours')}
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-400">
              {(lang === 'bg' ? storeInfo.hours : storeInfo.hoursEn).map((h) => (
                <li key={h.day}>
                  <div className="text-gray-300">{h.day}</div>
                  <div className="text-gold-200/80">{h.time}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gold-400/10 pt-6 text-center text-xs text-gray-500 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} CarnivalForYou.{' '}
            {lang === 'bg' ? 'Всички права запазени.' : 'All rights reserved.'}
          </p>

          <div className="flex items-center gap-2">
            <span>{lang === 'bg' ? 'Програмирано от' : 'Built by'}</span>
            <a
              href="https://www.core-logic.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-gray-300 transition hover:text-gray-100"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-teal-400 via-teal-600 to-cyan-800 p-0.5 text-[10px] font-extrabold text-slate-950 shadow-sm">
                &gt;_
              </div>
              <span className="text-xs font-semibold tracking-tight text-gray-100">
                Core<span className="text-teal-400">-</span>Logic
              </span>
            </a>
          </div>

          <div className="flex items-center gap-3">
            <p>
              {lang === 'bg'
                ? 'Костюми под наем — София, България.'
                : 'Costume rentals — Sofia, Bulgaria.'}
            </p>
            <button
              onClick={() => navigate('admin')}
              className="rounded px-2 py-1 text-[11px] text-gray-600 transition hover:text-gold-300"
              aria-label="Admin panel"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}