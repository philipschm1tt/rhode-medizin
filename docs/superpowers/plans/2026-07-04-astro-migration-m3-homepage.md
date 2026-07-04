# Astro Migration M3 Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render `/` in native Astro with plain images and verified visual/content parity while keeping legal pages green.

**Architecture:** Build on the M2 route/layout/module renderer and port the remaining Gatsby components leaf-first into native `.astro` components. Use plain `<img>` tags backed by normalized Contentful image data; defer responsive image optimization to M4.

**Tech Stack:** Astro components, scoped CSS, Contentful collection data, plain HTML images, fixture comparison, browser visual checks.

## Global Constraints

- Consumes master spec: `docs/superpowers/specs/2026-07-04-astro-migration-design.md`.
- Consumes planning design: `docs/superpowers/specs/2026-07-04-astro-migration-planning-design.md`.
- Depends on completed M1 and M2.
- M3 goal: `/` is rendered in native Astro and visually matches the live homepage using plain `<img>` tags.
- Legal pages remain the regression canary after each main-page component lands.
- Use plain `<img>` tags for all Contentful and local images in M3.
- Use `alt={description || title || ''}` for Contentful images.
- Use width and height attributes for images to prevent layout shifts.
- Do not use Astro's `<Image>` component in M3.
- Do not add remote image optimization configuration in M3.
- Do not add React, Gatsby, styled-components, `gatsby-image`, cookie banner, service worker, or client-side storage.
- The migrated output should ship no page-level client JavaScript for migrated components.
- Run `pnpm build`, legal comparison, homepage comparison, and `npm run lint` before considering work done.
- Review for ADR need before completion and state whether ADRs were added or why none were needed.

---

## File Structure

- Create: `tests/fixtures/live/index.html` — captured live homepage fixture.
- Modify: `scripts/compare-legal-pages.mjs` or create `scripts/compare-pages.mjs` — include homepage normalization/comparison.
- Create: `src/components/Quote.astro`
- Create: `src/components/EmployeeTile.astro`
- Create: `src/components/ProductGroup.astro`
- Create: `src/components/TileGrid.astro`
- Create: `src/components/TileList.astro`
- Create: `src/components/CallToActionButton.astro`
- Create: `src/components/HeroBlock.astro`
- Modify: `src/components/ModuleRenderer.astro`
- Modify: `src/pages/[...slug].astro`
- Delete after verification: `src/pages/debug.astro`
- Create: `src/pages/404.astro`
- Delete during cleanup: Gatsby-only source files and dependencies listed in the master spec.
- Modify: `AGENTS.md`, `README.md`, `package.json`, lockfile, lint scripts, and build scripts for the Astro stack.

---

### Task 1: Homepage Fixture And Comparison Harness

**Files:**
- Create: `tests/fixtures/live/index.html`
- Modify: `scripts/compare-legal-pages.mjs` or create `scripts/compare-pages.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: live homepage at `https://www.rhode-medizin.de/`.
- Produces: comparison command that verifies `/`, `/imprint/`, and `/data-policy/` after build.

- [ ] **Step 1: Capture homepage fixture**

Run:

```bash
curl -k https://www.rhode-medizin.de/ -o tests/fixtures/live/index.html
```

Expected: fixture file contains current live homepage HTML.

- [ ] **Step 2: Extend comparison script**

Normalize homepage with the same expected differences as M2: cookie banner, Gatsby runtime/script tags, whitespace-only differences, and asset URL hash differences.

- [ ] **Step 3: Add package script**

Add or update a script such as:

```json
"compare:pages": "node scripts/compare-pages.mjs"
```

Expected: after `pnpm build`, the command compares homepage and legal pages.

- [ ] **Step 4: Commit homepage fixture harness**

Run:

```bash
git status --short
git diff -- package.json scripts tests/fixtures/live/index.html
git add package.json scripts tests/fixtures/live/index.html
git commit -m "Add homepage parity fixture"
```

Expected: commit contains only comparison harness changes.

---

### Task 2: Leaf Components With Plain Images

**Files:**
- Create: `src/components/Quote.astro`
- Create: `src/components/EmployeeTile.astro`
- Create: `src/components/ProductGroup.astro`
- Create: `src/components/TileGrid.astro`
- Create: `src/components/TileList.astro`
- Modify: `src/components/ModuleRenderer.astro`

**Interfaces:**
- Consumes: existing React components `quote.jsx`, `employeeTile.jsx`, `productGroup.jsx`, `tileGrid.jsx`, and `tileList.jsx` as visual references.
- Produces: Astro components for `ContentfulZitat`, `ContentfulKartenLayout`, `ContentfulMitarbeiter`, and `ContentfulProduktgruppe`.

- [ ] **Step 1: Port `Quote.astro`**

Use semantic quote markup where compatible with visual parity. Preserve current typography and spacing.

- [ ] **Step 2: Port tile wrappers**

Create `TileGrid.astro` and `TileList.astro` with the current grid/list behavior and scoped CSS.

- [ ] **Step 3: Port image tiles**

Create `EmployeeTile.astro` and `ProductGroup.astro` using plain `<img>` with `src`, `width`, `height`, and `alt={description || title || ''}` from normalized data. Use `loading="lazy"` for below-the-fold tile images.

