import { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Navigation,
  DoorOpen,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import { fetchSiteSettings, type SiteSettings } from '@/lib/siteSettings';
import { storeInfo } from '@/data/catalog';
import SectionHeading from '@/components/SectionHeading';

export default function ContactsPage() {
  const { t, lang } = useI18n();
  useSEO({
    title: `${t('contacts.title')} | CarnivalForYou`,
    description: t('contacts.subtitle'),
  });

  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetchSiteSettings().then(setSettings).catch(() => {});
  }, []);

  const address = settings?.address || storeInfo.address;
  const phone = settings?.phone || storeInfo.phone;
  const email = settings?.email || storeInfo.email;
  const hours = settings
    ? lang === 'bg'
      ? settings.hoursBg
      : settings.hoursEn
    : lang === 'bg'
      ? storeInfo.hours
      : storeInfo.hoursEn;
  const mapsQueryRaw = settings?.mapsQuery || 'Carnival for You, София';

  const contactCards = [
    { icon: MapPin, label: t('contacts.address'), value: address, href: '#map' },
    {
      icon: Phone,
      label: t('contacts.phone'),
      value: phone,
      href: `tel:${phone.replace(/\s/g, '')}`,
    },
    {
      icon: Mail,
      label: t('contacts.email'),
      value: email,
      href: `mailto:${email}`,
    },
  ];

  const mapsQuery = encodeURIComponent(mapsQueryRaw);
  const mapsEmbed = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
      <SectionHeading
        eyebrow={t('contacts.eyebrow')}
        title={t('contacts.title')}
        subtitle={t('contacts.subtitle')}
      />

      {/* Contact info cards */}
      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {contactCards.map((c) => (
          <a
            key={c.label}
            href={c.href}
            className="glass glass-hover flex flex-col items-center gap-3 rounded-2xl p-6 text-center"
          >
            <div className="inline-flex rounded-xl border border-gold-400/20 bg-gold-400/5 p-3 text-gold-300">
              <c.icon size={24} />
            </div>
            <div>
              <p className="eyebrow text-[0.6rem]">{c.label}</p>
              <p className="mt-1 text-sm text-gray-200">{c.value}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Hours + Entrance Image */}
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* Hours card */}
        <div className="glass flex flex-col justify-between rounded-2xl p-6 lg:col-span-2">
          <div>
            <div className="flex items-center gap-3">
              <Clock size={22} className="text-gold-300" />
              <h3 className="font-display text-lg font-semibold text-gold-100">
                {t('contacts.workingHours')}
              </h3>
            </div>
            <ul className="mt-5 space-y-4">
              {hours.map((h, i) => (
                <li
                  key={i}
                  className="flex flex-col gap-0.5 border-b border-gold-400/10 pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-sm font-medium text-gray-200">{h.day}</span>
                  <span className="text-sm text-gold-200/80">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded-xl border border-gold-400/15 bg-gold-400/5 p-4">
            <p className="text-xs leading-relaxed text-gray-400">
              <span className="font-semibold text-gold-200">{t('contacts.tip')}</span>{' '}
              {t('contacts.tipBody')}
            </p>
          </div>
        </div>

        {/* Entrance Image block */}
        <div className="glass flex flex-col justify-between rounded-2xl p-6 lg:col-span-3">
          <div>
            <div className="flex items-center gap-3">
              <DoorOpen size={22} className="text-gold-300" />
              <h3 className="font-display text-lg font-semibold text-gold-100">
                {lang === 'bg' ? 'Как да ни откриете' : 'How to Find Us'}
              </h3>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              {lang === 'bg'
                ? 'Ориентир за входа на магазина и звънеца'
                : 'Guide to the store entrance and doorbell'}
            </p>

            <div className="mt-4 overflow-hidden rounded-xl border border-gold-400/20 bg-black/40">
              <img
                src="/images/entrance.jpg"
                alt="Вход на магазина CarnivalForYou"
                className="mx-auto h-auto max-h-[600px] w-full rounded-xl object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div id="map" className="mt-8 overflow-hidden rounded-2xl border border-gold-400/25 shadow-card">
        <div className="relative">
          <iframe
            title="Carnival for You, София"
            src={mapsEmbed}
            className="h-72 w-full sm:h-96"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-gold-400/20" />

          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3">
            <div className="glass flex items-center gap-2 rounded-full px-4 py-2">
              <Navigation size={16} className="text-gold-300" />
              <span className="text-xs text-gray-200">{address}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}