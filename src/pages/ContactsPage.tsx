import { useState, useEffect, type FormEvent } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import { fetchSiteSettings, type SiteSettings } from '@/lib/siteSettings';
import { storeInfo } from '@/data/catalog';
import SectionHeading from '@/components/SectionHeading';

type Status = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_MS = 60_000; // 1 minute between submissions from same client
const RATE_KEY = 'cfy-last-submit';

export default function ContactsPage() {
  const { t, lang } = useI18n();
  useSEO({
    title: `${t('contacts.title')} | CarnivalForYou`,
    description: t('contacts.subtitle'),
  });

  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    // honeypot — hidden field that real users never fill; bots do
    website: '',
  });

  useEffect(() => {
    fetchSiteSettings().then(setSettings).catch(() => {});
  }, []);

  const address = settings?.address || storeInfo.address;
  const phone = settings?.phone || storeInfo.phone;
  const email = settings?.email || storeInfo.email;
  const hours = settings ? (lang === 'bg' ? settings.hoursBg : settings.hoursEn) : (lang === 'bg' ? storeInfo.hours : storeInfo.hoursEn);
  const mapsQueryRaw = settings?.mapsQuery || 'Carnival for You, София';

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = (): string | null => {
    if (!form.name.trim()) return t('contacts.name');
    if (!EMAIL_RE.test(form.email.trim()))
      return t('contacts.invalidEmail');
    if (form.message.trim().length < 10) return t('contacts.shortMsg');
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Honeypot: if the hidden field is filled, silently "succeed" (bot trapped)
    if (form.website.trim() !== '') {
      setStatus('success');
      return;
    }

    // Client-side validation
    const validationError = validate();
    if (validationError) {
      setStatus('error');
      setErrorMsg(validationError);
      return;
    }

    // Rate limiting: prevent rapid repeated submissions from same client
    const lastSubmit = localStorage.getItem(RATE_KEY);
    const now = Date.now();
    if (lastSubmit && now - Number(lastSubmit) < RATE_LIMIT_MS) {
      setStatus('error');
      setErrorMsg(t('contacts.tooFast'));
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    const { error } = await supabase.from('contact_inquiries').insert({
      name: form.name.trim().slice(0, 200),
      email: form.email.trim().slice(0, 200),
      phone: form.phone.trim() ? form.phone.trim().slice(0, 50) : null,
      subject: form.subject.trim() ? form.subject.trim().slice(0, 200) : null,
      message: form.message.trim().slice(0, 5000),
    });

    if (error) {
      setStatus('error');
      setErrorMsg(t('contacts.errorMsg'));
      return;
    }

    localStorage.setItem(RATE_KEY, String(now));
    setStatus('success');
    setForm({ name: '', email: '', phone: '', subject: '', message: '', website: '' });
  };

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

      {/* Hours + form */}
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* Hours card */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
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

          <div className="mt-6 rounded-xl border border-gold-400/15 bg-gold-400/5 p-4">
            <p className="text-xs leading-relaxed text-gray-400">
              <span className="font-semibold text-gold-200">{t('contacts.tip')}</span>{' '}
              {t('contacts.tipBody')}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-6 lg:col-span-3">
          <h3 className="font-display text-lg font-semibold text-gold-100">
            {t('contacts.sendMsg')}
          </h3>
          <p className="mt-1 text-sm text-gray-400">{t('contacts.replyTime')}</p>

          {status === 'success' ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-8 text-center">
              <CheckCircle2 size={40} className="text-success" />
              <p className="font-display text-lg text-gray-100">
                {t('contacts.successTitle')}
              </p>
              <p className="max-w-sm text-sm text-gray-400">
                {t('contacts.successBody')}
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="btn-ghost mt-2 rounded-full px-5 py-2 text-sm"
              >
                {t('contacts.sendNew')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('contacts.name')} required>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={update('name')}
                    placeholder={t('contacts.name')}
                    className="input"
                    maxLength={200}
                    autoComplete="name"
                  />
                </Field>
                <Field label={t('contacts.emailField')} required>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={update('email')}
                    placeholder="you@example.com"
                    className="input"
                    maxLength={200}
                    autoComplete="email"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('contacts.phoneField')}>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={update('phone')}
                    placeholder="+359 ..."
                    className="input"
                    maxLength={50}
                    autoComplete="tel"
                  />
                </Field>
                <Field label={t('contacts.subject')}>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={update('subject')}
                    placeholder={t('contacts.subjectPlaceholder')}
                    className="input"
                    maxLength={200}
                  />
                </Field>
              </div>
              <Field label={t('contacts.message')} required>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={update('message')}
                  placeholder={t('contacts.messagePlaceholder')}
                  className="input resize-none"
                  maxLength={5000}
                />
              </Field>

              {/* Honeypot field — visually hidden, off-screen. Bots fill it; humans don't. */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  top: 'auto',
                  width: '1px',
                  height: '1px',
                  overflow: 'hidden',
                }}
              >
                <label>
                  Website
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={update('website')}
                  />
                </label>
              </div>

              {status === 'error' && (
                <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-gold flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm disabled:opacity-60"
              >
                {status === 'loading' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {status === 'loading' ? t('contacts.sending') : t('contacts.send')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Enchanted parchment-style map */}
      <div id="map" className="mt-8 overflow-hidden rounded-2xl border border-gold-400/25 shadow-card">
        <div className="relative">
          <iframe
            title="Carnival for You, София"
            src={mapsEmbed}
            className="h-72 w-full sm:h-96"
            style={{
              border: 0,
              filter:
                'grayscale(0.4) brightness(0.7) sepia(0.25) hue-rotate(-15deg) contrast(1.05)',
            }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-gold-400/20" />
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-ink-900/40 via-transparent to-ink-900/30" />

          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3">
            <div className="glass flex items-center gap-2 rounded-full px-4 py-2">
              <Navigation size={16} className="text-gold-300" />
              <span className="text-xs text-gray-200">{address}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: rgba(13, 20, 16, 0.6);
          border: 1px solid rgba(212, 175, 55, 0.18);
          border-radius: 0.75rem;
          padding: 0.7rem 0.9rem;
          color: #e8e6df;
          font-size: 0.875rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .input::placeholder { color: #6b7280; }
        .input:focus {
          outline: none;
          border-color: rgba(212, 175, 55, 0.6);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.12);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-300">
        {label} {required && <span className="text-gold-300">*</span>}
        {required && (
          <span className="sr-only"> ({t('contacts.required')})</span>
        )}
      </span>
      {children}
    </label>
  );
}
