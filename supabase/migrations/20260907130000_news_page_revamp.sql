/*
News page revamp: add a full-article `content_bg` / `content_en` field to
news_posts (the existing `excerpt_*` columns stay as the short card teaser)
so the public News page can expand a post inline on "Read more" instead of
just linking to Contacts. Content is stored as plain text: blank lines
separate paragraphs, a line starting with "## " renders as a sub-heading,
and single newlines inside a paragraph render as <br /> (used for the
short list-style lines in these articles). NewsPage.tsx / NewsForm in
AdminPage.tsx parse this format.

Replaces the 3 remaining Pexels placeholder rows (seeded in
20260903160000_content_pages_services_news_about_terms.sql, never edited
by the client) with the 3 real posts the client supplied: the new-site
announcement, the 2024 store move, and a Halloween feature.
*/

ALTER TABLE news_posts
  ADD COLUMN IF NOT EXISTS content_bg text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS content_en text NOT NULL DEFAULT '';

DELETE FROM news_posts;

INSERT INTO news_posts
  (title_bg, title_en, excerpt_bg, excerpt_en, content_bg, content_en, category_bg, category_en, post_date, image_url, is_active, sort_order)
VALUES
(
  $t$Благодарим ви, че пазим магията на карнавала заедно вече над 18 години$t$,
  $t$Thank you for celebrating the magic of carnival with us for over 18 years$t$,
  $t$Повече от 18 години „Карнавал за теб“ създава незабравими празнични моменти. С огромно вълнение ви представяме новия си сайт, създаден да ви помогне още по-лесно да откриете перфектната визия.$t$,
  $t$For more than 18 years, Carnival For You has created unforgettable festive moments. We're thrilled to unveil our brand-new website, built to help you find the perfect look even faster.$t$,
  $t$Повече от 18 години „Карнавал за теб“ създава настроение, усмивки и незабравими празнични моменти.
Но всичко това не би било възможно без вас – нашите прекрасни клиенти, които през годините ни се доверявате и ни помагате да пазим жив духа и магията на карнавала.

Благодарение на вашата подкрепа, любов към красивите празници и желание да се преобразявате, ние продължаваме да се развиваме и да търсим още по-добри начини да бъдем полезни.

## Нов сайт, създаден специално за вас

С огромно вълнение ви представяме новия сайт на „Карнавал за теб“ – направен с много старание, вдъхновение и грижа към вашето по-лесно и приятно изживяване.

Нашата идея беше не просто да обновим визията, а да създадем едно по-модерно, красиво и удобно място, в което:

по-лесно да разглеждате нашите предложения;
по-бързо да откривате точния костюм или аксесоар;
по-лесно да се вдъхновявате за цялостната си визия;
и с удоволствие да избирате най-подходящото за своето празненство.

## От старата визия към новото вдъхновение

Старият ни сайт беше началото на едно красиво пътешествие.
Той беше част от историята на „Карнавал за теб“ и дълги години ни помагаше да достигаме до вас.

Днес правим следващата стъпка напред.

Новият сайт е по-съвременен, по-подреден и по-вдъхновяващ. Той е създаден така, че да ви помогне не просто да изберете костюм, а да откриете цялостна идея за своя празничен образ – за Хелоуин, тематично парти, детско тържество, карнавал, училищно събитие или специален повод.

## Защото всяко празненство заслужава своята магия

Ние вярваме, че всеки празник започва с вдъхновение.
Понякога това е един костюм. Понякога е маска, аксесоар или цял образ.
А понякога е просто желанието за една вечер да бъдеш някой различен, интересен, приказен или незабравим.

Именно затова създадохме новия сайт –
за да ви бъде по-лесно да намерите най-добрата визия за вашето празненство
и да усетите магията още от първия клик.

## Благодарим ви!

Благодарим ви за доверието, за усмивките, за споделените празници и за това, че сте част от нашата история вече повече от 18 години.

Вашата подкрепа е причината да продължаваме напред.
Вашето вдъхновение ни мотивира да ставаме по-добри.
А новият ни сайт е нашият начин да ви кажем:

Благодарим ви, че пазим магията на карнавала заедно.$t$,
  $t$For more than 18 years, Carnival For You has been creating mood, smiles, and unforgettable festive moments.
But none of this would have been possible without you – our wonderful customers, who have trusted us over the years and helped us keep the spirit and magic of carnival alive.

Thanks to your support, your love for beautiful celebrations, and your desire to transform, we keep growing and looking for even better ways to be useful to you.

## A new website, built especially for you

With great excitement, we present the new Carnival For You website – made with care, inspiration, and attention to make your experience easier and more enjoyable.

Our idea was not simply to refresh the look, but to create a more modern, beautiful, and convenient place where you can:

browse our offers more easily;
find the exact costume or accessory faster;
get inspired for your overall look more easily;
and happily choose the best option for your celebration.

## From the old look to new inspiration

Our old website was the beginning of a beautiful journey.
It was part of Carnival For You's story and helped us reach you for many years.

Today we're taking the next step forward.

The new website is more modern, better organized, and more inspiring. It's designed to help you not just pick a costume, but discover a complete idea for your festive look – for Halloween, a themed party, a children's celebration, carnival, a school event, or any special occasion.

## Because every celebration deserves its own magic

We believe every celebration starts with inspiration.
Sometimes it's a single costume. Sometimes it's a mask, an accessory, or a whole look.
And sometimes it's simply the wish to be someone different, interesting, magical, or unforgettable for one night.

That's exactly why we created the new website –
to make it easier for you to find the best look for your celebration
and to feel the magic from the very first click.

## Thank you!

Thank you for your trust, for your smiles, for the celebrations we've shared, and for being part of our story for more than 18 years.

Your support is the reason we keep moving forward.
Your inspiration motivates us to become better.
And our new website is our way of telling you:

Thank you for keeping the magic of carnival alive together with us.$t$,
  $t$Обявление$t$, $t$Announcement$t$,
  DATE '2026-09-09',
  'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/1788772343127-cce641d9.png',
  true, 0
),
(
  $t$Преместихме се!$t$,
  $t$We've moved!$t$,
  $t$През 2024 г. „Карнавал за теб“ се премести в нов, по-голям дом в ж.к. Младост 4 — над 250 кв. м, климатици, 3 пробни, детски кът и фото декори за незабравими преживявания.$t$,
  $t$In 2024, Carnival For You moved to a bigger, more comfortable home in the Mladost 4 district — over 250 sq. m, air conditioning, 3 fitting rooms, a kids' corner, and photo backdrops.$t$,
  $t$## Ново начало за магията на карнавала

С огромно вълнение ви споделяме, че през 2024 година направихме една важна и вдъхновяваща крачка напред —
„Карнавал за теб“ се премести от ул. „Патриарх Евтимий“ №3 в своя нов, по-голям и по-удобен дом в ж.к. Младост 4.

Това не е просто нов адрес.
Това е ново пространство за повече комфорт, повече вдъхновение и още повече карнавална магия.

## Повече място. Повече удобство. Повече възможности.

В новия ни магазин ви очаква просторна и модерна обстановка с над 250 кв. м пространство, създадена така, че посещението ви да бъде по-приятно, по-лесно и по-вдъхновяващо.

За вашето удобство разполагаме с:

над 250 кв. м просторен търговски обект
климатици за комфорт през всеки сезон
3 специализирани пробни, в които спокойно и удобно да изберете своята перфектна визия
детски кът за най-малките ни посетители
специални декори за фотосесии, които превръщат избора на костюм в истинско преживяване

## Място, създадено за цялото семейство

Искахме новият ни магазин да бъде не просто по-голям, а по-уютен, по-функционален и по-подходящ за цялото семейство.

Докато избирате костюми, маски и аксесоари, децата могат да се чувстват добре и спокойно, а вие да разгледате нашите предложения с повече удобство и време.
Новите пробни създават комфорт при избора, а фотодекорите добавят онова специално усещане, което прави всяко посещение още по-приятно и запомнящо се.

## Същата магия – на още по-хубаво място

Преместването е важна част от нашето развитие, но най-важното остава непроменено —
любовта ни към празниците, красивите визии и вълшебството на преобразяването.

Новият магазин в ж.к. Младост 4 ни дава възможност да ви посрещаме още по-добре и да ви предложим още по-приятно изживяване, когато търсите идеалния костюм за Хелоуин, карнавал, тематично парти, детско тържество, фотосесия или специален повод.

## Очакваме ви!

Заповядайте в новия дом на „Карнавал за теб“ в ж.к. Младост 4
и открийте място, в което пространството е повече, удобството е по-голямо, а магията е същата — дори още по-силна.

Очакваме ви, за да създаваме празнични моменти заедно!$t$,
  $t$## A new beginning for the magic of carnival

We're thrilled to share that in 2024 we took an important and inspiring step forward —
Carnival For You moved from 3 Patriarh Evtimiy Street to its new, bigger, and more comfortable home in the Mladost 4 district.

This isn't just a new address.
It's a new space for more comfort, more inspiration, and even more carnival magic.

## More space. More comfort. More possibilities.

Our new store welcomes you with a spacious, modern setting of over 250 sq. m, designed to make your visit more pleasant, easier, and more inspiring.

For your comfort, we now offer:

over 250 sq. m of retail space
air conditioning for comfort in every season
3 dedicated fitting rooms where you can calmly and comfortably choose your perfect look
a kids' corner for our youngest visitors
special photo backdrops that turn choosing a costume into a real experience

## A place made for the whole family

We wanted our new store to be not just bigger, but cozier, more functional, and better suited for the whole family.

While you browse costumes, masks, and accessories, your children can feel comfortable and at ease, giving you more time and convenience to explore our offers.
The new fitting rooms make choosing more comfortable, and the photo backdrops add that special touch that makes every visit even more enjoyable and memorable.

## Same magic, in an even better place

Moving is an important part of our growth, but what matters most stays the same —
our love for celebrations, beautiful looks, and the magic of transformation.

Our new store in the Mladost 4 district lets us welcome you even better and offer you an even more enjoyable experience whenever you're looking for the perfect costume for Halloween, carnival, a themed party, a children's celebration, a photo shoot, or a special occasion.

## We're expecting you!

Come visit the new home of Carnival For You in the Mladost 4 district
and discover a place with more space, more comfort, and the same magic — only even stronger.

We're looking forward to welcoming you, so we can create festive moments together!$t$,
  $t$Нашият магазин$t$, $t$Our Store$t$,
  DATE '2024-08-20',
  'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/1788772344830-d49710e2.png',
  true, 2
),
(
  $t$Хелоуин наближава: любопитни факти за празника и идеи за незабравимо преобразяване$t$,
  $t$Halloween is coming: fun facts about the holiday and ideas for an unforgettable transformation$t$,
  $t$Хелоуин наближава, а с него и възможността за една вечер да бъдете някой съвсем различен. Открийте любопитни факти за празника и се вдъхновете за перфектния костюм.$t$,
  $t$Halloween is coming, and with it the chance to become someone completely different for one night. Discover fun facts about the holiday and get inspired for the perfect costume.$t$,
  $t$Хелоуин наближава, а с него идва и онова специално време от годината, в което за една вечер можем да бъдем някой съвсем различен. Страшен клоун, вампир, вещица, приказен герой, мистериозна дама, зомби или персонаж от любим филм — на Хелоуин въображението няма почти никакви граници.

Но откъде идва този необикновен празник и защо костюмите са толкова важна част от него?

## Откъде идва Хелоуин?

Хелоуин се отбелязва на 31 октомври, в навечерието на Деня на Вси светии. Името идва от английското All Hallows' Eve — „вечерта преди Вси светии“.

Много от традициите, които днес свързваме с Хелоуин, имат корени в стари европейски обичаи и постепенно са се променяли през вековете. С времето празникът се превръща в пъстра смесица от мистерия, страшни истории, маски, декорации, игри и, разбира се, костюми.

Днес Хелоуин вече не е просто „страшен празник“. За много хора той е повод за парти, забавление, творчество и възможност да влязат в роля, която в ежедневието никога не биха избрали.

## Знаете ли, че първите фенери не били от тикви?

Един от най-разпознаваемите символи на Хелоуин е тиквата с издълбано лице — известният Jack-o'-lantern.

Интересното е, че в по-стари европейски традиции подобни фенери често са се правели от ряпа и други кореноплодни, а не от тикви. Тиквата става популярна по-късно, особено в Северна Америка, защото е по-голяма и много по-удобна за издълбаване.

Днес светещата тиква е почти задължителна част от Хелоуин — от домашната украса до декорацията на тематични партита.

## Защо хората се маскират?

Костюмът е в самото сърце на Хелоуин.

В различни исторически традиции хората са използвали маски и необичайни дрехи по време на сезонни празници и шествия. С течение на времето маскирането постепенно се превръща в забавната традиция, която познаваме днес.

И точно тук започва най-интересната част.
Защото добрият Хелоуин костюм не е просто дреха.
Той е преобразяване.

## Не обличайте просто костюм — влезте в образ

Един от най-големите ефекти на Хелоуин идва, когато визията е завършена от глава до пети.

Представете си например костюм на страховит клоун. Самият костюм създава образа, но истинската трансформация идва, когато към него добавим:

маска или подходящ грим, перука, ръкавици, обувки, цветни лещи, шапка, оръжие-реквизит или друг подходящ аксесоар.

Същото важи за вещица, вампир, призрак, зомби, демон или любим филмов герой.

Малките детайли често правят най-голямата разлика.

Една перука може напълно да промени лицето. Маската моментално създава характер. Гримът добавя реализъм, а подходящият аксесоар прави образа разпознаваем още от първия поглед.

## Хелоуин не е само за страшни костюми

Разбира се, не е задължително всички да бъдат страховити.

Хелоуин е перфектният момент и за забавни, красиви или напълно неочаквани преобразявания.

Можете да бъдете приказна принцеса, супергерой, пират, историческа личност, животно, цирков артист или герой от любим филм.

Именно това прави празника толкова интересен — няма един правилен начин да изглеждате.

За децата това е шанс да бъдат любимия си герой.
За възрастните — възможност поне за една вечер да излязат от ежедневната си роля.

## Малко грим, голяма промяна

Ако искате визията ви да бъде запомняща се, помислете не само за костюма, а за цялостния образ.

Лек грим около очите може да превърне обикновения костюм в мистериозен персонаж.
Бяла основа, черни сенки и червени детайли могат да създадат страховит клоун.
Изкуствена кръв, белези и латекс могат да превърнат героя в зомби.
Перука и подходящи аксесоари могат напълно да променят силуета и излъчването.

И не е необходимо ефектът винаги да бъде сложен. Понякога правилната маска и един добре подбран костюм са напълно достатъчни.

## А какъв ще бъдете вие този Хелоуин?

Най-хубавата част от подготовката е изборът.
Ще бъдете страшни или забавни?
Класически или екстравагантни?
Ще изберете познат персонаж или ще създадете собствен?

В „Карнавал за теб“ Хелоуин е повече от костюм. Това е възможност да изградите цял образ — с подходящ костюм, маска, перука и аксесоари, които заедно създават истинското преобразяване.

Защото понякога е достатъчна само една вечер, за да станете някой съвсем различен.

Хелоуин наближава. Време е да изберете своя образ.$t$,
  $t$Halloween is coming, and with it comes that special time of year when, for one night, we can be someone completely different. A scary clown, a vampire, a witch, a fairy-tale hero, a mysterious lady, a zombie, or a character from your favorite movie — on Halloween, imagination has almost no limits.

But where does this unusual holiday come from, and why are costumes such an important part of it?

## Where does Halloween come from?

Halloween is celebrated on October 31st, the eve of All Saints' Day. The name comes from the English All Hallows' Eve — "the evening before All Hallows."

Many of the traditions we associate with Halloween today have roots in old European customs and have gradually changed over the centuries. Over time, the holiday became a colorful mix of mystery, scary stories, masks, decorations, games, and, of course, costumes.

Today, Halloween is no longer just a "scary holiday." For many people, it's an occasion for a party, fun, creativity, and a chance to step into a role they would never choose in everyday life.

## Did you know the first lanterns weren't made from pumpkins?

One of the most recognizable symbols of Halloween is the pumpkin with a carved face — the famous Jack-o'-lantern.

Interestingly, in older European traditions, similar lanterns were often made from turnips and other root vegetables rather than pumpkins. Pumpkins became popular later, especially in North America, because they're larger and much easier to carve.

Today, the glowing pumpkin is an almost essential part of Halloween — from home decor to themed party décor.

## Why do people wear costumes?

The costume is at the very heart of Halloween.

In various historical traditions, people wore masks and unusual clothing during seasonal celebrations and processions. Over time, dressing up gradually became the fun tradition we know today.

And this is exactly where the most interesting part begins.
Because a great Halloween costume isn't just an outfit.
It's a transformation.

## Don't just wear a costume — become the character

One of the biggest effects of Halloween comes when the look is completed from head to toe.

Picture, for example, a scary clown costume. The costume itself creates the look, but the real transformation happens when we add to it:

a mask or matching makeup, a wig, gloves, shoes, colored contact lenses, a hat, a prop weapon, or another fitting accessory.

The same goes for a witch, a vampire, a ghost, a zombie, a demon, or a favorite movie character.

The small details often make the biggest difference.

A wig can completely change a face. A mask instantly creates character. Makeup adds realism, and the right accessory makes the look recognizable at first glance.

## Halloween isn't only about scary costumes

Of course, not everyone has to be scary.

Halloween is also the perfect moment for fun, beautiful, or completely unexpected transformations.

You can be a fairy-tale princess, a superhero, a pirate, a historical figure, an animal, a circus performer, or a character from your favorite movie.

That's exactly what makes the holiday so interesting — there's no one right way to look.

For children, it's a chance to be their favorite character.
For adults — a chance to step out of their everyday role for at least one night.

## A little makeup, a big change

If you want your look to be memorable, think not just about the costume, but about the whole image.

Light makeup around the eyes can turn an ordinary costume into a mysterious character.
A white base, dark shadows, and red details can create a scary clown.
Fake blood, scars, and latex can turn a character into a zombie.
A wig and matching accessories can completely change your silhouette and presence.

And the effect doesn't always have to be complicated. Sometimes the right mask and a well-chosen costume are more than enough.

## So who will you be this Halloween?

The best part of getting ready is the choice.
Will you be scary or fun?
Classic or extravagant?
Will you pick a familiar character or create your own?

At Carnival For You, Halloween is more than a costume. It's a chance to build a whole look — with the right costume, mask, wig, and accessories that together create a true transformation.

Because sometimes all it takes is one night to become someone completely different.

Halloween is coming. It's time to choose your look.$t$,
  $t$Сезонни$t$, $t$Seasonal$t$,
  DATE '2026-10-01',
  'https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev/content-images/1788772346384-e4a6449d.png',
  true, 1
);
