# Astro Migration M2 Legal Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render `/imprint/` and `/data-policy/` in native Astro with verified content parity before migrating the homepage.

**Architecture:** Build on the M1 Contentful collection and add the route, global layout shell, legal-page module rendering, style tokens, and fixture comparison needed for the legal pages only. Keep the homepage out of public scope for this milestone except as a temporary local placeholder if the collection contains `/`.

**Tech Stack:** Astro static routes, native `.astro` components, scoped CSS, CSS custom properties, Contentful collection data, Markdown HTML emitted by the M1 loader, shell scripts or Node scripts for fixture normalization if needed.

## Global Constraints

- Consumes master spec: `docs/superpowers/specs/2026-07-04-astro-migration-design.md`.
- Consumes planning design: `docs/superpowers/specs/2026-07-04-astro-migration-planning-design.md`.
- Depends on completed M1 foundation and `pages` content collection.
- M2 goal: `/imprint/` and `/data-policy/` are fully rendered and verified in Astro before the main page migration starts.
- Capture live fixtures at the start of M2 with `curl -k`.
- Normalize expected fixture differences: old cookie banner markup, Gatsby runtime/script tags, whitespace-only differences, and asset URL hash differences.
- The page content inside the main article must remain content-identical.
- Use plain HTML and scoped CSS.
- Do not import React, Gatsby, styled-components, or `gatsby-image` from Astro files.
- Verify the NeuzeitOffice license before claiming visual parity with self-hosted fonts.
- If self-hosting is not allowed, stop and choose an approved substitute before continuing visual verification.
- M2 must not start the main page migration.
- Run `pnpm build` and `npm run lint` before considering work done.
- Review for ADR need before completion and state whether ADRs were added or why none were needed.

---

## File Structure

- Create: `tests/fixtures/live/imprint.html` — captured live imprint fixture.
- Create: `tests/fixtures/live/data-policy.html` — captured live data-policy fixture.
- Create: `scripts/compare-legal-pages.mjs` — normalizes fixture/current HTML and compares main article content.
- Create: `src/pages/[...slug].astro` — static route for Contentful pages, rendering only legal pages in M2.
- Create: `src/layouts/Layout.astro` — document shell, metadata, header, footer, and main grid shell.
- Create: `src/components/Header.astro` — native Astro port of the current header needed for legal pages.
- Create: `src/components/Footer.astro` — native Astro footer links without the old Contentful badge.
- Create: `src/components/MainGrid.astro` — layout grid wrapper.
- Create: `src/components/MainContent.astro` — main article wrapper.
- Create: `src/components/MainSection.astro` — main section wrapper.
- Create: `src/components/AsideSection.astro` — aside wrapper.
- Create: `src/components/ContentBox.astro` — content padding wrapper.
- Create: `src/components/ModuleRenderer.astro` — supports `ContentfulAbschnitt` and `ContentfulTextinhalt` only in M2.
- Create: `src/styles/tokens.css` — CSS custom properties copied from `src/styles/theme.js`.
- Create: `src/styles/global.css` — global reset and base styles copied from `src/styles/globalStyle.js`, without Contentful font injection until license approval.
- Modify: `package.json` — add a comparison script if `scripts/compare-legal-pages.mjs` is created.

---

### Task 1: Legal Fixtures And Comparison Harness

**Files:**
- Create: `tests/fixtures/live/imprint.html`
- Create: `tests/fixtures/live/data-policy.html`
- Create: `scripts/compare-legal-pages.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: live pages at `https://www.rhode-medizin.de/imprint/` and `https://www.rhode-medizin.de/data-policy/`.
- Produces: `pnpm compare:legal` command that compares built Astro legal pages against normalized fixtures.

- [ ] **Step 1: Capture live fixtures**

Run:

```bash
mkdir -p tests/fixtures/live
curl -k https://www.rhode-medizin.de/imprint/ -o tests/fixtures/live/imprint.html
curl -k https://www.rhode-medizin.de/data-policy/ -o tests/fixtures/live/data-policy.html
```

Expected: both fixture files exist and contain the current live HTML.

- [ ] **Step 2: Create `scripts/compare-legal-pages.mjs`**

Implement a Node script that reads `tests/fixtures/live/imprint.html`, `tests/fixtures/live/data-policy.html`, `dist/imprint/index.html`, and `dist/data-policy/index.html`; extracts the `<main>` content; removes cookie banner markup, Gatsby runtime/script tags, and whitespace-only differences; then exits non-zero with a readable diff summary if normalized content differs.

- [ ] **Step 3: Add package script**

Add this script to `package.json`:

```json
"compare:legal": "node scripts/compare-legal-pages.mjs"
```

Expected: `pnpm compare:legal` runs the comparison script after `pnpm build` creates `dist/`.

- [ ] **Step 4: Commit fixture harness**

Run:

```bash
git status --short
git diff -- package.json scripts/compare-legal-pages.mjs tests/fixtures/live
git add package.json scripts/compare-legal-pages.mjs tests/fixtures/live
git commit -m "Add legal page parity fixtures"
```

Expected: commit contains only fixture and comparison-harness changes.

---

### Task 2: Legal Layout And Styling Shell

