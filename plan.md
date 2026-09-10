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
- Bot Fight Mode + Rate Limiting (150 req/10s/IP) активирани.
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
10. [ ] 301 redirect mapping за старите jump.bg `/news` и `/services` страници — предстои проверка през Chrome extension (виж промпта по-долу), част от Phase 3 SEO.
11. [ ] 385 активни продукта без описание на нито един език (Перуки 121, Аксесоари 117, Маски 90, Шапки 57) — реално отложена задача, изисква писане на нови описания, не превод (виж памет `project_carnivalforyou_missing_en_descriptions`).
