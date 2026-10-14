# Mederinav Health Care – website

Static site (HTML + CSS + vanilla JS). There's no build step: open `index.html` or serve the folder.

```
index.html          Home: hero, treatments, seasonal campaign, before/after gallery, doctor, visit us
behandlingar.html   Treatments with descriptions (accordion)
om-oss.html         About: clinic and full staff profiles (education, experience, specialties)
boka.html           Online booking with a week-by-week calendar
assets/css/styles.css
assets/js/data.js   ← treatments, prices, staff, opening hours, campaign end date
assets/js/translations.js ← Spanish text (and Swedish text built by JS)
assets/js/i18n.js   Language switching (SV | ES)
assets/js/main.js   Shared behaviour (menu, gallery slider, rendering of treatments)
assets/js/booking.js Booking calendar
assets/images/      Placeholder images (SVG)
assets/logo/        Placeholder logos (SVG)
```

## Languages: Swedish and Spanish

The SV | ES toggle in the header switches the whole site, including the booking calendar, form errors and confirmations, without reloading the page or losing the visitor's booking progress. The choice is remembered, and Spanish pages get `?lang=es` in the URL so they can be shared (for example `index.html?lang=es`). A visitor whose browser language is Spanish sees Spanish on their first visit.

- **Swedish** is the source language and stays directly in the HTML.
- **Spanish page text** is in `assets/js/translations.js` under `es`. An element marked `data-i18n="home.hero.lead"` gets the text stored under that key; `data-i18n-attr="alt:home.hero.imgAlt"` does the same for attributes such as `alt` and `aria-label`.
- **Spanish treatments, descriptions and staff roles** are in `assets/js/data.js`, in the `es: { … }` block next to the Swedish text.

When you change Swedish text, update the Spanish too. If a Spanish key or field is missing, the Swedish text is shown and the browser console logs a warning naming the missing key, so the page never breaks.

To add a translated element: put `data-i18n="some.key"` on it in the HTML (wrap the text in a `<span>` if the element also contains an icon) and add `"some.key": "…"` to the `es` block in `translations.js`.

> ⚠️ The Spanish text is a translation from the Swedish placeholder text (neutral Spanish, informal "tú"). Have a native speaker review it before launch.

## Replacing images and the logo

Every placeholder shows its own file name and recommended size, so you can see which file goes where.

| File | Used on | Size / ratio |
|---|---|---|
| `logo/logo.svg` | Header and footer on every page | ~280×64 (wide) |
| `logo/logo-mark.svg`, `logo/logo-light.svg` | Extras: symbol only, and a white version | |
| `logo/favicon.svg` | Browser tab | square |
| `images/hero-clinic.svg` | Home hero (arch) | 800×1000 (4:5) |
| `images/treatment-medicinskt/fillers/botox/fotvard.svg` | Treatment circles on home, icons on Behandlingar | 600×600 (1:1) |
| `images/campaign-season.svg` | Campaign section | 900×700 |
| `images/gallery-01…04-before/after.svg` | Before/after gallery | 800×600 (4:3); before and after must match |
| `images/team-christian-navarro.svg`, `team-lorena-munoz.svg` | Home and Om oss | 600×750 (4:5) |
| `images/about-clinic.svg` | Om oss | 1200×800 (3:2) |
| `images/visit-clinic-street.svg` | "Öppettider" | 600×900 (2:3) |

**Easiest way to replace an image:** save your photo (`.jpg` / `.webp`) in `assets/images/` and update the file name in the HTML. To find every place an image is used, search the project for its file name (for example `hero-clinic`). The four treatment images are referenced by category id in `assets/js/main.js` (`treatment-${cat.id}.svg`), so if you switch to `.jpg`, change the extension there too.

All images use `object-fit: cover`, so photos with slightly different proportions still fit.

## Editing content

- **Treatments, descriptions, prices, durations:** `assets/js/data.js`. The Behandlingar and Boka tid pages, plus the "Från X kr" prices on the home page, all update from this file.
- **Seasonal campaign:** to put a treatment on offer, give it a `campaignPrice` in `data.js`. Set the campaign's end date in `campaign.endDate`. The offer list, the "up to −X%" badge, the countdown and the campaign badges are all generated automatically. The headline text lives in `index.html` (`#kampanj`), with the Spanish version under `home.campaign.title` in `translations.js`.
- **Opening hours, staff working days, booking window:** `hours`, `team[].days`, `bookingWeeksAhead` and `minNoticeHours` in `data.js`.
- **Before/after cases:** `index.html` → `#galleri`. Copy a `<figure class="ba">` block to add a case. `data-category` controls which filter it belongs to.
- **Staff profiles (education, experience, etc.):** `om-oss.html`, with a shorter version in `index.html` → `#lakare`.

> ⚠️ All bios, education entries, years, statistics ("15+ år", "3 000+ behandlingar"), prices and transport details are **placeholder text**. Replace them with real information before launch.

## Booking: important before going live

The calendar runs in **demo mode**:
- Available times are simulated in `isTaken()` in `assets/js/booking.js`.
- Bookings are only saved in the visitor's own browser (localStorage) by `submitBooking()`. **No booking reaches the clinic, and no email is sent.**

Before launch, connect these two functions to a real booking system or API (for example your booking provider's API or your own backend). Everything else (calendar, steps, validation, confirmation) can stay as it is.

Deep links work: `boka.html?behandling=fillers-lappar` preselects a treatment, and `boka.html?behandlare=lorena` preselects a staff member.

## Running locally

```bash
npx http-server -p 5173
```
