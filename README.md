# Mederinav Health Care – website

Static site (HTML + CSS + vanilla JS). There's no build step: open `index.html` or serve the folder.

```
index.html          Home: hero, treatments, seasonal campaign, before/after gallery, doctor, visit us
behandlingar.html   Treatments with descriptions (accordion)
om-oss.html         About: clinic and full staff profiles (education, experience, specialties)
boka.html           Online booking with a week-by-week calendar
assets/css/styles.css
assets/js/data.js   ← staff, opening hours, categories (+ backup copies of treatments and the campaign)
assets/js/translations.js ← Spanish text (and Swedish text built by JS)
assets/js/i18n.js   Language switching (SV | ES)
assets/js/main.js   Shared behaviour (menu, gallery slider, rendering of treatments)
assets/js/booking.js Booking calendar (talks to booking-api)
assets/images/      Placeholder images (SVG)
assets/logo/        Logo (logo.jpg)
booking-api/        Booking backend (Cloudflare Worker + D1 database) at api.mederinavhealthcare.se
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
| `logo/logo.jpg` | Header and footer on every page (shown round, next to the name as text) | square, e.g. 1254×1254 |
| `logo/favicon.png` | Browser tab icon: a round copy of logo.jpg with transparent corners (192×192). Make a new one if the logo changes | 192×192 |
| `images/hero-clinic.jpg` | Home hero (arch) | 800×1000 (4:5) |
| `images/treatment-medicinskt/injektioner/hudvard/fotvard.svg` | Treatment circles on home, icons on Behandlingar. Flat illustrations: medicinskt is the supplied doctor-and-patient picture (PNG inside the SVG), the other three were drawn to match it | square, transparent |
| `images/campaign-season.svg` | Campaign section, default picture (autumn botox & fillers illustration; keep the main motif in the middle, the image is cropped to a tall box on desktop). Staff can upload their own picture per campaign on the staff page | 900×700 |
| `images/gallery-01…04-before/after.svg` | Old placeholders, no longer used. Before & after pictures are uploaded on the staff page | – |
| `images/team-christian-navarro.jpg`, `team-lorena-munoz.svg` | Home and Om oss | 600×750 (4:5) |
| `images/about-clinic.jpg` | Om oss | 1200×800 (3:2) |
| `images/visit-clinic-street.jpg` | "Öppettider" | 600×900 (2:3) |

**Easiest way to replace an image:** save your photo (`.jpg` / `.webp`) in `assets/images/` and update the file name in the HTML. To find every place an image is used, search the project for its file name (for example `hero-clinic`). The four treatment images are referenced by category id in `assets/js/main.js` (`treatment-${cat.id}.svg`), so if you switch to `.jpg`, change the extension there too.

All images use `object-fit: cover`, so photos with slightly different proportions still fit.

## Editing content

- **Treatments, descriptions, prices, durations, who performs them:** on the staff page, **Behandlingar** tab (see "Staff page"). They are stored in the booking database. The Behandlingar and Boka tid pages, plus the "Från X kr" prices and campaign offers on the home page, load them from the booking API. The treatment list in `data.js` is only used to fill the database the first time, and as a backup if the API doesn't answer within 3 seconds.
- **Categories** (names, intros, images): `categories` in `assets/js/data.js`.
- **Seasonal campaign:** on the staff page, **Kampanj** tab: name, headline, description (Swedish and Spanish), start and end date, picture, and which treatments are included at what campaign price. The offer list, the "up to −X%" badge, the countdown and the campaign badges are all generated automatically. The campaign section on the home page only shows between the start and end date, and only if at least one treatment has a campaign price. `campaign` in `data.js` is only the first-time content and backup.
- **Opening hours, staff working days, booking window:** `hours`, `team[].days`, `bookingWeeksAhead` and `minNoticeHours` in `data.js`.
- **Before/after cases:** on the staff page, **Före & efter** tab. The filter buttons a case can belong to are `gallery.categories` in `data.js`.
- **Staff profiles (education, experience, etc.):** `om-oss.html`, with a shorter version in `index.html` → `#lakare`.

> ⚠️ All bios, education entries, years, statistics ("30+ år", "3 000+ behandlingar"), prices and transport details are **placeholder text**. Replace them with real information before launch.