- [ ] **Step 4: Extend module renderer**

Add support for `ContentfulZitat`, `ContentfulKartenLayout`, `ContentfulMitarbeiter`, and `ContentfulProduktgruppe`. `ContentfulKartenLayout` chooses `TileGrid` for `layout === 'Gitter'`, otherwise `TileList`.

- [ ] **Step 5: Verify legal pages still pass**

Run:

```bash
pnpm build
pnpm compare:legal
```

Expected: both commands PASS.

- [ ] **Step 6: Commit leaf components**

Run:

```bash
git status --short
git diff -- src/components
git add src/components
git commit -m "Port homepage leaf modules to Astro"
```

Expected: commit contains only leaf component and renderer changes.

---

### Task 3: Hero And Homepage Route

**Files:**
- Create: `src/components/CallToActionButton.astro`
- Create: `src/components/HeroBlock.astro`
- Modify: `src/components/ModuleRenderer.astro`
- Modify: `src/pages/[...slug].astro`

**Interfaces:**
- Consumes: existing `callToActionButton.jsx`, `heroBlock.jsx`, M2 route, and normalized Contentful hero data.
- Produces: rendered `/` homepage.

- [ ] **Step 1: Port call-to-action button**

Create `CallToActionButton.astro` as a navigation link matching the current button style.

- [ ] **Step 2: Port hero block**

Create `HeroBlock.astro` with plain `<img>`. The hero/LCP image must be present in raw HTML, must not use `loading="lazy"`, should include `fetchpriority="high"`, and must include width and height attributes.

- [ ] **Step 3: Extend module renderer for hero**

Add support for `ContentfulHeroBlock` and pass headline, subheadline, call-to-action text, and image data.

- [ ] **Step 4: Enable homepage route**

Update `src/pages/[...slug].astro` so Contentful slug `/` or empty slug renders `/` instead of a placeholder.

- [ ] **Step 5: Verify full page set**

Run:

```bash
pnpm build
pnpm compare:pages
```

Expected: both commands PASS for `/`, `/imprint/`, and `/data-policy/`.

- [ ] **Step 6: Manual visual check**

Compare Astro `/` to `https://www.rhode-medizin.de/`. Confirm visual parity, no cookie banner, no service worker, no client-side storage, and no page-level client JavaScript for migrated components.

- [ ] **Step 7: Commit homepage route**

Run:

```bash
git status --short
git diff -- src/components src/pages
git add src/components src/pages
git commit -m "Render homepage in Astro"
```

Expected: commit contains only hero/homepage rendering changes.

---

### Task 4: Gatsby Cleanup And M3 Completion Gate

**Files:**
- Delete: `gatsby-node.js`
- Delete: `gatsby-config.js`
- Delete: `src/templates/`
- Delete: `src/pages/404.jsx`
- Delete: old React components replaced by `.astro` equivalents.
- Delete: `src/pages/debug.astro`
- Create: `src/pages/404.astro`
- Modify: `package.json`
- Modify: lockfile
- Modify: `AGENTS.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: verified Astro pages from Tasks 1-3.
- Produces: Astro-only application source after parity is proven.

- [ ] **Step 1: Recreate 404 page in Astro**

Create `src/pages/404.astro` matching the old 404 behavior and using the new layout.

- [ ] **Step 2: Remove temporary and Gatsby-only source**

Delete `src/pages/debug.astro`, `gatsby-node.js`, `gatsby-config.js`, `src/templates/`, `src/pages/404.jsx`, and old React components replaced by `.astro` equivalents.

- [ ] **Step 3: Remove Gatsby-only dependencies**

Remove `gatsby`, `gatsby-image`, `gatsby-plugin-*`, `gatsby-source-*`, `gatsby-transformer-*`, `react-helmet`, `react-cookie-consent`, `react-router-dom`, `styled-reset`, `styled-components`, `babel-plugin-styled-components`, and `subfont` if no longer used.

- [ ] **Step 4: Update repo docs and scripts**

Update `AGENTS.md`, `README.md`, lint scripts, and build scripts to describe Astro. Keep `CONTENTFUL_ACCESS_TOKEN` documented only as legacy/deprecated if anything outside the repo still uses it; new builds use `CONTENTFUL_DELIVERY_TOKEN`.

- [ ] **Step 5: Run final M3 verification**

Run:

```bash
pnpm build
pnpm compare:pages
npm run lint
```

Expected: all commands PASS. Confirm no cookies, service worker, client-side storage, or page-level client JavaScript are introduced.

- [ ] **Step 6: Review for ADR need**

Add ADRs only for significant architecture decisions not already documented. Routine component ports and cleanup do not need ADRs.

- [ ] **Step 7: Commit cleanup**

Run:

```bash
git status --short
git diff
git add -A
git commit -m "Remove Gatsby after Astro parity"
```

Expected: commit contains only M3 cleanup/docs/dependency changes.

- [ ] **Step 8: Completion summary**

Report verification evidence, manual homepage parity result, legal regression result, cookie/storage/client-JS result, ADR status, and commit hashes. State that M4 can start only after this M3 gate is accepted.
