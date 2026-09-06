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

1. [ ] Ротирай admin паролата отново (в момента `Bogomil1`, известно слаба).
2. [ ] Прегледай `.env` историята в git за нищо изтекло (вече потвърдено gitignored, само двойна проверка).
3. [ ] Бърз secret-scan по цялото repo преди да върнеш видимостта private.
4. [ ] Реши: GitHub Pro ($4/мес) за private + запазен anti-force-push ruleset, или остави публично (mirror архивът вече го прави безопасно).
5. [ ] Ако избереш private → Chrome Extension: Settings → Danger Zone → Change visibility.
6. [ ] Провери Supabase RLS policies отново (`get_advisors` през Supabase MCP, във VSCode).
7. [ ] Реши дали да ъпгрейднеш Supabase на Pro ($25/мес) за автоматични DB backups.

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

1. [ ] Пусни отново "Final Verification Sweep" SQL заявките от `PRODUCT_AUDIT_SUMMARY.md` — 0 spam anchors във всички текстови колони.
2. [ ] Провери Google Search Console за manual actions, особено продукти 255, 259, 1427, 1430, 1543, 1547.
3. [ ] Финална ротация на admin паролата, ако не е станала в Фаза 1.

## Фаза 5 — Самият Cutover (go-live ден)
**Инструмент: Chrome Extension + VSCode за бърз hotfix**

0. [x] **Поща** — вече готово предварително (Фаза 2), не чака за cutover деня: Cloudflare Email Routing активен и потвърден, Gmail receive-as и send-as ("reply from office@") и двете тествани успешно.
1. [ ] Финален manual dispatch на backup archive workflow-а точно преди флипа.
2. [ ] Смени DNS записа в Cloudflare zone-а да сочи към Cloudflare Pages (само web-facing запис — A/CNAME на apex/www, НЕ MX).
3. [ ] **Активирай Cloudflare Bulk Redirects правилото от Фаза 3 (Enable)** — едновременно с/веднага след стъпка 2, за да не остане прозорец с живи стари URL-и без редирект.
4. [ ] Изчакай propagation, тествай от няколко локации/устройства.
5. [ ] Провери SSL/HTTPS сертификата се е издал правилно.
6. [ ] Провери 301 редиректите работят за няколко случайни стари URL-а (вече активни от т.3).
7. [ ] Провери отново пощата — потвърди forward-ът и send-as все още работят след флипа (вероятно неповлияни, но бърза проверка не боли).

## Фаза 6 — След go-live
**Инструмент: Chrome Extension + VSCode**

1. [ ] Изпрати новия sitemap.xml в Google Search Console, поискай re-crawl.
2. [ ] Наблюдавай GSC за crawl errors/404-ки първите 1-2 седмици.
3. [ ] Наблюдавай Supabase logs за необичаен трафик първите дни.
4. [ ] Финално решение за репото private/Pro (Фаза 1, т.4).
5. [ ] Проследи 420-те продукта без EN описание и 66-те, чакащи проверка (deferred, не спешни).
