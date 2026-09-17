# CarnivalForYou — Go-Live Plan & Status

Миграция от стар хостинг (jump.bg — само хостинг доставчик, не домейн) към
Cloudflare Pages. **Go-live завършен 2026-09-07, стабилизиран 2026-09-08.**
Пълната стъпка-по-стъпка история е в git commit съобщенията и в паметта
(`project_carnivalforyou_golive_plan.md` и свързаните `[[...]]` бележки) —
този файл е компресиран статус + чеклист, не пълен разказ.

Инструменти: **VSCode** (код/git/DB), **Chrome Extension** (дашборди:
Cloudflare/GitHub/Supabase/GSC), **Desktop app** (преглед/решения).

## ⚠️ Guardrails — никога не пипай без причина

- GSC Domain property TXT записът на apex-а — трие се верификацията, ако се изтрие.
- MX записите (`route1/2/3.mx.cloudflare.net`) и двата DKIM TXT (`default._domainkey`, `cf2024-1._domainkey`) — обслужват реалната поща през Gmail.
- Не прекратявай jump.bg хостинга — пази се като rollback fallback, докато GSC покаже стабилно индексиране на новия сайт (седмици, не дни).

## ✅ Фази 0–5 — Подготовка и Cutover (2026-09-06 — 07), завършени

- Admin парола ротирана; repo остава public (mirror archive го прави безопасно).
- Домейн свързан към Cloudflare; DKIM/SPF/имейл маршрутизация мигрирани към Cloudflare Email Routing, потвърдено с реален тест мейл (получаване + изпращане през Gmail).
- Bot Fight Mode + Rate Limiting активирани. **Прагът вече не е 150 —
  сверено на живо 2026-09-16: 50 req/10s, с израз, ограничен по host
  (apex + www) и изключващ статичните разширения. Виж паметта
  `project_carnivalforyou_cloudflare_security_rules` и я чети преди да
  пипаш правилото — този файл е бил остарял веднъж и това предизвика
  грешна промяна.**
- Legacy URL redirect-и (`products.php`/`t_prod.php`/`holds.php`/`about.php` → нови пътища) — код в [functions/_lib/legacyRedirect.js](functions/_lib/legacyRedirect.js), не Dashboard правило.
- Sitemap.xml + robots.txt + canonical tags + dynamic SEO metadata.
- Дълбок pre-cutover одит: 5 реални бъга намерени и оправени (счупен product-detail redirect — щеше да е soft-404 за 1230 URL-а; sitemap над-обявяваше; относителни OG пътища; липсващ favicon; misroute защита).
- GSC Domain property верифицирано — нула ръчни мерки, нула security проблеми.
- **Cutover изпълнен 2026-09-07 ~19:42 UTC** — DNS флип, ~45 сек прекъсване (522 докато Pages провизира custom domain), всичко потвърдено на живо веднага след. Пост-cutover: HEAD-заявка бъг оправен (redirect-ите връщаха 200 вместо 301), www→apex 301 добавен.
- AI краулъри отблокирани (бизнес решение), LocalBusiness JSON-LD добавен, sitemap подаден в GSC.
- Стар Google резултат с грешно заглавие → redirect поправен (`cntid=18/30` → `/` вместо `/terms`).

## ✅ Голямата сесия 2026-09-08 — всичко merge-нато в `main`

- **Google Analytics** — GA4 живо и consent-gated, потвърдено с реални Realtime сесии от България. Два реални бъга по пътя (липсващ `window.gtag`, после rest-array вместо `arguments` в dataLayer push) — детайли в git history (`edbfda2`, `5b76ddf`).
- **SEO почистване** — единичен `<h1>` на всяка страница, `BreadcrumbList` schema на продуктите, коригиран sitemap `lastmod` (`4195060`).
- **Английска версия (`/en`) — жива на carnivalforyou.com.** Routing (URL е source of truth за езика), hreflang навсякъде, двуезичен sitemap (2512 адреса), legacy redirect-и вече четат `&lang=en`, 27 продукта получиха нови EN описания (не от стария CSV — изрично решение). Един реален бъг хванат и оправен на самия живия сайт (дублирани hreflang tag-ове от статичните index.html тагове). Пълен анализ и решения: `[[project_carnivalforyou_english_seo_gap]]`.
- **24-часов трафик преглед** — миграцията е чиста: нула реални 5xx извън cutover прозореца, нула блокирани търсачки/AI ботове, 855-те mitigated заявки са всички datacenter скенери. Почистени 7 мъртви DNS записа от старото jump.bg хостване (`mail`/`pop`/`pop3`/`smtp`/`imap` изтрити, `test`/`new` сменени на DNS-only).

