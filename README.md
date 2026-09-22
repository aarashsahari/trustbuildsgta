# TrustBuildGTA website

Static site: a homepage, six service landing pages and four city pages. Every page is one
self-contained HTML file (inline CSS and JS, no frameworks). The only build step is a
Python script that keeps the shared parts in sync.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Homepage. Hand-edited, except the regions between `@build` markers. |
| `*-renovation.html`, `flooring.html`, `concrete-patios.html`, `backyard-landscaping.html` | Service landing pages (generated) |
| `mississauga.html`, `oakville.html`, `burlington.html`, `hamilton.html` | City pages (generated) |
| `src/site.css` | Styles shared by every page |
| `src/site.js` | Shared script: menus, header loader, lead forms, tracking |
| `tools/content.py` | All copy for the service and city pages |
| `tools/build.py` | Generates the pages, patches the homepage, writes `sitemap.xml` and `robots.txt`, lints copy |

## Editing

1. Change copy in `tools/content.py`, styles in `src/site.css` or behaviour in `src/site.js`.
2. Run `python3 tools/build.py`. It fails if a page has a banned word, an em or en dash,
   a meta description outside 150 to 160 characters, or more or less than one H1.
3. Don't edit the generated `.html` pages directly. The next build overwrites them.

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

Pages link to clean URLs like `/basement-renovation`. Netlify, Cloudflare Pages and
GitHub Pages serve `basement-renovation.html` at that address with no redirect. On
Vercel, add `{ "cleanUrls": true }` to `vercel.json`. Opening the files directly from disk
works for the homepage, but links between pages need a local server
(for example `npx serve .`).
