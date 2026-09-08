# CarnivalForYou — Go-Live Plan (carnivalforyou.com → Cloudflare)

Автономен план за прехвърлянето от стария сайт (домейн **carnivalforyou.com**,
на споделен хостинг от доставчика **jump.bg** — jump.bg е само хостинг доставчикът,
НЕ домейнът) към новия Cloudflare/React сайт, плюс последващи SEO и security стъпки.
Инструменти: Claude Desktop app, Claude в VSCode, Claude Chrome Extension.

Легенда за инструмент по стъпка:
- **VSCode** — код, git, DB заявки, migrations, файлове
- **Chrome Extension** — кликане през реални логнати дашборди (Cloudflare, GitHub, Supabase, GSC, jump.bg клиентски панел/регистратор)
- **Desktop app** — преглед, решения, дълги разговори без директно изпълнение

## Статус към 2026-09-06 (Фаза 0)

- [x] `dev/product-seo-audit` branch — **мърджнат** в `main` (commit `9a30b6d`). SEO title/description генерирането е live.
- [x] `admin-content-pages` branch — **мърджнат** в `main` (commit `6b6d24b`, "Add admin-editable content pages...").
- [x] Коригирано: реалният домейн е **carnivalforyou.com** (не jump.bg — това е хостинг доставчикът). Погрешно създадена Cloudflare zone за `jump.bg` е изтрита.
- [~] Cloudflare zone за `carnivalforyou.com` създадена (DNS only, nameservers все още НЕ са сменени). При DNS верификация открит DKIM запис (`default._domainkey`), пропуснат от Cloudflare auto-scan — в процес на ръчно добавяне преди да продължим.

---

## Фаза 1 — Security hardening преди реални потребители
**Инструмент: VSCode + Chrome Extension**
**⚠️ Статус 2026-09-08: изцяло пропусната досега** — прескочихме директно към Фаза 2 в предната сесия. Проверена през Supabase `get_advisors` точно сега:

1. [x] **Admin паролата ротирана 2026-09-08** — генерирана случайна силна парола (24 char base64url, ~144 бита ентропия) през Supabase Admin Auth API (service_role key от локалния `.env`), приложена за `valeriya@carnicalforyou.com`, потвърдено с реален login тест (получен access token). Новата парола е дадена на потребителя в чата — не е записана никъде в repo-то.
2. [x] `.env` историята — вече потвърдено gitignored, local-only (виж reference memory), нищо ново оттогава.
3. [ ] Бърз secret-scan по цялото repo преди да върнеш видимостта private (неприложимо засега — виж т.4).
4. [x] **Решено 2026-09-08: репото остава public засега** — mirror архивът вече го прави безопасно, преминаване към private без спешна причина сега.
5. [ ] N/A (само ако по-късно решим да минем на private).
6. [x] Supabase RLS advisors проверени 2026-09-08:
   - ⚠️ **Leaked Password Protection изключена** в Supabase Auth (HaveIBeenPwned проверка) — препоръчано включване. Изисква Supabase Dashboard (Chrome extension) — Authentication → Policies → Password Security, няма MCP tool за това. Все още отворено.
   - ℹ️ 2 archive/backup таблици (`products_archived_nonproducts_20260820`, `products_text_backup_20260820`) с RLS включен но без policy — RLS default-deny означава реално 0 достъп, само lint шум, не риск. Не спешно.
7. [ ] Реши дали да ъпгрейднеш Supabase на Pro ($25/мес) за автоматични DB backups (nightly GH Action backup-ът вече работи като алтернатива — виж backups memory).

## Фаза 2 — Свързване на домейна към Cloudflare
**Инструмент: Chrome Extension + VSCode за проверка**

1. [x] Cloudflare Dashboard → Add a Site → **carnivalforyou.com** → **"Connect a domain"** (НЕ "Transfer"). (Забележка: първи опит погрешно създаде zone за `jump.bg` — изтрита; jump.bg е само хостинг доставчикът, текущи nameservers `ns29/ns30.jumpdns.net`.)
2. [x] Сравни auto-scanned DNS записите срещу реалните (проверени директно през публичен resolver) — особено MX/SPF/DKIM.
   - Съвпада: NS (jumpdns.net), MX, SPF, A апекс/www (185.199.38.18).
   - DMARC: реално липсва в живия DNS (не е грешка на скенера).
   - **Пропуснато от Cloudflare скенера:** `default._domainkey` (DKIM) TXT запис — [x] добавен и потвърден.
   - **Втори риск, открит при финалната проверка:** Cloudflare по подразбиране пуска "Proxied" (оранжев облак) на повечето A/CNAME записи, но не проксира IMAP/POP3/SMTP/FTP/CalDAV/CardDAV портове. [x] Оправено: "DNS only" за `mail, imap, pop, pop3, smtp, ftp, cpcalendars, cpcontacts, autoconfig, autodiscover, cpanel, whm, webmail, webdisk`. Proxied само на `apex, www, new, test`.
   - [x] Финален пълен списък записи прегледан и одобрен 2026-09-06 (13 A, 5 AAAA, 6 CNAME, 1 MX, 3 SRV, 8 TXT). Забелязано, не блокиращо: няма DMARC запис (реално липсва, не е пропуск) и няма видим `google-site-verification` TXT — ще се провери изрично в Фаза 4 при GSC проверката.
