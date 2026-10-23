# Sikhi Path

A responsive, static React app for reading Gurbani and beginning to learn about Sikhi. It deploys to GitHub Pages and fetches public Gurbani content directly from BaniDB in the visitor's browser. No app server, database, or API key is required.

## Included

- Gurbani search by English translation, Gurmukhi word, Roman transliteration, or English first letters, with pagination.
- Bani library, shabad reader, and the latest available Hukamnama. The reading displays BaniDB's actual date rather than assuming it is today's.
- Translation and transliteration controls, Gurmukhi text sizing, and dark mode.
- Browser-local bookmarks and lesson progress. Bookmarks store reading identifiers and titles, not scripture. No account or cross-device sync is included.
- Six introductory Sikhi learning guides with reflection prompts and further resources.

## GitHub Pages deployment

The workflow in `.github/workflows/pages.yml` builds and tests the site, uploads only `dist`, and publishes it on pushes to `main` or a manual workflow run.

1. Push the project files to `main` in `rf-cayea/sikhism`.
2. In the GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages**. If the first run happened before Pages was enabled, run the workflow again using **Run workflow**.
4. Wait for both the `build` and `deploy` jobs to succeed. The deployment job shows the published URL.

The default URL after successful publication is `https://rf-cayea.github.io/sikhism/`. The `github-pages` environment may require approval if repository protection rules specify it. GitHub must permit Pages for the repository's visibility and plan.

The app uses hash routes and relative asset URLs, so pages such as `/sikhism/#/learn/beginning` can be refreshed without server-side route rewrites. The same build can also be served at a domain root. No token needs to be added to the app or repository; the workflow uses GitHub's built-in deployment token with scoped permissions.

## Development and local preview

Use Node.js 24 and npm. From `/workspace/sikhism`:

```sh
npm_config_cache=/workspace/.npm-cache npm ci --no-fund --no-audit
npm run dev
```

The development server uses port 3000. To override it, use `npm run dev -- --port 3002`.

Build and preview the static site:

```sh
npm run build
npm start
```

`npm start` is a local Vite preview, not a production app-server requirement. Deploy the generated `dist` directory to static hosting. Browser requests go directly to `https://api.banidb.com/v2/`, including on GitHub Pages. Their availability depends on BaniDB and its CORS policy. Browser-local settings will belong to the published origin, so bookmarks created on a local preview do not automatically move to GitHub Pages.

## Validation

```sh
npm test
npm run build
npm run test:e2e
```

Seven Node tests verify the API client, cancellation, timeouts, response errors, caching, name filtering, and BaniDB data shapes. Thirteen browser tests exercise learning, search, bookmarks, settings, mobile layouts, and the GitHub project path.

Browser tests serve the built files using a test-only static server at `/sikhism/`, with no API routes or fallback rewrites. They intercept external BaniDB requests with clearly synthetic, non-scriptural fixtures. These deterministic tests do not establish live provider availability or content accuracy; check actual browser requests separately.

The cloud browser suite uses `/usr/bin/chromium`. Elsewhere, install Playwright's browser with `npx playwright install chromium` or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. CI installs Playwright's Chromium and its system dependencies.

Cloud installation needs access to `registry.npmjs.org`; live browser checks need `api.banidb.com`. GitHub deployment management needs `api.github.com`, and checking the published site needs `rf-cayea.github.io`. Preserve inherited proxy settings and CA trust for cloud tools. Keep TLS verification enabled.

## Content and attribution

Gurbani comes from [BaniDB](https://www.banidb.com/), following the response shapes in [KhalisFoundation/banidb-api](https://github.com/KhalisFoundation/banidb-api). A bounded two-minute browser memory cache reduces repeated requests. No Gurbani text is bundled, invented, or stored in localStorage. English translations retain their provider identifier or known translator name.

The upstream API code is MIT-licensed; BaniDB data has separate [terms of service](https://www.banidb.com/tos) and a [data license referenced by the API](https://www.banidb.com/nposl). Review current terms before public launch, large-scale caching, or redistribution. No upstream API source has been copied into this app.

Learning guides are original introductory summaries, not scripture, translations, or religious rulings. They link to the Sikh Coalition, Sikh Research Institute, and BaniDB. Knowledgeable Sikh editorial review is recommended before publishing the educational material.

Audio, offline scripture access, accounts, and cross-device sync are not included.
