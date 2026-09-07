/*
# About page: kids' corner section + fitting rooms detail

## Purpose
1. Adds a new "kids' corner" section to `about_content` (title/body bg+en +
   image), rendered on the About page alongside a photo of the store's play
   area for children.
2. Extends the existing `addons_body_bg`/`addons_body_en` copy (the
   paragraph shown right above the fitting-room photo) to describe the
   store's three fitting rooms — one large "royal" one and two standard
   ones.

## Notes
- Additive only: new nullable-with-default columns on the existing
  `about_content` singleton (id=1), no RLS/policy changes needed since the
  existing public-select / admin-update policies already cover new columns.
- The UPDATE only touches row id=1 and is idempotent (safe to re-run).
*/

ALTER TABLE about_content
  ADD COLUMN IF NOT EXISTS kids_corner_title_bg text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS kids_corner_title_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS kids_corner_body_bg text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS kids_corner_body_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS kids_corner_image_url text NOT NULL DEFAULT '';

UPDATE about_content
SET
  kids_corner_title_bg = $t$Детски кът$t$,
  kids_corner_title_en = $t$Kids' Corner$t$,
  kids_corner_body_bg = $t$За най-малките ни приятели подготвихме уютен детски кът — място, в което да играят и да се забавляват, докато вие, необезпокоявани, избирате своя перфектен образ.$t$,
  kids_corner_body_en = $t$For our smallest friends, we've created a cozy kids' corner — a place to play and have fun while you take your time choosing your perfect look, completely undisturbed.$t$,
  kids_corner_image_url = 'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/1788775534113-07e04a97.jpg',
  addons_body_bg = $t$А ако костюмът не е достатъчен, добавяме грим, прическа, маска, перука, шапка, аксесоари и всичко необходимо, за да завършим образа. Професионални дизайнери, стилисти, гримьори и фризьори с опит и нестандартно мислене са на ваше разположение, за да превърнем желанието ви в реалност. За максимално удобство ви посрещаме в три пробни — една истинска царска пробна, достойна за крале и кралици, и още две стандартни, в които спокойно и без бързане ще намерите своя перфектен образ.$t$,
  addons_body_en = $t$And if the costume alone isn't enough, we'll add makeup, hairstyling, a mask, a wig, a hat and any accessories needed to complete the look. Experienced, out-of-the-box designers, stylists, makeup artists and hairdressers are on hand to turn your idea into reality. For maximum comfort, we welcome you into three fitting rooms — one truly regal, worthy of kings and queens, and two more standard-sized rooms where you can take your time finding your perfect look.$t$,
  updated_at = now()
WHERE id = 1;