3. [x] Nameservers обновени в jump.bg панела: `alexis.ns.cloudflare.com` / `courtney.ns.cloudflare.com` (замениха `ns29/ns30.jumpdns.net`). Публична DNS проверка вече вижда новите NS — пропагирало бързо. Cloudflare dashboard-ът все още показва "Waiting for registrar to propagate" (тяхната собствена проверка изостава, типично отнема часове за официално "Active").
4. [x] Zone Active (Free plan), потвърдено 2026-09-07. Тестов имейл до `office@carnivalforyou.com` пристигна във `carnivalforyou@gmail.com` (по старата jump.bg верига, MX непипан — потвърждава mail пътят още работи непроменен).
5. [x] Bot Fight Mode: включен. Rate Limiting: "General abuse protection", **150 заявки/10 сек по IP, action Block** (Managed Challenge не съществува на Free план — установено по време на настройката), без изключения за статични файлове (Free план ограничение за custom expression scoping — прагът е вдигнат от 50→150 вместо scoping, за да намали фалшиви positives от image-heavy странициte).
6. [ ] Приет известен пропуск: browser→Supabase REST заявките не минават през Cloudflare zone-а, rate limiting там не помага (малък магазин, без плащания, RLS пази данните) — optional бъдещ Worker-proxy.
7. [x] **Имейл архитектура — receiving преместен изцяло на Cloudflare Email Routing**, потвърдено 2026-09-07 end-to-end с реален тест мейл (office@ → Gmail получен успешно):
   - Старото MX (jump.bg, priority 0) изтрито; ново MX: route1/2/3.mx.cloudflare.net (priorities 56/57/18).
   - SPF мърджнат в ЕДИН запис (jump.bg/superhosting includes + `include:_spf.mx.cloudflare.net`) — 5 DNS lookups общо, под RFC 7208 лимита от 10.
   - DKIM: и двата селектора живи — `cf2024-1._domainkey` (нов, Email Routing) и `default._domainkey` (стар, jump.bg/superhosting outbound — недокоснат).
   - Routing rule `office@carnivalforyou.com` → `carnivalforyou@gmail.com`: Active, verified.
   - FTP/cPanel/webmail A/CNAME записите — непокътнати, DNS-only, независими от MX промяната.
   - Все още липсва DMARC запис (Cloudflare продължава да го препоръчва) — отделна, незапочната задача, не блокира нищо. Добра идея за добавяне по-нататък (`p=none` monitoring режим като начало).
   - Управлението на пощата е изцяло през Gmail; НЕ е потвърдено дали в момента реално може да се **изпраща** (не само получава) като `office@carnivalforyou.com` от Gmail ("Send mail as") — оставена проверка за по-късно, преди пълно решение да махнем `default._domainkey`/старите SPF includes.
   - **Resend** остава бъдеща опция — или за реални transactional имейли от приложението (в момента няма такива), или като SMTP relay ако Gmail send-as не проработи.
8. [ ] **Нищо все още не сочи към Cloudflare Pages** — сайтът продължава да се обслужва от jump.bg хостинга през Cloudflare proxy. Реалният cutover към новия React сайт остава в Фаза 5, изрично недокоснат.

## Фаза 3 — SEO чернова/подготовка (само данни и код, БЕЗ активиране на нищо живо)
**Инструмент: VSCode + Chrome Extension (GSC)**

⚠️ Важно разграничение, вече валидирано: всичко тук е подготовка, която не
пипа нищо живо — реализирано е като **код в новия сайт** (Cloudflare Pages
Functions + `_redirects`), не като Cloudflare Dashboard правила. Това
елегантно решава проблема, който флагна по-рано: няма отделно "Enable"
копче за забравяне — редиректите просто тръгват автоматично живи в
секундата, в която новият сайт се деплойне на cutover (Фаза 5), не преди.

1. [x] **Реален формат на старите URL-и открит чрез директна проверка на живия сайт** (не CSV-то directno — то съдържа само SEO title/description текст, не самите URL пътища): всичко е query-string based, няма path routing на стария сайт:
   - `index.php?lang=bg`, `about.php?lang=bg[&cntid=X]`, `services.php?lang=bg`, `contacts.php?lang=bg`
   - `t_prod.php?lang=bg&tid=X` (категорийна листинг), `holds.php?lang=bg&tid=X` ("Празници"/сезонни)
   - `products.php?lang=bg&tid=X&obid=Y` (детайл на продукт)
   - `about.php?cntid=X` е отделна находка — старите Terms/News/Privacy/Partners/"Представяне" страници са били под-страници на `about.php`, не собствени файлове.
2. [x] **Категориен мапинг направен, с потвърдена колизия** (CLAUDE.md §7): старото `tid=10` (Украса за парти) ≠ новото `category_id=10` (Хелоуин) — директно tid→id НЕ работи навсякъде. Пълна таблица в [functions/_lib/legacyRedirect.js](functions/_lib/legacyRedirect.js). Одобрени с потребителя 2026-09-07:
   - tid 2,3,4,17,19 → same category id (директно съвпада)
   - tid 5,6,7,8 → same category id (скрити категории, но реално имат продукти — 104/68/139/158 бр. — филтърът работи без значение от `is_active`)
   - tid 14 → `/services`, tid 16 → `/about` (специфични, по избор на потребителя)
   - tid 9,10,12,13,15,18,21 (без нов еквивалент) → generic `/products` fallback (по избор на потребителя)