## ✅ 2026-09-16 — двуседмична проверка след go-live

Всичко проверено на живо: сайтът е здрав, TLS до 6 дек, www и pages.dev
правят 301 към apex, 9-те legacy redirect-а работят, DNS/MX/SPF/DMARC чисти,
backup-ите 8/8 зелени, Supabase advisors без нови находки.

- **hreflang на BG продуктовите страници** (`833b6d5`) — EN страната декларираше
  двойката, българската — не, тоест Google я игнорираше. Поправено като
  чисто добавяне в `functions/product-detail/[id].js`, без делегиране към
  `_lib/productMeta.js` — този файл обслужва 1230+ URL-а и се е чупил тихо преди.
- **Абсолютни `<image:loc>` в sitemap-а** (`3746799`) — затваря „6 грешки“ в GSC.
- **R2 custom domain `img.carnivalforyou.com`** (`b196b49`) — виж
  `[[project_carnivalforyou_r2_migration]]`. 1889 стойности в 6 таблици
  мигрирани, `r2-media` v8 приема и двата хоста при изтриване.
- **Грешка, която си струва да се помни:** на база остарели бележки беше
  променен изразът на rate limiting правилото за несъществуващ проблем и
  беше върнат обратно. Виж
  `[[project_carnivalforyou_cloudflare_security_rules]]`.

## ✅ 2026-09-17 — освежени снимки без стар воден знак + чистене от checklist-а

55 продукта получиха нови, по-качествени снимки (без стария воден знак) от
`E:\Downloads\new`, качени през реалния админ панел с Playwright — файловете
бяха именувани с каталожния номер (`old_catalog_number`), не вътрешния `id`.
Старите R2 обекти изтрити веднага след всеки успешен запис (потвърдено чрез
`product.id = 686` „Маркизата в бяло" като първи ръчно валидиран пример, после
54 още на партиди). Това по пътя потвърди и т. 6 от checklist-а — новият
`r2-media` secret + `img.carnivalforyou.com` работят коректно за upload.

Два файла в папката не бяха обработени — да се провери ръчно:
- `110А.png` — няма продукт с такъв каталожен номер в базата (само гол `110`,
  вече обновен от отделен файл `110.png`). Вероятно грешно именуване.
- `zmia_sublaznitelka_A4_300dpi.png` — без номер, не е ясно към кой продукт се
  отнася.

Освен снимките, от постоянния checklist по-долу — вижте отметнатите точки за
backup-папката и WebP конверсията на категорийните плочки.

### Остават от тази проверка

- [ ] **Soft-404**: непознат адрес връща 200 със съдържанието на началната
  страница — причината е `/*  /index.html  200` в `public/_redirects`. Иска бял
  списък на маршрутите; сгреши ли се, връща 404 на реални страници. Нарочно
  оставено недокоснато 2026-09-17 — сайт-широка промяна в SEO статус кодовете,
  заслужава отделен фокусиран проход с тестване, не набързо в друга сесия.
- [x] 3-те продукта (id 787, 637, 1790), сочещи към
  `product-images-pre-ai-upscale-backup/`, преместени 2026-09-17 в стандартния
  `product-images` bucket — **същите байтове**, само локацията се смени
  (снимките там бяха умишлено revert-нати от AI upscale версията по-рано,
  визуалното съдържание не е пипано). Старите копия в backup папката оставени
  непокътнати (изтриването им беше блокирано от auto-mode класификатора —
  безобидно, там им е мястото).
