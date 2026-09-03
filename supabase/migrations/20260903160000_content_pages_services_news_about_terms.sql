/*
# Admin-editable content pages: Services, News, About, Terms & FAQ

## Purpose
Adds four content tables so the admin panel can edit the About/Services/News/
Terms&FAQ public pages (bilingual text + images) without a redeploy. Replaces
the hardcoded `services`/`newsPosts` arrays in src/data/catalog.ts and the
hardcoded bg/en content in AboutPage.tsx (via i18n.tsx) / TermsPage.tsx.

## New Tables
1. `services` — list, replaces catalog.ts `services` (title/description bg+en,
   icon, image, active, sort_order). Seeded with the current 4 services;
   English text is newly written here since none existed anywhere before.
2. `news_posts` — list, replaces catalog.ts `newsPosts` (title/excerpt/category
   bg+en, post_date, image, active, sort_order). Seeded likewise.
3. `about_content` — singleton (id=1), flat bg/en columns for every editable
   paragraph/heading plus jsonb arrays for the hero list / occasions / values
   repeating lists, plus 4 image columns. Seeded with the exact current text
   from i18n.tsx's `about.*` keys, so the page is unchanged until edited.
4. `terms_content` — singleton (id=1), jsonb for faq_groups / info_block /
   terms_blocks (mirrors TermsPage.tsx's current hardcoded structure exactly).
   FAQ answers are stored as one string per language, paragraphs joined by
   "\n\n" (rendered by splitting on that separator, same multi-paragraph
   look as today).

## Security
All four: RLS enabled, public SELECT (anon + authenticated), admin-only
writes (INSERT/UPDATE/DELETE for the two list tables, UPDATE only for the
two singletons) — identical policy shape to `banners`/`categories`/
`site_settings` (admin check: EXISTS profiles row with role = 'admin').
*/

-- ============================================================
-- 1. SERVICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title_bg text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  description_bg text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Sparkles',
  image_url text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_select_public" ON services;
