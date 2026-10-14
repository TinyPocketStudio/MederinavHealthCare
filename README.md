# Mederinav Health Care – website

Static site (HTML + CSS + vanilla JS). There's no build step: open `index.html` or serve the folder.

```
index.html          Home: hero, treatments, seasonal campaign, before/after gallery, doctor, visit us
behandlingar.html   Treatments with descriptions (accordion)
priser.html         Price list
om-oss.html         About: clinic and full staff profiles (education, experience, specialties)
boka.html           Online booking with a week-by-week calendar
assets/css/styles.css
assets/js/data.js   ← treatments, prices, staff, opening hours, campaign end date
assets/js/main.js   Shared behaviour (menu, gallery slider, rendering of treatments/prices)
assets/js/booking.js Booking calendar
assets/images/      Placeholder images (SVG)
assets/logo/        Placeholder logos (SVG)
```

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
| `images/visit-clinic-street.svg` | "Besök oss" | 600×900 (2:3) |

**Easiest way to replace an image:** save your photo (`.jpg` / `.webp`) in `assets/images/` and update the file name in the HTML. To find every place an image is used, search the project for its file name (for example `hero-clinic`). The four treatment images are referenced by category id in `assets/js/main.js` (`treatment-${cat.id}.svg`), so if you switch to `.jpg`, change the extension there too.

All images use `object-fit: cover`, so photos with slightly different proportions still fit.

## Editing content

- **Treatments, descriptions, prices, durations:** `assets/js/data.js`. The Behandlingar, Priser and Boka tid pages, plus the "Från X kr" prices on the home page, all update from this file.
- **Seasonal campaign:** to put a treatment on offer, give it a `campaignPrice` in `data.js`. Set the campaign's end date in `campaign.endDate`. The offer list, the "up to −X%" badge, the countdown and the campaign badges are all generated automatically. The headline text lives in `index.html` (`#kampanj`).
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
