import { FileText } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import SectionHeading from '@/components/SectionHeading';

export default function TermsPage() {
  const { t, lang } = useI18n();

  useSEO({
    title: `${t('terms.title')} | CarnivalForYou`,
    description: t('terms.subtitle'),
  });

  const sections = lang === 'bg' ? [
    {
      h: '1. Условия за наем',
      p: [
        'Костюмите се отдават под наем за период, посочен при резервацията. Минималният период е един ден.',
        'Цените са посочени на ден и не включват депозита, който се заплаща еднократно при вземане на костюма.',
      ],
    },
    {
      h: '2. Депозит',
      p: [
        'При вземане на костюма се заплаща гаранционен депозит, чиято стойност е посочена в каталога.',
        'Депозитът се връща в пълен размер при връщане на костюма в добро състояние и в уговорения срок.',
      ],
    },
    {
      h: '3. Резервация',
      p: [
        'Резервацията се прави на място в магазина или по телефон. За потвърждение е необходима предплата за определени костюми.',
        'При отказ от резервация по-малко от 48 часа преди датата, предплатата не се връща.',
      ],
    },
    {
      h: '4. Отговорност на клиента',
      p: [
        'Клиентът носи отговорност за костюма по време на наема. При повред или загуба се удържа стойността на костюма от депозита.',
        'Дребни замърсявания се почистват за сметка на магазина. Големи щети се заплащат допълнително.',
      ],
    },
    {
      h: '5. Връщане',
      p: [
        'Костюмът се връща в магазина в уговорения срок. При закъснение се дължи допълнителна такса за всеки просрочен ден.',
        'Удължаване на наема е възможно след предварителна уговорка с магазина.',
      ],
    },
    {
      h: '6. Лични данни',
      p: [
        'Данните, които предоставяте при резервация и контакт, се използват единствено за обработка на заявките ви.',
        'Не предоставяме вашите данни на трети лица без ваше съгласие.',
      ],
    },
  ] : [
    {
      h: '1. Rental terms',
      p: [
        'Costumes are rented for the period specified at reservation. The minimum period is one day.',
        'Prices are per day and do not include the deposit, which is paid once when picking up the costume.',
      ],
    },
    {
      h: '2. Deposit',
      p: [
        'A security deposit is paid when picking up the costume; its amount is shown in the catalog.',
        'The deposit is fully refunded when the costume is returned in good condition and within the agreed period.',
      ],
    },
    {
      h: '3. Reservation',
      p: [
        'Reservations are made in store or by phone. A prepayment is required to confirm certain costumes.',
        'If a reservation is cancelled less than 48 hours before the date, the prepayment is non-refundable.',
      ],
    },
    {
      h: '4. Client responsibility',
      p: [
        'The client is responsible for the costume during the rental. In case of damage or loss, the costume value is deducted from the deposit.',
        'Minor stains are cleaned at the store\u2019s expense. Major damage is charged additionally.',
      ],
    },
    {
      h: '5. Return',
      p: [
        'The costume is returned to the store within the agreed period. A late fee applies for each overdue day.',
        'Rental extension is possible by prior arrangement with the store.',
      ],
    },
    {
      h: '6. Personal data',
      p: [
        'Data you provide during reservation and contact is used solely to process your requests.',
        'We do not share your data with third parties without your consent.',
      ],
    },
  ];

  return (
    <div className="relative z-10 mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
      <SectionHeading
        eyebrow={t('terms.eyebrow')}
        title={t('terms.title')}
        subtitle={t('terms.subtitle')}
      />

      <div className="mt-10 space-y-8">
        {sections.map((s, i) => (
          <section key={i} className="glass rounded-2xl p-6 sm:p-7">
            <div className="flex items-start gap-3">
              <FileText size={20} className="mt-1 shrink-0 text-gold-300" />
              <div>
                <h3 className="font-display text-lg font-semibold text-gold-100">
                  {s.h}
                </h3>
                <div className="mt-3 space-y-3">
                  {s.p.map((para, j) => (
                    <p
                      key={j}
                      className="text-sm leading-relaxed text-gray-300 sm:text-[0.95rem]"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-gold-400/15 bg-gold-400/5 p-5 text-center">
        <p className="text-sm text-gray-400">{t('terms.footer')}</p>
      </div>
    </div>
  );
}
