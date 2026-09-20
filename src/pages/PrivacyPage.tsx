import { ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import SectionHeading from '@/components/SectionHeading';

type Block = { title: string; paragraphs: string[] };

const CONTENT: Record<'bg' | 'en', { eyebrow: string; title: string; subtitle: string; updated: string; blocks: Block[] }> = {
  bg: {
    eyebrow: 'Поверителност',
    title: 'Политика за поверителност',
    subtitle: 'Как CarnivalForYou обработва личните ви данни, когато посещавате сайта или се свързвате с нас.',
    updated: 'Последна актуализация: септември 2026 г.',
    blocks: [
      {
        title: '1. Администратор на данни',
        paragraphs: [
          'Администратор на личните данни е CarnivalForYou, ж.к. Младост 4, бл. 426А, вх. В, ет. 1, София. За въпроси, свързани с обработката на лични данни, можете да се свържете с нас на office@carnivalforyou.com или на +359 88 8716 941.',
        ],
      },
      {
        title: '2. Какви данни обработваме',
        paragraphs: [
          'При резервация на място или запитване по телефон/имейл обработваме данните, които ни предоставяте доброволно — име, телефон и/или имейл адрес, — за да организираме наема на костюм.',
          'При посещение на сайта, ако сте дали съгласие чрез банера за бисквитки, събираме анонимизирана статистика за посещенията (страници, устройство, приблизителен регион, източник на трафика) чрез Google Analytics 4.',
        ],
      },
      {
        title: '3. Бисквитки, които използваме',
        paragraphs: [
          'Необходими: запомнят избрания език и вашето решение по банера за бисквитки — винаги активни, тъй като са нужни за самата работа на сайта.',
          'Аналитични (Google Analytics 4, _ga и _ga_*): се задействат само след като натиснете „Приемам" в банера за бисквитки. Помагат ни да разберем кои страници и костюми представляват интерес, без да идентифицират лично вас. Можете да оттеглите съгласието си по всяко време, като изчистите бисквитките на сайта от настройките на браузъра си.',
          'Ако решите „Отказвам", не се зареждат аналитични бисквитки и не се изпращат данни към Google Analytics.',
        ],
      },
      {
        title: '4. С кого споделяме данни',
        paragraphs: [
          'Google Ireland Ltd. (Google Analytics 4) — статистика за посещенията, само след съгласие.',
          'Cloudflare, Inc. — защита и ускорено доставяне на сайта и снимковия материал (img.carnivalforyou.com); не получава данни за резервации.',
          'Supabase (база данни на сайта, ЕС регион) — съхранява каталога и настройките на сайта; данните от резервации, направени на място, не се въвеждат в тази база.',
          'Не продаваме и не предоставяме личните ви данни на трети страни за маркетингови цели.',
        ],
      },
      {
        title: '5. Срок на съхранение',
        paragraphs: [
          'Аналитичните данни в Google Analytics 4 се пазят до 14 месеца, след което се изтриват автоматично.',
          'Данните, свързани с направена резервация, се пазят толкова дълго, колкото е необходимо за изпълнението й и за спазване на счетоводното законодателство.',
        ],
      },
      {
        title: '6. Вашите права',
        paragraphs: [
          'Съгласно Общия регламент за защита на данните (GDPR) имате право на достъп, коригиране, изтриване или ограничаване на обработката на вашите данни, право на преносимост и право на възражение, както и право да оттеглите съгласието си по всяко време.',
          'Имате право да подадете жалба до Комисията за защита на личните данни (КЗЛД), ако считате, че правата ви са нарушени.',
        ],
      },
    ],
  },
  en: {
    eyebrow: 'Privacy',
    title: 'Privacy Policy',
    subtitle: 'How CarnivalForYou handles your personal data when you visit the site or contact us.',
    updated: 'Last updated: September 2026',
    blocks: [
      {
        title: '1. Data controller',
        paragraphs: [
          'The data controller is CarnivalForYou, 426A Mladost 4, entrance V, floor 1, Sofia, Bulgaria. For any questions about how we process personal data, contact us at office@carnivalforyou.com or +359 88 8716 941.',
        ],
      },
      {
        title: '2. What data we process',
        paragraphs: [
          'When you make an in-store reservation or reach out by phone or email, we process the details you voluntarily provide — name, phone number and/or email — to arrange your costume rental.',
          'When you visit the site and accept the cookie banner, we collect anonymized visit statistics (pages viewed, device, approximate region, traffic source) via Google Analytics 4.',
        ],
      },
      {
        title: '3. Cookies we use',
        paragraphs: [
          'Essential: remember your chosen language and your cookie-banner decision — always active, since the site needs them to function.',
          'Analytics (Google Analytics 4, _ga and _ga_*): only activate once you click "Accept" on the cookie banner. They help us understand which pages and costumes are of interest, without personally identifying you. You can withdraw consent at any time by clearing the site\'s cookies in your browser settings.',
          'If you choose "Decline", no analytics cookies are loaded and no data is sent to Google Analytics.',
        ],
      },
      {
        title: '4. Who we share data with',
        paragraphs: [
          'Google Ireland Ltd. (Google Analytics 4) — visit statistics, only after consent.',
          'Cloudflare, Inc. — security and fast delivery of the site and product images (img.carnivalforyou.com); does not receive reservation data.',
          'Supabase (the site\'s database, EU region) — stores the catalog and site settings; in-store reservation details are not entered into this database.',
          'We do not sell or share your personal data with third parties for marketing purposes.',
        ],
      },
      {
        title: '5. Retention period',
        paragraphs: [
          'Google Analytics 4 data is kept for up to 14 months and then automatically deleted.',
          'Reservation-related data is kept only as long as needed to fulfil the reservation and to comply with accounting law.',
        ],
      },
      {
        title: '6. Your rights',
        paragraphs: [
          'Under the General Data Protection Regulation (GDPR) you have the right to access, correct, delete or restrict the processing of your data, the right to data portability and to object, as well as the right to withdraw consent at any time.',
          'You have the right to file a complaint with the Bulgarian Commission for Personal Data Protection (CPDP) if you believe your rights have been violated.',
        ],
      },
    ],
  },
};

export default function PrivacyPage() {
  const { lang } = useI18n();
  const c = CONTENT[lang];

  useSEO({
    title: `${c.title} | CarnivalForYou`,
    description: c.subtitle,
  });

  return (
    <div className="relative z-10 mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
      <SectionHeading as="h1" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />

      <p className="mt-6 text-center text-xs uppercase tracking-widest text-gray-500">
        {c.updated}
      </p>

      <div className="mt-10 space-y-8">
        {c.blocks.map((block, i) => (
          <section key={i} className="glass rounded-2xl p-6 sm:p-7">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="mt-1 shrink-0 text-gold-300" />
              <div>
                <h3 className="font-display text-lg font-semibold text-gold-100">
                  {block.title}
                </h3>
                <div className="mt-3 space-y-2.5">
                  {block.paragraphs.map((p, j) => (
                    <p key={j} className="text-sm leading-relaxed text-gray-300 sm:text-[0.95rem]">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