3. [x] Продукти: `products.old_id` колоната вече съществува в Supabase (уникална, запазена при миграцията) — директен lookup `old_id → id`, покрива и трите 1841 активни продукта без нужда от статичен списък.
4. [x] Имплементирано като код (не Cloudflare Dashboard):
   - [functions/_lib/legacyRedirect.js](functions/_lib/legacyRedirect.js) — споделена мапинг логика
   - [functions/products.php.js](functions/products.php.js) — obid lookup → `/product-detail/<id>`, fallback към категория/каталог
   - [functions/t_prod.php.js](functions/t_prod.php.js), [functions/holds.php.js](functions/holds.php.js) — tid-базирана категория
   - [functions/about.php.js](functions/about.php.js) — cntid-базирано (Terms/News/Presentation/Privacy/Partners)
   - [public/_redirects](public/_redirects) — прости 1:1 за `index.php→/`, `services.php→/services`, `contacts.php→/contacts`
5. [ ] **Известен, приет остатъчен риск** (нисък обем, не блокира): 3 стари SEO-optimized landing pages от `carnival_seo_page_meta.csv` (`cn-9`=временни татуировки, `cn-17`=грим/make-up artist, `cn-6`=Halloween-landing) използват `cn-<N>` номера, които НЕ съвпадат нито с `tid`, нито с `cntid` схемите — истинският им query-string формат не е потвърден. Fallback поведението (непознат tid → `/products`) означава, че дори тези линкове не чупят нищо (просто не са оптимално прецизни) — следи за реален crawl трафик към тях в Фаза 6 GSC проверката и добави точна цел само ако се появи трафик.
6. [x] **Metadata консистентност (CLAUDE.md §6):** per-продукт и per-категория SEO title/description вече съществуваха ([src/lib/products.ts](src/lib/products.ts)); липсваше `<link rel="canonical">` навсякъде — добавено в [src/lib/useSEO.ts](src/lib/useSEO.ts) (default: origin+pathname без query, за да не се третират филтри/пагинация/търсене като отделни страници) с изричен override в [src/pages/ProductsPage.tsx](src/pages/ProductsPage.tsx) (canonical = `/products?category=<id>` за единична категория, иначе bare `/products`). Type-check чист.
7. [x] **sitemap.xml + robots.txt:** SPA с динамичен Supabase каталог → статичен build-time sitemap би остарял бързо. Направено като Cloudflare Pages Function [functions/sitemap.xml.js](functions/sitemap.xml.js) (чете live от Supabase: статични страници + 18-те активни категории + всички активни продукти, пейджва през PostgREST 1000-row cap-а). [public/robots.txt](public/robots.txt) сочи към него, disallow `/admin`.

## Фаза 4 — Финална проверка точно преди DNS cutover
**Инструмент: VSCode (SQL) + Chrome Extension (GSC)**
**Извършена в дълбочина 2026-09-08.**

### Минали проверки ✅
1. [x] **SEO spam sweep** — 0 anchor тагове, 0 `display:none`, 0 `href`, 0 `http` във всички текстови колони на всички продукти. Чисто.
2. [x] **Data integrity** — 1665 активни продукта: 0 без снимка, 0 останали Supabase Storage URL-и, 0 нe-R2 хостове, 0 дублирани `old_id` (критично за редиректите), 0 без име, 0 с несъществуваща категория. Открити 7 активни продукта с цена ≤ 0 (сайтът така или иначе ги крие) и 1 активен без `old_id` (нов продукт, нормално).
3. [x] **Redirect покритие, измерено срещу легаси CSV-то** — 1988 стари продукта, 1840 (92.6%) резолвват в собствената си нова страница; 148 нямат съответствие (133 от тях активни на стария сайт) и падат към категория/каталог. 176 резолвват към продукт, който днес е неактивен — страницата им пак се отваря нормално (RLS позволява четене), 143 от тях изглеждат напълно чисто, 33 са без цена.
4. [x] **Функциите изпълнени реално срещу живата база** (за първи път) — 19 реални стари URL-а → всички дават коректен 301. Легаси форматът потвърден и на живо (`products.php?...&obid=2` → "Пиратката Пинк").
5. [x] **sitemap.xml изпълнен реално** — 200, валиден XML, 1256 URL-а (1230 продукта + 19 категории + 7 статични), 0 неекранирани `&`, 178 KB.
6. [x] **Production build + type-check** — минават чисто (507 KB JS / 137 KB gzip).
7. [x] **Браузърна проверка на реалния build срещу живата база** — начало, `/products?category=2`, `/product-detail/1312`, `/news`, `/contacts`: **0 конзолни грешки**, коректни SEO заглавия, продуктовата страница се рендира изцяло.
8. [x] **Backup safety net** — архивният workflow е бил **счупен 4 поредни дни (4–7 септ.)**, поправен от днешния `2e407ed` grants fix. Последният run (07 септ. 13:54 UTC) е успешен и manifest-ът показва пълни данни (products 1841, всичките 4 нови content таблици, auth_users).

