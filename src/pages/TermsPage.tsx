import { useEffect, useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import SectionHeading from '@/components/SectionHeading';
import { fetchTermsContent, type TermsContent } from '@/lib/termsContent';

type QA = { q: string; a: string[] };
type FaqGroup = { heading?: string; items: QA[] };
type InfoBlock = { title: string; items: string[] };
type TermsBlock = { title: string; items: string[] };

export default function TermsPage() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [openKey, setOpenKey] = useState<string | null>('0-0');
  const [content, setContent] = useState<TermsContent | null>(null);

  useSEO({
    title: `${t('terms.title')} | CarnivalForYou`,
    description: t('terms.subtitle'),
  });

  useEffect(() => {
    fetchTermsContent().then(setContent).catch(() => setContent(null));
  }, []);

  const toggle = (key: string) => {
    setOpenKey((k) => (k === key ? null : key));
  };

  if (!content) return null;

  const bg = lang === 'bg';
  const faqGroups: FaqGroup[] = content.faqGroups.map((g) => ({
    heading: (bg ? g.headingBg : g.headingEn) ?? undefined,
    items: g.items.map((i) => ({
      q: bg ? i.qBg : i.qEn,
      a: (bg ? i.aBg : i.aEn).split('\n\n'),
    })),
  }));
  const infoBlock: InfoBlock = {
    title: bg ? content.infoBlock.titleBg : content.infoBlock.titleEn,
    items: content.infoBlock.items.map((i) => (bg ? i.bg : i.en)),
  };
  const termsBlocks: TermsBlock[] = content.termsBlocks.map((b) => ({
    title: bg ? b.titleBg : b.titleEn,
    items: b.items.map((i) => (bg ? i.bg : i.en)),
  }));

  return (
    <div className="relative z-10 mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
      <SectionHeading
        eyebrow={t('terms.eyebrow')}
        title={t('terms.title')}
        subtitle={t('terms.subtitle')}
      />

      <div className="mt-10 rounded-2xl border border-gold-400/15 bg-gold-400/5 p-5 sm:p-6">
        <h3 className="font-display text-base font-semibold text-gold-100">
          {infoBlock.title}
        </h3>
        <ul className="mt-3 space-y-1.5">
          {infoBlock.items.map((it, i) => (
            <li key={i} className="text-sm leading-relaxed text-gray-300 sm:text-[0.95rem]">
              {it}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 space-y-8">
        {termsBlocks.map((block, i) => (
          <section key={i} className="glass rounded-2xl p-6 sm:p-7">
            <div className="flex items-start gap-3">
              <FileText size={20} className="mt-1 shrink-0 text-gold-300" />
              <div>
                <h3 className="font-display text-lg font-semibold text-gold-100">
                  {block.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {block.items.map((it, j) => (
                    <li
                      key={j}
                      className="text-sm leading-relaxed text-gray-300 sm:text-[0.95rem]"
                    >
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 space-y-3">
        {faqGroups.map((group, gi) => (
          <div key={gi}>
            {group.heading && (
              <h3 className="mb-3 mt-8 font-display text-lg font-semibold text-gold-100">
                {group.heading}
              </h3>
            )}
            <div className="space-y-3">
              {group.items.map((item, ii) => {
                const key = `${gi}-${ii}`;
                const isOpen = openKey === key;
                return (
                  <div key={key} className="glass overflow-hidden rounded-2xl">
                    <button
                      onClick={() => toggle(key)}
                      className="flex w-full items-center justify-between gap-3 p-5 text-left sm:p-6"
                      aria-expanded={isOpen}
                    >
                      <span className="font-display text-base font-semibold text-gold-100 sm:text-[1.05rem]">
                        {item.q}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-gold-300 transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="space-y-2.5 px-5 pb-5 sm:px-6 sm:pb-6">
                        {item.a.map((para, pi) => (
                          <p
                            key={pi}
                            className="text-sm leading-relaxed text-gray-300 sm:text-[0.95rem]"
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-gold-400/15 bg-gold-400/5 p-5 text-center">
        <p className="text-sm text-gray-400">
          {t('terms.footerPrefix')}{' '}
          <button
            onClick={() => navigate('contacts')}
            className="font-medium text-gold-300 underline underline-offset-2 transition hover:text-gold-200"
          >
            {t('nav.contacts')}
          </button>
          {t('terms.footerSuffix')}
        </p>
      </div>
    </div>
  );
}
