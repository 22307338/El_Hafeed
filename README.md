# El-Hafeed Website

Maintenance guide for the French-language El-Hafeed website. This repository is a static HTML, CSS, and JavaScript site for a geriatric home-care service in Morocco. Its production domain is <https://el-hafeed.com>.

## Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Project structure](#3-project-structure)
4. [Content model](#4-content-model)
5. [How rendering works](#5-how-rendering-works)
6. [Generated files and builds](#6-generated-files-and-builds)
7. [Run locally](#7-run-locally)
8. [Edit content](#8-edit-content)
9. [Deployment and SEO](#9-deployment-and-seo)
10. [Sanity configuration checklist](#10-sanity-configuration-checklist)
11. [Accounts and ownership](#11-accounts-and-ownership)
12. [Troubleshooting](#12-troubleshooting)
13. [Conventions and gotchas](#13-conventions-and-gotchas)

## 1. Overview

The site is a French-language static frontend. It has four public HTML pages:

| Page                 | File                      | Main purpose                                                             |
| -------------------- | ------------------------- | ------------------------------------------------------------------------ |
| Accueil              | `index.html`              | Organization introduction, values, legitimacy stories, and care approach |
| Notre équipe         | `notre-equipe.html`       | Team professions, photo carousel, and home-care process                  |
| Articles             | `articles.html`           | Searchable article index and query-string article details                |
| Questions & réponses | `questions_reponses.html` | Topics, questions, and answers                                           |

The shared header and footer are HTML fragments under `partials/`. Browser JavaScript fetches published content from Sanity. Local JSON files provide fallback content if Sanity cannot be reached.

## 2. Architecture

```text
                  ┌──────────────────────────────┐
                  │ Separate Sanity Studio      │
                  │ ../studio-el-hafeed         │
                  │ https://elhafeed.sanity.studio│
                  │ schema source is outside    │
                  │ this Website repository     │
                  └──────────────┬───────────────┘
                                 │ publish
                                 ▼
┌─────────┐    static files    ┌──────────────────┐   public read API   ┌──────────────────────────┐
│ Browser │ ◀────────────────▶│ Static host      │───────────────────▶│ Sanity Content Lake      │
└────┬────┘                    │ Cloudflare Pages │                    │ project pxacju14         │
     │                         └──────────────────┘                    │ dataset production       │
     │                                                                   │ no browser token         │
     ├──────── fallback when Sanity is unavailable ───────────────────▶└──────────────────────────┘
     │                            content/*.json
     └────────────────────────────────────────────────────────────────▶ Mux video playback
                                                                         (Mux Player from jsDelivr)
```

Sanity Studio is a separate project in the sibling folder `studio-el-hafeed`; it is not part of this repository and must not be moved into the website. Its hosted Studio is <https://elhafeed.sanity.studio>. The Studio schemas are maintained in that sibling project's `schemaTypes/` directory.

The frontend uses the public Sanity query API. It does not contain or require a Sanity write token. Mux playback IDs are stored in Sanity; the Mux Player browser component is loaded on demand from jsDelivr.

## 3. Project structure

`dist/` and `node_modules/` are generated/local folders and are ignored by Git. Do not edit `dist/` by hand; `npm run build` recreates it.

```text
.
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml       # GitHub Pages workflow: npm build, deploy dist/
│       ├── jekyll-gh-pages.yml    # Additional GitHub Pages workflow; review before launch
│       └── static.yml             # Additional GitHub Pages workflow; review before launch
├── .gitignore                    # Local dependencies, build output, and secret-file patterns
├── README.md                     # This maintenance guide
├── index.html                    # Accueil page structure and script/style entry points
├── notre-equipe.html             # Team page structure and script/style entry points
├── articles.html                 # Articles index/detail shell
├── questions_reponses.html       # Q&A page shell
├── robots.txt                    # Allows crawling and points to the sitemap
├── sitemap.xml                   # Four public page URLs; article query URLs are excluded
├── site.webmanifest              # Browser-install metadata and app icon paths
├── favicon.ico                   # Browser favicon
├── favicon-16x16.png             # Small PNG favicon
├── favicon-32x32.png             # Standard PNG favicon
├── apple-touch-icon.png          # Apple home-screen icon
├── android-chrome-192x192.png    # Android app icon
├── android-chrome-512x512.png    # Large Android app icon
├── package.json                  # Build dependencies and commands
├── package-lock.json             # Locked npm dependency versions
├── tailwind.config.cjs           # Tailwind content globs, theme tokens, and font settings
├── content/
│   ├── articles-page.json        # Offline copy and labels for the article page
│   ├── articles.json             # Offline article records
│   ├── home-page.json            # Offline homepage content and local image paths
│   ├── qa.json                   # Offline FAQ topics and answers
│   ├── services.json            # Legacy service data; no current page module reads it
│   ├── site-settings.json        # Offline shared header, footer, and contact settings
│   └── team-page.json            # Offline team page content and carousel paths
├── css/
│   ├── articles.css              # Article listing and detail styles
│   ├── fonts.css                 # Generated local @font-face declarations
│   ├── notre-equipe.css          # Team page styles
│   ├── questions-reponses.css    # Q&A page styles
│   ├── style.css                 # Shared custom styles and homepage styles
│   ├── tailwind.css              # Generated Tailwind output loaded by pages
│   ├── tailwind.input.css        # Tailwind input directives
│   └── team-carousel.css         # Team carousel styles
├── js/
│   ├── articles.js               # Article/category/page queries and rendering
│   ├── lucide-entry.js           # Icon allowlist and Lucide bundle entry point
│   ├── lucide.js                 # Generated browser icon bundle loaded by pages
│   ├── main.js                   # Homepage content query and shared homepage/video behavior
│   ├── notre-equipe.js           # Team mission dialog behavior
│   ├── questions-reponses.js     # FAQ query, rendering, and interaction
│   ├── sanity.js                 # Sanity client helper, image URL helper, metadata, Portable Text
│   ├── services.js               # Legacy service-section renderer; staged but not loaded by current HTML
│   ├── site-shell.js             # Shared header/footer partial and siteSettings loader
│   ├── team-carousel.js          # Team photo carousel interaction
│   └── team-page-content.js      # Team-page query and content rendering
├── partials/
│   ├── header.html               # Shared navigation fragment
│   └── footer.html               # Shared footer/contact fragment
├── resources/
│   ├── brand-logo.webp           # Retained logo asset; no current source reference found (verify before deleting)
│   ├── hero-desktop.webp         # Homepage desktop background
│   ├── hero-mobile.webp          # Homepage mobile background
│   ├── home-safety-article.webp  # Article image
│   ├── logo-cropped.webp         # Fallback brand image
│   ├── logo-symbol.webp          # Brand symbol asset
│   ├── fonts/                    # Generated local font files, retained for deployed CSS
│   │   ├── dm-sans-latin-ext-wght-normal.woff2
│   │   ├── dm-sans-latin-wght-normal.woff2
│   │   ├── fraunces-latin-ext-wght-normal.woff2
│   │   ├── fraunces-latin-wght-normal.woff2
│   │   ├── playfair-display-latin-600-normal.woff2
│   │   ├── playfair-display-latin-700-normal.woff2
│   │   ├── plus-jakarta-sans-latin-ext-wght-normal.woff2
│   │   └── plus-jakarta-sans-latin-wght-normal.woff2
│   ├── healthcare-services-assets/ # Service-related images used by fallback data
│   │   ├── infirmerie.webp
│   │   ├── kinesitherapie.webp
│   │   ├── nutrition.webp
│   │   ├── orthophonie.webp
│   │   └── psychologie.webp
│   ├── team-carousel/            # Local fallback team carousel images
│   │   ├── Art-decoration.webp
│   │   ├── el-hafeed.webp
│   │   ├── team.webp
│   │   ├── tower-reception.webp
│   │   └── tower.webp
│   └── team-members/
│       └── directrice.webp       # Founder portrait fallback
├── scripts/
│   ├── copy-fonts.cjs            # Copies selected font files and generates css/fonts.css
│   └── prepare-pages.cjs         # Stages allowlisted pages/assets into dist/
└── dist/                         # Generated GitHub Pages artifact; ignored by Git
```

The five staff JPGs in `resources/team-members/` are retained as possible carousel image fallbacks if an editor configures those files in Sanity. No local JSON or source reference currently uses their filenames, so verify the Studio carousel asset URLs before removing them. `resources/brand-logo.webp` also remains because it is a brand asset and may be useful; verify its purpose before considering removal.

## 4. Content model

All page-specific reads below are public, unauthenticated Sanity GROQ requests made by the browser. Shared `siteSettings` is also requested on every page by `js/site-shell.js` and falls back to `content/site-settings.json`.

| Page/content                | Sanity document or collection                                                                   | Querying module            | Local fallback                       |
| --------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------ |
| Homepage                    | Singleton `_id == "homePage"` (`homePage`)                                                      | `js/main.js`               | `content/home-page.json`             |
| Shared header/footer        | Singleton `_id == "siteSettings"` (`siteSettings`)                                              | `js/site-shell.js`         | `content/site-settings.json`         |
| Team page                   | Singleton `_id == "teamPage"` (`teamPage`)                                                      | `js/team-page-content.js`  | `content/team-page.json`             |
| Article page labels and SEO | Singleton `_id == "articlePage"` (`articlePage`)                                                | `js/articles.js`           | `content/articles-page.json`         |
| Article records             | `article` documents                                                                             | `js/articles.js`           | `content/articles.json`              |
| Article filters             | `articleCategory` documents; if unavailable, categories are derived from loaded article records | `js/articles.js`           | Derived from `content/articles.json` |
| Questions & answers         | Singleton `_id == "qaPage"` (`qaPage`)                                                          | `js/questions-reponses.js` | `content/qa.json`                    |

Current website queries do **not** read a `service` collection. `content/services.json` and `js/services.js` are retained legacy files; `services.js` is included in the `dist/` copy list but is not loaded by the current HTML pages. Do not assume these legacy files control the current team page.

The team page also loads `js/main.js` for shared behavior; that module issues its homepage query, but homepage selectors are not present on the team page. The team content itself comes from `teamPage`.

## 5. How rendering works

1. Each HTML page references its page modules with relative ES-module paths. Use an HTTP server; `file://` does not support the module/fetch behavior used here.
2. `js/site-shell.js` fetches `partials/header.html` and `partials/footer.html` using URLs relative to the module file. It queries `siteSettings`, renders navigation/social/footer content, and falls back to `content/site-settings.json` if Sanity is unavailable.
3. The page module requests its Sanity document/collection and then uses the matching local JSON fallback. The team module loads local team JSON as well so missing Sanity fields can be filled from it. The articles page uses local categories derived from fallback articles when the category query fails.
4. `js/articles.js` renders Sanity Portable Text blocks for article details, including headings, lists, links, images, and callouts. `js/questions-reponses.js` uses the shared Portable Text renderer in `js/sanity.js` for FAQ answers.
5. Sanity image asset URLs are transformed by `sanityImageUrl()` in `js/sanity.js` or the homepage image helper. Local fallbacks use relative paths under `resources/`.
6. Mux playback IDs are queried from Sanity and passed to the Mux Player custom element. `js/main.js` loads the Mux Player library from jsDelivr; article media videos use native HTML `<video>` elements.

Sanity-provided page titles, descriptions, and social images are applied by JavaScript after page load. Crawlers that do not execute JavaScript may not see article-specific Open Graph metadata; server rendering or pre-rendering would be needed to guarantee that.

## 6. Generated files and builds

The generated files are required by the static pages and should remain in the repository:

- `css/fonts.css` plus `resources/fonts/*.woff2` are generated by `scripts/copy-fonts.cjs` from the installed Fontsource packages.
- `css/tailwind.css` is generated from `css/tailwind.input.css` and scanned project files.
- `js/lucide.js` is the bundled Lucide icon output from `js/lucide-entry.js`.
- `dist/` is recreated as a deployment artifact by `scripts/prepare-pages.cjs`; it is ignored by Git.

Run `npm run build` after adding Tailwind classes, adding/removing an icon from the `js/lucide-entry.js` allowlist, or changing font packages/selection. The build copies fonts, rebuilds Tailwind CSS and Lucide, then stages the site into `dist/`. Generated root files are committed because direct static hosts serve them without running a build.

Tailwind's `content` globs in `tailwind.config.cjs` include root HTML files, `partials/**/*.html`, and `js/**/*.js`. Keep these globs current if new template or script locations are introduced; otherwise production CSS can omit classes used only in those files.

The `scripts/prepare-pages.cjs` allowlists the four HTML pages, SEO files, icons, CSS, JS, and the `content/`, `partials/`, and `resources/` directories. Update that allowlist if a new runtime file is added.

## 7. Run locally

Requirements: Node.js and npm. From the Website folder:

```sh
npm ci
npm run build
```

Use an HTTP static server, for example the VS Code Live Server extension. The configured Sanity development origins are `http://127.0.0.1:5501` and `http://localhost:5501`; use one of those origins/ports or add the chosen origin in Sanity CORS settings. Open `index.html` at the server URL. Do not open the page as `file://`.

The root files can be served directly without building because generated CSS, icons, and fonts are committed. `npm run build` is still required to refresh generated output and to prepare the `dist/` artifact used by the GitHub Pages workflow.

## 8. Edit content

Edit published website content in the separate Sanity Studio, not in page markup. `content/*.json` files are offline fallbacks and are not the live source while Sanity is responding. Keep these JSON files reasonably synchronized with important Sanity changes so the site has a usable offline fallback.

Schema definitions live in the sibling `studio-el-hafeed/schemaTypes/` directory. After changing a schema, build/deploy the Studio from that sibling project, then update/publish the corresponding Sanity documents. Do not add a Sanity write token to this static website; writes belong in Studio or a protected migration environment.

## 9. Deployment and SEO

### Cloudflare Pages target

For the requested direct-root Cloudflare Pages deployment, connect the repository, leave the build command empty, and set the output directory to the repository root (`.`). This serves the committed HTML and generated runtime assets as-is. Attach `el-hafeed.com` in Cloudflare Pages, configure the registrar/DNS records Cloudflare provides, and confirm HTTPS is active before launch.

### Existing GitHub Actions workflows

This repository currently contains **three** workflows that trigger on pushes to `main` and deploy GitHub Pages in different ways:

- `.github/workflows/deploy-pages.yml` runs `npm ci`, `npm run build`, and deploys `dist/`.
- `.github/workflows/static.yml` uploads the repository root.
- `.github/workflows/jekyll-gh-pages.yml` runs Jekyll and uploads `_site/`.

They are all recognized by GitHub Actions. Confirm which deployment platform is authoritative and disable/remove the other workflows only after approval; otherwise GitHub Pages deployments may compete. The Cloudflare direct-root settings above are distinct from these workflows.

### SEO files

- `robots.txt` allows crawling and points to `https://el-hafeed.com/sitemap.xml`.
- `sitemap.xml` contains only the four public HTML pages. It intentionally excludes article details such as `articles.html?article=slug`; those details are rendered from Sanity and are not separate HTML files.
- Each public HTML page has one canonical link immediately after its title. Update the corresponding canonical URL and sitemap entry if a public route/domain changes.
- `scripts/prepare-pages.cjs` copies `robots.txt` and `sitemap.xml` to `dist/` for the GitHub Pages artifact.

After production deployment, verify the domain, HTTPS, `https://el-hafeed.com/robots.txt`, and `https://el-hafeed.com/sitemap.xml`, then submit the sitemap in Google Search Console.

## 10. Sanity configuration checklist

- Project ID: `pxacju14`; dataset: `production`.
- The browser uses unauthenticated read requests. The dataset must be public for this setup; never embed an editor/write token in JavaScript.
- In Sanity Manage, allow the browser origins `https://el-hafeed.com`, `http://127.0.0.1:5501`, and `http://localhost:5501` in CORS settings. Add `https://www.el-hafeed.com` too if the `www` host serves the site rather than redirecting.
- `js/sanity.js` currently uses `api.sanity.io` with `cache: "no-store"`, so newly published content should be queried without the API CDN cache. For production caching, the host may be changed to `apicdn.sanity.io`; expect recently published edits to take a few minutes to appear. Verify current Sanity cache guidance before changing this.
- Sanity Free projects have hard usage caps; reaching a cap can block affected functionality until reset or upgrade. Monitor the project's Usage page and check Sanity's current [pricing](https://www.sanity.io/pricing) and [quota documentation](https://www.sanity.io/docs/help/understanding-quotas) before launch because limits can change.
- Hosted Studio: <https://elhafeed.sanity.studio>. The local Studio source is in the sibling `studio-el-hafeed` folder.

## 11. Accounts and ownership

The client should fill in the owner/contact field for each service. Do not put passwords, tokens, or personal email addresses in this README.

| Service                              | Account / organization | Owner (client to fill in) |
| ------------------------------------ | ---------------------- | ------------------------- |
| Domain registrar for `el-hafeed.com` |                        |                           |
| Cloudflare / Pages                   |                        |                           |
| GitHub repository                    |                        |                           |
| Sanity project `pxacju14`            |                        |                           |
| Mux                                  |                        |                           |

## 12. Troubleshooting

| Symptom                                   | Check                                                                                                                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content does not update                   | Confirm the Sanity document was published, the page queries the expected document/slug, and the browser can reach `api.sanity.io`. This project currently uses the uncached API host. |
| CORS error                                | Add the exact origin (scheme, hostname, and port) in Sanity Manage. `localhost` and `127.0.0.1` are separate origins.                                                                 |
| Blank page or failed module imports       | Serve over HTTP instead of `file://`; check the browser console for failed relative paths.                                                                                            |
| Styles, fonts, or icons missing           | Check `css/tailwind.css`, `css/fonts.css`, `js/lucide.js`, and the matching `resources/fonts/` files. Rebuild if their source/config changed.                                         |
| Video does not play                       | Check the Mux asset has a playback ID, Mux Player loads from jsDelivr, and the visitor's browser/network permits media playback.                                                      |
| Fallback copy appears                     | Sanity may be unreachable, the document may be missing/unpublished, or CORS may be blocking the request. Check the console and fallback JSON.                                         |
| Build reports `EPERM` on Windows/OneDrive | OneDrive or an editor may hold a generated file open. Close the lock-holding process and retry; do not delete generated assets as a workaround.                                       |

## 13. Conventions and gotchas

- Header/footer are shared HTML fragments in `partials/`, loaded by `js/site-shell.js`; they are not standalone pages.
- Local asset and module paths are relative so the static files can run at a host root. Keep paths relative if using a repository subpath.
- Article detail views use `articles.html?article=<slug>`; they are rendered by JavaScript from the Sanity `article` collection and are not separate HTML files.
- The current Sanity helper is read-only. Content writes and schema changes belong in the separate Studio or a secure migration script.
- `content/services.json` and `js/services.js` are retained legacy files, not active service CMS integration. `services.js` is copied into `dist/` but not referenced by the current page HTML.
- The root `resources/brand-logo.webp` is not referenced by current source paths. It is retained pending confirmation that it is not an archive/source asset.
- The three GitHub Pages workflows are all active by convention; review them before production if Cloudflare Pages is the intended host.