### Открити и поправени дефекти (commit `185eafd`) 🔧
9. [x] **Стари tid 5/6/7/8 сочеха към празна страница** — маски/шапки/перуки/аксесоари се пренасочваха към `/products?category=N`, но `products.ts` изключва точно тези 4 категории от всеки листинг (`HIDDEN_CATEGORY_IDS`). Проверено живо: **0 продукта** за всяка от 5/6/7/8 срещу 522 за категория 2. Вече падат към `/products`.
10. [x] **sitemap обявяваше 1665 продукта, а сайтът показва 1230** — не прилагаше правилата за цена > 0, наличнa снимка и скрити категории. Вече огледало на `baseQuery()`.
11. [x] **`og:image`/`og:url` бяха относителни пътища** — краулърите за link preview (Facebook/WhatsApp/Viber) не ги резолвват, значи всички не-продуктови страници нямаха preview снимка. Вече абсолютни.
12. [x] **Сайтът нямаше favicon изобщо** — `index.html` сочеше към несъществуващ `/vite.svg`. Добавен `public/favicon.svg` в стила на марката.
13. [x] **Защита срещу misroute** — `*.php.js` функциите вече връщат SPA-та непокътната, ако пътят не завършва на `.php`, така че изненада в Pages routing-а не може да сложи `products.php.js` върху реалния `/products`.

