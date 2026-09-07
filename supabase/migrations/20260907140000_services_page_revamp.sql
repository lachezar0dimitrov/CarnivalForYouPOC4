/*
Services page revamp: add a full-article `content_bg` / `content_en` field
to services (same plain-text format as news_posts.content_* — blank lines
separate paragraphs, a line starting with "## " renders as a sub-heading,
single newlines inside a paragraph render as <br />) plus a `gallery_images`
array so the public Services page can expand a service card inline on
"Read more" (like NewsPage) with a photo gallery interspersed through the
long-form text. ServicesPage.tsx / ServiceForm in AdminPage.tsx parse this.

Replaces the 4 existing placeholder services (seeded in
20260903160000_content_pages_services_news_about_terms.sql, generic
Pexels-photo entries never edited by the client) with the 4 real services
the client supplied: evening/stage/carnival makeup, themed photo sessions,
gift vouchers, and temporary henna tattoos.
*/

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS content_bg text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS content_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}'::text[];

DELETE FROM services;

INSERT INTO services
  (title_bg, title_en, description_bg, description_en, content_bg, content_en, icon, image_url, gallery_images, is_active, sort_order)
VALUES
(
  $t$Вечерен, сценичен и карнавален грим$t$,
  $t$Evening, Stage & Carnival Makeup$t$,
  $t$Официален, сценичен или забавен карнавален грим, изработен от професионална гримьорка – по ваш вкус, за деца и възрастни.$t$,
  $t$Formal, stage or fun carnival makeup by our professional makeup artist – tailored to your look, for kids and adults alike.$t$,
  $t$Имате повод за празнуване, намерили сте си подходящото облекло и аксесоари – какво остава, за да завършите цялостната си визия? Гримът и прическата са много важни елементи, които, използвани по правилния начин, ви карат да се чувствате различни и неотразими. Точно това е и нашата цел.

Професионалната ни гримьорка с радост ще ви предложи най-подходящия грим спрямо лицето ви и стила на тоалета, а разбира се и спрямо вашите желания!

Предлагаме официален грим, сценичен грим, а също и карнавален грим – забавен или страшен, за малки или големи. Гримовете, с които работим, са професионални и качествени.

Карнавалният грим обикновено се прави със специална боя за лице на водна основа, която се почиства лесно и е дерматологично тествана, така че е подходяща и за деца.

Разполагаме с богат каталог с безброй модели, от които можете да изберете точно какъв да бъде вашият грим – съобразен с периода и визията на карнавалния костюм. Ако пък не сте привърженик на рисуването върху лице, имаме и алтернативен, не по-малко ефектен вариант – карнавални маски.

Заповядайте при нас, изборът е ваш!$t$,
  $t$You have a reason to celebrate, you've found the right outfit and accessories – what's left to complete your overall look? Makeup and hairstyling are essential elements that, done the right way, make you feel different and irresistible. That's exactly our goal.

Our professional makeup artist will gladly suggest the most fitting makeup for your face and the style of your outfit – and of course, for your own wishes!

We offer formal makeup, stage makeup, and carnival makeup – fun or scary, for kids or adults. The makeup products we work with are professional and high quality.

Carnival face makeup is usually done with special water-based face paint that washes off easily and is dermatologically tested, making it suitable for children too.

We have a rich catalog with countless designs to choose from, so your makeup can match the period and look of your carnival costume perfectly. And if face painting isn't your thing, we also offer an equally striking alternative – carnival masks.

Come visit us, the choice is yours!$t$,
  'Brush',
  'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-makeup-main.jpg',
  ARRAY[
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-makeup-1.jpg',
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-makeup-2.jpg',
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-makeup-3.jpg',
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-makeup-4.jpg'
  ]::text[],
  true, 0
),
(
  $t$Тематични фотосесии$t$,
  $t$Themed Photo Sessions$t$,
  $t$Професионални тематични декори и фотографски услуги за Хелоуин, Коледа и всесезонни теми – само с предварително записване.$t$,
  $t$Professional themed backdrops and photography for Halloween, Christmas and year-round themes – by appointment only.$t$,
  $t$Предлагаме прекрасни, професионално изградени тематични декори за фотосесии – съобразени със сезона: Хелоуин, Коледа, а също и всесезонни теми като пиратски приключения или любим приказен герой.

Фотосесиите се провеждат само с предварително записан час, за да можем да ви посветим необходимото внимание и да подготвим декора специално за вас.

При желание можем да изградим и цялостния ви образ – с помощта на професионален грим, прическа, облекло и аксесоари – така че резултатът да бъде запомнящ се до последния детайл.

Предлагаме и вариант за подаръчен ваучер за тематична фотосесия – прекрасна изненада за близък човек.

Заповядайте да създадем заедно вашите специални кадри!$t$,
  $t$We offer beautifully crafted, professional themed backdrops for photo sessions – matched to the season: Halloween, Christmas, as well as year-round themes like pirate adventures or a favorite fairytale character.

Photo sessions are by prior appointment only, so we can give you our full attention and prepare the set especially for you.

On request, we can also build your entire look – with professional makeup, hairstyling, clothing and accessories – so the result is memorable down to the last detail.

We also offer a gift voucher option for a themed photo session – a lovely surprise for someone close to you.

Come and let's create your special shots together!$t$,
  'Camera',
  'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-photosessions-main.jpg',
  ARRAY[
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-photosessions-1.jpg',
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-photosessions-2.jpg',
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-photosessions-3.jpg',
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-photosessions-4.jpg'
  ]::text[],
  true, 1
),
(
  $t$Подаръчни ваучери$t$,
  $t$Gift Vouchers$t$,
  $t$Изненадайте близките си с ваучер за костюм, грим или тематична фотосесия в „Карнавал за теб“ – идеалният подарък за всеки повод.$t$,
  $t$Surprise your loved ones with a voucher for a costume, makeup or themed photo session at Carnival For You – the perfect gift for any occasion.$t$,
  $t$Не можете да решите какъв точно подарък да изберете за любим човек? Ваучерът от „Карнавал за теб“ е перфектното решение за всеки, който обича празниците, преобразяването и хубавите снимки.

С нашия подаръчен ваучер получателят може да избере сам своя костюм, аксесоари, професионален грим или тематична фотосесия сред декорите на нашата карнавална къща – по свой вкус и повод.

Ваучерите са подходящи за рожден ден, парти, Хелоуин, Коледа или просто като приятна изненада без специален повод.

Стойността и предназначението на ваучера могат да бъдат съобразени изцяло с вашето желание – просто ни кажете за какво търсите подарък и ние ще се погрижим за останалото.$t$,
  $t$Can't decide on the perfect gift for someone special? A Carnival For You voucher is the ideal solution for anyone who loves celebrations, transformation, and beautiful photos.

With our gift voucher, the recipient can choose their own costume, accessories, professional makeup, or a themed photo session among the backdrops of our carnival house – to match their own taste and occasion.

Vouchers make a great gift for a birthday, a party, Halloween, Christmas, or simply as a lovely surprise for no particular reason at all.

The value and purpose of the voucher can be tailored entirely to your wishes – just tell us what kind of gift you're looking for, and we'll take care of the rest.$t$,
  'Gift',
  'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-vouchers-main.png',
  ARRAY[]::text[],
  true, 2
),
(
  $t$Временни татуировки с къна$t$,
  $t$Temporary Henna Tattoos$t$,
  $t$Безболезнени временни татуировки с натурална къна – перфектният летен акцент, който трае до 2 седмици.$t$,
  $t$Pain-free temporary henna tattoos – the perfect summer accent that lasts up to two weeks.$t$,
  $t$## Искаш татуировка, но без болка и ангажименти?

Лятото е тук, време е да заблестиш! Превърни кожата си в изкуство с нашите временни татуировки с натурална къна. 🌿

## Защо да избереш къна?

0% болка, 100% стил – напълно безболезнено, релаксиращо и приятно изживяване.
Издръжливост – перфектната визия за морето, която трае до 2 седмици!
Красиво прикриване – идеалният и естетичен начин нежно да прикриеш белези, разширени вени или дребни кожни несъвършенства.
Тест драйв – искаш истинска татуировка, но се колебаеш за мястото или дизайна? Пробвай я първо при нас, за да видиш как ти стои, преди да я направиш завинаги!
Твоето уникално бижу за лятото – подчертай загара си и събирай възхитени погледи по бански или с любимата си лятна рокля.

Заповядай да превърнем кожата ти в произведение на изкуството!$t$,
  $t$## Want a tattoo without the pain or commitment?

Summer is here, it's time to shine! Turn your skin into art with our temporary tattoos made from natural henna. 🌿

## Why choose henna?

0% pain, 100% style – a completely painless, relaxing and pleasant experience.
Long-lasting – the perfect look for the beach that lasts up to two weeks!
Beautiful coverage – an elegant, gentle way to conceal scars, visible veins or minor skin imperfections.
A test drive – want a real tattoo but can't decide on the placement or design? Try it with us first to see how it looks before making it permanent!
Your one-of-a-kind summer accessory – highlight your tan and turn heads in your swimsuit or favorite summer dress.

Come let us turn your skin into a work of art!$t$,
  'PenTool',
  'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-henna-main.jpg',
  ARRAY[
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-henna-1.jpg',
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-henna-2.jpg',
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-henna-3.jpg',
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-henna-4.jpg',
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-henna-5.jpg',
    'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/services-henna-6.jpg'
  ]::text[],
  true, 3
);
