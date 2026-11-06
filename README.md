# El-Hafeed Website

Static, French-language website for El-Hafeed, a multidisciplinary home-based support service for older adults and their families in Morocco. The site presents the organization, team, services, articles, frequently asked questions, contact options, and video stories. Page copy and shared site settings are fetched from Sanity when available, with local JSON content used as a fallback.

## Table of contents

- [Project overview](#project-overview)
- [Features](#features)
- [Preview](#preview)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation and setup](#installation-and-setup)
- [Environment variables](#environment-variables)
- [Run locally](#run-locally)
- [Available scripts](#available-scripts)
- [Pages and functionality](#pages-and-functionality)
- [External services](#external-services)
- [Build and deployment](#build-and-deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Project overview

El-Hafeed’s website explains its home-care approach, introduces its multidisciplinary team and services, and provides educational articles and answers to common questions. It is a multi-page static frontend: HTML pages and browser JavaScript run directly in the visitor’s browser, while Sanity supplies published content through its read API.

There is no application server or database in this repository. Local JSON files provide page-content fallbacks if Sanity cannot return a document. The site also includes static images, locally hosted fonts, shared header and footer partials, and Mux-hosted video playback.

## Features

- Four public pages: home, team and services, articles, and questions and answers.
- Sanity-backed page copy, site settings, service listings, article content, and Mux playback IDs.
- Local JSON fallbacks for shared settings and page content.
- Responsive layouts and locally hosted web fonts.
- Search, category filtering, featured and detail views for articles.
- Expandable FAQ topics and answers.
- Inline Mux video playback on the home page.
- Shared navigation and footer populated from HTML partials and Sanity site settings.
- WhatsApp contact links and configurable contact and social links.
- Favicon set and web app manifest.

## Preview

No dedicated screenshots or preview images are included in the repository. Open `index.html` through a local static web server to preview the site.

## Technology stack

- **Frontend:** HTML, CSS, and native browser JavaScript using ES modules; no frontend framework.
- **Styling:** Tailwind CSS 3, custom CSS, and project-specific Tailwind theme configuration.
- **Content platform:** Sanity Content Lake queried from browser code using GROQ over the Sanity HTTP query API.
- **Video:** Mux Player 3.14.1 loaded from jsDelivr at runtime; Mux playback IDs are read from Sanity.
- **Icons:** Lucide icons bundled into `js/lucide.js` with esbuild.
- **Fonts:** Fontsource packages for DM Sans, Fraunces, Plus Jakarta Sans, and Playfair Display. The build script copies selected font files into `resources/fonts/` and writes `css/fonts.css`.
- **Build tooling:** Node.js, npm, Tailwind CLI, esbuild, and a small Node.js font-copy script.

## Architecture

The four root HTML documents define page structure, metadata, stylesheets, and script entry points. They load shared styles and icons, then use page-specific browser modules to fetch and render data.

`js/sanity.js` contains the shared Sanity project configuration, uncached read helper, URL and HTML escaping helpers, and a Portable Text renderer. Page modules issue GROQ queries and map returned content into existing page elements or rendered components. When a query fails or returns no page document, the relevant module can load a corresponding file from `content/`.

`js/site-shell.js` loads `partials/header.html` and `partials/footer.html`, fetches the `siteSettings` document, and applies its brand, navigation, contact, and social data. It falls back to `content/site-settings.json` when Sanity is unavailable.

The homepage and team page both load `js/main.js` for shared interactive behavior such as inline video playback. `js/team-page-content.js` separately loads team-page and service data and initializes the service selector. Page content is rendered client-side after the HTML shell is loaded.

## Project structure

```text
.
├── index.html                 # Home page
├── notre-equipe.html          # Team and services page
├── articles.html              # Articles listing and detail shell
├── questions_reponses.html    # Q&A page shell
├── content/                   # Local JSON fallbacks for Sanity content
├── css/                       # Shared styles, page styles, Tailwind input/output
├── js/                        # Sanity helper and browser page modules
├── partials/                  # Shared header and footer HTML
├── resources/                 # Images, team/service assets, fonts
├── scripts/                   # Build helper scripts
├── package.json               # Dependencies and npm scripts
├── package-lock.json          # Locked npm dependency tree
├── tailwind.config.cjs        # Tailwind content paths and design tokens
└── site.webmanifest           # Installed-site metadata and app icons
```

Important content files:

| File | Purpose |
| --- | --- |
| `content/home-page.json` | Homepage fallback, including hero, approach, and stories |
| `content/team-page.json` | Team-page fallback |
| `content/services.json` | Service cards and selector fallback |
| `content/articles-page.json` | Articles page labels and copy fallback |
| `content/articles.json` | Article records fallback |
| `content/qa.json` | Questions and answers fallback |
| `content/site-settings.json` | Shared brand, navigation, contact, and footer fallback |

## Prerequisites

- Node.js and npm to install dependencies and run the build scripts.
- A modern browser.
- A local static HTTP server to view the site. A server is needed because the site uses ES modules and browser `fetch()` requests; opening the files directly with `file://` will not provide the expected behavior.

No Sanity credentials or environment variables are required by the current frontend code. Published Sanity documents must follow the IDs, types, and fields queried by the page modules for CMS content to appear.

## Installation and setup

From the repository root, install the locked dependencies:

```sh
npm ci
```

Generate the local font files, minified Tailwind stylesheet, and Lucide bundle:

```sh
npm run build
```

The build writes generated assets into `resources/fonts/`, `css/`, and `js/` in place. It does not create a `dist/` directory.

## Environment variables

The inspected frontend and build scripts do not read environment variables. Sanity’s project ID, dataset, and API version are configured in `js/sanity.js`; the public website uses unauthenticated read requests. Do not put private tokens in browser code.

Sanity Studio configuration and schema definitions are not included in this repository, so document schemas and Studio setup must be maintained in the separate Sanity project.

## Run locally

There is no `dev`, `start`, or local-server npm script in `package.json`. Start a static HTTP server from the repository root using your preferred tool. For example, if Python is installed:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000/` for the homepage. Other pages are available at `/notre-equipe.html`, `/articles.html`, and `/questions_reponses.html`.

The site can render fallback JSON when Sanity is unavailable, but all referenced local assets and generated build outputs must exist. Run `npm run build` after a fresh dependency installation to generate the font subset and build outputs.

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Runs font copying, Tailwind CSS generation, and Lucide bundling in sequence. |
| `npm run copy:fonts` | Copies selected Fontsource WOFF2 files into `resources/fonts/` and generates `css/fonts.css`. |
| `npm run build:css` | Builds and minifies `css/tailwind.css` from `css/tailwind.input.css` using `tailwind.config.cjs`. |
| `npm run build:icons` | Bundles `js/lucide-entry.js` into `js/lucide.js` with esbuild. |
| `npm test` | Placeholder only; it exits with an error because no automated test suite is configured. |

## Pages and functionality

### Home — `index.html`

The homepage presents the service, legitimacy stories, and the staged home-support approach. `js/main.js` queries the Sanity `homePage` document, updates the page, and falls back to `content/home-page.json`. Story carousels and inline Mux video playback are also handled by this module.

### Team and services — `notre-equipe.html`

The page introduces the director and team members, with additional mission details. `js/team-page-content.js` queries the `teamPage` document and service documents of type `service`, then initializes the service selector through `js/services.js`. Fallback data is read from `content/team-page.json` and `content/services.json`. `js/notre-equipe.js` supplies team mission dialog behavior.

### Articles — `articles.html`

`js/articles.js` loads article documents of type `article`, article categories of type `articleCategory`, and the `articlePage` singleton. It supports search, category filters, article listing and detail views, and rich text rendering. Local fallbacks are `content/articles.json` and `content/articles-page.json`; categories can be derived from the loaded articles if no Sanity categories are returned.

### Questions and answers — `questions_reponses.html`

`js/questions-reponses.js` queries the `qaPage` document and falls back to `content/qa.json`. It renders question topics, expandable answers, contact content, and updates the page metadata when Sanity provides it.

### Shared shell

All four pages include `js/site-shell.js`, which inserts the header and footer partials and applies Sanity `siteSettings` data. The partial HTML provides the baseline shell; local site settings are used if the Sanity request fails.

## External services

- **Sanity:** Browser modules query the configured project’s `production` dataset through `api.sanity.io`. The queries expect singleton documents such as `homePage`, `teamPage`, `articlePage`, `qaPage`, and `siteSettings`, plus collections such as `service`, `article`, and `articleCategory`. The corresponding Studio schemas and structure are external to this repository.
- **Mux:** The homepage loads the Mux Player web component from jsDelivr when needed. Video playback uses Mux playback IDs supplied by Sanity. The repository does not include video files or a server-side Mux integration.
- **WhatsApp and map links:** Contact actions link to WhatsApp and Google Maps URLs; these links do not imply server-side integrations.
- **Local fonts and icons:** Font files are copied into the site during the build. Lucide is bundled locally; Mux Player is the runtime CDN-loaded dependency.

## Build and deployment

Run `npm ci` followed by `npm run build` before publishing if generated fonts, CSS, or icon bundles need to be refreshed. The site is structured as static files with relative paths, so a static host can serve the repository root (or an equivalent directory containing the HTML pages and their referenced assets).

No deployment provider, hosting configuration, CI workflow, or output-directory configuration was found in the repository. Configure the chosen static host to publish the root directory; do not assume a `dist/` output exists.

## Troubleshooting

- **A page is blank or has missing content when opened directly:** Serve the repository over HTTP instead of opening an HTML file with `file://`; browser module imports and `fetch()` require an HTTP origin.
- **Local fonts are missing:** Run `npm ci` and `npm run build` so the font-copy script creates `resources/fonts/` and `css/fonts.css`.
- **Tailwind classes appear unstyled:** Run `npm run build:css` and confirm the HTML, partial, and JavaScript files remain included in the content globs in `tailwind.config.cjs`.
- **Icons are missing after changing the icon entry:** Run `npm run build:icons` to regenerate `js/lucide.js` from `js/lucide-entry.js`.
- **Sanity edits do not appear:** Confirm the document is published in the configured dataset, uses the ID/type queried by the relevant module, and supplies the expected fields. If the query returns no document or fails, the page may display its local JSON fallback instead.
- **A video does not play:** Confirm the Sanity video asset has a Mux playback ID and that the browser can reach the Mux Player CDN and Mux playback endpoints.
- **Automated tests:** `npm test` is currently an unimplemented placeholder and exits unsuccessfully; no test suite is configured in this repository.

## Contributing

1. Make changes in the page, shared module, stylesheet, or content fallback that owns the behavior.
2. Keep Sanity queries and local fallback data aligned so pages remain usable when the CMS is unavailable.
3. For visual changes, check the affected page at desktop and mobile viewport sizes.
4. Run `npm run build` and review the generated changes before submitting a contribution.

There is no repository-specific contribution guide or automated test workflow at present.

## License

`package.json` declares the `ISC` license. A separate `LICENSE` file was not found in the repository.
