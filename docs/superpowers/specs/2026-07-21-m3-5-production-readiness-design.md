# M3.5 — Production Readiness

Insert a new milestone, **M3.5 Production Readiness**, between the completed M1–M3 Astro migration and the existing M4 (image optimization) / M5 (Cloudflare deploy). M3.5 closes visual, validity, SEO, and dependency defects surfaced by review of the M3 state, then verifies the result against the live site at `https://www.rhode-medizin.de/` using Playwright. The existing M4 and M5 labels in `docs/superpowers/specs/2026-07-04-astro-migration-design.md` are not renumbered; M3.5 is documented here only.

M3.5 is complete only when every defect below is fixed, `pnpm build` succeeds, `pnpm lint` passes, `pnpm compare:legal` and `pnpm compare:pages` still pass, and the Playwright comparison in Section 7 surfaces no unresolved new defects.

## Out of scope

- **NeuzeitOffice web fonts.** The site renders in Arial fallback. Resolving the font license and self-hosting woff2 is deferred to a later milestone.
- **Image optimization.** Plain `<img>` tags remain; M4 owns this.
- **Any visual redesign** beyond restoring parity with the live site.
- **Contentful schema changes.** No new Contentful fields. SEO description text is hardcoded in code, not sourced from Contentful.
- **Dependency upgrades other than `dotenv`.** `astro`, `contentful`, `remark`/`rehype`/`unified` stay as-is.

---

## Section 1 — Layout shell refactor (Header/Footer)

### Root cause

In the original styled-components code, `HeaderArea` and `FooterArea` *extended* `MainGrid` — they were grid containers themselves with `grid-column: 1 / 5`. In the M2/M3 Astro port, `Header.astro` and `Footer.astro` instead wrap a child `<MainGrid>`, and `Layout.astro` places them as children of an outer `<MainGrid>`. That outer grid's `.main-grid > *` rule constrains every child (including the header and footer) to `grid-column: main-column-start / side-column-end`, so:

- the header renders collapsed in the main column rather than spanning full width (observed as "header at the bottom with a centered logo");
- the footer does not span full width for the same reason.

### Fix

Make `Header.astro` and `Footer.astro` carry the grid themselves, mirroring the original styled-components structure:

- `Layout.astro` keeps a single `<MainGrid>` for the article/slot region and the side-background only. Header and Footer render as siblings outside that inner grid (or as direct children that carry their own grid semantics), each with `grid-column: 1 / 5`.
- Move the `display: grid; grid-template-columns: var(--main-grid-columns)` rules and the `> * { grid-column: main-column-start / side-column-end }` rule out of `MainGrid.astro` and into `Header.astro` / `Footer.astro` directly (or a shared selector), so they are grid containers in their own right, not grid items.

### Side-background

`Layout.astro:38` currently stops at `side-column-end`. The original extended to `5` (the far edge), filling the right margin column with light blue. Extend the `.side-background` grid-column to `side-column-start / 5`.

### Regression guard

Re-run `pnpm compare:legal` and `pnpm compare:pages` after this refactor. The legal pages' fixture comparison is the regression canary — if the shell refactor breaks article grid placement, the comparison must catch it.

---

## Section 2 — Remaining visual defects

### Footer link underline

`src/styles/global.css:47-50` sets `a { text-decoration: none }` globally (ported from styled-reset). The original styled-components `FooterLink` did not re-enable underline either, but it inherited the browser default because the original styled-reset did not reset anchor decoration. Fix: add a scoped rule in `Footer.astro`'s `<style>` block re-enabling `text-decoration: underline` on `.footer-link`. The rest of the site (logo link, CTA) intentionally has no underline.

### Footer full-width background

Addressed by Section 1: once the footer is a grid container spanning `1 / 5`, its background color fills the full width.

### Header position / centered logo

Addressed by Section 1: once the header is a grid container spanning `1 / 5` rather than a grid item constrained to the main column, the logo and company-type sit in the left column aligned with the text below, as in the original.

### Side-background right strip

Addressed by Section 1's `side-column-start / 5` change.

---

## Section 3 — Invalid HTML: `<button>` nested in `<a>`

### Defect

