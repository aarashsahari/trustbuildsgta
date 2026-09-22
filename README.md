# TrustBuildGTA website

Static site: a homepage, six service landing pages and four city pages. Every page is one
self-contained HTML file (inline CSS and JS, no frameworks). The only build step is a
Python script that keeps the shared parts in sync.

## Pages

| Page | File |
| --- | --- |
| Homepage (short: hero, services list, featured project, promises, reviews, quote form) | `index.html` |
| Header pages | `services.html`, `projects.html`, `process.html`, `areas.html`, `faq.html`, `contact.html` |
| Service landing pages | `basement-renovation.html`, `kitchen-renovation.html`, `bathroom-renovation.html`, `flooring.html`, `concrete-patios.html`, `backyard-landscaping.html` |
| City pages | `mississauga.html`, `oakville.html`, `burlington.html`, `hamilton.html` |

Every page is generated. Links between pages are relative (`services.html`), so the site
works on any host, in a subfolder, or opened straight from disk.

## Editing

| Change | Edit |
| --- | --- |
| Service and city copy | `tools/content.py` |
| General FAQ answers | `tools/home_faq.json` |
| Hand-written sections (services grid, gallery, process, why, reviews, areas, hero) | `src/partials/*.html` |
| Colours, type, layout | `src/site.css` (palette tokens at the top) |
| Menus, loader, forms, gallery, tracking | `src/site.js` |
| Page structure, header, footer, quote form | `tools/build.py` |

Then run `python3 tools/build.py`. It fails if a page has a banned word, an em or en dash,
a meta description outside 150 to 160 characters, anything other than one H1, a duplicate
id, a broken internal link, or an in-page link to a missing anchor. Don't edit the generated
`.html` files directly. The next build overwrites them.

## Before launch

- **Form endpoint.** Set `FORM_ENDPOINT` at the top of `src/site.js`, then rebuild. Until
  it is set, every form shows an error with the phone number, and the browser console
  says the lead was not sent. Any service that accepts a JSON POST works (Formspree,
  Basin, a CRM or Zapier/Make webhook).
- **Placeholders.** Search for `[X]`, `[X weeks]`, `[price range]`, `[EMAIL]`,
  `[OWNER NAME]`, `[GOOGLE_REVIEWS_URL]`, `[REVIEW TEXT]`, `[NAME]` and `[CITY]`.
- **Photos.** Unsplash images are placeholders. Each one has a `REAL PHOTO` comment, or a
  note in `content.py`, describing the photo to swap in.
- **Analytics.** Forms push `form_start`, `form_step`, `generate_lead` and `form_error` to
  `dataLayer`, and phone links push `click_to_call`. Add Google Tag Manager and use
  `generate_lead` as the conversion. Each lead also carries UTM tags, `gclid`, the landing
  page and the referrer.

## Hosting

Upload the `.html` files, `sitemap.xml` and `robots.txt` (the `src` and `tools` folders are
only needed for editing). Canonical URLs use the clean form (`/services`), which Netlify,
Cloudflare Pages and GitHub Pages serve from `services.html`. On Vercel, add
`{ "cleanUrls": true }` to `vercel.json`.
