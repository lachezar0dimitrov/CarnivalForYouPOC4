import { useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useSEO } from '@/lib/useSEO';
import SectionHeading from '@/components/SectionHeading';

type QA = { q: string; a: string[] };
type FaqGroup = { heading?: string; items: QA[] };
type InfoBlock = { title: string; items: string[] };
type TermsBlock = { title: string; items: string[] };

export default function TermsPage() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [openKey, setOpenKey] = useState<string | null>('0-0');

  useSEO({
    title: `${t('terms.title')} | CarnivalForYou`,
    description: t('terms.subtitle'),
  });

  const toggle = (key: string) => {
    setOpenKey((k) => (k === key ? null : key));
  };

  const faqGroups: FaqGroup[] = lang === 'bg' ? [
    {
      items: [
        {
          q: '1. Как мога да наема костюм?',
          a: [
            'Обадете ни се по телефона, за да уточним посещението ви в нашата карнавална къща.',
            'Можете предварително да изберете костюм от сайта или да разгледате моделите в нашите каталози. Ако не сте сигурни какво търсите, нашите консултанти с удоволствие ще ви помогнат да изберете подходящ костюм и аксесоари.',
            'След избора можете да пробвате костюма и да го резервирате за желаната от вас дата, като заплатите наема.',
            'При получаване на костюма се заплаща депозит, който се възстановява при връщането му, ако костюмът е в нормален за използване вид – без скъсвания, изгаряния, трайни петна и други подобни повреди.',
          ],
        },
        {
          q: '2. Как мога да заплатя наема и депозита?',
          a: [
            'Наемът може да бъде заплатен в брой или с карта.',
            'Депозитът се заплаща в брой.',
          ],
        },
        {
          q: '3. За колко време е наемът?',
          a: [
            'Стандартният срок на наема е 48 часа.',
            'Неработните дни на карнавалната къща не се включват в срока на наема и за тях не се заплаща допълнително.',
          ],
        },
        {
          q: '4. Мога ли да наема костюм за по-дълъг период?',
          a: [
            'Да, възможно е.',
            'При необходимост от по-дълъг период на наем цената се договаря индивидуално.',
          ],
        },
        {
          q: '5. Мога ли да заменя или да откажа вече резервиран костюм?',
          a: [
            'Да, при следните условия:',
            '• При замяна до 3 дни преди резервираната дата доплащате само разликата, ако новият костюм е по-скъп. Ако е по-евтин, получавате ваучер за разликата, валиден 1 година.',
            '• При отказ до 3 дни преди резервираната дата получавате ваучер на стойност 100% от заплатения наем, валиден 1 година.',
            '• В последните 3 дни преди резервираната дата не се допуска отказ или замяна, освен по изключение и при възможност за замяна с друг наличен костюм.',
            '• В периода от 15 дни преди Halloween и Коледа замяна или отказ на вече резервиран костюм се допуска само по изключение и при възможност за замяна с друг наличен костюм.',
            'При всички случаи новият костюм трябва да бъде наличен за съответната дата.',
          ],
        },
        {
          q: '6. Мога ли да запазя костюм по телефона?',
          a: ['Не. Костюми се резервират само на място в нашата карнавална къща.'],
        },
        {
          q: '7. Мога ли да запазя костюм с доставка?',
          a: [
            'Да, но само ако предварително сте видели и одобрили костюма и сте заплатили наема му – лично или чрез упълномощен от вас човек.',
            'Тази услуга не се предлага в периода от 15 дни преди Halloween и Коледа.',
          ],
        },
        {
          q: '8. Мога ли да върна наетите артикули по куриер?',
          a: [
            'Да.',
            'Необходимо е предварително да ни уведомите и да изпратите наетите артикули добре опаковани и в срок.',
            'Пратката трябва да бъде изпратена с опция „Преглед", с транспорт за ваша сметка и с наложен платеж в размер на оставения депозит.',
          ],
        },
        {
          q: '9. Какво се случва при повреда на костюма?',
          a: [
            'Ако повредата може да бъде отстранена, от депозита се удържа необходимата сума за ремонта.',
            'Ако костюмът не може да бъде възстановен, се удържа целият депозит.',
            'Нормалното зацапване след използване не се счита за повреда.',
          ],
        },
        {
          q: '10. Какво се случва при забавяне на връщането?',
          a: ['За всеки просрочен ден, с изключение на неработните дни на карнавалната къща, се начислява такса от 10 € на ден.'],
        },
        {
          q: '11. Трябва ли да почиствам костюма?',
          a: [
            'Не. Не е необходимо да почиствате костюма нито преди, нито след използването му.',
            'Костюмите се предоставят почистени, а след връщането им почистването отново е наш ангажимент.',
          ],
        },
      ],
    },
    {
      heading: 'Проби и консултация',
      items: [
        {
          q: '12. Колко костюма мога да пробвам?',
          a: [
            'Всеки клиент може да пробва до 4 костюма безплатно.',
            'При желание за проба на допълнителни модели всеки следващ костюм се заплаща по 3 €.',
            'Пробите са предназначени за клиенти, които търсят костюм за наемане.',
            'В нормални дни, когато няма други чакащи клиенти, наш консултант може да отдели допълнително време за избора и комбинирането на костюма и аксесоарите.',
            'В периоди на голямо натоварване, когато има чакащи клиенти, карнавалната къща си запазва правото да ограничи броя на пробваните костюми, за да може да обслужи всички посетители. Молим ви в тези дни да се съобразите с останалите чакащи клиенти.',
          ],
        },
        {
          q: '13. Мога ли да пробвам перуки?',
          a: ['Да. Пробата на перука се заплаща 1 €.'],
        },
      ],
    },
  ] : [
    {
      items: [
        {
          q: '1. How can I rent a costume?',
          a: [
            'Call us by phone so we can arrange your visit to the carnival house.',
            'You can pre-select a costume from the site or browse the models in our catalogs. If you’re not sure what you’re looking for, our consultants will be happy to help you choose a suitable costume and accessories.',
            'After choosing, you can try on the costume and reserve it for your desired date by paying the rental fee.',
            'A deposit is paid when you pick up the costume; it is refunded when you return it in normal, usable condition – without tears, burns, permanent stains or similar damage.',
          ],
        },
        {
          q: '2. How can I pay the rental fee and deposit?',
          a: [
            'The rental fee can be paid in cash or by card.',
            'The deposit is paid in cash.',
          ],
        },
        {
          q: '3. How long is the rental period?',
          a: [
            'The standard rental period is 48 hours.',
            'The carnival house’s non-working days are not counted toward the rental period and are not charged for.',
          ],
        },
        {
          q: '4. Can I rent a costume for a longer period?',
          a: [
            'Yes, that’s possible.',
            'If you need a longer rental period, the price is agreed individually.',
          ],
        },
        {
          q: '5. Can I exchange or cancel a costume I’ve already reserved?',
          a: [
            'Yes, under the following conditions:',
            '• If you exchange it up to 3 days before the reserved date, you only pay the difference if the new costume is more expensive. If it’s cheaper, you receive a voucher for the difference, valid for 1 year.',
            '• If you cancel up to 3 days before the reserved date, you receive a voucher for 100% of the rental fee paid, valid for 1 year.',
            '• In the last 3 days before the reserved date, cancellation or exchange is not allowed, except by exception and if another available costume can be substituted.',
            '• In the 15 days before Halloween and Christmas, exchanging or cancelling an already reserved costume is only allowed by exception and if another available costume can be substituted.',
            'In all cases, the new costume must be available for the relevant date.',
          ],
        },
        {
          q: '6. Can I reserve a costume by phone?',
          a: ['No. Costumes can only be reserved in person, at our carnival house.'],
        },
        {
          q: '7. Can I reserve a costume with delivery?',
          a: [
            'Yes, but only if you’ve already seen and approved the costume in advance and paid the rental fee – either in person or through someone you’ve authorized.',
            'This service is not offered in the 15 days before Halloween and Christmas.',
          ],
        },
        {
          q: '8. Can I return the rented items by courier?',
          a: [
            'Yes.',
            'You need to let us know in advance and send the rented items well packaged and on time.',
            'The parcel must be sent with an "inspection" option, at your own transport cost, and cash-on-delivery for the amount of the deposit left.',
          ],
        },
        {
          q: '9. What happens if the costume is damaged?',
          a: [
            'If the damage can be repaired, the necessary repair cost is deducted from the deposit.',
            'If the costume cannot be restored, the entire deposit is withheld.',
            'Normal soiling from use is not considered damage.',
          ],
        },
        {
          q: '10. What happens if the return is late?',
          a: ['A fee of €10 per day is charged for each overdue day, excluding the carnival house’s non-working days.'],
        },
        {
          q: '11. Do I need to clean the costume?',
          a: [
            'No. You don’t need to clean the costume, either before or after use.',
            'Costumes are provided cleaned, and cleaning them after return is our responsibility again.',
          ],
        },
      ],
    },
    {
      heading: 'Fittings & consultation',
      items: [
        {
          q: '12. How many costumes can I try on?',
          a: [
            'Every customer can try on up to 4 costumes for free.',
            'If you’d like to try additional models, each further costume costs €3.',
            'Fittings are intended for customers who are looking to rent a costume.',
            'On normal days, when there are no other waiting customers, our consultant can spend extra time helping you choose and put together the costume and accessories.',
            'During busy periods, when there are customers waiting, the carnival house reserves the right to limit the number of costumes tried on so that everyone can be served. On those days, please be considerate of other waiting customers.',
          ],
        },
        {
          q: '13. Can I try on wigs?',
          a: ['Yes. Trying on a wig costs €1.'],
        },
      ],
    },
  ];

  const infoBlock: InfoBlock = lang === 'bg' ? {
    title: 'Какво включва цената на наема?',
    items: [
      'почистване на костюма;',
      'ползване на костюма за договорения период;',
      'предаване на костюма в подходяща за пренасяне опаковка.',
    ],
  } : {
    title: 'What does the rental price include?',
    items: [
      'cleaning of the costume;',
      'use of the costume for the agreed period;',
      'handing over the costume in packaging suitable for carrying.',
    ],
  };

  const termsBlocks: TermsBlock[] = lang === 'bg' ? [
    {
      title: 'Задължения на Carnival For You',
      items: [
        'Да ви предоставим възможност и съдействие при избора на подходящ костюм и аксесоари.',
        'Да почистим и предадем избрания костюм в договорения срок, в нормален за използване вид и в подходяща за пренасяне опаковка.',
        'Да възстановим депозита при връщане на костюма без трайни повреди.',
      ],
    },
    {
      title: 'Права на Carnival For You',
      items: [
        'Да получи дължимия наем при резервация и депозита при получаване на костюма.',
        'Да получи наетите артикули обратно в договорения срок и без трайни повреди.',
        'При наличие на чакащи клиенти да ограничи времето и броя на пробваните костюми с цел да осигури възможност за обслужване на всички посетители.',
      ],
    },
    {
      title: 'Права на наемателя',
      items: [
        'Да получи безплатна консултация и съдействие при избора на костюм и аксесоари.',
        'Да пробва до 4 костюма безплатно.',
        'Да пробва допълнителни костюми срещу такса от 3 € за всеки следващ костюм.',
        'Да пробва перуки срещу такса от 1 €.',
        'Да получи резервираните артикули в нормален за използване вид и в предварително уточнения ден.',
      ],
    },
    {
      title: 'Задължения на наемателя',
      items: [
        'Да заплати наема при резервация и депозита при получаване на костюма.',
        'Да пази наетия костюм с грижата на добър стопанин и да го върне без трайни повреди.',
        'Да върне наетия артикул в определения срок.',
        'Да пази квитанцията за резервацията и депозита или поне нейна снимка.',
      ],
    },
    {
      title: 'Лични данни',
      items: [
        'Данните, които предоставяте при резервация и контакт, се използват единствено за обработка на заявките ви.',
        'Не предоставяме вашите данни на трети лица без ваше съгласие.',
      ],
    },
  ] : [
    {
      title: 'CarnivalForYou’s obligations',
      items: [
        'To give you guidance and help choosing a suitable costume and accessories.',
        'To clean and hand over the chosen costume within the agreed period, in normal usable condition and in packaging suitable for carrying.',
        'To refund the deposit when the costume is returned without permanent damage.',
      ],
    },
    {
      title: 'CarnivalForYou’s rights',
      items: [
        'To receive the rental fee due at reservation and the deposit when the costume is picked up.',
        'To receive the rented items back within the agreed period and without permanent damage.',
        'When there are waiting customers, to limit the time and number of costumes tried on so that all visitors can be served.',
      ],
    },
    {
      title: 'The renter’s rights',
      items: [
        'To receive free consultation and help choosing a costume and accessories.',
        'To try on up to 4 costumes for free.',
        'To try on additional costumes for a fee of €3 per further costume.',
        'To try on wigs for a fee of €1.',
        'To receive the reserved items in normal usable condition on the pre-agreed day.',
      ],
    },
    {
      title: 'The renter’s obligations',
      items: [
        'To pay the rental fee at reservation and the deposit when picking up the costume.',
        'To take good care of the rented costume and return it without permanent damage.',
        'To return the rented item within the agreed period.',
        'To keep the reservation and deposit receipt, or at least a photo of it.',
      ],
    },
    {
      title: 'Personal data',
      items: [
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

      <div className="mt-10 space-y-3">
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

      <div className="mt-8 rounded-2xl border border-gold-400/15 bg-gold-400/5 p-5 sm:p-6">
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

      <div className="mt-14 space-y-8">
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