`src/components/HeroBlock.astro:51-54` wraps `<CallToActionButton>` (which renders a `<button>`) inside an `<a href="/imprint/">`. `<button>` inside `<a>` is invalid HTML (interactive element nesting) and HTML validators flag it.

### Fix

`CallToActionButton.astro` renders a single `<a>` element (always a link, no `<button>` fallback, no `href` prop branching). `HeroBlock.astro` passes `href="/imprint/"` to `CallToActionButton` and drops the wrapping `<a>`.

### CTA target source

The original `heroBlock.jsx` hardcoded `/imprint/` for the CTA. Preserve that — do not invent a Contentful field that does not exist. The Contentful `HeroBlock` has a `callToAction` text field but no link field; `/imprint/` remains the destination.

---

## Section 4 — English 404 on German site

### Defect

`src/pages/404.astro:10-11` ships Gatsby's default English copy: `<h1>NOT FOUND</h1>` and `<p>You just hit a route that doesn't exist... the sadness.</p>`.

### Fix

Rewrite in German. Keep it minimal and on-brand:

- `<h1>Seite nicht gefunden</h1>`
- `<p>Die angeforderte Seite existiert nicht.</p>`

The page title passed to `<Layout>` is already `Seite nicht gefunden` (`404.astro:7`), so the `<title>` is already German — only the body copy needs replacing.

---

## Section 5 — SEO (meta description, OG, canonical, sitemap, favicon)

### Defect

`src/layouts/Layout.astro:12-16` emits only `charset`, `viewport`, and `<title>`. No description, canonical, OG/Twitter, favicon, or sitemap.

### Fix

Add `astro-seo` as a dependency and use its `<SEO>` component inside `Layout.astro`'s `<head>`. Per direction, SEO applies to the homepage only — `/imprint/` and `/data-policy/` get no SEO tags beyond charset/viewport/title.

### Layout props

`Layout.astro` accepts optional `seo` props (description, canonical, ogImage, etc.) and passes them to `<SEO>`. When `seo` is absent (legal pages, 404), only the basic `<title>` is emitted via `titleDefault` — no description, no OG, no canonical.

### Homepage wiring

`src/pages/[...slug].astro` detects the homepage (slug `/` or empty) and passes hardcoded German SEO defaults to `<Layout>`:

- `title`: `Rhode Medizintechnik – Heinrich Rhode GmbH`
- `description`: a short factual German description (e.g. "Heinrich Rhode GmbH – Medizintechnik für Praxen und Kliniken. Beratung, Service und Produkte aus einer Hand.")
- `openGraph.basic`: `{ title, type: 'website', image: <hero image absolute URL>, url: 'https://www.rhode-medizin.de/' }`
- `openGraph.optional`: `{ locale: 'de_DE', siteName: 'Heinrich Rhode GmbH' }`
- `twitter`: `{ card: 'summary_large_image' }` plus matching title/image/description.
- `canonical`: defaults to `Astro.url.href` via astro-seo — acceptable.

The final description wording is an implementation detail; the constraint is that it is short, factual, German, and not the Gatsby-era `Sample` placeholder.

### Astro config

Set `site: 'https://www.rhode-medizin.de'` in `astro.config.mjs` so astro-seo's canonical/OG URL defaults and the sitemap emit absolute URLs.

### Favicon

Add `public/favicon.png` (small square logo, e.g. `logo_small_initials.png` copied/sized) and reference it via astro-seo's `extend.link: [{ rel: 'icon', href: '/favicon.png' }]`. No apple-touch-icon or manifest (deliberate PWA removal per M5 design).

### Sitemap

Add `@astrojs/sitemap` integration. With `site` set, it auto-generates `/sitemap-index.xml` and `/sitemap-0.xml` at build time from all static routes. Legal pages will appear in the sitemap — that is acceptable (sitemap ≠ indexing; legal pages are simply not given SEO tags, so they remain indexable by default). Flag this as a deliberate choice in the ADR.

### Robots

Add `public/robots.txt` allowing all crawlers and pointing to `https://www.rhode-medizin.de/sitemap-index.xml`. No robots meta tag on pages.

---