CREATE POLICY "services_select_public"
ON services FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "services_insert_admin" ON services;
CREATE POLICY "services_insert_admin"
ON services FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "services_update_admin" ON services;
CREATE POLICY "services_update_admin"
ON services FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "services_delete_admin" ON services;
CREATE POLICY "services_delete_admin"
ON services FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO services (title_bg, title_en, description_bg, description_en, icon, image_url, sort_order)
SELECT * FROM (VALUES
  ($t$Персонално шиене$t$, $t$Custom Tailoring$t$,
   $t$Изработка на костюми по мярка — за перфектна посадка и уникален образ по ваша идея.$t$,
   $t$Custom-made costumes tailored to fit perfectly — for a unique look built around your idea.$t$,
   'Scissors', 'https://images.pexels.com/photos/6461076/pexels-photo-6461076.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0),
  ($t$Професионален грим$t$, $t$Professional Makeup$t$,
   $t$Сценичен и карнавален грим от опитни гримьори — превърнете се във вашия герой напълно.$t$,
   $t$Stage and carnival makeup by experienced makeup artists — become your character completely.$t$,
   'Brush', 'https://images.pexels.com/photos/324656/pexels-photo-324656.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
  ($t$Консултация по образ$t$, $t$Look Consultation$t$,
   $t$Помагаме ви да изберете перфектния костюм, аксесоари и грим за вашето събитие.$t$,
   $t$We help you choose the perfect costume, accessories and makeup for your event.$t$,
   'Sparkles', 'https://images.pexels.com/photos/4721513/pexels-photo-4721513.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 2),
  ($t$Групови резервации$t$, $t$Group Bookings$t$,
   $t$Отстъпки за групи — за театри, студия, училища и тематични партита с общ образ.$t$,
   $t$Discounts for groups — for theaters, studios, schools and themed parties with a shared look.$t$,
   'Users', 'https://images.pexels.com/photos/3858268/pexels-photo-3858268.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 3)
) AS v(title_bg, title_en, description_bg, description_en, icon, image_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM services);

-- ============================================================
-- 2. NEWS_POSTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS news_posts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title_bg text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  excerpt_bg text NOT NULL DEFAULT '',
  excerpt_en text NOT NULL DEFAULT '',
  category_bg text NOT NULL DEFAULT '',
  category_en text NOT NULL DEFAULT '',
  post_date date NOT NULL DEFAULT current_date,
  image_url text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_posts_select_public" ON news_posts;
CREATE POLICY "news_posts_select_public"
ON news_posts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "news_posts_insert_admin" ON news_posts;
CREATE POLICY "news_posts_insert_admin"
ON news_posts FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "news_posts_update_admin" ON news_posts;
CREATE POLICY "news_posts_update_admin"
ON news_posts FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "news_posts_delete_admin" ON news_posts;
CREATE POLICY "news_posts_delete_admin"
ON news_posts FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO news_posts (title_bg, title_en, excerpt_bg, excerpt_en, category_bg, category_en, post_date, image_url, sort_order)
SELECT * FROM (VALUES
  ($t$Нова колекция венециански маски вече в карнавалната къща$t$,
   $t$New Venetian Mask Collection Now In Store$t$,
   $t$Току-що получихме нова пратка от ръчно изработени венециански маски. Заповядайте при нас, за да ги изберете на живо.$t$,
   $t$We just received a new shipment of handmade Venetian masks. Come see them in person and pick your favorite.$t$,
   $t$Нови поступления$t$, $t$New Arrivals$t$,
   DATE '2025-10-15',
   'https://images.pexels.com/photos/15587740/pexels-photo-15587740.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 0),
  ($t$Подгответе се за Хелоуин — резервациите започнаха$t$,
   $t$Get Ready for Halloween — Reservations Are Open$t$,
   $t$Местата за най-търсените страшни костюми се изчерпват бързо. Резервирайте своя образ още днес, за да не изпускате.$t$,
   $t$Spots for the most in-demand spooky costumes are filling up fast. Reserve your look today so you don't miss out.$t$,
   $t$Сезонни$t$, $t$Seasonal$t$,
   DATE '2025-10-01',
   'https://images.pexels.com/photos/14202548/pexels-photo-14202548.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
  ($t$Групов пакет за балове и абитуриенти$t$,
   $t$Group Package for Proms and Graduation Balls$t$,
   $t$Специална оферта за групови резервации — отстъпки и безплатна консултация по образ за вашата компания.$t$,
   $t$A special offer for group bookings — discounts and a free look consultation for your group.$t$,
   $t$Оферти$t$, $t$Offers$t$,
   DATE '2025-09-20',
   'https://images.pexels.com/photos/18457620/pexels-photo-18457620.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 2),
  ($t$Майсторски клас по сценичен грим$t$,
   $t$Stage Makeup Masterclass$t$,
   $t$Научете тайните на професионалния карнавален грим от нашите гримьори. Запишете се за следващия клас.$t$,
   $t$Learn the secrets of professional carnival makeup from our makeup artists. Sign up for the next class.$t$,
   $t$Събития$t$, $t$Events$t$,
   DATE '2025-09-05',
   'https://images.pexels.com/photos/324656/pexels-photo-324656.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 3)
) AS v(title_bg, title_en, excerpt_bg, excerpt_en, category_bg, category_en, post_date, image_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM news_posts);

-- ============================================================
-- 3. ABOUT_CONTENT TABLE (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS about_content (
  id int PRIMARY KEY DEFAULT 1,
  hook_body_bg text NOT NULL DEFAULT '',
  hook_body_en text NOT NULL DEFAULT '',
  story_title_bg text NOT NULL DEFAULT '',
  story_title_en text NOT NULL DEFAULT '',
  story1_bg text NOT NULL DEFAULT '',
  story1_en text NOT NULL DEFAULT '',
  story2_bg text NOT NULL DEFAULT '',
  story2_en text NOT NULL DEFAULT '',
  story_image_url text NOT NULL DEFAULT '',
  hero_list_title_bg text NOT NULL DEFAULT '',
  hero_list_title_en text NOT NULL DEFAULT '',
  hero_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  hero_image_url text NOT NULL DEFAULT '',
  offer_title_bg text NOT NULL DEFAULT '',
  offer_title_en text NOT NULL DEFAULT '',
  offer_body_bg text NOT NULL DEFAULT '',
  offer_body_en text NOT NULL DEFAULT '',
  addons_body_bg text NOT NULL DEFAULT '',
  addons_body_en text NOT NULL DEFAULT '',
  offer_image_url text NOT NULL DEFAULT '',
  values_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  origin_title_bg text NOT NULL DEFAULT '',
  origin_title_en text NOT NULL DEFAULT '',
  origin_body_bg text NOT NULL DEFAULT '',
  origin_body_en text NOT NULL DEFAULT '',
  occasions_title_bg text NOT NULL DEFAULT '',
  occasions_title_en text NOT NULL DEFAULT '',
  occasions jsonb NOT NULL DEFAULT '[]'::jsonb,
  quote_bg text NOT NULL DEFAULT '',
  quote_en text NOT NULL DEFAULT '',
  closing_body_bg text NOT NULL DEFAULT '',
  closing_body_en text NOT NULL DEFAULT '',
  forest_image_url text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "about_content_select_public" ON about_content;
CREATE POLICY "about_content_select_public"
ON about_content FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "about_content_update_admin" ON about_content;
CREATE POLICY "about_content_update_admin"
ON about_content FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO about_content (
  id,
  hook_body_bg, hook_body_en,
  story_title_bg, story_title_en, story1_bg, story1_en, story2_bg, story2_en, story_image_url,
  hero_list_title_bg, hero_list_title_en, hero_list, hero_image_url,
  offer_title_bg, offer_title_en, offer_body_bg, offer_body_en, addons_body_bg, addons_body_en, offer_image_url,
  values_list,
  origin_title_bg, origin_title_en, origin_body_bg, origin_body_en,
  occasions_title_bg, occasions_title_en, occasions,
  quote_bg, quote_en, closing_body_bg, closing_body_en, forest_image_url
) VALUES (
  1,
  $t$Всеки ден имаме своята роля — родители, деца, съпрузи, приятели, професионалисти. Правим едни и същи неща, срещаме едни и същи хора, следваме познатия ритъм. Но някъде дълбоко в нас навярно все още живее детето, което е мечтало да бъде принц или принцеса, пират, фея, супергерой, крал или кралица. Ами ако за един ден можем да бъдем точно този герой?$t$,
  $t$Every day we play our roles — parents, children, partners, friends, professionals. We do the same things, meet the same people, follow the same familiar rhythm. But somewhere deep down, the child who once dreamed of being a prince or princess, a pirate, a fairy, a superhero, a king or queen is probably still there. What if, for one day, we could be that hero?$t$,
  $t$От малка идея до магически свят$t$, $t$From a small idea to a magical world$t$,
  $t$CarnivalForYou започна като малка работилница с една мечта — да помогне на всеки човек да се превърне в героя, за когото мечтае. Днес сме уютна карнавална къща в София, която подбира костюми и венециански маски от най-добрите карнавални работилници по света.$t$,
  $t$CarnivalForYou started as a small workshop with one dream — to help everyone become the hero they imagine. Today we are a cozy carnival house in Sofia, curating costumes and Venetian masks from the best carnival costume workshops around the world.$t$,
  $t$Вярваме, че костюмът е не само дреха — това е портал към друга история. Затова подбираме всеки образ с внимание към детайла и страст към занаята.$t$,
  $t$We believe a costume is not just clothing — it is a portal to another story. That is why we curate every look with attention to detail and a passion for the craft.$t$,
  '/images/shop2.jpg',
  $t$Може би ще бъдете:$t$, $t$You might become:$t$,
  $j$[
    {"bg": "Пиратски капитан, тръгнал по следите на изгубено съкровище", "en": "A pirate captain chasing a lost treasure"},
    {"bg": "Фея, пристигнала от приказна страна", "en": "A fairy who just arrived from a storybook land"},
    {"bg": "Крал или кралица — поне за една нощ", "en": "A king or queen — for one night"},
    {"bg": "Герой от любимия ви филм", "en": "A hero from your favorite movie"},
    {"bg": "Или просто някой, когото никога досега не сте били", "en": "Or simply someone you've never been before"}
  ]$j$::jsonb,
  '/images/shop.jpg',
  $t$Над 2000 костюма за всеки повод$t$, $t$Over 2000 costumes for every occasion$t$,
  $t$При нас ви очакват над 2000 костюма — карнавални, сценични и официални, за деца и възрастни, под наем, за покупка или по поръчка.$t$,
  $t$We have over 2000 costumes waiting for you — carnival, stage and formal wear, for children and adults, available to rent, buy, or order custom-made.$t$,
  $t$А ако костюмът не е достатъчен, добавяме грим, прическа, маска, перука, шапка, аксесоари и всичко необходимо, за да завършим образа. Професионални дизайнери, стилисти, гримьори и фризьори с опит и нестандартно мислене са на ваше разположение, за да превърнем желанието ви в реалност.$t$,
  $t$And if the costume alone isn't enough, we'll add makeup, hairstyling, a mask, a wig, a hat and any accessories needed to complete the look. Experienced, out-of-the-box designers, stylists, makeup artists and hairdressers are on hand to turn your idea into reality.$t$,
  '/images/shop3.jpg',
  $j$[
    {"icon": "Sparkles", "title_bg": "От най-добрите работилници по света", "title_en": "From the best workshops in the world", "body_bg": "Подбираме всеки костюм с внимание към детайла — от най-добрите карнавални работилници по света.", "body_en": "We select every costume with care for detail — sourced from the best carnival costume workshops around the world."},
    {"icon": "Clock", "title_bg": "Над 10 години опит", "title_en": "Over 10 years of experience", "body_bg": "Създаваме магически образи за хиляди клиенти от цяла България.", "body_en": "We create magical looks for thousands of clients across Bulgaria."},
    {"icon": "Heart", "title_bg": "С грижа за вас", "title_en": "With care for you", "body_bg": "Помагаме ви да изберете перфектния образ за вашето събитие.", "body_en": "We help you choose the perfect look for your event."}
  ]$j$::jsonb,
  $t$Кои сме ние?$t$, $t$Who are we?$t$,
  $t$Може би ни познавате като модна къща „Одета" — да, това сме ние. След години, посветени на сватбените, вечерните и балните тоалети, решихме да отворим още една врата към света на въображението. Така се роди CarnivalForYou — място за моментите, в които не искате просто да празнувате, а искате да преживеете нещо различно и запомнящо се.$t$,
  $t$You might know us as the fashion house Odeta — yes, that's us. After years devoted to wedding, evening and prom gowns, we decided to open another door to the world of imagination. That's how CarnivalForYou was born — a place for the moments when you don't just want to celebrate, but want to experience something different and memorable.$t$,
  $t$За всеки повод$t$, $t$For every occasion$t$,
  $j$[
    {"bg": "Рожден ден", "en": "Birthdays"},
    {"bg": "Парти с приятели", "en": "Parties with friends"},
    {"bg": "Тематично събитие", "en": "Themed events"},
    {"bg": "Детски празник", "en": "Kids' celebrations"},
    {"bg": "Изненада за любим човек", "en": "A surprise for someone you love"},
    {"bg": "Моминско или ергенско парти", "en": "Bachelorette or bachelor parties"},
    {"bg": "Театрален спектакъл", "en": "Theater performances"},
    {"bg": "Фотосесия", "en": "Photo shoots"},
    {"bg": "Или просто ден, в който ви се иска да избягате от обичайното", "en": "Or just a day when you want to escape the everyday"}
  ]$j$::jsonb,
  $t$„Изберете своя герой, облечете костюм, сложете маска — и нека приключението започне. Понякога е хубаво да бъдеш някой друг."$t$,
  $t$"Choose your hero, put on a costume, wear a mask — and let the adventure begin. Sometimes it's nice to be someone else."$t$,
  $t$В нашата приказка няма вълшебни пръчици. Но има костюми, въображение, опит и много желание да ви изненадаме. А останалото зависи от вас.$t$,
  $t$There are no magic wands in our story. But there are costumes, imagination, experience, and a real desire to surprise you. The rest is up to you.$t$,
  'https://images.pexels.com/photos/1996042/pexels-photo-1996042.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. TERMS_CONTENT TABLE (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS terms_content (
  id int PRIMARY KEY DEFAULT 1,
  faq_groups jsonb NOT NULL DEFAULT '[]'::jsonb,
  info_block jsonb NOT NULL DEFAULT '{}'::jsonb,
  terms_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE terms_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "terms_content_select_public" ON terms_content;
CREATE POLICY "terms_content_select_public"
ON terms_content FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "terms_content_update_admin" ON terms_content;
CREATE POLICY "terms_content_update_admin"
ON terms_content FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO terms_content (id, faq_groups, info_block, terms_blocks) VALUES (
  1,
  $j$[
    {
      "heading_bg": null,
      "heading_en": null,
      "items": [
        {"q_bg": "1. Как мога да наема костюм?", "q_en": "1. How can I rent a costume?",
         "a_bg": "Обадете ни се по телефона, за да уточним посещението ви в нашата карнавална къща.\n\nМожете предварително да изберете костюм от сайта или да разгледате моделите в нашите каталози. Ако не сте сигурни какво търсите, нашите консултанти с удоволствие ще ви помогнат да изберете подходящ костюм и аксесоари.\n\nСлед избора можете да пробвате костюма и да го резервирате за желаната от вас дата, като заплатите наема.\n\nПри получаване на костюма се заплаща депозит, който се възстановява при връщането му, ако костюмът е в нормален за използване вид – без скъсвания, изгаряния, трайни петна и други подобни повреди.",
         "a_en": "Call us by phone so we can arrange your visit to the carnival house.\n\nYou can pre-select a costume from the site or browse the models in our catalogs. If you're not sure what you're looking for, our consultants will be happy to help you choose a suitable costume and accessories.\n\nAfter choosing, you can try on the costume and reserve it for your desired date by paying the rental fee.\n\nA deposit is paid when you pick up the costume; it is refunded when you return it in normal, usable condition – without tears, burns, permanent stains or similar damage."},
        {"q_bg": "2. Как мога да заплатя наема и депозита?", "q_en": "2. How can I pay the rental fee and deposit?",
         "a_bg": "Наемът може да бъде заплатен в брой или с карта.\n\nДепозитът се заплаща в брой.",
         "a_en": "The rental fee can be paid in cash or by card.\n\nThe deposit is paid in cash."},
        {"q_bg": "3. За колко време е наемът?", "q_en": "3. How long is the rental period?",
         "a_bg": "Стандартният срок на наема е 48 часа.\n\nНеработните дни на карнавалната къща не се включват в срока на наема и за тях не се заплаща допълнително.",
         "a_en": "The standard rental period is 48 hours.\n\nThe carnival house's non-working days are not counted toward the rental period and are not charged for."},
        {"q_bg": "4. Мога ли да наема костюм за по-дълъг период?", "q_en": "4. Can I rent a costume for a longer period?",
         "a_bg": "Да, възможно е.\n\nПри необходимост от по-дълъг период на наем цената се договаря индивидуално.",
         "a_en": "Yes, that's possible.\n\nIf you need a longer rental period, the price is agreed individually."},
        {"q_bg": "5. Мога ли да заменя или да откажа вече резервиран костюм?", "q_en": "5. Can I exchange or cancel a costume I've already reserved?",
         "a_bg": "Да, при следните условия:\n\n• При замяна до 3 дни преди резервираната дата доплащате само разликата, ако новият костюм е по-скъп. Ако е по-евтин, получавате ваучер за разликата, валиден 1 година.\n\n• При отказ до 3 дни преди резервираната дата получавате ваучер на стойност 100% от заплатения наем, валиден 1 година.\n\n• В последните 3 дни преди резервираната дата не се допуска отказ или замяна, освен по изключение и при възможност за замяна с друг наличен костюм.\n\n• В периода от 15 дни преди Halloween и Коледа замяна или отказ на вече резервиран костюм се допуска само по изключение и при възможност за замяна с друг наличен костюм.\n\nПри всички случаи новият костюм трябва да бъде наличен за съответната дата.",
         "a_en": "Yes, under the following conditions:\n\n• If you exchange it up to 3 days before the reserved date, you only pay the difference if the new costume is more expensive. If it's cheaper, you receive a voucher for the difference, valid for 1 year.\n\n• If you cancel up to 3 days before the reserved date, you receive a voucher for 100% of the rental fee paid, valid for 1 year.\n\n• In the last 3 days before the reserved date, cancellation or exchange is not allowed, except by exception and if another available costume can be substituted.\n\n• In the 15 days before Halloween and Christmas, exchanging or cancelling an already reserved costume is only allowed by exception and if another available costume can be substituted.\n\nIn all cases, the new costume must be available for the relevant date."},
        {"q_bg": "6. Мога ли да запазя костюм по телефона?", "q_en": "6. Can I reserve a costume by phone?",
         "a_bg": "Не. Костюми се резервират само на място в нашата карнавална къща.",
         "a_en": "No. Costumes can only be reserved in person, at our carnival house."},
        {"q_bg": "7. Мога ли да запазя костюм с доставка?", "q_en": "7. Can I reserve a costume with delivery?",
         "a_bg": "Да, но само ако предварително сте видели и одобрили костюма и сте заплатили наема му – лично или чрез упълномощен от вас човек.\n\nТази услуга не се предлага в периода от 15 дни преди Halloween и Коледа.",
         "a_en": "Yes, but only if you've already seen and approved the costume in advance and paid the rental fee – either in person or through someone you've authorized.\n\nThis service is not offered in the 15 days before Halloween and Christmas."},
        {"q_bg": "8. Мога ли да върна наетите артикули по куриер?", "q_en": "8. Can I return the rented items by courier?",
         "a_bg": "Да.\n\nНеобходимо е предварително да ни уведомите и да изпратите наетите артикули добре опаковани и в срок.\n\nПратката трябва да бъде изпратена с опция „Преглед\", с транспорт за ваша сметка и с наложен платеж в размер на оставения депозит.",
         "a_en": "Yes.\n\nYou need to let us know in advance and send the rented items well packaged and on time.\n\nThe parcel must be sent with an \"inspection\" option, at your own transport cost, and cash-on-delivery for the amount of the deposit left."},
        {"q_bg": "9. Какво се случва при повреда на костюма?", "q_en": "9. What happens if the costume is damaged?",
         "a_bg": "Ако повредата може да бъде отстранена, от депозита се удържа необходимата сума за ремонта.\n\nАко костюмът не може да бъде възстановен, се удържа целият депозит.\n\nНормалното зацапване след използване не се счита за повреда.",
         "a_en": "If the damage can be repaired, the necessary repair cost is deducted from the deposit.\n\nIf the costume cannot be restored, the entire deposit is withheld.\n\nNormal soiling from use is not considered damage."},
        {"q_bg": "10. Какво се случва при забавяне на връщането?", "q_en": "10. What happens if the return is late?",
         "a_bg": "За всеки просрочен ден, с изключение на неработните дни на карнавалната къща, се начислява такса от 10 € на ден.",
         "a_en": "A fee of €10 per day is charged for each overdue day, excluding the carnival house's non-working days."},
        {"q_bg": "11. Трябва ли да почиствам костюма?", "q_en": "11. Do I need to clean the costume?",
         "a_bg": "Не. Не е необходимо да почиствате костюма нито преди, нито след използването му.\n\nКостюмите се предоставят почистени, а след връщането им почистването отново е наш ангажимент.",
         "a_en": "No. You don't need to clean the costume, either before or after use.\n\nCostumes are provided cleaned, and cleaning them after return is our responsibility again."}
      ]
    },
    {
      "heading_bg": "Проби и консултация",
      "heading_en": "Fittings & consultation",
      "items": [
        {"q_bg": "12. Колко костюма мога да пробвам?", "q_en": "12. How many costumes can I try on?",
         "a_bg": "Всеки клиент може да пробва до 4 костюма безплатно.\n\nПри желание за проба на допълнителни модели всеки следващ костюм се заплаща по 3 €.\n\nПробите са предназначени за клиенти, които търсят костюм за наемане.\n\nВ нормални дни, когато няма други чакащи клиенти, наш консултант може да отдели допълнително време за избора и комбинирането на костюма и аксесоарите.\n\nВ периоди на голямо натоварване, когато има чакащи клиенти, карнавалната къща си запазва правото да ограничи броя на пробваните костюми, за да може да обслужи всички посетители. Молим ви в тези дни да се съобразите с останалите чакащи клиенти.",
         "a_en": "Every customer can try on up to 4 costumes for free.\n\nIf you'd like to try additional models, each further costume costs €3.\n\nFittings are intended for customers who are looking to rent a costume.\n\nOn normal days, when there are no other waiting customers, our consultant can spend extra time helping you choose and put together the costume and accessories.\n\nDuring busy periods, when there are customers waiting, the carnival house reserves the right to limit the number of costumes tried on so that everyone can be served. On those days, please be considerate of other waiting customers."},
        {"q_bg": "13. Мога ли да пробвам перуки?", "q_en": "13. Can I try on wigs?",
         "a_bg": "Да. Пробата на перука се заплаща 1 €.",
         "a_en": "Yes. Trying on a wig costs €1."}
      ]
    }
  ]$j$::jsonb,
  $j${
    "title_bg": "Какво включва цената на наема?",
    "title_en": "What does the rental price include?",
    "items": [
      {"bg": "почистване на костюма;", "en": "cleaning of the costume;"},
      {"bg": "ползване на костюма за договорения период;", "en": "use of the costume for the agreed period;"},
      {"bg": "предаване на костюма в подходяща за пренасяне опаковка.", "en": "handing over the costume in packaging suitable for carrying."}
    ]
  }$j$::jsonb,
  $j$[
    {
      "title_bg": "Задължения на Carnival For You", "title_en": "CarnivalForYou's obligations",
      "items": [
        {"bg": "Да ви предоставим възможност и съдействие при избора на подходящ костюм и аксесоари.", "en": "To give you guidance and help choosing a suitable costume and accessories."},
        {"bg": "Да почистим и предадем избрания костюм в договорения срок, в нормален за използване вид и в подходяща за пренасяне опаковка.", "en": "To clean and hand over the chosen costume within the agreed period, in normal usable condition and in packaging suitable for carrying."},
        {"bg": "Да възстановим депозита при връщане на костюма без трайни повреди.", "en": "To refund the deposit when the costume is returned without permanent damage."}
      ]
    },
    {
      "title_bg": "Права на Carnival For You", "title_en": "CarnivalForYou's rights",
      "items": [
        {"bg": "Да получи дължимия наем при резервация и депозита при получаване на костюма.", "en": "To receive the rental fee due at reservation and the deposit when the costume is picked up."},
        {"bg": "Да получи наетите артикули обратно в договорения срок и без трайни повреди.", "en": "To receive the rented items back within the agreed period and without permanent damage."},
        {"bg": "При наличие на чакащи клиенти да ограничи времето и броя на пробваните костюми с цел да осигури възможност за обслужване на всички посетители.", "en": "When there are waiting customers, to limit the time and number of costumes tried on so that all visitors can be served."}
      ]
    },
    {
      "title_bg": "Права на наемателя", "title_en": "The renter's rights",
      "items": [
        {"bg": "Да получи безплатна консултация и съдействие при избора на костюм и аксесоари.", "en": "To receive free consultation and help choosing a costume and accessories."},
        {"bg": "Да пробва до 4 костюма безплатно.", "en": "To try on up to 4 costumes for free."},
        {"bg": "Да пробва допълнителни костюми срещу такса от 3 € за всеки следващ костюм.", "en": "To try on additional costumes for a fee of €3 per further costume."},
        {"bg": "Да пробва перуки срещу такса от 1 €.", "en": "To try on wigs for a fee of €1."},
        {"bg": "Да получи резервираните артикули в нормален за използване вид и в предварително уточнения ден.", "en": "To receive the reserved items in normal usable condition on the pre-agreed day."}
      ]
    },
    {
      "title_bg": "Задължения на наемателя", "title_en": "The renter's obligations",
      "items": [
        {"bg": "Да заплати наема при резервация и депозита при получаване на костюма.", "en": "To pay the rental fee at reservation and the deposit when picking up the costume."},
        {"bg": "Да пази наетия костюм с грижата на добър стопанин и да го върне без трайни повреди.", "en": "To take good care of the rented costume and return it without permanent damage."},
        {"bg": "Да върне наетия артикул в определения срок.", "en": "To return the rented item within the agreed period."},
        {"bg": "Да пази квитанцията за резервацията и депозита или поне нейна снимка.", "en": "To keep the reservation and deposit receipt, or at least a photo of it."}
      ]
    },
    {
      "title_bg": "Лични данни", "title_en": "Personal data",
      "items": [
        {"bg": "Данните, които предоставяте при резервация и контакт, се използват единствено за обработка на заявките ви.", "en": "Data you provide during reservation and contact is used solely to process your requests."},
        {"bg": "Не предоставяме вашите данни на трети лица без ваше съгласие.", "en": "We do not share your data with third parties without your consent."}
      ]
    }
  ]$j$::jsonb
)
ON CONFLICT (id) DO NOTHING;
