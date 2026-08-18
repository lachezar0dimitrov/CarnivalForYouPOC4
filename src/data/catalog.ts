// All placeholder catalog + content data for CarnivalForyou.
// Images are real Pexels URLs (object-cover responsive).

export type Category = {
  id: string;
  name: string;
  tagline: string;
  image: string;
};

export type Costume = {
  id: string;
  name: string;
  category: string;
  description: string;
  pricePerDay: number;
  deposit: number;
  sizes: string[];
  image: string;
  tags: string[];
};

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: string;
  image: string;
};

export type NewsPost = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
};

export const categories: Category[] = [
  {
    id: 'venetian',
    name: 'Венециански',
    tagline: 'Мистерия и изящество от карнавала във Венеция',
    image:
      'https://images.pexels.com/photos/30926717/pexels-photo-30926717.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'fantasy',
    name: 'Фантазийни',
    tagline: 'Елфи, вещици и същества от магическите гори',
    image:
      'https://images.pexels.com/photos/27581197/pexels-photo-27581197.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'halloween',
    name: 'Хелоуин',
    tagline: 'Тъмни и смразяващи образи за най-страшната нощ',
    image:
      'https://images.pexels.com/photos/14202548/pexels-photo-14202548.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'kids',
    name: 'Детски',
    tagline: 'Вълшебни костюми за най-малките герои',
    image:
      'https://images.pexels.com/photos/6617274/pexels-photo-6617274.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
];

export const costumes: Costume[] = [
  {
    id: 'c1',
    name: 'Венецианска маска с пера',
    category: 'venetian',
    description:
      'Ръчно изработена венецианска маска с декоративни пера и златна бродерия. Идеална за маскаради и балове.',
    pricePerDay: 25,
    deposit: 40,
    sizes: ['S', 'M', 'L'],
    image:
      'https://images.pexels.com/photos/15587740/pexels-photo-15587740.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    tags: ['Маска', 'Пера', 'Бал'],
  },
  {
    id: 'c2',
    name: 'Черен карнавален образ',
    category: 'venetian',
    description:
      'Елегантен черен костюм с орнаментирана маска и шапка. Класически венециански силует за всеки бал.',
    pricePerDay: 35,
    deposit: 60,
    sizes: ['M', 'L', 'XL'],
    image:
      'https://images.pexels.com/photos/30926699/pexels-photo-30926699.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    tags: ['Черен', 'Шапка', 'Класика'],
  },
  {
    id: 'c3',
    name: 'Венециански маски — колекция',
    category: 'venetian',
    description:
      'Богата колекция от маски за групови резервации — за тематични партита и студийни снимки.',
    pricePerDay: 20,
    deposit: 30,
    sizes: ['Универсална'],
    image:
      'https://images.pexels.com/photos/31397062/pexels-photo-31397062.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    tags: ['Колекция', 'Група'],
  },
  {
    id: 'c4',
    name: 'Магьосница от тъмната гора',
    category: 'fantasy',
    description:
      'Тъмна мантия с качулка и тояга. Въплъщение на мистична сила от легендите за гората.',
    pricePerDay: 30,
    deposit: 50,
    sizes: ['S', 'M', 'L'],
    image:
      'https://images.pexels.com/photos/27581197/pexels-photo-27581197.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    tags: ['Магия', 'Мантия', 'Тояга'],
  },
  {
    id: 'c5',
    name: 'Елфическа горска фея',
    category: 'fantasy',
    description:
      'Дълга руса перука с елфически уши и зелен горски наряд. За феновете на фентъзи и косплей.',
    pricePerDay: 32,
    deposit: 55,
    sizes: ['S', 'M'],
    image:
      'https://images.pexels.com/photos/33411470/pexels-photo-33411470.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    tags: ['Елф', 'Фея', 'Косплей'],
  },
  {
    id: 'c6',
    name: 'Готическа цветна корона',
    category: 'fantasy',
    description:
      'Готически грим с пищна цветна глава — смел образ за тематични фотосесии и събития.',
    pricePerDay: 28,
    deposit: 45,
    sizes: ['M', 'L'],
    image:
      'https://images.pexels.com/photos/28587983/pexels-photo-28587983.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    tags: ['Готик', 'Цветя', 'Грим'],
  },
  {
    id: 'c7',
    name: 'Смразяваща нощ в гората',
    category: 'halloween',
    description:
      'Двойка страшни маски за най-страшната нощ. Идеално за двойки и тематични партии.',
    pricePerDay: 22,
    deposit: 35,
    sizes: ['Универсална'],
    image:
      'https://images.pexels.com/photos/14202548/pexels-photo-14202548.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    tags: ['Страшен', 'Двойка', 'Маска'],
  },
  {
    id: 'c8',
    name: 'Тиквена глава',
    category: 'halloween',
    description:
      'Черна рокля с тиквена маска — класически Хелоуин образ с усещане за селски кошмар.',
    pricePerDay: 24,
    deposit: 40,
    sizes: ['S', 'M', 'L'],
    image:
      'https://images.pexels.com/photos/18951432/pexels-photo-18951432.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    tags: ['Тиква', 'Рокля', 'Хелоуин'],
  },
  {
    id: 'c9',
    name: 'Малката фея ангел',
    category: 'kids',
    description:
      'Крила и вълшебна пръчка за малки феи. Лек и удобен костюм за детски партита.',
    pricePerDay: 15,
    deposit: 25,
    sizes: ['Дети 4-6', 'Дети 7-10'],
    image:
      'https://images.pexels.com/photos/6617274/pexels-photo-6617274.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    tags: ['Фея', 'Крила', 'Деца'],
  },
  {
    id: 'c10',
    name: 'Малчуганът магьосник',
    category: 'kids',
    description:
      'Висока зелена шапка на магьосник — идеален костюм за любителите на магическите истории.',
    pricePerDay: 14,
    deposit: 22,
    sizes: ['Дети 5-8', 'Дети 9-12'],
    image:
      'https://images.pexels.com/photos/6800541/pexels-photo-6800541.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    tags: ['Магьосник', 'Шапка', 'Деца'],
  },
  {
    id: 'c11',
    name: 'Кралска синя рокля',
    category: 'fantasy',
    description:
      'Блестяща синя вечерна рокля за принцеси. За балове, абитуриентски балове и театрални роли.',
    pricePerDay: 40,
    deposit: 70,
    sizes: ['S', 'M', 'L'],
    image:
      'https://images.pexels.com/photos/18457620/pexels-photo-18457620.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    tags: ['Рокля', 'Принцеса', 'Бал'],
  },
  {
    id: 'c12',
    name: 'Венецианска маскарадна двойка',
    category: 'venetian',
    description:
      'Маскарадна маска с червени пера — елегантен акцент за партита и снимки в двойка.',
    pricePerDay: 26,
    deposit: 44,
    sizes: ['Универсална'],
    image:
      'https://images.pexels.com/photos/3535986/pexels-photo-3535986.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    tags: ['Маска', 'Червено', 'Партита'],
  },
];

export const services: Service[] = [
  {
    id: 's1',
    title: 'Персонално шиене',
    description:
      'Изработка на костюми по мярка — за перфектна посадка и уникален образ по ваша идея.',
    icon: 'Scissors',
    image:
      'https://images.pexels.com/photos/6461076/pexels-photo-6461076.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 's2',
    title: 'Професионален грим',
    description:
      'Сценичен и карнавален грим от опитни гримьори — превърнете се във вашия герой напълно.',
    icon: 'Brush',
    image:
      'https://images.pexels.com/photos/324656/pexels-photo-324656.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 's3',
    title: 'Консултация по образ',
    description:
      'Помагаме ви да изберете перфектния костюм, аксесоари и грим за вашето събитие.',
    icon: 'Sparkles',
    image:
      'https://images.pexels.com/photos/4721513/pexels-photo-4721513.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 's4',
    title: 'Групови резервации',
    description:
      'Отстъпки за групи — за театри, студия, училища и тематични партита с общ образ.',
    icon: 'Users',
    image:
      'https://images.pexels.com/photos/3858268/pexels-photo-3858268.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
];

export const newsPosts: NewsPost[] = [
  {
    id: 'n1',
    title: 'Нова колекция венециански маски вече в магазина',
    excerpt:
      'Току-що получихме нова пратка от ръчно изработени венециански маски. Заповядайте при нас, за да ги изберете на живо.',
    date: '15 октомври 2025',
    category: 'Нови поступления',
    image:
      'https://images.pexels.com/photos/15587740/pexels-photo-15587740.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'n2',
    title: 'Подгответе се за Хелоуин — резервациите започнаха',
    excerpt:
      'Местата за най-търсените страшни костюми се изчерпват бързо. Резервирайте своя образ още днес, за да не изпускате.',
    date: '1 октомври 2025',
    category: 'Сезонни',
    image:
      'https://images.pexels.com/photos/14202548/pexels-photo-14202548.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'n3',
    title: 'Групов пакет за балове и абитуриенти',
    excerpt:
      'Специална оферта за групови резервации — отстъпки и безплатна консултация по образ за вашата компания.',
    date: '20 септември 2025',
    category: 'Оферти',
    image:
      'https://images.pexels.com/photos/18457620/pexels-photo-18457620.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'n4',
    title: 'Майсторски клас по сценичен грим',
    excerpt:
      'Научете тайните на професионалния карнавален грим от нашите гримьори. Запишете се за следващия клас.',
    date: '5 септември 2025',
    category: 'Събития',
    image:
      'https://images.pexels.com/photos/324656/pexels-photo-324656.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
];

export const storeInfo = {
  name: 'CarnivalForYou',
  address: 'ж.к. Младост 4, бл. 426А, вх. В, ет. 1, София',
  addressEn: 'Mladost 4, bl. 426A, ent. B, fl. 1, Sofia',
  phone: '+359 88 8716 941',
  email: 'office@carnivalforyou.com',
  hours: [
    { day: 'Понед., Сряда, Петък', time: '12:00 – 18:00' },
    { day: 'Събота', time: '12:00 – 14:00' },
    { day: 'Неделя и Вторник, Четвъртък', time: 'Затворено' },
  ],
  hoursEn: [
    { day: 'Monday, Wednesday, Friday', time: '12:00 – 18:00' },
    { day: 'Saturday', time: '12:00 – 14:00' },
    { day: 'Sunday, Tuesday, Thursday', time: 'Closed' },
  ],
};

// Background hero images
export const heroImage =
  'https://images.pexels.com/photos/38188604/pexels-photo-38188604.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
export const aboutImage =
  'https://images.pexels.com/photos/374677/pexels-photo-374677.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
export const forestImage =
  'https://images.pexels.com/photos/1996042/pexels-photo-1996042.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