## Section 6 — Stale `package-lock.json` and `dotenv` upgrade

### Defects

- `package-lock.json` (829 KB) is committed alongside `pnpm-lock.yaml` — stale npm artifact from the Gatsby era; AGENTS.md declares pnpm as the package manager.
- `dotenv` is pinned at `^7.0.0` (released 2019); current major is v17. The loader at `src/content/loaders/contentful.ts` uses it.

### Fix

- `git rm package-lock.json`. Confirm `.gitignore` already ignores it (or add it) so it can't sneak back.
- Upgrade `dotenv` to `^17.0.0` (or latest stable). Run `pnpm install` to regenerate `pnpm-lock.yaml`. Verify the loader still imports and loads `.env` correctly via `pnpm build`.

### Out of scope

No other dependency upgrades — `astro`, `contentful`, `remark`/`rehype`/`unified` stay as-is.

---

## Section 7 — Playwright verification against the live site

### Goal

Catch any visual regressions beyond the listed defects by comparing the local dev build against `https://www.rhode-medizin.de/` for `/`, `/imprint/`, and `/data-policy/`.

### Setup

- Use the Playwright CLI skill (already installed in the repo).
- Launch Chromium with `--ignore-certificate-errors` (or equivalent) to handle the live site's SSL issue.
- Serve the local build via `pnpm develop` (or `pnpm build` + a static server) on `localhost:4321` (Astro default).

### Comparison procedure, per page

1. Navigate to the live URL and the local URL at the same viewport (desktop default 1280×800; optional mobile pass at 375×800).
2. Capture full-page screenshots from both.
3. Side-by-side visual review: header position, footer width, side-background color, link underlines, hero overlay, tile layouts, image presence/aspect.
4. Document any defects found that are not already in the review notes.

### Functional checks (also via Playwright)

- No cookies set by the local site (no `Set-Cookie`, no cookie banner).
- No service worker registered.
- `<title>`, meta description, canonical, OG tags, favicon present on homepage.
- `/imprint/` and `/data-policy/` have no meta description / OG tags (per Section 5).
- 404 route renders German copy when navigating to a nonexistent path.
- `/sitemap-index.xml` resolves and lists all three routes.
- `/robots.txt` resolves.

### Timing

Run the comparison after implementing all fixes (Sections 1–6), so it verifies the final state. Any new defects surfaced go back into the milestone as follow-up tasks.

### Outcome

A written comparison report (screenshots + defect list) committed to `docs/` or referenced in the milestone summary — not a permanent test fixture.

---

## Section 8 — ADRs

Per AGENTS.md, significant architecture decisions are documented in `docs/adrs/`. Two ADRs are warranted by this milestone:

### ADR 5 — `astro-seo` for SEO tag management

Significant because it introduces a new runtime dependency for `<head>` tag emission, constrains how SEO props flow through `Layout.astro`, and is a deliberate choice over hand-rolling meta tags. Document the rationale (structured prop surface, OG/Twitter coverage, sitemap integration) and the trade-off (dependency for what could be static tags).

### ADR 6 — Header/Footer as grid containers (root-cause layout refactor)

Significant because it diverges from the M2/M3 Astro port structure (where Header/Footer wrapped a `<MainGrid>`) back toward the original styled-components model (where `HeaderArea`/`FooterArea` extended `MainGrid`). Document the root cause of the visual defects, the structural fix, and that fixture comparison was re-run as the regression guard.

### No ADR for

The `dotenv` upgrade, `package-lock.json` deletion, 404 copy fix, footer-link underline, or CallToActionButton-as-link — these are routine fixes. The Playwright comparison is a verification activity, not an architecture decision.

---

## Verification gate

M3.5 is complete only when all of the following are true:

- `pnpm build` succeeds.
- `pnpm lint` passes.
- `pnpm compare:legal` and `pnpm compare:pages` still pass (regression canary for the layout shell refactor).
- Every defect in Sections 1–6 is resolved.
- The Playwright comparison in Section 7 has been run and any new defects it surfaces are either fixed or explicitly deferred with rationale.
- ADRs 5 and 6 are written.
- No cookies are set by the site, no service worker is registered, no client-side storage is introduced.