- [x] Категорийните PNG плочки конвертирани в WebP 2026-09-17 (commit
  `22ae825`) — 7 живи tile снимки (3 статични в `public/images/categories/` +
  4 в R2 `category-images`), ~90% по-малки (напр. 6.9MB → 476KB за Деца 0-3г).
  `categories.image_url` и `CategoryGrid.tsx` обновени в синхрон.
- [ ] Bot Fight Mode важи и за `img.carnivalforyou.com` — да се гледа за
  challenge-нати заявки към снимки (блокира image краулъри). Все още само
  наблюдение — 62-те качвания през админ панела днес минаха гладко.
- Splash видеото е изключено от админ панела, но **кодът се пази
  съзнателно** — функционалността може да се използва повторно с друго видео.
  `SplashVideo.tsx` вече сочи към `img.carnivalforyou.com`, така че ново видео
  ще се сервира кеширано от първия ден. Не е тествано на живо, защото
  килл превключвателят е изключен — провери при първото включване.

## 📋 Остава — малки, не спешни, за след почивката

1. [ ] `/images/favicon.ico` 404 — браузърски default probe, козметично.
2. [ ] DMARC запис (`p=none` начален режим).
3. [ ] Supabase: Leaked Password Protection (Dashboard → Auth → Policies → Password Security, няма MCP tool).
4. [x] ~~Supabase Pro backups~~ — решено 2026-09-09: няма да се плаща, nightly GH Action backup е достатъчен.
5. [ ] Следи GSC "Страници" отчета — брой намерени страници трябва да скочи от 1256 към ~2512 (двуезичния sitemap), обичайно отнема дни.
6. [x] Cloudflare worker `statuscheck-prober` — потвърдено 2026-09-09, потребителски е.
7. [x] ~~`ClothingStore` JSON-LD bg-only в `/en`~~ — решено 2026-09-09: не си заслужава усилието, оставя се както си е.
8. [ ] 3-те неразпознати стари `cn-*` landing страници (временни татуировки/грим/Halloween) — следи за реален трафик преди да инвестираш в точна redirect цел.
9. [ ] `arlekinobg.com` GA акаунт имаше стар account-level достъп на непознат имейл, премахнат — провери дали подобен стар достъп не виси другаде (Cloudflare/GitHub/Supabase/GSC), по желание.
10. [x] 301 redirect mapping за `/news`/`/services` — одит 2026-09-10 (Wayback Machine + GSC): `/news` вече е пълен (единствен стар URL, cntid=20 → /news). `/services` изхождаше от грешна предпоставка — истинската стара `services.php` (грим/прическа/хна/поръчка) никога не е имала отделни URL-и (0 GSC impressions за 16 месеца), но е ловена само от static `public/_redirects` правило, което губеше `?lang=en`. Fix-нато: нови `functions/services.php.js`/`contacts.php.js` (Function вместо static redirect) + export-нат `withLang`/нов `handleStaticContentPage` helper в `legacyRedirect.js`; премахнати мъртвите редове от `_redirects`. Commit `4960ea0`, push-нато.
11. [ ] 385 активни продукта без описание на нито един език (Перуки 121, Аксесоари 117, Маски 90, Шапки 57) — реално отложена задача, изисква писане на нови описания, не превод (виж памет `project_carnivalforyou_missing_en_descriptions`).
12. [x] 3 стари WordPress инсталации на jump.bg (`new.carnivalforyou.com`, `www.carnivalforyou.com/arlekinobg.com`, `www.arlekinobg.com/site`) — тестове от предишен администратор, потвърдени напълно отделни от реалния `www.arlekinobg.com` (различни DB/пътища), изтрити през Softaculous 2026-09-12 + изтрит `new` DNS записа в Cloudflare. Реалният магазин проверен работещ след чистенето. Смяна на cPanel паролата — обмислена, потребителят реши да не я прави.
