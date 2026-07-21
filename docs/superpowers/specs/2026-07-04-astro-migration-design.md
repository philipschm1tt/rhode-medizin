# Astro Migration Design

Migrate the Heinrich Rhode GmbH marketing site from Gatsby v2 + Contentful + Netlify to Astro + Contentful-at-build-time + Cloudflare Pages. The site must remain visually identical to `www.rhode-medizin.de`, become cookie-free (no cookie banner), and the imprint (`/imprint/`) and data policy (`/data-policy/`) pages must remain content-identical.

The migration is a native Astro migration from the start. There is no React-island bridge: the current React/styled-components components are used as reference material, then ported directly to `.astro` components with scoped CSS and shared CSS custom properties.

## Current state

- **Stack:** Gatsby v2, React 16, styled-components 4, Contentful CMS, Netlify deploy, `subfont` for font inlining (currently disabled).
- **Content model (Contentful):** eight rendered content types — `Seite` (page), `HeroBlock`, `Zitat` (quote), `Abschnitt` (section wrapper), `Textinhalt` (Markdown text node), `KartenLayout` (card layout), `Mitarbeiter` (employee), `Produktgruppe` (product group). Plus `FontContainer` (NeuzeitOffice web font asset — dead in the new site).
- **Routing:** `gatsby-node.js` creates one page per `Seite.slug` using `src/templates/contentful-page.jsx`, which dispatches on `module.__typename` to render the matching component.
- **Known issues with the live site:** does not build locally; SSL certificate causes browser warnings (the site still works over HTTPS).
- **Environment variables (in `.env`, gitignored):** `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ACCESS_TOKEN`, `CONTENTFUL_DELIVERY_TOKEN`. `CONTENTFUL_ACCESS_TOKEN` exists for the current Gatsby build; `CONTENTFUL_DELIVERY_TOKEN` exists for the Astro loader and currently has the same token value. `CONTENTFUL_PREVIEW_TOKEN` is optional for preview builds only.

## Final stack

- **Framework:** Astro, static output (no SSR adapter).
- **Hosting:** Cloudflare Pages, static deploy.
- **Content:** Astro Content Collections populated by a custom content loader that fetches from Contentful at build time via the `contentful.js` SDK. A future, separate project may move content to local Markdown/JSON files — out of scope here.
- **Styling:** Native `.astro` components with scoped CSS; CSS custom properties for the design tokens. No styled-components, no React runtime shipped to the browser.
- **Fonts:** NeuzeitOffice (bold/medium/light) self-hosted as woff2 in `src/fonts/`, `@font-face` in `src/styles/global.css` with `font-display: swap`. License permitting self-hosting must be verified before committing the files. If self-hosting is not permitted, stop and choose an approved font substitution explicitly; do not silently accept visual drift.
- **Images:** Astro's built-in image service (`astro:assets` `<Image />` and `<Picture />`) optimizes Contentful images at build time. The Contentful asset hosts are authorized in `astro.config.mjs`; the loader's normalized image data is passed directly to the Astro image components.
- **Package manager:** pnpm.
- **Cookies:** none. No cookie banner, no `Set-Cookie` headers, no client-side storage, no service worker.

## Milestones

The migration proceeds in five milestones, each with a verification gate. M1-M4 happen locally against captured reference fixtures and the live site. M5 is deploy + DNS cutover.

---

## Milestone 1 — Astro foundation and Contentful loader

**Goal:** Astro can fetch, normalize, and inspect Contentful content. No public UI yet.

### Project setup

Initialize a fresh Astro project in the repo root while preserving existing Gatsby files until the deploy cutover. Use pnpm. Add Astro, TypeScript, `@astrojs/check`, `contentful`, and a Markdown rendering pipeline such as `unified`, `remark-parse`, `remark-rehype`, and `rehype-stringify`.

Do **not** add `@astrojs/react`, `react`, `react-dom`, or styled-components integration for the Astro migration. The migration ports components directly to native Astro.

New files introduced in this milestone:

- `astro.config.mjs` — static Astro configuration.
- `tsconfig.json` — Astro/TypeScript configuration.
- `src/content/config.ts` — content collection definitions.
- `src/content/loaders/contentful.ts` — Contentful fetch, normalization, reference resolution, and Markdown rendering.
- `src/pages/debug.astro` — temporary content inspection route, deleted after the real routes are verified.

### Loader design