## Booking backend

Bookings are stored by a small backend in `booking-api/`: a Cloudflare Worker with a D1 database, served at `https://api.mederinavhealthcare.se`.

- `GET /treatments` returns the treatments shown on the website (hidden ones left out).
- `GET /availability?from=…&to=…` returns which times are taken (max 14 days). It contains no names or contact details.
- `POST /bookings` saves a booking and returns a booking number such as `MH-7KQ2XD`.

The backend checks everything again: the treatment, the staff member, their working days, opening hours, minimum notice and the booking window. It saves each booking with a single "only if still free" step, so two people can never book the same time. The second person sees "Den valda tiden är inte längre ledig" (the chosen time is no longer available) and picks another time.

**Limit per person.** One person (same email or same phone number, however it's written) can have at most 2 upcoming bookings through the website; a third attempt is refused with "Du har redan bokade tider – ring oss". Staff phone bookings are never limited. Change the number in `MAX_UPCOMING_PER_PERSON` at the top of `booking-api/src/index.js`.

**Bot check (Cloudflare Turnstile).** The booking form gets a short-lived token from Cloudflare that proves a real browser filled it in; the backend checks it with Cloudflare before saving. It is invisible for most visitors. The public site key is `booking.turnstileSiteKey` in `assets/js/data.js`; the secret key is the Cloudflare secret `TURNSTILE_SECRET`. Without that secret the check is switched off (the Worker log says so). Locally, Cloudflare's official test keys are used automatically.

**One source of truth.** Treatments live in the D1 database (table `treatments`, code in `booking-api/src/catalog.js`); the website and the backend both read them from there. Categories, staff days and opening hours still come straight from `assets/js/data.js`. After editing that file, push to GitHub: both the website and the backend update, the backend through the Cloudflare ↔ GitHub connection.

**New database tables.** When a new file appears in `booking-api/migrations/`, run it once against the real database from `booking-api/`:

```bash
npm run db:migrate:remote
```

Until `0003_treatments.sql`, `0004_campaign.sql` and `0005_gallery.sql` have been run, the backend keeps using the treatments and campaign in `data.js` and keeps the gallery hidden, so nothing breaks (the staff page can't save campaign or gallery changes until then). The first request after they have run fills the tables from `data.js`.

**No secrets in the repo.** Keys are stored as encrypted secrets in Cloudflare. For local testing they go in `booking-api/.dev.vars`, which Git ignores. Patient data only lives in the D1 database, never in the repo.

**Emails.** After each booking, `booking-api/src/email.js` sends two emails through Brevo (an EU email service), from `noreply@mederinavhealthcare.se`:
- **To the patient:** a confirmation in Swedish or Spanish, matching the site's language when they booked. Replies go to `kundservice@mederinavhealthcare.se`.
- **To the clinic** (`CLINIC_NOTIFY_EMAIL`, i.e. `bokning@mederinavhealthcare.se`): "Ny bokning" with all details. Replying writes directly to the patient.

The mailboxes are at Loopia. The domain's DNS is at Cloudflare, so Cloudflare holds the MX records that point mail to Loopia (`mailcluster.loopia.se` priority 10, `mail2.loopia.se` priority 20), plus one combined SPF record.

The emails are sent in the background: a booking is saved even if an email fails, and failures show up in Cloudflare → Worker → **Observability / Logs**.

Settings in Cloudflare → Workers & Pages → `mederinav-booking` → **Settings → Variables and secrets** (type **Secret**):

| Name | What |
|---|---|
| `BREVO_API_KEY` | Brevo → Settings → SMTP & API → API keys |
| `CLINIC_NOTIFY_EMAIL` | Who gets "Ny bokning" emails. Several addresses separated by commas. Change it any time; no push needed |

The sender, its name and the reply address are in `booking-api/wrangler.toml` (`MAIL_FROM`, `MAIL_FROM_NAME`, `MAIL_REPLY_TO`). Locally, without a Brevo key, emails are only printed in the terminal.

## Staff page

Staff manage bookings at **https://api.mederinavhealthcare.se/admin/** (Swedish, works on phones):

- **The week's bookings:** all bookings per week, with a filter per staff member. "Visa avbokade" also shows cancelled ones.
- **Ny bokning:** add a phone booking.
  - Short notice and more than 8 weeks ahead are allowed; past times, closed days and taken times are not.
  - Optionally emails the patient a confirmation. The clinic gets no "Ny bokning" email for these.
- **Avboka:** cancel a booking, optionally with a cancellation email to the patient. The time becomes bookable again.
- **Blockera tid:** block time for one person or the whole clinic, for one or several days, as a whole day or a time range (vacation, sick days, lunch).
  - Blocked time can't be booked online.
  - Existing bookings in that time are *not* cancelled automatically; the page lists them so staff can contact the patients.
- **Behandlingar** (tab at the top): add or change treatments, including name, category, duration, price, who performs it, and the texts.
  - Spanish is required: a Spanish name always, and a Spanish version of the description and "Passar dig som" whenever the Swedish one is filled in.
  - Changes show on the website within a minute.
  - Treatments can't be deleted, only hidden ("Dölj på webbplatsen"). A hidden treatment can't be booked, but old bookings for it keep their name and price.
  - The web address of a new treatment (`/boka?behandling=…`) is made from its Swedish name when it is created and never changes.
- **Kampanj** (tab at the top): the seasonal campaign on the home page.
  - Name (also the badge on the treatments), headline and description, in Swedish and Spanish (Spanish required as for treatments).
  - Start and end date: the campaign and its prices apply from the start date through the end date, so the next campaign can be prepared in advance.
  - Picture: choose a new one and it is saved right away (shrunk to at most 1600 px before upload; JPG, PNG or WebP). "Använd standardbilden" goes back to `campaign-season.svg`.
  - Treatments and campaign prices: tick a treatment and type its campaign price, which must be lower than the normal price. Saving replaces all campaign prices at once.
- **Före & efter** (tab at the top): the before & after gallery on the home page.
  - A switch shows or hides the whole section. It only appears on the website when it is on *and* at least one case is published.
  - Each case has a before and an after picture (shrunk to at most 1600 px before upload), a title, a short description, a filter (Fillers, Botox, Hud, Fotvård) and Spanish texts (required as elsewhere).
  - A case can only be published once staff tick that the patient has given written consent, and both pictures are added.
  - Cases can be reordered with the arrows, hidden ("Publicera på webbplatsen" off) or deleted for good together with their pictures, for example if a patient withdraws consent.
  - Privacy: the website can only fetch the pictures of published cases. Unpublished pictures are only reachable from the logged-in staff page.

**Login** is Cloudflare Access (Zero Trust). Staff type their own email and get a one-time code; there are no passwords.
- **Who may log in:** the email list in the Access application's policy (Cloudflare → Zero Trust → Access → Applications).
- **Second check:** the backend also verifies the Access login itself (`booking-api/src/auth.js`, using the Cloudflare secrets `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`). If those are empty, it refuses everyone.

The page itself is in `booking-api/public/admin/` and its API in `booking-api/src/admin.js`. Every phone booking, cancellation, block and treatment change records which staff email did it.

For local testing, `ADMIN_DEV_EMAIL` in `booking-api/.dev.vars` logs you in as that address. It only works on `localhost`.

Still to come: a spam check plus privacy policy (stage 4).

Deep links work: `/boka?behandling=fillers-lappar` preselects a treatment, and `/boka?behandlare=lorena` preselects a staff member.

**Clean addresses.** All links use addresses without `.html` (`/behandlingar`, `/om-oss`, `/boka`, `/`). GitHub Pages serves `behandlingar.html` for `/behandlingar` automatically, and the old `.html` addresses keep working. Each page has a `<link rel="canonical">` so search engines show the clean address.

## Running locally

Website only:

```bash
npx http-server -p 5173
```

Website + booking backend (needs Node.js). The first time, run this inside `booking-api/`:

```bash
npm install
```

```bash
cp .dev.vars.example .dev.vars
```

```bash
npm run db:migrate:local
```

Then start the backend in `booking-api/` and the website in the project folder, in two terminals:

```bash
npm run dev
```

```bash
npx http-server -p 5173
```

Open `http://localhost:5173/boka.html`. When the site runs on `localhost`, the calendar automatically uses the local backend (`http://localhost:8787`) with its own test database, so nothing touches real bookings.