### Cloudflare Pages проверка — извършена 2026-09-08 през Chrome extension ✅/🔴
14. [x] **Конфигурацията е наред:**
    - Проект `carnivalforyoupoc4`, но **hostname-ът е `carnivalforyoupoc3.pages.dev`** (не poc4!) — ⚠️ важно за Фаза 5, DNS трябва да сочи натам.
    - Вързан за `lachezar0dimitrov/CarnivalForYouPOC4`, production branch `main`, авто-деплой включен.
    - Build: `npm run build`, output `dist`, root `/`. Последен деплой успешен.
    - И 6-те Functions се разпознават.
    - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` **съществуват в Production** (тип Secret) — потвърдено допълнително и от факта, че sitemap-ът връща пълните 1256 записа, т.е. Supabase се чете реално. Големият страх не се е сбъднал.
    - Няма закачен custom domain — точно както трябва преди cutover.
15. [x] 🔴 **Открит и поправен реален блокер** (commit `8228065`): всяко директно зареждане на `/product-detail/*` правеше сървърен 301 към началната страница. Причина: `functions/product-detail/[id].js` искаше `/index.html` от asset слоя, а Pages сервира clean URLs и отговаря на това с 301 към `/`; редът `if (!assetResponse.ok) return assetResponse;` връщаше този 301 直 на браузъра. Функцията е отпреди тази работа (29 авг., OG previews) и в `CLAUDE.md` изрично пишеше, че никога не е тествана срещу реален деплой — била е счупена от самото начало, но само директното зареждане я задейства, а вътрешната навигация работи, затова не е била забелязана. Ако беше минала в cutover-а: 1230 от 1256 URL-а в sitemap-а + всички стари `products.php` линкове щяха да водят до началната страница = масов soft-404 за Google. Поправено с искане на `/`.
16. [x] Добавен `functions/_middleware.js` (commit `90a2383`): `X-Robots-Tag: noindex` само за `*.pages.dev`, за да не се индексира preview копието като дублиращо съдържание срещу истинския домейн (sitemap-ът там обявява pages.dev URL-и, понеже `<loc>` се гради от заявения хост).
17. [x] ✅ **Повторният тест мина изцяло** (деплой `12ff99d`, 7 септ. 21:48): `/product-detail/1`, `/1312`, `/1564`, `/2`, `/1977` се зареждат с 200 без редирект; `products.php?...obid=2` → `/product-detail/1`; `obid=1478` → `/product-detail/1312`; `obid=1416` → `/products`; `holds.php` (и с, и без `tid`) → `/products`. `X-Robots-Tag: noindex` присъства навсякъде на pages.dev. Сървърният HTML на продуктова страница носи правилните og тагове с името на конкретния костюм и работеща R2 снимка (900×1200).
    - ⚠️ Полезно за наблюдение: старият счупен редирект беше **301 (permanent)** и браузърите го кешират трайно. Ако при теб `/product-detail/*` още хвърля на началната — това е локален кеш, не сървърът; тествай в инкогнито. На истинския домейн проблем няма, там никой не е попадал на стария 301.
18. [x] **Middleware-ът доказан емпирично** — изпълнен локално срещу 6 хоста: `carnivalforyou.com`, `www.carnivalforyou.com`, `/product-detail/*` и `/sitemap.xml` на истинския домейн получават **никакъв** `X-Robots-Tag`; само `carnivalforyoupoc3.pages.dev` и deployment alias-ите получават `noindex, nofollow`. Рискът "целият сайт тръгва с noindex" не съществува.
19. [x] Добавен сървърен `<link rel="canonical">` на продуктовите страници (commit `7aff754`) — дотогава canonical се слагаше само от React след зареждане. Гради се от вече валидирания числов id, значи `/product-detail/007` се свежда до същия canonical като `/7`.
20. [ ] **Съзнателно НЕ пипано:** добавянето на `_middleware.js` разшири invocation routes до `/*`, значи всяка заявка (вкл. статични файлове) минава през Function. Може да се стесни с ръчен `_routes.json`, но това е точно видът промяна в routing-а, който не бива да се прави в навечерието на cutover. Обемът е далеч под безплатния лимит (снимките са на R2, не на Pages) — оптимизация за след старта, ако изобщо потрябва.

### Остава — изисква Chrome Extension ⚠️
15. [x] **Google Search Console — property създадено и верифицирано 2026-09-07, ръчни мерки НЯМА** ✅
    - Оказа се, че property изобщо никога не е съществувало: проверени 4 профила (`dimitrovlacho@`, `lachezar0dimitrov@`, трети, и бизнес пощата `carnivalforyou@`) — нула property-та, нула чакащи верификации. Значи липсващият `google-site-verification` TXT в зоната не е паднала верификация, просто никога не е имало.
    - Създадено **Domain property** (не URL-prefix), верифицирано с нов отделен TXT на apex-а. Броят TXT записи в зоната отиде от 39 на 40 — добавен, не заменен; SPF/MX/DKIM/A/AAAA/CNAME непокътнати. ⚠️ Този TXT никога не бива да се трие — премахването му отменя собствеността.
    - Отказан е автоматизираният път на Google (OAuth към Cloudflare DNS) — щеше да даде на Google права за писане в зоната. Ръчният TXT постига същото без раздаване на достъп.
    - **Ръчни мерки: "Няма открити проблеми". Проблеми със сигурността: "Няма открити проблеми".** Инжектираният спам в старите описания не е довел до санкция — мигрираме чист домейн.
    - ⚠️ Уговорка, за да не се чете погрешно: тези два отчета покриват само ръчните мерки и security флаговете. Ако спамът е свалил сайта **алгоритмично**, това не се показва никъде като "проблем" — вижда се само като спад в Performance, а исторически данни оттам няма и няма да се появят (Performance започва да събира от датата на верификация).
    - Pages/Indexing отчетът още е празен ("данните се обработват, проверете след ден") — базова стойност отпреди миграцията няма да получим оттам. Единственият ориентир: `site:carnivalforyou.com` ≈ **4890 резултата**, тоест старият сайт е сериозно индексиран и има реален SEO капитал за пренасяне.
    - За протокола: живият стар сайт **не сервира robots.txt** (GSC го отчита като липсващ) — новият билд има валиден, така че отчетът ще се промени след cutover. И Crawl stats ще се пълни със стария сайт до момента на превключването.
16. [x] Финална ротация на admin паролата — направена във Фаза 1.
17. [ ] Незначително, за после: непознат Cloudflare worker `statuscheck-prober` (създаден 05 септ.) — потвърди, че е твой.

## Фаза 5 — Самият Cutover (go-live ден)
**Инструмент: Chrome Extension + VSCode за бърз hotfix**

0. [x] **Поща** — вече готово предварително (Фаза 2), не чака за cutover деня: Cloudflare Email Routing активен и потвърден, Gmail receive-as и send-as ("reply from office@") и двете тествани успешно.
1. [x] **Финален backup — направен и проверен задълбочено 2026-09-07 19:33 UTC.** Двата job-а успешни; всичките 13 таблици с точно съвпадащи бройки спрямо живата база; `products.json` реално парсван (1841 реда, 1840 с `old_id`, 1665 активни, spot check `id=1312` → "Чаровната снежанка"/`old_id=1478`); нула spam остатъци; днешните промени вътре (коригирано работно време, ротирана парола); `mirror/main` = `a238f72`, точно текущия HEAD.
   - ⚠️ Известна дупка при възстановяване: `auth_users` пази профила, но **не и хеша на паролата** — при restore admin потребителят ще съществува без парола и ще трябва reset през Supabase. Не е блокер (незаменимото са продуктите и съдържанието), но е добре да се знае.
2. [x] DNS насочен към Cloudflare Pages през Pages проект `carnivalforyoupoc4` → Custom domains → `carnivalforyou.com` + `www`. ⚠️ Целевият хост е **`carnivalforyoupoc3.pages.dev`** — името на проекта (poc4) и hostname-ът (poc3) НЕ съвпадат.
3. [x] ~~Активирай Cloudflare Bulk Redirects правилото~~ — неприложимо вече: Фаза 3 redirect-ите са код (Cloudflare Pages Functions + `_redirects`), не Dashboard правило — тръгват автоматично живи в мига на деплоя от стъпка 2, нищо за ръчно активиране тук.
4. [x] **ИЗВЪРШЕН 2026-09-07 ~19:42 UTC.** SSL режимът беше вече `Full` (не `Flexible`), значи redirect loop нямаше риск. Cloudflare премахна apex A + AAAA (и двата → jump.bg) и създаде CNAME `@` → `carnivalforyoupoc3.pages.dev`. Нищо от забранителния списък не беше докоснато. Прозорец с грешка 522: **~45 секунди** (19:42:41 → 19:43:28 UTC), докато Pages довърши провизирането.
5. [x] Проверено на живо веднага след флипа:
   - `X-Robots-Tag` **отсъства** на истинския домейн ✅ (middleware-ът се държи точно както беше доказан локално)
   - Новият React сайт е жив; SSL валиден (`ssl_verify_result=0`)
   - `/product-detail/1312` се зарежда директно, с `<link rel="canonical" href="https://carnivalforyou.com/product-detail/1312">` и правилен `og:title`
   - **11 от 11 стари URL-а** дават 301 към правилните цели
   - `sitemap.xml`: 1256 записа, **нула** pages.dev адреси; `robots.txt` и `favicon.svg` — 200
   - MX (и трите Cloudflare Email Routing), SPF и google-site-verification — непокътнати
   - Apex вече резолвва към Cloudflare anycast (104.21.69.123 / 172.67.208.6), не към 185.199.38.18
6. [x] Тест на пощата след cutover-а — потвърдено от потребителя, работи и при получаване, и при изпращане.
7. [x] **Още един дефект, намерен и поправен след cutover-а** (commit `2e0a60a`): четирите Function-базирани редиректа експортваха `onRequestGet`, значи при **HEAD** заявка функцията се прескачаше и старият URL връщаше **200 вместо 301** (падаше към SPA catch-all-а). Статичните правила в `_redirects` през цялото време се държаха коректно и на двата метода — само функциите не. Googlebot и браузърите ползват GET, така че миграцията не беше засегната, но SEO одит инструменти и link checker-и често ползват HEAD и биха отчели всеки стар URL като жива дублирана страница. Поправено на `onRequest`, проверено на живо: и четирите дават 301 еднакво на GET и HEAD.
8. [x] **403-ките при автоматизирано тестване са артефакт, не проблем.** Проверени 7 реални страници с нормален браузърски User-Agent от независима мрежа — всичките 200, нула 403. Bot Fight Mode удря само автоматизиран трафик от датацентър IP-та.
9. [ ] ⚠️ **www и apex сервират еднакво съдържание** (и двата 200) — за продуктовите страници Function-ата гради canonical от заявения хост, значи `www.` версиите се самоканонизират и разцепват SEO сигнала. Старият сайт е ползвал www в линковете си, тоест вероятно е индексиран и там.
   - [x] Redirect Rule "www to apex" създадено: `http.host eq "www.carnivalforyou.com"` → Dynamic `concat("https://carnivalforyou.com", http.request.uri.path)`, preserve query string. Пуснато първо като **302** нарочно (сгрешен 301 се кешира трайно в браузърите), потвърдено от независима мрежа: www дава `302` + `Location: https://carnivalforyou.com/`, apex остава `200` без Location, а query string-ът оцелява през хопа.
   - [x] Промотирано на **301**, потвърдено от независима мрежа: `HTTP/1.1 301 Moved Permanently` + `Location: https://carnivalforyou.com/`.

## Фаза 6 — След go-live
**Инструмент: Chrome Extension + VSCode**

0. [x] **AI краулърите са отблокирани** (2026-09-07, бизнес решение: искаме Gemini/ChatGPT/Claude да четат сайта и да го препоръчват при въпроси за карнавални костюми и идеи за подаръци). Cloudflare блокираше `Google-Extended` (точно това спира Gemini), `GPTBot`, `ClaudeBot`, `CCBot`, `Amazonbot`, `Applebot-Extended`, `Bytespider`, `meta-externalagent`, плюс `Content-Signal: ai-train=no`. Оказаха се **три** отделни места:
   - `Security → Settings → Block AI bots` (deprecated, WAF ниво) — беше "Block only on pages with ads" → изключено.
   - В същия диалог, отделна настройка "blocking AI training" — беше настроена да блокира crawler-и с двойна цел **автоматично от 15 септември**; изключена, иначе решението щеше да се саморазвали след седмица.
   - `AI Crawl Control → Signals → Managed robots.txt` — източникът на блока в robots.txt → изключено.
   - Bot Fight Mode, rate limiting, DNS и redirect правилото — недокоснати. Потвърдено на живо: `robots.txt` вече съдържа само нашите правила.
   - Наблюдение от Signals: `Meta-ExternalAgent` е имал 74 нарушения на `Disallow: /` — част от тези ботове така или иначе не са спазвали блока.
1. [x] **`LocalBusiness` структурирани данни добавени** (commit `4742750`, живи): `ClothingStore` JSON-LD в `index.html` — име, описание, адрес, телефон, имейл, работно време, ценови диапазон, обслужван град, социални профили. Статично, не през `useSEO`, защото краулърите без JavaScript са точно целевата аудитория. Има `@id`, за да може schema на ниво страница да реферира същия бизнес вместо да обявява втори. ⚠️ Адресът/телефонът/часовете дублират `site_settings` — при промяна през админ панела трябва да се обнови и този блок.
2. [x] **Sitemap подаден и приет — Успех, 1256 намерени страници** (2026-09-07). Уточнение за бъдеще: при Domain property Google иска **пълния URL** в полето (`https://carnivalforyou.com/sitemap.xml`), голото `sitemap.xml` се отхвърля с "Невалиден адрес". Първоначалното "Не може да се извлече" е било просто защото Google още не е стигнал до файла — при презареждане показва Успех.
3. [x] **Google потвърждава сайта от своя страна** — URL Inspection (live test) на `/product-detail/1312`: "URL адресът е достъпен за Google", обхождане разрешено, индексиране разрешено, деклариран каноничен `https://carnivalforyou.com/product-detail/1312`, **без** предупреждение за noindex или robots.txt блок. Това затваря окончателно въпроса с `_middleware.js` — потвърдено от самия Googlebot, не само от наши заявки. Разпознати два типа структурирани данни (Product snippets и Merchant listings), по 1 валиден елемент всеки, с некритични препоръчителни полета липсващи (типично `sku`, `brand`, `aggregateRating`).
4. [x] Заявено преобхождане на началната страница. Продуктовите URL-а нарочно не са заявявани поотделно — има дневен лимит и sitemap-ът върши тази работа.
5. [ ] **След 3–4 дни:** погледни отчета "Страници" (индексирани / неиндексирани) и Crawl stats. В момента и двете са празни, което е нормално за property на няколко часа. Отчетът за `robots.txt` показва "Няма файл" — това е кеширан изглед от последното обхождане на **стария** сайт; живият тест потвърди, че Googlebot чете файла нормално.
6. [ ] Наблюдавай GSC за crawl errors/404-ки първите 1-2 седмици — включително дали се появява реален трафик към 3-те неразпознати стари `cn-*` landing страници (Фаза 3, т.5).
6a. [x] **Реален бъг, намерен чрез Google търсене 2026-09-08, поправен (`b8a58e8`):** търсене на "карнавални костюми" в Google връщаше органичен резултат с остаряло заглавие ("Над 1500 карнавални костюми под наем, София" — старата обща заглавна табела на сайта, споделяна на много страници) за стария адрес `about.php?cntid=18`, който реално е бил "Условия за отдаване". Редиректът коректно водеше към `/terms` — технически правилно, но объркващо: посетител, който вижда заглавие на начална страница, не очаква да излезе на страница с условия. Сменено да води към `/` — по-добро и откъм SEO (натрупаната тежест на стария адрес се предава на страницата, която реално продава, не на Условията). Същата логика приложена и на `cntid=30` (поверителност, бündлиран преди в `/terms`), макар само 18 да е потвърден живо в индекса на Google.
   - Потвърдено на живо: `about.php?lang=bg&cntid=18` вече дава 301 → `https://carnivalforyou.com/`.
   - Следваща стъпка: URL Inspection в GSC за точно този адрес → Request indexing, за да ускори обновяването на показаното заглавие.
7. [ ] Наблюдавай Supabase logs за необичаен трафик първите дни.
   - 💡 **Ако някой се оплаче, че сайтът не работи — първо hard reload (`Ctrl+Shift+R`), после търси проблем.** По време на миграцията два пъти имаше фалшив аларм точно от това: счупеният 301 на `/product-detail/*`, който браузърите пазят трайно и след поправката, и 403, кеширан в профила на собственика от момент, в който автоматизираните тестове на extension-а бяха задействали rate limit-а. И в двата случая сървърът връщаше правилния отговор, а браузърът сервираше стария. Incognito е бързият начин да се различи кеш от реален проблем — ползва същия IP, но чист кеш и без разширения.
8. [x] Финално решение за репото private/Pro — взето 2026-09-08: остава public.
9. [ ] Проследи 420-те продукта без EN описание и 66-те, чакащи проверка (deferred, не спешни).
10. [ ] **Не прекратявай хостинга при jump.bg още** — стои като път за връщане назад. Прекрати го чак след като GSC покаже стабилно индексиране на новия сайт (седмици, не дни).
11. [ ] Останали дребни, незапочнати: DMARC запис (`p=none` за начало), Leaked Password Protection в Supabase Auth, решение за Supabase Pro backups.

### ⭐ Важни TODO-та за следващата сесия

12. [ ] 🔴 **24-часов мониторинг: провери всички non-200 отговори от новия сайт.** Cloudflare пази исторически логове/аналитика — трябва да се прегледа трафикът от момента на cutover-а (2026-09-07 ~19:42 UTC) насам за:
    - Реални 4xx/5xx кодове (не кеширани в браузъра фалшиви аларми, каквито вече имахме два пъти — виж т.7 по-горе).
    - Дали Bot Fight Mode или rate limiting правилото са хванали реален посетителски трафик, не само автоматизирани тестове.
    - Concentрация от грешки върху конкретен path — би сочило към пропусната redirect комбинация или продукт с проблем.
    - Cloudflare Dashboard → Analytics & Logs → Traffic, филтрирано по status code; или Security → Events за блокираните заявки конкретно.
13. [x] ✅ **Google Analytics — ЖИВ И ПОТВЪРДЕН 2026-09-08.** GA4 Realtime показа реални сесии от България (посещение от телефон + проверки срещу живия домейн), consent gating работи и в двете посоки.
    - [x] **Код-частта готова 2026-09-08 (VSCode сесия):** [src/lib/analytics.ts](src/lib/analytics.ts) — GA4 loader с Consent Mode (`analytics_storage` default `denied`, `initConsentDefaults()` викнато веднъж в [src/main.tsx](src/main.tsx)). [src/components/CookieConsent.tsx](src/components/CookieConsent.tsx) вече реално гейтва: `accepted` → `loadAnalytics()` (и при клик, и при вече запазен избор при следващо зареждане), `declined`/без избор → скриптът никога не се вкарва в DOM-а. Без `VITE_GA_MEASUREMENT_ID` цялото нещо е no-op — безопасно е вече мърджнато без да чака GA4 property-то. `tsc`/build минават чисти.
    - [x] Google Maps iframe-ът на Контакти вече е **click-to-load** ([src/pages/ContactsPage.tsx](src/pages/ContactsPage.tsx)) — плейсхолдър бутон вместо безусловен iframe; единственият чужд бисквитков източник вече не се зарежда без действие от посетителя.
    - [x] **GA4 property създадено 2026-09-08 (Chrome extension сесия).** Проверени акаунти `dimitrovlacho@`, `lachezar0dimitrov@`, `lachezar123dimitrov@`, `carnivalforyou@` — единственият с GA беше `carnivalforyou@gmail.com`, но property-то там е за **`arlekinobg.com`** (друг сайт на същия собственик, отделна GA4 property; нищо по неговите данни/tracking не е пипано). За `carnivalforyou.com` е създадена **нова**, отделна Analytics сметка ("CarnivalForYou") + property, Web data stream = `https://carnivalforyou.com`, Enhanced measurement включено по подразбиране (scrolls/outbound clicks/site search/video/form interactions/file downloads), свързано със Search Console Domain property-то, timezone България/BGN. Measurement ID: **`G-9LQ9WXM8YT`**.
      - ⚠️ **Странична находка при прегледа:** `arlekinobg.com`-ото GA акаунт имаше **account-level** (не само property-level) Administrator достъп на непознат имейл `fori1914@gmail.com`, вероятно стар разработчик от 2023 — премахнат по изрична заявка на потребителя. Не е нищо във въпросния repo/проект, но си струва да се провери дали подобен стар достъп виси и другаде (Cloudflare, GitHub, Supabase, GSC) — не проверено още тук.
    - [x] **Wire-нато в кода 2026-09-08 (VSCode сесия):** `VITE_GA_MEASUREMENT_ID=G-9LQ9WXM8YT` сложено в локалния `.env`; `npm run build` минава чисто с реалния ID.
    - [x] Кодовите промени (analytics.ts + гейтването в CookieConsent + click-to-load картата) push-нати към `main` 2026-09-08 (`3855da7`).
    - [x] `VITE_GA_MEASUREMENT_ID=G-9LQ9WXM8YT` добавен в Cloudflare Pages → Production env vars (Chrome extension), нов deploy направен.
    - 🔴 **Реален бъг открит при първата live проверка (Chrome extension):** `gtag/js` се зареждаше (200), но `window.gtag` никога не се дефинираше и никога не излизаше заявка към `google-analytics.com/g/collect` — GA4 Realtime показваше 0 потребители. Причина: `gtag` в `analytics.ts` беше module-scoped helper, никога закачен на `window`; истинската gtag.js библиотека очаква реален глобален `window.gtag` shim (както в официалния Google snippet), за да поеме опашката и прати hit-а.
    - [x] **Пренаписан 2026-09-08 (VSCode) по каноничния Google Consent Mode pattern:** `window.gtag`/`window.dataLayer` вече реални globals; script tag-ът и `consent default denied` се зареждат безусловно при boot (`initConsentDefaults()`); `consent update granted` + `config` (реалният старт на измерването) чакат `loadAnalytics()` при "Приемам". `tsc`/build чисти, push-нат.
    - 🔴 **Втори, истинският root cause (открит 2026-09-08 след като първата поправка НЕ реши проблема):** shim-ът беше писан с rest-параметър — `window.gtag = function(...args) { dataLayer.push(args) }` — което бута **истински `Array`**. Официалният Google snippet бута **`arguments`** обекта. gtag.js разпознава записите в опашката като команди само ако формата им е `[object Arguments]`; обикновен масив се игнорира. Затова `config` никога не се изпълняваше: скриптът се зареждаше (200), контейнерът `window.google_tag_manager['G-9LQ9WXM8YT']` bootstrap-ваше, `window.gtag` беше дефиниран — и въпреки това нула hit-ове, нула бисквитки. Поправено: `function gtag() { window.dataLayer.push(arguments) }`.
      - ⚠️ Диагностичен капан, който подведе две отделни проверки: GA4 праща hit-овете през `navigator.sendBeacon`, а те **не се появяват в `performance.getEntriesByType('resource')`**. Проверката "няма нищо в Performance API, значи нищо не се праща" дава фалшив отрицателен резултат. Ползвай мрежовия лог на DevTools/Playwright или наличието на `_ga` / `_ga_<ID>` бисквитките.
      - Другото подвеждащо: GA4 Data Stream → "Тестване" зарежда сайта като бот без да приема cookie банера, така че при consent gating винаги ще каже "Маркерът не бе открит" — това не е доказателство за бъг.
    - [x] **Потвърдено работещо end-to-end 2026-09-08** (production build, реален браузър през Playwright, срещу живото GA4 property):
      - "Приемам" → два реални `POST` към `region1.google-analytics.com/g/collect`, `tid=G-9LQ9WXM8YT`, `en=page_view`, `gcs=G1-1` (consent granted), отговор `204`; бисквитките `_ga` и `_ga_9LQ9WXM8YT` се създават.
      - "Отказвам" (от чисто състояние) → **нула** заявки към Google, `document.cookie` остава напълно празен. Гейтването реално работи и в двете посоки.
    - Контекст от одита 2026-09-08: сайтът дотогава не слагаше **никакви** собствени бисквитки (`document.cookie` не се ползва никъде), нямаше нито един тракер, а трите localStorage ключа (език, splash-seen, самото съгласие) + Supabase admin сесията са строго функционални.