**Files:**
- Create: `src/layouts/Layout.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/components/MainGrid.astro`
- Create: `src/components/MainContent.astro`
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`

**Interfaces:**
- Consumes: visual/styling reference from `src/components/layout.jsx`, `src/components/header.jsx`, `src/components/footer.jsx`, `src/components/mainGrid.jsx`, `src/components/mainContent.jsx`, `src/styles/theme.js`, and `src/styles/globalStyle.js`.
- Produces: reusable native Astro layout shell for legal pages and later homepage work.

- [ ] **Step 1: Port CSS tokens**

Create `src/styles/tokens.css` with CSS custom properties that map the colors, spacing, font families, breakpoints, and grid widths from `src/styles/theme.js`.

- [ ] **Step 2: Port global styles**

Create `src/styles/global.css` with reset/base styles from `src/styles/globalStyle.js`, import `./tokens.css`, set `lang="de"` assumptions, and do not add `@font-face` until the font license is verified.

- [ ] **Step 3: Port header and footer**

Create `Header.astro` and `Footer.astro` to match the current visible legal-page shell. Footer must include imprint and data-policy links and omit the old Contentful badge.

- [ ] **Step 4: Port layout wrappers**

Create `Layout.astro`, `MainGrid.astro`, and `MainContent.astro` using semantic `<header>`, `<main>`, and `<footer>` landmarks, `<html lang="de">`, `<meta charset="utf-8">`, and `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.

- [ ] **Step 5: Verify shell compiles**

Run:

```bash
pnpm astro check
```

Expected: PASS.

- [ ] **Step 6: Commit layout shell**

Run:

```bash
git status --short
git diff -- src/layouts src/components src/styles
git add src/layouts src/components src/styles
git commit -m "Port legal page layout shell to Astro"
```

Expected: commit contains only layout/style shell files.

---

### Task 3: Legal Routes And Module Rendering

**Files:**
- Create: `src/pages/[...slug].astro`
- Create: `src/components/MainSection.astro`
- Create: `src/components/AsideSection.astro`
- Create: `src/components/ContentBox.astro`
- Create: `src/components/ModuleRenderer.astro`
- Modify: `src/pages/debug.astro`

**Interfaces:**
- Consumes: `pages` collection from M1, `Layout.astro`, and legal wrapper components from Task 2.
- Produces: Astro-rendered `/imprint/` and `/data-policy/` routes.

- [ ] **Step 1: Implement section/content wrappers**

Create `MainSection.astro`, `AsideSection.astro`, and `ContentBox.astro` by porting the corresponding React/styled-components wrappers to native markup and scoped CSS.

- [ ] **Step 2: Implement M2 `ModuleRenderer.astro`**

Support only `ContentfulAbschnitt` and `ContentfulTextinhalt`. For `ContentfulTextinhalt`, render `textHtml` using `set:html`. For unsupported module types, render nothing in M2.

- [ ] **Step 3: Implement catch-all route**

Create `src/pages/[...slug].astro` with `getStaticPaths()` that normalizes `/imprint/`, `imprint`, `imprint/`, `/data-policy/`, `data-policy`, and `data-policy/`. Render only legal pages; if `/` exists, return a temporary local "not migrated yet" page or exclude it from static paths in M2.

- [ ] **Step 4: Keep debug route available**

Leave `src/pages/debug.astro` in place for M1/M2 inspection. Do not delete it until M2 routes are verified.

- [ ] **Step 5: Build and compare legal pages**

Run:

```bash
pnpm build
pnpm compare:legal
```

Expected: both commands PASS and `/imprint/` plus `/data-policy/` are present in `dist/`.

- [ ] **Step 6: Commit legal routes**

Run:

```bash
git status --short
git diff -- src/pages src/components
git add src/pages src/components
git commit -m "Render legal pages in Astro"
```

Expected: commit contains only legal route/module-rendering changes.

---

### Task 4: Visual, Cookie, Font, ADR, And Completion Gate

**Files:**
- Modify if approved: `src/styles/global.css`
- Create if license allows: `src/fonts/*.woff2`
- Create if needed: `docs/adrs/adr_XX-fonts.md`

**Interfaces:**
- Consumes: built legal pages from Tasks 1-3.
- Produces: verified M2 legal-page milestone.

- [ ] **Step 1: Verify font license**

Check whether NeuzeitOffice bold/medium/light may be self-hosted as woff2 files in this repository. If allowed, add files under `src/fonts/` and `@font-face` rules with `font-display: swap`. If not allowed, stop and ask the user to choose an approved substitute before visual verification.

- [ ] **Step 2: Manual browser comparison**

Run `pnpm develop`, open Astro `/imprint/` and `/data-policy/`, and compare against the live URLs. Confirm no meaningful layout or typography regression, excluding the deliberately removed cookie banner and Contentful badge.

- [ ] **Step 3: Cookie/storage check**

In browser dev tools or with response headers, confirm the Astro pages set no cookies, show no cookie banner, use no service worker, and do not write client-side storage.

- [ ] **Step 4: Run final M2 verification**

Run:

```bash
pnpm build
pnpm compare:legal
npm run lint
```

Expected: all commands PASS.

- [ ] **Step 5: Review for ADR need**

Add an ADR only if M2 confirms a significant decision not already documented, especially font self-hosting or a font substitution decision.

- [ ] **Step 6: Commit verification docs, fonts, or ADRs if added**

Run:

```bash
git status --short
git diff
git add src/styles/global.css src/fonts docs/adrs
git commit -m "Verify Astro legal page parity"
```

Expected: commit includes only Task 4 artifacts. If a listed path does not exist, omit that path from `git add`. Skip commit if no files changed.

- [ ] **Step 7: Completion summary**

Report verification evidence, manual visual comparison result, cookie/storage result, font decision, ADR status, and commit hashes. State that M3 must not start until this M2 gate is accepted.