The custom content loader at `src/content/loaders/contentful.ts` implements Astro's Content Loader API. It fetches via the `contentful.js` SDK using `CONTENTFUL_SPACE_ID` and this token selection:

- In normal local builds and Cloudflare builds, use `CONTENTFUL_DELIVERY_TOKEN` against `cdn.contentful.com`.
- If a preview mode is intentionally enabled and `CONTENTFUL_PREVIEW_TOKEN` exists, use `CONTENTFUL_PREVIEW_TOKEN` against `preview.contentful.com`.
- Do not depend on `CONTENTFUL_ACCESS_TOKEN` in new Astro code; it remains only so the old Gatsby setup can keep working during the migration.

### Collections (`src/content/config.ts`)

One collection per Contentful type, each with a Zod schema mirroring the fields actually rendered by the site:

| Collection | Source type | Key fields |
|---|---|---|
| `pages` | `Seite` | `slug`, `module[]` |
| `heroBlocks` | `HeroBlock` | `hauptueberschrift`, `unterueberschrift`, `callToAction`, `bild` |
| `quotes` | `Zitat` | `zitat` |
| `sections` | `Abschnitt` | `volleBreite`, `inhalte[]`, `seitenabschnitt?` |
| `textContents` | `Textinhalt` | `textMarkdown`, `textHtml` |
| `cardLayouts` | `KartenLayout` | `titel`, `layout`, `elemente[]` |
| `employees` | `Mitarbeiter` | `name`, `dienstbereich`, `foto` |
| `productGroups` | `Produktgruppe` | `name`, `beschreibung`, `beispiele`, `foto` |

### Normalized data shape

Contentful returns entries with `sys.id` cross-references. The loader denormalizes at load time: each `module[]`, `inhalte[]`, and `elemente[]` entry is resolved to a discriminated-union object tagged with `__typename`, preserving the current `ModuleTemplate` dispatch pattern from `src/templates/contentful-page.jsx`.

Text fields must expose both raw Markdown and rendered HTML:

- `textMarkdown` — the raw Contentful Markdown string.
- `textHtml` — HTML rendered at build time by the Markdown pipeline.

The rendered HTML replaces Gatsby's current `childContentfulTextinhaltTextTextNode.childMarkdownRemark.html` output. Legal-page verification in M2 decides whether the Markdown pipeline is close enough or needs small normalization adjustments.

Image fields become plain data objects for `<img>` rendering:

```ts
type ContentfulImage = {
  src: string
  width: number
  height: number
  title?: string
  description?: string
}
```

`src` must be an absolute HTTPS URL. If Contentful returns protocol-relative URLs, the loader prefixes `https:`.

### Idempotency and caching

The loader may write a JSON cache to `node_modules/.astro/contentful-cache/` keyed by content type + entry ID + `sys.updatedAt`. On subsequent dev runs, unchanged entries can be served from cache; changed entries are re-fetched. This is a dev-speed optimization, not a correctness requirement. A clean `pnpm build` must work without an existing cache.

### Verification gate

`src/pages/debug.astro` iterates the `pages` collection and prints each slug + module tree as JSON. Confirm:

- `/`, `/imprint/`, and `/data-policy/` exist after slug normalization.
- Text entries expose non-empty `textMarkdown` and `textHtml`.
- Images expose absolute `src`, `width`, and `height`.
- Nested `Abschnitt`, `KartenLayout`, `Mitarbeiter`, and `Produktgruppe` references are resolved with the expected `__typename` values.

No styling, no real public pages yet. Delete `src/pages/debug.astro` after M2 routes are verified.

### Out of scope

Any visual component port, any optimized image processing, and the `FontContainer` type.

---

## Milestone 2 — Legal pages in native Astro

**Goal:** `/imprint/` and `/data-policy/` are fully rendered and verified in Astro before the main page migration starts.

This milestone validates the complete migration loop on the lowest-risk pages: Contentful fetch, Markdown rendering, routing, global layout, CSS token port, fixture capture, HTML comparison, manual visual comparison, and cookie checks.

### Reference fixtures

Capture the live site's current legal pages at the start of the milestone:

- `curl -k https://www.rhode-medizin.de/imprint/` → `tests/fixtures/live/imprint.html`
- `curl -k https://www.rhode-medizin.de/data-policy/` → `tests/fixtures/live/data-policy.html`

Normalize expected differences before comparison:

- Remove the old cookie banner markup.
- Remove Gatsby runtime/script tags.
- Ignore whitespace-only differences.
- Ignore asset URL hash differences.

The page content inside the main article must remain content-identical.

### Routing

Create `src/pages/[...slug].astro`. `getStaticPaths()` reads the `pages` collection and returns one path per normalized slug.

Slug handling must explicitly cover the homepage and nested/simple pages:

- A Contentful slug of `/` or an empty slug maps to Astro path `undefined` or `''` so it renders `/`.
- A Contentful slug of `/imprint/`, `imprint`, or `imprint/` maps to `/imprint/`.
- A Contentful slug of `/data-policy/`, `data-policy`, or `data-policy/` maps to `/data-policy/`.

During M2, the route renders only `/imprint/` and `/data-policy/`. If `/` is present in the collection, it can return a temporary "not migrated yet" page in local development, but it is not part of the public deploy until M3.

### Native Astro files

Port only the pieces needed for the two legal pages:

- `src/layouts/Layout.astro` — `<html>`, `<head>`, title/meta, `lang="de"`, global stylesheet, header, footer, main grid shell.
- `src/components/Header.astro` — logo and company type from `src/components/header.jsx`.
- `src/components/Footer.astro` — imprint and data-policy links from `src/components/footer.jsx`; omit the old Contentful badge.
- `src/components/MainGrid.astro` — grid structure from `src/components/mainGrid.jsx`.
- `src/components/MainContent.astro` — article wrapper from `src/components/mainContent.jsx`.
- `src/components/MainSection.astro` — section wrapper from `src/components/mainSection.jsx`.
- `src/components/AsideSection.astro` — aside wrapper from `src/components/asideSection.jsx`.
- `src/components/ContentBox.astro` — padding wrapper from `src/components/contentBox.jsx`.
- `src/components/ModuleRenderer.astro` — supports only `ContentfulAbschnitt` and `ContentfulTextinhalt` in this milestone.
- `src/styles/tokens.css` — CSS custom properties copied from `src/styles/theme.js`.
- `src/styles/global.css` — reset and global element styles copied from `src/styles/globalStyle.js`, excluding Contentful font injection until local font files are approved.

Use plain HTML and scoped CSS. Do not import React, Gatsby, styled-components, or gatsby-image from Astro files.

### Typography

Before claiming visual parity, verify the NeuzeitOffice license allows self-hosting. If allowed, place the woff2 files in `src/fonts/` and add `@font-face` rules to `src/styles/global.css`.

If self-hosting is not allowed, stop and choose an approved substitute before continuing visual verification. The substitute must be documented because it affects the "visually identical" goal.

### Verification gate

M2 is complete only when all of these are true:

- `pnpm build` succeeds.
- `/imprint/` and `/data-policy/` render from Astro.
- The main article content of `/imprint/` and `/data-policy/` matches the captured fixtures after the documented normalization rules.
- Manual browser comparison against `www.rhode-medizin.de/imprint/` and `www.rhode-medizin.de/data-policy/` shows no meaningful layout or typography regression, modulo the deliberately removed cookie banner and Contentful badge.
- Browser dev tools show no cookies set by the site and no cookie banner.
- No React or styled-components dependency is introduced for the Astro path.

Do not start the main page migration until this gate passes. If the legal pages reveal problems in slug normalization, Markdown rendering, global layout, or fixture comparison, fix those problems here.

---

## Milestone 3 — Main page in native Astro with plain images

**Goal:** `/` is rendered in native Astro and visually matches the live homepage, using plain `<img>` tags.

M3 builds on the verified M2 foundation. The legal pages remain the regression canary: after each main-page component lands, re-check that `/imprint/` and `/data-policy/` still pass their fixture comparison.

### Homepage fixture

Capture the live homepage at the start of M3:

- `curl -k https://www.rhode-medizin.de/` → `tests/fixtures/live/index.html`

Normalize the same expected differences as M2: old cookie banner, Gatsby runtime/script tags, whitespace-only differences, and asset URL hash differences.

### Component conversion order

Convert the remaining components directly from the existing React/styled-components source into `.astro` files. Keep the order leaf-first so each step is independently reviewable:

1. `Quote.astro` from `src/components/quote.jsx`.
2. `EmployeeTile.astro` from `src/components/employeeTile.jsx`.
3. `ProductGroup.astro` from `src/components/productGroup.jsx`.
4. `TileGrid.astro` and `TileList.astro` from `src/components/tileGrid.jsx` and `src/components/tileList.jsx`.
5. Extend `ModuleRenderer.astro` for `ContentfulZitat`, `ContentfulKartenLayout`, `ContentfulMitarbeiter`, and `ContentfulProduktgruppe`.
6. `CallToActionButton.astro` from `src/components/callToActionButton.jsx`.
7. `HeroBlock.astro` from `src/components/heroBlock.jsx`.
8. Extend `ModuleRenderer.astro` for `ContentfulHeroBlock` and finish rendering `/`.

Dynamic styled-components props become explicit Astro props and CSS classes. For example, `MainSection` uses classes for `darkBackground` and `fullWidth`; `KartenLayout` chooses `TileGrid` vs `TileList` based on `layout === 'Gitter'`.

### Plain image strategy

Use plain `<img>` tags for all Contentful and local images in M3.

Contentful images:

- Use the loader's `ContentfulImage.src`, `width`, `height`, `title`, and `description` fields.
- Prefix protocol-relative URLs with `https:` in the loader.
- Use `alt={description || title || ''}`.
- Use CSS `object-fit` and dimensions to reproduce the current `gatsby-image` layouts.
- Do not use Astro's `<Image>` component in M3.
- Do not add remote image optimization configuration in M3.

Local logo images:

- Use the existing files in `src/images/` or move stable public assets to `public/` if that is simpler for Astro.
- Preserve the current visible logo and dimensions from `src/components/header.jsx`.

### Verification gate

M3 is complete only when all of these are true:

- `pnpm build` succeeds.
- `/`, `/imprint/`, and `/data-policy/` render from Astro.
- `/imprint/` and `/data-policy/` still pass the M2 content fixture comparison.
- `/` matches the captured homepage fixture after documented normalization, with manual browser comparison for visual parity.
- No cookies are set by the site, no cookie banner exists, and no service worker is registered.
- The build output ships no page-level client JavaScript for migrated components.

### Cleanup at end of M3

After all routes render in Astro and verification passes:

- Remove Gatsby-only source files: `gatsby-node.js`, `gatsby-config.js`, `src/templates/`, `src/pages/404.jsx`, and old React components replaced by `.astro` equivalents.
- Recreate the 404 page as `src/pages/404.astro`.
- Remove Gatsby-only dependencies: `gatsby`, `gatsby-image`, `gatsby-plugin-*`, `gatsby-source-*`, `gatsby-transformer-*`, `react-helmet`, `react-cookie-consent`, `react-router-dom`, `styled-reset`, `styled-components`, `babel-plugin-styled-components`, and `subfont` if no longer used.
- Keep `CONTENTFUL_ACCESS_TOKEN` documented only as legacy/deprecated if anything outside the repo still uses it; new builds use `CONTENTFUL_DELIVERY_TOKEN`.
- Update `AGENTS.md`, `README.md`, lint scripts, and build scripts to describe the Astro stack.

---

## Milestone 4 — Image optimization pass

**Goal:** improve image delivery after page parity is proven, without changing content or layout.

This milestone is intentionally after the native Astro parity work. Do not combine image optimization with M2 or M3, because it makes visual and markup regressions harder to diagnose.

### Decision point

Use Astro's built-in image service (`astro:assets` `<Image />` and `<Picture />`) as the sole image optimization provider. Authorize the Contentful asset hosts (`images.ctfassets.net`, `videos.ctfassets.net`) in `astro.config.mjs` so the image service downloads and transforms remote assets at build time.

Component choice is mixed per-context:

- **Hero (LCP):** `<Picture />` with `formats={['avif', 'webp']}`, `fetchpriority="high"`, and `loading="eager"`.
- **Below-the-fold (employee, product):** `<Image />` with `loading="lazy"`.

The Contentful loader's `ContentfulImage` shape is unchanged; no Contentful-specific image transform helper is introduced. See `docs/superpowers/specs/2026-07-21-m4-astro-image-optimization-design.md` for the full design and `docs/adrs/adr_05_image_strategy.md` for the decision record.

### Verification gate

M4 is complete only when all of these are true:

- `pnpm build` succeeds.
- `/`, `/imprint/`, and `/data-policy/` still pass the same content and visual checks from M3.
- Images have appropriate `width`, `height`, `alt`, and lazy/eager loading behavior.
- The homepage does not regress visually when comparing against the M3 plain-image baseline.
- No cookies, service worker, or client-side storage are introduced.

