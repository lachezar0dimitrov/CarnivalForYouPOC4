import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Lang = 'bg' | 'en';

type I18nContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

// All UI strings for both languages. Keys are namespaced.
const translations: Record<Lang, Record<string, string>> = {
  bg: {
    // nav
    'nav.home': 'Начало',
    'nav.products': 'Продукти',
    'nav.about': 'За нас',
    'nav.services': 'Услуги',
    'nav.news': 'Новини',
    'nav.contacts': 'Контакти',
    'nav.terms': 'Условия и въпроси',

    // common
    'common.costumesRent': 'Костюми под наем · София',
    'common.viewDetails': 'Виж детайли',
    'common.reserveInStore': 'Запази на място',
    'common.contactUs': 'Свържете се с нас',
    'common.all': 'Всички',
    'common.perDay': '/ ден',
    'common.loading': 'Зареждане…',
    'common.error': 'Възникна грешка. Моля, опитайте отново.',
    'common.backToCategory': 'Обратно към категория',
    'common.previousProduct': 'Предишен',
    'common.nextProduct': 'Следващ',
    'common.bgn': 'лв.',
    'common.eur': '€',
    'common.deposit': 'Депозит',
    'common.depositInfo': 'Депозитът се внася при вземане на костюма и се възстановява изцяло при връщането му, ако е без трайни повреди.',
    'common.sizes': 'Размери',
    'common.tags': 'Тагове',
    'common.rentalPrice': 'Цена за наем',
    'common.rentalTerms': 'Условия за наемане',
    'common.similarSuggestions': 'Сходни предложения',
    'common.noResults': 'Няма намерени костюми в тази категория.',
    'common.notFoundTitle': 'Костюмът не е намерен',
    'common.notFoundBody': 'Изглежда този костюм вече не е в каталога.',
    'common.category': 'Категория',
    'common.catalogNumber': 'Каталожен №',

    // home
    'home.eyebrow': 'Костюми под наем · София',
    'home.heroTitle1': 'Всичко за вашето',
    'home.heroTitle2': 'уникално парти.',
    'home.heroBody':
      'От венециански маски до фантастични същества — открийте перфектния костюм за вашия бал, парти или събитие. Резервирайте на място в нашия магазин.',
    'home.findLook': 'Намери своя образ',
    'home.aboutStore': 'За магазина',
    'home.categoriesEyebrow': 'Категории',
    'home.viewLooks': 'Виж образи',
    'home.newArrivalsTitle': 'Нашите най-нови образи',
    'home.countdownDays': 'дни',
    'home.countdownHours': 'часа',
    'home.countdownMinutes': 'минути',
    'home.countdownSeconds': 'секунди',
    'home.quote': '„Всеки костюм е портал към друга история — изберете своята."',
    'home.ctaTitle': 'Готови ли сте за трансформация?',
    'home.ctaBody':
      'Заповядайте в нашия магазин в София, за да изберете и резервирате своя костюм на място с помощта на нашия екип.',
    'home.ctaButton': 'Намерете ни на картата',

    // products
    'products.eyebrow': 'Каталог',
    'products.title': 'Нашите костюми',
    'products.subtitle':
      'Разгледайте наличните костюми под наем. Цените са на ден. За резервация посетете магазина ни или се свържете с нас.',
    'products.categories': 'Основни раздели',
    'products.allCategories': 'Всички категории',
    'products.filterCategory': 'Категория',
    'products.filterCategories': 'Категории',
    'products.filterSize': 'Размер',
    'products.filterAll': 'Всички',
    'products.search': 'Търсене',
    'products.searchPlaceholder': 'Име или каталожен №…',
    'products.results': 'резултата',
    'products.page': 'Страница',
    'products.prev': 'Предишна',
    'products.next': 'Следваща',
    'products.of': 'от',
    'products.advancedFilter': 'Прецизен филтър за вашата визия',
    'products.clearFilters': 'Изчисти филтрите',
    'products.activeFilters': 'активни филтъра',
    'products.showResults': 'Покажи резултатите',
    'products.themeCategories': 'Теми и сезони',

    // contacts
    'contacts.eyebrow': 'Свържете се с нас',
    'contacts.title': 'Контакти',
    'contacts.subtitle':
      'Имате въпрос или искате да резервирате костюм? Посетете ни в магазина или ни пишете.',
    'contacts.address': 'Адрес',
    'contacts.phone': 'Телефон',
    'contacts.email': 'Имейл',
    'contacts.workingHours': 'Работно време',
    'contacts.sendMsg': 'Изпратете ни съобщение',
    'contacts.replyTime': 'Отговоряме обикновено в рамките на един работен ден.',
    'contacts.name': 'Име',
    'contacts.emailField': 'Имейл',
    'contacts.phoneField': 'Телефон',
    'contacts.subject': 'Относно',
    'contacts.message': 'Съобщение',
    'contacts.subjectPlaceholder': 'Тема на съобщението',
    'contacts.messagePlaceholder': 'Разкажете ни за вашето събитие или въпрос…',
    'contacts.send': 'Изпрати съобщение',
    'contacts.sending': 'Изпращане…',
    'contacts.successTitle': 'Съобщението е изпратено!',
    'contacts.successBody': 'Благодарим ви. Ще се свържем с вас възможно най-скоро.',
    'contacts.sendNew': 'Изпрати ново съобщение',
    'contacts.errorMsg':
      'Възникна грешка при изпращане. Моля, опитайте отново или ни се обадете.',
    'contacts.tooFast': 'Моля, изчакайте малко преди да изпратите ново съобщение.',
    'contacts.invalidEmail': 'Моля, въведете валиден имейл адрес.',
    'contacts.shortMsg': 'Съобщението трябва да бъде поне 10 символа.',
    'contacts.tip': 'Съвет:',
    'contacts.tipBody':
      'За групови резервации и консултации по образ ви препоръчваме да ни се обадите предварително.',
    'contacts.openMaps': 'Отворете в Google Maps',
    'contacts.required': 'задължително',

    // about
    'about.eyebrow': 'Историята ни',
    'about.title': 'За нас',
    'about.subtitle':
      'Понякога е хубаво да бъдеш някой друг, поне за малко. CarnivalForYou е семеен магазин за костюми под наем в София, където всеки може да открие своя герой.',
    'about.hookBody':
      'Всеки ден имаме своята роля — родители, деца, съпрузи, приятели, професионалисти. Правим едни и същи неща, срещаме едни и същи хора, следваме познатия ритъм. Но някъде дълбоко в нас навярно все още живее детето, което е мечтало да бъде принц или принцеса, пират, фея, супергерой, крал или кралица. Ами ако за един ден можем да бъдем точно този герой?',
    'about.storyTitle': 'От малка идея до магически свят',
    'about.story1':
      'CarnivalForYou започна като малка работилница с една мечта — да помогне на всеки човек да се превърне в героя, за когото мечтае. Днес сме уютен магазин в София, който подбира костюми и венециански маски от най-добрите карнавални работилници по света.',
    'about.story2':
      'Вярваме, че костюмът е не само дреха — това е портал към друга история. Затова подбираме всеки образ с внимание към детайла и страст към занаята.',
    'about.heroListTitle': 'Може би ще бъдете:',
    'about.hero1': 'Пиратски капитан, тръгнал по следите на изгубено съкровище',
    'about.hero2': 'Фея, пристигнала от приказна страна',
    'about.hero3': 'Крал или кралица — поне за една нощ',
    'about.hero4': 'Герой от любимия ви филм',
    'about.hero5': 'Или просто някой, когото никога досега не сте били',
    'about.offerTitle': 'Над 2000 костюма за всеки повод',
    'about.offerBody':
      'При нас ви очакват над 2000 костюма — карнавални, сценични и официални, за деца и възрастни, под наем, за покупка или по поръчка.',
    'about.addonsBody':
      'А ако костюмът не е достатъчен, добавяме грим, прическа, маска, перука, шапка, аксесоари и всичко необходимо, за да завършим образа. Професионални дизайнери, стилисти, гримьори и фризьори с опит и нестандартно мислене са на ваше разположение, за да превърнем желанието ви в реалност.',
    'about.v1Title': 'От най-добрите работилници по света',
    'about.v1Body':
      'Подбираме всеки костюм с внимание към детайла — от най-добрите карнавални работилници по света.',
    'about.v2Title': 'Над 10 години опит',
    'about.v2Body':
      'Създаваме магически образи за хиляди клиенти от цяла България.',
    'about.v3Title': 'С грижа за вас',
    'about.v3Body':
      'Помагаме ви да изберете перфектния образ за вашето събитие.',
    'about.originTitle': 'Кои сме ние?',
    'about.originBody':
      'Може би ни познавате като модна къща „Одета" — да, това сме ние. След години, посветени на сватбените, вечерните и балните тоалети, решихме да отворим още една врата към света на въображението. Така се роди CarnivalForYou — място за моментите, в които не искате просто да празнувате, а искате да преживеете нещо различно и запомнящо се.',
    'about.occasionsTitle': 'За всеки повод',
    'about.occasion1': 'Рожден ден',
    'about.occasion2': 'Парти с приятели',
    'about.occasion3': 'Тематично събитие',
    'about.occasion4': 'Детски празник',
    'about.occasion5': 'Изненада за любим човек',
    'about.occasion6': 'Моминско или ергенско парти',
    'about.occasion7': 'Театрален спектакъл',
    'about.occasion8': 'Фотосесия',
    'about.occasion9': 'Или просто ден, в който ви се иска да избягате от обичайното',
    'about.closingBody':
      'В нашата приказка няма вълшебни пръчици. Но има костюми, въображение, опит и много желание да ви изненадаме. А останалото зависи от вас.',
    'about.quote':
      '„Изберете своя герой, облечете костюм, сложете маска — и нека приключението започне. Понякога е хубаво да бъдеш някой друг."',
    'about.browseBtn': 'Разгледайте костюмите',

    // services
    'services.eyebrow': 'Какво предлагаме',
    'services.title': 'Услуги',
    'services.subtitle':
      'Освен наем на костюми, помагаме с персонално шиене, професионален грим и консултация по образ.',
    'services.inquire': 'Запитване',
    'services.processTitle': 'Как работи резервацията',
    'services.step1T': 'Изберете образ',
    'services.step1D': 'Разгледайте каталога и изберете своя костюм.',
    'services.step2T': 'Запазете на място',
    'services.step2D':
      'Посетете магазина ни, за да потвърдим наличност и размер.',
    'services.step3T': 'Вземете и се преобразете',
    'services.step3D': 'Вземете костюма си и се насладете на събитието.',

    // news
    'news.eyebrow': 'Актуално',
    'news.title': 'Новини',
    'news.subtitle':
      'Последни новини, сезонни оферти и събития от света на CarnivalForYou.',
    'news.readMore': 'Прочетете повече',

    // terms
    'terms.eyebrow': 'Правила и условия',
    'terms.title': 'Условия и въпроси',
    'terms.subtitle':
      'Условията под наем на костюми в CarnivalForYou. Моля, прочетете ги внимателно преди резервация.',
    'terms.footerPrefix': 'Имате въпроси относно условията? Свържете се с нас чрез страницата',
    'terms.footerSuffix': '.',

    // cookie
    'cookie.title': 'Бисквитки и поверителност',
    'cookie.body':
      'Използваме бисквитки, за да подобрим вашето преживяване и да запомним предпочитанията ви. Продължавайки, вие се съгласявате с използването им.',
    'cookie.accept': 'Приемам',
    'cookie.decline': 'Отказвам',

    // seo
    'seo.homeTitle': 'CarnivalForYou — Магически костюми под наем',
    'seo.homeDesc':
      'Магически костюми под наем в София. Венециански маски, фантастични образи, Хелоуин и детски костюми. Резервирайте на място.',
    'seo.productsTitle': 'Каталог костюми под наем | CarnivalForYou',
    'seo.productsDesc':
      'Разгледайте наличните костюми под наем — венециански, фантастични, Хелоуин и детски. Цени на ден, резервация на място в София.',
  },
  en: {
    // nav
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.about': 'About',
    'nav.services': 'Services',
    'nav.news': 'News',
    'nav.contacts': 'Contacts',
    'nav.terms': 'Terms & FAQ',

    // common
    'common.costumesRent': 'Costume Rentals · Sofia',
    'common.viewDetails': 'View details',
    'common.reserveInStore': 'Reserve in store',
    'common.contactUs': 'Contact us',
    'common.all': 'All',
    'common.perDay': '/ day',
    'common.loading': 'Loading…',
    'common.error': 'An error occurred. Please try again.',
    'common.backToCategory': 'Back to category',
    'common.previousProduct': 'Previous',
    'common.nextProduct': 'Next',
    'common.bgn': 'BGN',
    'common.eur': '€',
    'common.deposit': 'Deposit',
    'common.depositInfo': 'The deposit is paid when you collect the costume and refunded in full when it is returned undamaged.',
    'common.sizes': 'Sizes',
    'common.tags': 'Tags',
    'common.rentalPrice': 'Rental price',
    'common.rentalTerms': 'Rental terms',
    'common.similarSuggestions': 'Similar suggestions',
    'common.noResults': 'No costumes found in this category.',
    'common.notFoundTitle': 'Costume not found',
    'common.notFoundBody': 'It seems this costume is no longer in the catalog.',
    'common.category': 'Category',
    'common.catalogNumber': 'Catalog №',

    // home
    'home.eyebrow': 'Costume Rentals · Sofia',
    'home.heroTitle1': 'Everything for your',
    'home.heroTitle2': 'unique party.',
    'home.heroBody':
      'From Venetian masks to fantasy creatures — find the perfect costume for your ball, party or event. Reserve in store.',
    'home.findLook': 'Find your look',
    'home.aboutStore': 'About the store',
    'home.categoriesEyebrow': 'Categories',
    'home.viewLooks': 'View looks',
    'home.newArrivalsTitle': 'Our newest looks',
    'home.countdownDays': 'days',
    'home.countdownHours': 'hours',
    'home.countdownMinutes': 'minutes',
    'home.countdownSeconds': 'seconds',
    'home.quote': '“Every costume is a portal to another story — choose yours."',
    'home.ctaTitle': 'Ready for a transformation?',
    'home.ctaBody':
      'Visit our store in Sofia to choose and reserve your costume on the spot with the help of our team.',
    'home.ctaButton': 'Find us on the map',

    // products
    'products.eyebrow': 'Catalog',
    'products.title': 'Our costumes',
    'products.subtitle':
      'Browse available costumes for rent. Prices are per day. To reserve, visit our store or contact us.',
    'products.categories': 'Main categories',
    'products.allCategories': 'All categories',
    'products.filterCategory': 'Category',
    'products.filterCategories': 'Categories',
    'products.filterSize': 'Size',
    'products.filterAll': 'All',
    'products.search': 'Search',
    'products.searchPlaceholder': 'Name or catalog №…',
    'products.results': 'results',
    'products.page': 'Page',
    'products.prev': 'Previous',
    'products.advancedFilter': 'Precise Filter for Your Look',
    'products.clearFilters': 'Clear Filters',
    'products.activeFilters': 'active filters',
    'products.showResults': 'Show Results',
    'products.themeCategories': 'Themes & Seasons',
    'products.next': 'Next',
    'products.of': 'of',

    // contacts
    'contacts.eyebrow': 'Get in touch',
    'contacts.title': 'Contacts',
    'contacts.subtitle':
      'Have a question or want to reserve a costume? Visit our store or write to us.',
    'contacts.address': 'Address',
    'contacts.phone': 'Phone',
    'contacts.email': 'Email',
    'contacts.workingHours': 'Working hours',
    'contacts.sendMsg': 'Send us a message',
    'contacts.replyTime': 'We usually reply within one business day.',
    'contacts.name': 'Name',
    'contacts.emailField': 'Email',
    'contacts.phoneField': 'Phone',
    'contacts.subject': 'Subject',
    'contacts.message': 'Message',
    'contacts.subjectPlaceholder': 'Message subject',
    'contacts.messagePlaceholder': 'Tell us about your event or question…',
    'contacts.send': 'Send message',
    'contacts.sending': 'Sending…',
    'contacts.successTitle': 'Message sent!',
    'contacts.successBody': 'Thank you. We will get back to you as soon as possible.',
    'contacts.sendNew': 'Send a new message',
    'contacts.errorMsg':
      'An error occurred while sending. Please try again or call us.',
    'contacts.tooFast': 'Please wait a moment before sending another message.',
    'contacts.invalidEmail': 'Please enter a valid email address.',
    'contacts.shortMsg': 'The message must be at least 10 characters long.',
    'contacts.tip': 'Tip:',
    'contacts.tipBody':
      'For group reservations and look consultations we recommend calling us in advance.',
    'contacts.openMaps': 'Open in Google Maps',
    'contacts.required': 'required',

    // about
    'about.eyebrow': 'Our story',
    'about.title': 'About us',
    'about.subtitle':
      "Sometimes it's nice to be someone else, if only for a little while. CarnivalForYou is a family-run costume rental store in Sofia, where everyone can discover their inner hero.",
    'about.hookBody':
      'Every day we play our roles — parents, children, partners, friends, professionals. We do the same things, meet the same people, follow the same familiar rhythm. But somewhere deep down, the child who once dreamed of being a prince or princess, a pirate, a fairy, a superhero, a king or queen is probably still there. What if, for one day, we could be that hero?',
    'about.storyTitle': 'From a small idea to a magical world',
    'about.story1':
      'CarnivalForYou started as a small workshop with one dream — to help everyone become the hero they imagine. Today we are a cozy store in Sofia, curating costumes and Venetian masks from the best carnival costume workshops around the world.',
    'about.story2':
      'We believe a costume is not just clothing — it is a portal to another story. That is why we curate every look with attention to detail and a passion for the craft.',
    'about.heroListTitle': 'You might become:',
    'about.hero1': 'A pirate captain chasing a lost treasure',
    'about.hero2': 'A fairy who just arrived from a storybook land',
    'about.hero3': 'A king or queen — for one night',
    'about.hero4': 'A hero from your favorite movie',
    'about.hero5': "Or simply someone you've never been before",
    'about.offerTitle': 'Over 2000 costumes for every occasion',
    'about.offerBody':
      'We have over 2000 costumes waiting for you — carnival, stage and formal wear, for children and adults, available to rent, buy, or order custom-made.',
    'about.addonsBody':
      "And if the costume alone isn't enough, we'll add makeup, hairstyling, a mask, a wig, a hat and any accessories needed to complete the look. Experienced, out-of-the-box designers, stylists, makeup artists and hairdressers are on hand to turn your idea into reality.",
    'about.v1Title': 'From the best workshops in the world',
    'about.v1Body':
      'We select every costume with care for detail — sourced from the best carnival costume workshops around the world.',
    'about.v2Title': 'Over 10 years of experience',
    'about.v2Body':
      'We create magical looks for thousands of clients across Bulgaria.',
    'about.v3Title': 'With care for you',
    'about.v3Body': 'We help you choose the perfect look for your event.',
    'about.originTitle': 'Who are we?',
    'about.originBody':
      "You might know us as the fashion house Odeta — yes, that's us. After years devoted to wedding, evening and prom gowns, we decided to open another door to the world of imagination. That's how CarnivalForYou was born — a place for the moments when you don't just want to celebrate, but want to experience something different and memorable.",
    'about.occasionsTitle': 'For every occasion',
    'about.occasion1': 'Birthdays',
    'about.occasion2': 'Parties with friends',
    'about.occasion3': 'Themed events',
    'about.occasion4': "Kids' celebrations",
    'about.occasion5': 'A surprise for someone you love',
    'about.occasion6': 'Bachelorette or bachelor parties',
    'about.occasion7': 'Theater performances',
    'about.occasion8': 'Photo shoots',
    'about.occasion9': 'Or just a day when you want to escape the everyday',
    'about.closingBody':
      "There are no magic wands in our story. But there are costumes, imagination, experience, and a real desire to surprise you. The rest is up to you.",
    'about.quote':
      '“Choose your hero, put on a costume, wear a mask — and let the adventure begin. Sometimes it\'s nice to be someone else."',
    'about.browseBtn': 'Browse costumes',

    // services
    'services.eyebrow': 'What we offer',
    'services.title': 'Services',
    'services.subtitle':
      'Besides costume rentals, we help with custom tailoring, professional makeup and look consultation.',
    'services.inquire': 'Inquire',
    'services.processTitle': 'How reservation works',
    'services.step1T': 'Choose a look',
    'services.step1D': 'Browse the catalog and choose your costume.',
    'services.step2T': 'Reserve in store',
    'services.step2D': 'Visit our store to confirm availability and size.',
    'services.step3T': 'Pick up and transform',
    'services.step3D': 'Take your costume and enjoy the event.',

    // news
    'news.eyebrow': 'Latest',
    'news.title': 'News',
    'news.subtitle':
      'Latest news, seasonal offers and events from the world of CarnivalForYou.',
    'news.readMore': 'Read more',

    // terms
    'terms.eyebrow': 'Rules & conditions',
    'terms.title': 'Terms & FAQ',
    'terms.subtitle':
      'Rental terms for costumes at CarnivalForYou. Please read carefully before reserving.',
    'terms.footerPrefix': 'Questions about the terms? Contact us through the',
    'terms.footerSuffix': ' page.',

    // cookie
    'cookie.title': 'Cookies & privacy',
    'cookie.body':
      'We use cookies to improve your experience and remember your preferences. By continuing, you agree to our use of cookies.',
    'cookie.accept': 'Accept',
    'cookie.decline': 'Decline',

    // seo
    'seo.homeTitle': 'CarnivalForYou — Magical Costume Rentals',
    'seo.homeDesc':
      'Magical costume rentals in Sofia. Venetian masks, fantasy looks, Halloween and kids costumes. Reserve in store.',
    'seo.productsTitle': 'Costume Rental Catalog | CarnivalForYou',
    'seo.productsDesc':
      'Browse available costumes for rent — Venetian, fantasy, Halloween and kids. Daily prices, in-store reservation in Sofia.',
  },
};

const STORAGE_KEY = 'cfy-lang';

function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'bg';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en') return 'en';
  // Bulgarian is the default language.
  return 'bg';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    typeof window !== 'undefined' ? detectInitialLang() : 'bg'
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = (next: Lang) => setLangState(next);

  const t = (key: string): string => translations[lang][key] ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