---

## Milestone 5 — Cloudflare Pages hosting

**Goal:** site deployed on Cloudflare Pages static, Netlify decommissioned, DNS cut over.

### Adapter

None needed. Astro's default static output (`astro build` → `dist/`) is what Cloudflare Pages serves. No `@astrojs/cloudflare` SSR adapter — the site is fully static, which matches the cookie-free goal and is the simplest reliable deploy model.

### Build configuration on Cloudflare Pages

- Framework preset: Astro.
- Build command: `pnpm install --frozen-lockfile && pnpm build`.
- Output directory: `dist`.
- Environment variables: `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`. No preview token is needed for production Cloudflare builds.
- Node version: set `NODE_VERSION` env var to current LTS supported by Astro and Cloudflare Pages.

### DNS and domain

- The domain `rhode-medizin.de` and `www.rhode-medizin.de` move to Cloudflare or keep current DNS pointed at Cloudflare as appropriate for the registrar setup.
- Cloudflare Pages assigns a `*.pages.dev` URL first. Verify the build there before DNS cutover.
- Add custom domains `rhode-medizin.de` and `www.rhode-medizin.de` to the Pages project. Cloudflare provisions the SSL certificate automatically, which should fix the current SSL warning.
- Remove old Netlify DNS/records only after the new site is confirmed serving correctly.

### Decommissioning Netlify

- Keep Netlify alive during M1-M4; the live site stays on Netlify until M5 cutover.
- After DNS cutover and verification, delete the Netlify site.
- Remove Netlify-related files if present. There is currently no `netlify.toml`; `requirements.txt` can be removed if the disabled subfont Python step is gone.

### Webhook for content changes

With Contentful as the build-time data source, content edits in Contentful do not appear until a rebuild. Configure a Contentful webhook to POST to a Cloudflare Pages deploy hook on `publish` and `unpublish` events.

Alternative: manual deploy via git push or manual Cloudflare deploy trigger. Content updates then require a manual rebuild.

This webhook concern is transient if a future project moves content into git-backed local collections.

### 404 page

Cloudflare Pages serves `404.html` from `dist/` automatically. The Gatsby `404.jsx` is recreated as `src/pages/404.astro` in M3; Cloudflare picks it up with no extra config.

### Manifest / PWA

The old site had `gatsby-plugin-manifest` (theme color `#4038A0`, background `#FFFDF3`, icon `logo_small_rhode_medizin_white.png`) and `gatsby-plugin-offline` (service worker). For the new site: drop both. This is a deliberate simplification in service of the cookie-free goal — service workers can set storage and add avoidable complexity.

### Verification gate

- `rhode-medizin.de` and `www.rhode-medizin.de` serve the new Astro build over HTTPS with a valid Cloudflare edge cert.
- Every route returns the expected status: `/`, `/imprint/`, and `/data-policy/` return 200; missing routes return the Astro 404 page.
- `/imprint/` and `/data-policy/` remain content-identical to the verified fixtures, modulo documented removals.
- No cookies are set by the site: no `Set-Cookie` headers, no cookie banner, no client-side storage, no service worker.
- Netlify site decommissioned and old DNS records removed.

---

## Deliberate behavior changes from the old site

Called out explicitly so they are not regressions:

1. **No cookie banner.** The old site showed a `react-cookie-consent` bar; the new site sets no cookies and shows no banner.
2. **No service worker / PWA manifest.** The old site registered a service worker via `gatsby-plugin-offline` and had a manifest; the new site has neither.
3. **No "Powered by Contentful" footer link.** The old footer linked to `contentful.com` with their badge; this is removed as a simplification.
4. **Font pipeline simplified.** The licensed-font `subfont` inlining build step is gone; fonts are self-hosted woff2 with `font-display: swap` only if the license allows it.
5. **Image optimization via Astro image service.** M3 parity used plain `<img>` tags; M4 replaces them with Astro's `astro:assets` `<Image />` and `<Picture />` components, which transform Contentful assets at build time. No Contentful-specific image helper ships in the repo.

## Out of scope

- Moving content from Contentful to local Markdown/JSON content collections.
- Any visual redesign beyond matching the existing site. "Simpler" refers to the stack, not the design.
- i18n — the site is German-only.
