# M3.5 Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the visual, validity, SEO, and dependency defects surfaced by review of the M3 Astro state, then verify the result against the live site with Playwright.

**Architecture:** Refactor `Header.astro` and `Footer.astro` to be grid containers themselves (mirroring the original styled-components structure where `HeaderArea`/`FooterArea` extended `MainGrid`), rather than wrapping a `<MainGrid>` as grid items. Layer on `astro-seo` + `@astrojs/sitemap` for the SEO surface, swap the invalid `<a><button></button></a>` for a single styled `<a>`, fix the 404 copy, and clean up stale/old dependencies. A final Playwright comparison against `www.rhode-medizin.de` catches any remaining regressions.

**Tech Stack:** Astro 7, `astro-seo`, `@astrojs/sitemap`, `dotenv` v17, Playwright CLI (`@playwright/cli`), pnpm.

## Global Constraints

- Package manager is **pnpm** (see AGENTS.md). No `package-lock.json` may be committed.
- Prettier config: **no semicolons, single quotes, ES5 trailing commas, 2-space indent, LF** (see AGENTS.md).
- German-only site; all user-facing copy is German.
- No cookies, no service worker, no client-side storage, no PWA manifest (deliberate removal per M5 design).
- NeuzeitOffice web fonts are **out of scope** — site renders in Arial fallback. Do not add `@font-face` rules.
- Contentful field names are German (`hauptueberschrift`, `unterueberschrift`, `volleBreite`, `seitenabschnitt`, `inhalte`). Preserve this convention.
- The build runs `astro check` (TypeScript diagnostics) then `astro build`. Both must pass.
- Every task ends with `pnpm lint` passing unless the task explicitly scopes it out.
- `dotenv` is loaded via `import 'dotenv/config'` at the top of `src/content/loaders/contentful.ts:1`.
- The `Seite` Contentful type has no SEO description field; the homepage SEO description is hardcoded German text, not sourced from Contentful.
- SEO applies to the homepage only — `/imprint/` and `/data-policy/` get no SEO tags beyond charset/viewport/title.

## File Structure

- **Modify** `src/layouts/Layout.astro` — consume `astro-seo`, accept optional `seo` props, render favicon link, restructure header/footer placement.
- **Modify** `src/components/Header.astro` — become a grid container spanning `1 / 5` (carry the grid rules directly).
- **Modify** `src/components/Footer.astro` — become a grid container spanning `1 / 5`, add scoped `text-decoration: underline` rule for `.footer-link`.
- **Modify** `src/components/MainGrid.astro` — extract the shared grid-container CSS so Header/Footer/MainContent can reuse it without re-wrapping.
- **Modify** `src/components/HeroBlock.astro` — pass `href="/imprint/"` to `CallToActionButton`, drop the wrapping `<a>`.
- **Modify** `src/components/CallToActionButton.astro` — render a single `<a>` element (always a link), accept `href` prop.
- **Modify** `src/pages/404.astro` — replace English body copy with German.
- **Modify** `src/pages/[...slug].astro` — pass homepage SEO defaults to `<Layout>` when slug is the homepage.
- **Modify** `astro.config.mjs` — set `site: 'https://www.rhode-medizin.de'`, add `@astrojs/sitemap` integration.
- **Create** `public/favicon.png` — small square logo for the favicon.
- **Create** `public/robots.txt` — allow all crawlers, point to sitemap.
- **Modify** `package.json` — add `astro-seo`, `@astrojs/sitemap`; upgrade `dotenv` to `^17.0.0`.
- **Delete** `package-lock.json` — stale npm artifact.
- **Modify** `.gitignore` — add `package-lock.json` if not present.
- **Create** `docs/adrs/adr_05_astro_seo.md` — document the `astro-seo` decision.
- **Create** `docs/adrs/adr_06_header_footer_grid.md` — document the layout refactor.
- **Create** `docs/superpowers/m3-5-playwright-report.md` — written comparison report from the Playwright verification.

---

### Task 1: Delete stale `package-lock.json` and ignore it

**Files:**
- Delete: `package-lock.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: a repo with no `package-lock.json` and a `.gitignore` entry preventing re-commit.

- [ ] **Step 1: Check current `.gitignore` for `package-lock.json`**

Run: `grep -n "package-lock" .gitignore`
Expected: no match (the entry is not present).

- [ ] **Step 2: Add `package-lock.json` to `.gitignore`**

Append this line to `.gitignore` (after the `.env` line):

```
package-lock.json
```

- [ ] **Step 3: Remove `package-lock.json` from git tracking**

Run: `git rm --cached package-lock.json`
Expected: `rm 'package-lock.json'` (file is untracked but remains on disk).

- [ ] **Step 4: Delete the file from disk**

Run: `rm -f package-lock.json`
Expected: no output.

- [ ] **Step 5: Verify lint still passes**

Run: `pnpm lint`
Expected: PASS (all files formatted correctly).

- [ ] **Step 6: Commit**

```bash
git add .gitignore
git commit -m "Remove stale package-lock.json, ignore it going forward"
```

---

### Task 2: Upgrade `dotenv` to v17

**Files:**
- Modify: `package.json`
- Regenerate: `pnpm-lock.yaml`

**Interfaces:**
- Produces: `dotenv` resolved to `^17.0.0`; `import 'dotenv/config'` at `src/content/loaders/contentful.ts:1` continues to work.

- [ ] **Step 1: Update `package.json`**

In `package.json`, change the `dotenv` dependency from:

```json
"dotenv": "^7.0.0",
```

to:

```json
"dotenv": "^17.0.0",
```

- [ ] **Step 2: Install and regenerate the lockfile**

Run: `pnpm install`
Expected: pnpm resolves `dotenv@17.x`, updates `pnpm-lock.yaml`, prints no peer-dependency warnings about `dotenv`.

- [ ] **Step 3: Verify the build still loads `.env`**

This requires Contentful credentials in `.env`. If `.env` is present:

Run: `pnpm build`
Expected: build succeeds (no `Missing CONTENTFUL_SPACE_ID` error, no `dotenv` import error).

If `.env` is not present, skip this step and note it in the commit body — the build will be re-verified in Task 11.

- [ ] **Step 4: Verify lint passes**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "Upgrade dotenv to v17"
```

---

### Task 3: Refactor `Header.astro` to be a grid container

**Files:**
- Modify: `src/components/MainGrid.astro:1-6` (comment-only clarification, no behavioral change)
- Modify: `src/components/Header.astro:7-22` (markup), `:24-53` (style)
- Modify: `src/layouts/Layout.astro`

**Interfaces:**
- Consumes: `ContentBox.astro` (unchanged), `logo@2x.png` (unchanged).
- Produces: `Header.astro` renders a `<header class="header">` that is itself the grid container (no inner `<MainGrid>` wrapper). Its `> *` rule places children in the main column. The header spans `1 / 5` so the logo sits in the left column aligned with the text below, as in the original.

- [ ] **Step 1: Add a clarifying comment to `MainGrid.astro`**

In `src/components/MainGrid.astro`, replace the existing comment:

```astro
---
// Native Astro port of src/components/mainGrid.jsx.
// Used as a grid wrapper that places children in the main column on
// large screens, and falls back to a flex column on smaller screens.
const { gridRow = 'auto' } = Astro.props
---
```

with:

```astro
---
// Native Astro port of src/components/mainGrid.jsx.
// Used as a grid wrapper that places children in the main column on
// large screens, and falls back to a flex column on smaller screens.
// Header.astro and Footer.astro carry their own copy of these grid
// rules so they can span 1 / 5 without being constrained as grid items.
const { gridRow = 'auto' } = Astro.props
---
```

No behavioral change — this is documentation for future readers, captured here rather than as a separate commit/review cycle.

- [ ] **Step 2: Read the original styled-components source for reference**

Run: `git show HEAD~30:src/components/header.jsx 2>/dev/null || git log --all --oneline -- src/components/header.jsx`
Expected: locate the original `header.jsx`. The key structure is that `HeaderArea` extends `MainGrid` and carries `grid-column: 1 / 5; grid-row: 1;` plus the grid container rules. The Astro port must mirror this.

If the file is no longer in history, use the captured live fixture at `tests/fixtures/live/index.html:32` (the `.kOXUir` styled-components rule) as the reference: `grid-column: 1 / 5; grid-row: 1;` and the same `@media (min-width: 800px)` grid container block as `MainGrid.astro`.

- [ ] **Step 3: Rewrite `Header.astro` markup**

Replace the full contents of `src/components/Header.astro` with:

```astro
---
import ContentBox from './ContentBox.astro'
import logoSrc from '../images/logo@2x.png'
---

<header class="header">
  <ContentBox extraVerticalPadding>
    <a href="/">
      <img
        class="logo"
        src={logoSrc.src}
        width={460}
        height={30}
        alt="Heinrich Rhode GmbH"
      />
    </a>
    <div class="company-type">Medizintechnik</div>
  </ContentBox>
</header>

<style>
  .header {
    grid-column: 1 / 5;
    color: var(--color-company-blue);
    padding: 0 var(--outer-padding);
  }

  .logo {
    max-width: 460px;
    width: 100%;
    height: auto;
  }

  .company-type {
    text-transform: uppercase;
    font-size: var(--font-size-xl-small);
    line-height: var(--line-height-xl-small);
  }

  @media (min-width: 800px) {
    .header {
      display: flex;
      flex-direction: column;
      display: grid;
      grid-template-columns: var(--main-grid-columns);
      justify-items: stretch;
      padding: 0;
    }

    .header > :global(*) {
      grid-column: main-column-start / side-column-end;
    }

    .company-type {
      font-size: var(--font-size-xl-large);
      line-height: var(--line-height-xl-large);
    }
  }
</style>
```

Key changes from the previous version:
- Removed the `import MainGrid from './MainGrid.astro'` and the wrapping `<MainGrid>` element.
- Added `grid-column: 1 / 5` to `.header` (was previously `1 / 5` on the outer wrapper inherited from `MainGrid`'s `grid-column: 1 / 5`, but the header itself was a grid item constrained to `main-column-start / side-column-end`).
- Added the `display: grid; grid-template-columns: var(--main-grid-columns)` block and the `> :global(*) { grid-column: main-column-start / side-column-end }` rule directly on `.header`, matching `MainGrid.astro`'s behavior.

- [ ] **Step 4: Update `Layout.astro` so the header is a direct child of the outer grid, not wrapped in a `MainGrid`**

Read `src/layouts/Layout.astro`. The current structure is:

```astro
<MainGrid>
  <div class="side-background" style="grid-row: 1 / 4;"></div>
  <Header gridRow="1" />
  <slot />
  <Footer gridRow="3" />
</MainGrid>
```

This must change so the header and footer are direct children of `.global-wrapper` (which itself becomes the outer grid). Replace the full `<body>` contents and `<style>` block of `src/layouts/Layout.astro` with:

```astro
---
import '../styles/global.css'
import Header from '../components/Header.astro'
import Footer from '../components/Footer.astro'
import MainContent from '../components/MainContent.astro'

const { title = 'Rhode Medizintechnik' } = Astro.props
---

<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
  </head>
  <body>
    <div class="global-wrapper">
      <div class="side-background"></div>
      <Header />
      <slot />
      <Footer />
    </div>
  </body>
</html>

<style>
  .global-wrapper {
    max-width: var(--layout-max-width);
    margin: 0 auto;
    background-color: var(--color-light-yellow);
  }

  .side-background {
    display: none;
  }

  @media (min-width: 800px) {
    @supports (display: grid) {
      .global-wrapper {
        max-width: none;
        margin: 0;
        display: grid;
        grid-template-columns: var(--main-grid-columns);
        grid-template-rows: auto 1fr auto;
      }

      .side-background {
        display: block;
        background-color: var(--color-light-blue);
        grid-column: side-column-start / 5;
        grid-row: 1 / 4;
      }
    }
  }
</style>
```

Key changes:
- Removed the wrapping `<MainGrid>` — Header, slot (MainContent), and Footer are now direct children of `.global-wrapper`.
- `.global-wrapper` becomes the outer grid container at the `min-width: 800px` breakpoint, mirroring the original styled-components `GlobalWrapper` + `MainGrid` combination.
- `.side-background` now spans `side-column-start / 5` (was `side-column-start / side-column-end`), filling the right margin column with light blue as in the original.
- `.side-background` is `display: none` on small screens (it was previously always rendered but had no visible effect because it was the only item in its column track on small screens; making it explicit avoids accidental layout shifts).
- Removed `gridRow` props from `<Header>` and `<Footer>` — their grid-row is now determined by source order in `.global-wrapper`'s `grid-template-rows: auto 1fr auto`.

**Note on `MainContent.astro`:** `MainContent.astro` already carries `grid-column: 1 / 5` and the grid-container rules for its own children (see `src/components/MainContent.astro:13-29`). It becomes the middle row of `.global-wrapper`. No change to `MainContent.astro` is needed in this task.

- [ ] **Step 5: Verify lint passes**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 6: Verify build succeeds**

Run: `pnpm build`
Expected: build succeeds (or fails only with the Contentful credentials error).

- [ ] **Step 7: Run fixture comparison as regression canary**

Run: `pnpm compare:legal && pnpm compare:pages`
Expected: both pass. The legal page article content must still match the captured fixtures — the layout shell refactor must not change article grid placement or typography.

If the comparison fails, the refactor broke the article grid. Inspect the diff and adjust the grid rules in `Layout.astro` / `Header.astro` / `MainContent.astro` until the comparison passes. Do not proceed to Task 4 with a failing comparison.

- [ ] **Step 8: Commit**

```bash
git add src/components/MainGrid.astro src/components/Header.astro src/layouts/Layout.astro
git commit -m "Refactor Header to be a grid container

The M2/M3 port wrapped Header in a MainGrid, making it a grid item
constrained to main-column-start / side-column-end. This caused the
header to render collapsed in the main column with a centered logo
rather than spanning full width. Mirror the original styled-components
structure where HeaderArea extended MainGrid and carried grid-column
1 / 5 plus the grid container rules itself.

Layout.astro now becomes the outer grid container (.global-wrapper)
and the side-background spans side-column-start / 5, filling the
right margin column with light blue as in the original.

Fixture comparison (compare:legal, compare:pages) re-run as the
regression canary."
```

---

### Task 4: Refactor `Footer.astro` to be a grid container and underline links

**Files:**
- Modify: `src/components/Footer.astro:6-25` (markup and style)

**Interfaces:**
- Consumes: `ContentBox.astro` (unchanged).
- Produces: `Footer.astro` renders a `<footer class="footer">` that is itself the grid container (no inner `<MainGrid>` wrapper). Its `> *` rule places children in the main column. The footer spans `1 / 5` so its background color fills the full width. Footer links are underlined via a scoped rule.

- [ ] **Step 1: Rewrite `Footer.astro`**

Replace the full contents of `src/components/Footer.astro` with:

```astro
---
import ContentBox from './ContentBox.astro'
---

<footer class="footer">
  <ContentBox extraVerticalPadding>
    <a class="footer-link" href="/imprint/">Impressum</a>
    <a class="footer-link" href="/data-policy/">Datenschutzhinweis</a>
  </ContentBox>
</footer>

<style>
  .footer {
    grid-column: 1 / 5;
    background-color: var(--color-darker-purple);
    color: var(--color-light-yellow);
    padding: 0 var(--outer-padding);
  }

  .footer-link {
    color: var(--color-light-yellow);
    margin-right: var(--base-line-height);
    text-decoration: underline;
  }

  @media (min-width: 800px) {
    .footer {
      display: flex;
      flex-direction: column;
      display: grid;
      grid-template-columns: var(--main-grid-columns);
      justify-items: stretch;
      padding: 0;
    }

    .footer > :global(*) {
      grid-column: main-column-start / side-column-end;
    }
  }
</style>
```

Key changes from the previous version:
- Removed the `import MainGrid from './MainGrid.astro'` and the wrapping `<MainGrid>` element.
- Added `grid-column: 1 / 5` to `.footer` so the background color fills the full width.
- Added the grid container rules directly on `.footer`, matching `Header.astro` and `MainGrid.astro`.
- Added `padding: 0 var(--outer-padding)` on small screens (was previously inherited from the outer `.footer` rule) and `padding: 0` on large screens inside the `@media` block.
- Added `text-decoration: underline` to `.footer-link` to restore the underline that the original styled-components inherited from the browser default (the global `a { text-decoration: none }` rule in `global.css:47-50` strips it).

- [ ] **Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 3: Verify build succeeds**

Run: `pnpm build`
Expected: build succeeds (or fails only with the Contentful credentials error).

- [ ] **Step 4: Run fixture comparison as regression canary**

Run: `pnpm compare:legal && pnpm compare:pages`
Expected: both pass. The footer is not part of the article fixture comparison, but the layout shell change could affect the article grid placement.

If the comparison fails, inspect and fix as in Task 3 Step 7.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.astro
git commit -m "Refactor Footer to be a grid container, underline links

The M2/M3 port wrapped Footer in a MainGrid, making it a grid item
constrained to main-column-start / side-column-end. The background
color therefore did not fill the full width. Mirror the original
styled-components structure where FooterArea extended MainGrid and
carried grid-column 1 / 5 plus the grid container rules itself.

Restore the underline on footer links: the global
a { text-decoration: none } rule in global.css strips it, but the
original styled-reset did not reset anchor decoration, so the live
site's footer links are underlined. Scope the underline to .footer-link
so the logo link and CTA remain non-underlined."
```

---

### Task 5: Make `CallToActionButton` a link and fix invalid HTML in `HeroBlock`

**Files:**
- Modify: `src/components/CallToActionButton.astro:1-44`
- Modify: `src/components/HeroBlock.astro:49-55`

**Interfaces:**
- Produces: `CallToActionButton.astro` accepts `text: string` and `href: string` props and renders a single `<a class="cta-button">`. No `<button>` fallback, no `href` branching. `HeroBlock.astro` passes `href="/imprint/"` and drops the wrapping `<a>`.

- [ ] **Step 1: Rewrite `CallToActionButton.astro`**

Replace the full contents of `src/components/CallToActionButton.astro` with:

```astro
---
// Native Astro port of src/components/callToActionButton.jsx.
// The original was a styled <button> wrapped in a Gatsby <Link> by
// heroBlock.jsx, which produced invalid HTML (<button> inside <a>).
// We render a single styled <a> instead.
interface Props {
  text: string
  href: string
}

const { text, href } = Astro.props
---

<a class="cta-button" href={href}>{text}</a>

<style>
  .cta-button {
    color: var(--color-company-blue);
    text-shadow: 0 0 15px white;
    background:
      linear-gradient(rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0.1)),
      var(--color-yellow);
    padding: 10px var(--inner-padding);
    border: 1px solid var(--color-yellow);
    border-radius: 3px;
    overflow: hidden;
    box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.5);
    font-family: var(--font-bold);
    font-size: var(--font-size-l-small);
    line-height: var(--line-height-l-small);
    font-weight: bold;
    justify-self: start;
    text-decoration: none;
  }

  @media (min-width: 800px) {
    .cta-button {
      font-size: var(--font-size-l-large);
      line-height: var(--line-height-l-large);
      padding: 10px var(--double-base-line-height);
    }
  }
</style>
```

Key changes:
- Added `href: string` to `Props` and destructured it.
- Replaced `<button class="cta-button" type="button">` with `<a class="cta-button" href={href}>`.
- Added `text-decoration: none` to `.cta-button` (the global `a { text-decoration: none }` rule already covers this, but scoping it makes the intent explicit and guards against future changes to the global rule).
- Removed `cursor: pointer` (no longer needed — `<a>` is a link and has pointer cursor by default).
- Updated the comment at the top to explain the element change.

- [ ] **Step 2: Update `HeroBlock.astro` to pass `href` and drop the wrapping `<a>`**

In `src/components/HeroBlock.astro`, replace the CTA block (currently lines 49-55):

```astro
    {
      callToAction && (
        <a href="/imprint/">
          <CallToActionButton text={callToAction} />
        </a>
      )
    }
```

with:

```astro
    {callToAction && <CallToActionButton text={callToAction} href="/imprint/" />}
```

- [ ] **Step 3: Verify lint passes**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 4: Verify build succeeds**

Run: `pnpm build`
Expected: build succeeds (or fails only with the Contentful credentials error).

- [ ] **Step 5: Run fixture comparison as regression canary**

Run: `pnpm compare:legal && pnpm compare:pages`
Expected: both pass. `CallToActionButton` only renders on the homepage; the legal pages don't use it. The homepage comparison fixture (`tests/fixtures/live/index.html`) was captured from the live site which ships the same invalid `<button>`-in-`<a>` markup, so the comparison script's normalization must not flag the element change. If the comparison fails on the homepage, inspect the diff — if it is only the `<button>` → `<a>` change, the comparison script may need a normalization update. Document any normalization change in the commit body.

- [ ] **Step 6: Commit**

```bash
git add src/components/CallToActionButton.astro src/components/HeroBlock.astro
git commit -m "Render CallToActionButton as a link, not a button in an anchor

<button> nested inside <a> is invalid HTML (interactive element
nesting). Make CallToActionButton render a single styled <a> and
have HeroBlock pass href=/imprint/ directly. The CTA destination
remains /imprint/ as in the original heroBlock.jsx; the Contentful
HeroBlock has a callToAction text field but no link field."
```

---

### Task 6: Rewrite 404 page copy in German

**Files:**
- Modify: `src/pages/404.astro:10-11`

**Interfaces:**
- Produces: German 404 body copy. The page title passed to `<Layout>` is already `Seite nicht gefunden` (`404.astro:7`), so the `<title>` is already German.

- [ ] **Step 1: Replace the English body copy**

In `src/pages/404.astro`, replace lines 10-11:

```astro
      <h1>NOT FOUND</h1>
      <p>You just hit a route that doesn't exist... the sadness.</p>
```

with:

```astro
      <h1>Seite nicht gefunden</h1>
      <p>Die angeforderte Seite existiert nicht.</p>
```

- [ ] **Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 3: Verify build succeeds**

Run: `pnpm build`
Expected: build succeeds (or fails only with the Contentful credentials error). Astro generates `dist/404.html` from `src/pages/404.astro`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/404.astro
git commit -m "Translate 404 page copy to German"
```

---

### Task 7: Add `astro-seo` and wire up homepage SEO

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Modify: `astro.config.mjs`
- Modify: `src/layouts/Layout.astro`
- Modify: `src/pages/[...slug].astro`
- Create: `public/favicon.png`

**Interfaces:**
- Produces: `Layout.astro` accepts an optional `seo` prop (the shape of `astro-seo`'s `<SEO>` component props). When `seo` is provided, `<SEO>` renders with those props; when absent, only `<title>` is emitted (via `titleDefault`). `[...slug].astro` passes hardcoded German SEO defaults for the homepage only.

- [ ] **Step 1: Install `astro-seo`**

Run: `pnpm add astro-seo`
Expected: `astro-seo` added to `package.json` dependencies, `pnpm-lock.yaml` updated.

- [ ] **Step 2: Set `site` in `astro.config.mjs`**

Replace the contents of `astro.config.mjs` with:

```javascript
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  output: 'static',
  site: 'https://www.rhode-medizin.de',
  vite: {
    resolve: {
      alias: {
        '@content-loaders': fileURLToPath(
          new URL('./src/content/loaders', import.meta.url),
        ),
      },
    },
  },
})
```

The `@astrojs/sitemap` integration is added in Task 8; this task only sets `site`.

- [ ] **Step 3: Create `public/favicon.png`**

Copy the existing square logo to `public/favicon.png`:

Run: `mkdir -p public && cp src/images/logo_small_initials.png public/favicon.png`
Expected: `public/favicon.png` exists.

Verify the file is a reasonable size for a favicon (it does not need to be `.ico`; modern browsers accept `.png`):

Run: `ls -l public/favicon.png`
Expected: file exists, size > 0.

- [ ] **Step 4: Rewrite `Layout.astro` to consume `astro-seo` and render favicon**

Replace the full contents of `src/layouts/Layout.astro` with:

```astro
---
import '../styles/global.css'
import { SEO } from 'astro-seo'
import Header from '../components/Header.astro'
import Footer from '../components/Footer.astro'

interface SeoProps {
  title: string
  description: string
  openGraph?: {
    basic: { title: string; type: string; image: string; url: string }
    optional?: { locale?: string; siteName?: string }
  }
  twitter?: {
    card: string
    title?: string
    description?: string
    image?: string
    imageAlt?: string
  }
}

interface Props {
  title?: string
  seo?: SeoProps
}

const { title = 'Rhode Medizintechnik', seo } = Astro.props
---

<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    {seo ? (
      <SEO
        title={seo.title}
        description={seo.description}
        openGraph={seo.openGraph}
        twitter={seo.twitter}
        extend={{
          link: [{ rel: 'icon', href: '/favicon.png' }],
        }}
      />
    ) : (
      <title>{title}</title>
    )}
  </head>
  <body>
    <div class="global-wrapper">
      <div class="side-background"></div>
      <Header />
      <slot />
      <Footer />
    </div>
  </body>
</html>

<style>
  .global-wrapper {
    max-width: var(--layout-max-width);
    margin: 0 auto;
    background-color: var(--color-light-yellow);
  }

  .side-background {
    display: none;
  }

  @media (min-width: 800px) {
    @supports (display: grid) {
      .global-wrapper {
        max-width: none;
        margin: 0;
        display: grid;
        grid-template-columns: var(--main-grid-columns);
        grid-template-rows: auto 1fr auto;
      }

      .side-background {
        display: block;
        background-color: var(--color-light-blue);
        grid-column: side-column-start / 5;
        grid-row: 1 / 4;
      }
    }
  }
</style>
```

Key changes from Task 3's version:
- Added `import { SEO } from 'astro-seo'`.
- Added the `SeoProps` interface and the optional `seo` prop on `Props`.
- When `seo` is provided, render `<SEO>` with those props (it emits `<title>`, meta description, OG tags, and the favicon link via `extend`).
- When `seo` is absent, render a plain `<title>{title}</title>` (no description, no OG, no canonical) — this is the path legal pages and the 404 take.
- Removed the `MainContent` import (it was never used directly in `Layout.astro`; the slot receives it from `[...slug].astro`). If the original `Layout.astro` did import `MainContent` and it was unused, removing it is correct. If `Layout.astro` did not import `MainContent`, simply omit that line.

- [ ] **Step 5: Pass homepage SEO defaults from `[...slug].astro`**

Replace the frontmatter and `<Layout>` opening of `src/pages/[...slug].astro` with:

```astro
---
import { getCollection } from 'astro:content'
import Layout from '../layouts/Layout.astro'
import MainContent from '../components/MainContent.astro'
import ModuleRenderer from '../components/ModuleRenderer.astro'

// Renders all Contentful pages: the homepage (/) plus legal pages.
// A Contentful slug of '/' or '' maps to Astro path undefined so it
// renders at the site root.
export async function getStaticPaths() {
  const normalize = (slug: string): string =>
    slug.replace(/^\/+/, '').replace(/\/+$/, '')
  const pages = await getCollection('pages')
  return pages.map((page) => {
    const slug = normalize(page.data.slug)
    return {
      params: { slug: slug === '' ? undefined : slug },
      props: { page },
    }
  })
}

const { page } = Astro.props
const slug = page.data.slug.replace(/^\/+/, '').replace(/\/+$/, '')
const isHomepage = slug === ''
const title = isHomepage
  ? 'Rhode Medizintechnik – Heinrich Rhode GmbH'
  : slug === 'data-policy'
    ? 'Datenschutzhinweis'
    : slug === 'imprint'
      ? 'Impressum'
      : 'Rhode Medizintechnik'

// Homepage hero image absolute URL for OG/Twitter. The hero image
// comes from Contentful; we read it from the first ContentfulHeroBlock
// in the page's module tree.
const modules = page.data.module as unknown as {
  __typename: string
  id: string
  bild?: { src: string; width: number; height: number; title?: string; description?: string }
  [key: string]: unknown
}[]
const heroBlock = modules.find((m) => m.__typename === 'ContentfulHeroBlock')
const heroImageSrc = heroBlock?.bild?.src
const homepageOgImage = heroImageSrc
  ? new URL(heroImageSrc, Astro.site).toString()
  : undefined

const seo = isHomepage
  ? {
      title: 'Rhode Medizintechnik – Heinrich Rhode GmbH',
      description:
        'Heinrich Rhode GmbH – Medizintechnik für Praxen und Kliniken. Beratung, Service und Produkte aus einer Hand.',
      openGraph: {
        basic: {
          title: 'Rhode Medizintechnik – Heinrich Rhode GmbH',
          type: 'website',
          image: homepageOgImage ?? 'https://www.rhode-medizin.de/favicon.png',
          url: 'https://www.rhode-medizin.de/',
        },
        optional: {
          locale: 'de_DE',
          siteName: 'Heinrich Rhode GmbH',
        },
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Rhode Medizintechnik – Heinrich Rhode GmbH',
        description:
          'Heinrich Rhode GmbH – Medizintechnik für Praxen und Kliniken. Beratung, Service und Produkte aus einer Hand.',
        image: homepageOgImage,
      },
    }
  : undefined
---

<Layout title={title} seo={seo}>
  <MainContent gridRow="2">
    {modules.map((mod) => <ModuleRenderer module={mod} />)}
  </MainContent>
</Layout>
```

Key changes:
- Added `isHomepage` boolean.
- Changed the homepage `title` to `Rhode Medizintechnik – Heinrich Rhode GmbH` (was `Rhode Medizintechnik`).
- Resolved the hero image absolute URL from the page's `ContentfulHeroBlock.bild.src` (Contentful returns absolute HTTPS URLs; `new URL(src, Astro.site)` is a safety net in case Contentful returns a protocol-relative URL).
- Built the `seo` object for the homepage only; legal pages pass `seo={undefined}` and get only `<title>`.
- The `twitter.image` falls back to `undefined` when there is no hero image, which `astro-seo` handles by omitting the tag.

- [ ] **Step 6: Verify lint passes**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 7: Verify build succeeds**

Run: `pnpm build`
Expected: build succeeds. `astro check` must pass — the `SeoProps` interface in `Layout.astro` must be compatible with `astro-seo`'s `<SEO>` component props. If `astro check` reports type mismatches, adjust the `SeoProps` interface to match `astro-seo`'s exported types (import the types from `astro-seo` if available).

- [ ] **Step 8: Verify SEO tags render in the homepage build**

Run: `pnpm build && grep -o '<meta[^>]*property="og:[^>]*>' dist/index.html | head -10`
Expected: at least `og:title`, `og:type`, `og:url`, `og:image`, `og:locale` are present.

Run: `grep -o '<meta name="description"[^>]*>' dist/index.html`
Expected: one match with the hardcoded German description.

Run: `grep -o '<link rel="icon"[^>]*>' dist/index.html`
Expected: one match pointing to `/favicon.png`.

- [ ] **Step 9: Verify SEO tags do NOT render on legal pages**

Run: `grep -c 'property="og:' dist/imprint/index.html`
Expected: `0` (no OG tags on the imprint page).

Run: `grep -c 'name="description"' dist/imprint/index.html`
Expected: `0` (no description tag on the imprint page).

- [ ] **Step 10: Run fixture comparison as regression canary**

Run: `pnpm compare:legal && pnpm compare:pages`
Expected: both pass. The SEO tags are in `<head>` and should not affect the article fixture comparison. If the homepage comparison fails because the fixture script compares `<head>` contents, inspect the diff and update the script's normalization rules if needed (document any change in the commit body).

- [ ] **Step 11: Commit**

```bash
git add package.json pnpm-lock.yaml astro.config.mjs src/layouts/Layout.astro src/pages/'[...slug].astro' public/favicon.png
git commit -m "Add astro-seo, wire up homepage SEO, add favicon

Layout.astro now accepts an optional seo prop and renders
astro-seo's <SEO> component when provided, emitting title, meta
description, Open Graph, Twitter card, and favicon link tags. When
seo is absent (legal pages, 404), only a plain <title> is rendered.

[...slug].astro passes hardcoded German SEO defaults for the
homepage only. The description is short, factual German text — not
the Gatsby-era 'Sample' placeholder. The Contentful Seite type has
no SEO description field, so the description is hardcoded in code.

Set site=https://www.rhode-medizin.de in astro.config.mjs so
astro-seo's canonical/OG URL defaults and the sitemap (Task 8) emit
absolute URLs. Add public/favicon.png (copy of logo_small_initials.png)
and reference it via astro-seo's extend.link. No apple-touch-icon or
manifest (deliberate PWA removal per M5 design)."
```

---

### Task 8: Add `@astrojs/sitemap` and `robots.txt`

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Modify: `astro.config.mjs`
- Create: `public/robots.txt`

**Interfaces:**
- Produces: `/sitemap-index.xml` and `/sitemap-0.xml` generated at build time from all static routes. `/robots.txt` allows all crawlers and points to the sitemap.

- [ ] **Step 1: Install `@astrojs/sitemap`**

Run: `pnpm add @astrojs/sitemap`
Expected: `@astrojs/sitemap` added to `package.json` dependencies, `pnpm-lock.yaml` updated.

- [ ] **Step 2: Register the sitemap integration in `astro.config.mjs`**

Replace the contents of `astro.config.mjs` with:

```javascript
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  output: 'static',
  site: 'https://www.rhode-medizin.de',
  integrations: [sitemap()],
  vite: {
    resolve: {
      alias: {
        '@content-loaders': fileURLToPath(
          new URL('./src/content/loaders', import.meta.url),
        ),
      },
    },
  },
})
```

- [ ] **Step 3: Create `public/robots.txt`**

Create `public/robots.txt` with:

```
User-agent: *
Allow: /

Sitemap: https://www.rhode-medizin.de/sitemap-index.xml
```

- [ ] **Step 4: Verify lint passes**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 5: Verify build succeeds and emits the sitemap**

Run: `pnpm build`
Expected: build succeeds.

Run: `ls dist/sitemap-index.xml dist/sitemap-0.xml`
Expected: both files exist.

Run: `grep -c 'imprint' dist/sitemap-0.xml && grep -c 'data-policy' dist/sitemap-0.xml && grep -c 'rhode-medizin.de/' dist/sitemap-0.xml`
Expected: each returns at least `1` (all three routes are listed).

- [ ] **Step 6: Verify robots.txt is copied to dist**

Run: `ls dist/robots.txt`
Expected: file exists.

Run: `cat dist/robots.txt`
Expected: the two lines from `public/robots.txt`.

- [ ] **Step 7: Run fixture comparison as regression canary**

Run: `pnpm compare:legal && pnpm compare:pages`
Expected: both pass.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml astro.config.mjs public/robots.txt
git commit -m "Add sitemap and robots.txt

Register @astrojs/sitemap, which auto-generates /sitemap-index.xml
and /sitemap-0.xml from all static routes at build time. Add
public/robots.txt allowing all crawlers and pointing to the sitemap.
Legal pages appear in the sitemap — this is acceptable (sitemap ≠
indexing; they are simply not given SEO tags, so they remain
indexable by default)."
```

---

### Task 9: Write ADRs for `astro-seo` and the Header/Footer refactor

**Files:**
- Create: `docs/adrs/adr_05_astro_seo.md`
- Create: `docs/adrs/adr_06_header_footer_grid.md`

**Interfaces:**
- Produces: two ADRs following the format of `docs/adrs/adr_01_astro.md` through `adr_04_fonts.md`. Concise; rationale only where known from the spec or implementation.

- [ ] **Step 1: Read an existing ADR for format reference**

Run: `cat docs/adrs/adr_04_fonts.md`
Expected: the file's structure (heading, context, decision, consequences). Mirror this format.

- [ ] **Step 2: Write `docs/adrs/adr_05_astro_seo.md`**

```markdown
# ADR 5: Use astro-seo for SEO tag management

## Context

The M3 Astro port emitted only `<title>` in the `<head>`. The production-readiness milestone (M3.5) requires meta description, Open Graph, Twitter card, canonical, and favicon tags on the homepage. These could be hand-rolled as static meta tags in `Layout.astro`, or delegated to a component that structures the prop surface and emits tags according to the Open Graph and Twitter Card specifications.

## Decision

Add `astro-seo` as a dependency and use its `<SEO>` component inside `Layout.astro`'s `<head>`. Pass SEO props only from the homepage; legal pages and the 404 render a plain `<title>`.

## Consequences

- `Layout.astro` accepts an optional `seo` prop whose shape mirrors `astro-seo`'s `<SEO>` component props.
- SEO tags are structured and validated against the OG/Twitter specs by the component, rather than hand-maintained strings.
- Trade-off: a runtime dependency for what could be static tags. Accepted because the OG/Twitter tag surface is large enough that hand-rolling invites drift, and `astro-seo` is a single `.astro` component with no client-side JavaScript.
- The homepage SEO description is hardcoded in code (not sourced from Contentful) because the `Seite` Contentful type has no description field. A future Contentful schema change would require code changes here.
```

- [ ] **Step 3: Write `docs/adrs/adr_06_header_footer_grid.md`**

```markdown
# ADR 6: Header and Footer as grid containers

## Context

The M2/M3 Astro port wrapped `Header.astro` and `Footer.astro` in a child `<MainGrid>` component. `Layout.astro` then placed them as children of an outer `<MainGrid>`, whose `> *` rule constrained every child (including the header and footer) to `grid-column: main-column-start / side-column-end`. This caused two visual defects:

- The header rendered collapsed in the main column with a centered logo, rather than spanning full width with the logo in the left column.
- The footer's background color did not fill the full width.

The original styled-components structure had `HeaderArea` and `FooterArea` *extend* `MainGrid` — they were grid containers themselves with `grid-column: 1 / 5`, not grid items.

## Decision

Refactor `Header.astro` and `Footer.astro` to carry the grid container rules (`display: grid; grid-template-columns: var(--main-grid-columns); justify-items: stretch;` and the `> * { grid-column: main-column-start / side-column-end }` rule) directly, rather than wrapping a `<MainGrid>`. `Layout.astro`'s `.global-wrapper` becomes the outer grid container at the `min-width: 800px` breakpoint, with Header, MainContent, and Footer as direct children. The side-background spans `side-column-start / 5` to fill the right margin column with light blue.

## Consequences

- The Astro structure now mirrors the original styled-components component model.
- The visual defects (header position, footer width, side-background right strip) are fixed structurally rather than by CSS overrides.
- The fixture comparison scripts (`pnpm compare:legal`, `pnpm compare:pages`) are re-run as the regression canary after the refactor.
- `MainGrid.astro` is retained for the article region and `HeroBlock.astro` (which uses it as its grid container). Header and Footer do not import `MainGrid.astro`.
```

- [ ] **Step 4: Verify lint passes**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/adrs/adr_05_astro_seo.md docs/adrs/adr_06_header_footer_grid.md
git commit -m "Document astro-seo and Header/Footer grid ADRs"
```

---

### Task 10: Playwright verification against the live site

**Files:**
- Create: `docs/superpowers/m3-5-playwright-report.md`

**Interfaces:**
- Consumes: all changes from Tasks 1–9. Requires `pnpm build` to succeed (requires Contentful credentials in `.env`). Requires Node 22 + the global `playwright-cli` (`@playwright/cli`) on PATH.

**Context for the implementer:** This task is verification, not implementation. It runs after all fixes are in place. Use the `playwright-cli` skill for browser automation. The live site at `https://www.rhode-medizin.de/` has an SSL certificate issue — launch Chromium with the ignore-certificate-errors option (Playwright does this by default for `--ignore-certificate-errors` via context launch options; `playwright-cli open` accepts a URL directly).

- [ ] **Step 1: Ensure the local build is up to date**

Run: `pnpm build`
Expected: build succeeds, `dist/` is populated.

If the build fails with a Contentful credentials error, stop and request `.env` access — this task cannot be completed without a real build.

- [ ] **Step 2: Serve the local build**

Run (in a separate shell, or backgrounded): `pnpm exec astro preview --port 4321`
Expected: Astro preview server serving `dist/` at `http://localhost:4321`.

Verify it responds:

Run (in the original shell): `curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/`
Expected: `200`.

Keep the preview server running for the duration of this task.

- [ ] **Step 3: Open Playwright against the live site (ignore SSL)**

Run: `playwright-cli open`
Expected: a Chromium window opens.

Navigate to the live homepage (Playwright's Chromium is configured to ignore certificate errors by default in `@playwright/cli`):

Run: `playwright-cli goto https://www.rhode-medizin.de/`
Expected: the live homepage loads despite the SSL warning.

- [ ] **Step 4: Capture live homepage screenshot**

Set viewport to desktop default:

Run: `playwright-cli resize 1280 800`

Capture:

Run: `playwright-cli screenshot --filename=/tmp/opencode/m3-5-live-home.png`
Expected: screenshot saved.

- [ ] **Step 5: Capture local homepage screenshot**

Navigate to the local build:

Run: `playwright-cli goto http://localhost:4321/`

Capture:

Run: `playwright-cli screenshot --filename=/tmp/opencode/m3-5-local-home.png`
Expected: screenshot saved.

- [ ] **Step 6: Capture live and local screenshots for `/imprint/`**

Live:

Run: `playwright-cli goto https://www.rhode-medizin.de/imprint/`
Run: `playwright-cli screenshot --filename=/tmp/opencode/m3-5-live-imprint.png`

Local:

Run: `playwright-cli goto http://localhost:4321/imprint/`
Run: `playwright-cli screenshot --filename=/tmp/opencode/m3-5-local-imprint.png`

- [ ] **Step 7: Capture live and local screenshots for `/data-policy/`**

Live:

Run: `playwright-cli goto https://www.rhode-medizin.de/data-policy/`
Run: `playwright-cli screenshot --filename=/tmp/opencode/m3-5-live-data-policy.png`

Local:

Run: `playwright-cli goto http://localhost:4321/data-policy/`
Run: `playwright-cli screenshot --filename=/tmp/opencode/m3-5-local-data-policy.png`

- [ ] **Step 8: Functional checks on the local homepage**

Navigate to local homepage:

Run: `playwright-cli goto http://localhost:4321/`

Check cookies (must be empty for the local origin):

Run: `playwright-cli cookie-list --domain=localhost`
Expected: no cookies set by the local site (Playwright's own context cookies may appear; filter for any set by `localhost` responses — there should be none from the site itself).

Check no service worker:

Run: `playwright-cli eval "navigator.serviceWorker.getRegistrations().then(r => r.length)"`
Expected: `0`.

Check `<title>`:

Run: `playwright-cli eval "document.title"`
Expected: `Rhode Medizintechnik – Heinrich Rhode GmbH`.

Check meta description:

Run: `playwright-cli eval "document.querySelector('meta[name=description]').content"`
Expected: the hardcoded German description from Task 7.

Check canonical:

Run: `playwright-cli eval "document.querySelector('link[rel=canonical]').href"`
Expected: a URL starting with `https://www.rhode-medizin.de/`.

Check OG tags present:

Run: `playwright-cli eval "[...document.querySelectorAll('meta[property^=og:]')].map(m => m.getAttribute('property')).join(', ')"`
Expected: at least `og:title, og:type, og:url, og:image, og:locale, og:site_name`.

Check favicon:

Run: `playwright-cli eval "document.querySelector('link[rel=icon]').href"`
Expected: a URL ending in `/favicon.png`.

- [ ] **Step 9: Functional checks on legal pages (no SEO tags)**

Navigate to local imprint:

Run: `playwright-cli goto http://localhost:4321/imprint/`

Check no meta description:

Run: `playwright-cli eval "document.querySelector('meta[name=description]')"`
Expected: `null`.

Check no OG tags:

Run: `playwright-cli eval "document.querySelectorAll('meta[property^=og:]').length"`
Expected: `0`.

- [ ] **Step 10: Functional check — 404 route**

Navigate to a nonexistent path:

Run: `playwright-cli goto http://localhost:4321/does-not-exist`
Expected: the 404 page renders. (Astro preview serves `404.html` with a 404 status for unknown paths.)

Check the heading:

Run: `playwright-cli eval "document.querySelector('h1').textContent"`
Expected: `Seite nicht gefunden`.

Check the body:

Run: `playwright-cli eval "document.querySelector('p').textContent"`
Expected: `Die angeforderte Seite existiert nicht.`.

- [ ] **Step 11: Functional check — sitemap and robots**

Fetch the sitemap:

Run: `curl -s http://localhost:4321/sitemap-index.xml | head -5`
Expected: XML starting with `<?xml` and containing `<sitemapindex`.

Run: `curl -s http://localhost:4321/sitemap-0.xml | grep -o 'https://www.rhode-medizin.de/[a-z-]*'`
Expected: matches for `/`, `/imprint/`, `/data-policy/`.

Fetch robots:

Run: `curl -s http://localhost:4321/robots.txt`
Expected: the two lines from `public/robots.txt`.

- [ ] **Step 12: Close the browser**

Run: `playwright-cli close`
Expected: browser closes.

- [ ] **Step 13: Visual comparison and defect documentation**

Open the six screenshots (live vs. local for each of the three pages) side by side. Compare:

- Header position: full-width, logo in the left column aligned with the text below.
- Footer width: full-width background color.
- Side-background: light blue fills the right margin column.
- Footer links: underlined.
- Hero overlay: image present, overlay box with headline + subheadline + CTA button.
- Tile layouts: employee tiles and product group tiles render with correct grid.
- Image presence and aspect ratios.

Document the comparison in `docs/superpowers/m3-5-playwright-report.md` with:

```markdown
# M3.5 Playwright Verification Report

## Screenshots

- Homepage: live `/tmp/opencode/m3-5-live-home.png` vs. local `/tmp/opencode/m3-5-local-home.png`
- Imprint: live `/tmp/opencode/m3-5-live-imprint.png` vs. local `/tmp/opencode/m3-5-local-imprint.png`
- Data policy: live `/tmp/opencode/m3-5-live-data-policy.png` vs. local `/tmp/opencode/m3-5-local-data-policy.png`

## Functional checks

| Check | Expected | Actual |
|---|---|---|
| No cookies (localhost) | none | (fill in) |
| No service worker | 0 registrations | (fill in) |
| Homepage `<title>` | Rhode Medizintechnik – Heinrich Rhode GmbH | (fill in) |
| Homepage meta description | hardcoded German text | (fill in) |
| Homepage canonical URL | https://www.rhode-medizin.de/... | (fill in) |
| Homepage OG tags present | og:title, og:type, og:url, og:image, og:locale, og:site_name | (fill in) |
| Homepage favicon link | /favicon.png | (fill in) |
| Imprint has no meta description | null | (fill in) |
| Imprint has no OG tags | 0 | (fill in) |
| 404 heading | Seite nicht gefunden | (fill in) |
| 404 body | Die angeforderte Seite existiert nicht. | (fill in) |
| Sitemap lists all routes | /, /imprint/, /data-policy/ | (fill in) |
| robots.txt serves | two lines | (fill in) |

## Visual comparison

### Homepage
(fill in: note any visual differences between live and local. The known accepted difference is Arial fallback for NeuzeitOffice web fonts, which is out of scope for M3.5.)

### Imprint
(fill in)

### Data policy
(fill in)

## New defects found

(fill in: list any defects found that are NOT already in the M3.5 review notes. If none, write "None — all listed defects are resolved and no new defects surfaced.")
```

Fill in every `(fill in)` with the actual observed value.

- [ ] **Step 14: Triage any new defects**

If the "New defects found" section is not "None", review each defect. For each:

- If it is a regression introduced by Tasks 1–9, fix it before completing this task (add steps as needed).
- If it is a pre-existing defect not covered by M3.5's scope, document it as a follow-up and note it in the report. Do not fix it in this milestone.

- [ ] **Step 15: Verify lint passes**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 16: Commit**

```bash
git add docs/superpowers/m3-5-playwright-report.md
git commit -m "Add M3.5 Playwright verification report"
```

---

### Task 11: Final verification gate

**Files:**
- None modified. This task runs the full verification gate from the spec.

**Interfaces:**
- Consumes: all changes from Tasks 1–10.

- [ ] **Step 1: Verify `pnpm build` succeeds**

Run: `pnpm build`
Expected: `astro check` passes, `astro build` succeeds, `dist/` is populated.

- [ ] **Step 2: Verify `pnpm lint` passes**

Run: `pnpm lint`
Expected: PASS (all files formatted correctly).

- [ ] **Step 3: Verify `pnpm compare:legal` passes**

Run: `pnpm compare:legal`
Expected: legal page fixture comparison passes (no content diff after normalization).

- [ ] **Step 4: Verify `pnpm compare:pages` passes**

Run: `pnpm compare:pages`
Expected: homepage + legal page fixture comparison passes.

- [ ] **Step 5: Verify no `package-lock.json` exists**

Run: `ls package-lock.json 2>&1`
Expected: `No such file or directory`.

- [ ] **Step 6: Verify `dotenv` is v17**

Run: `grep '"dotenv"' package.json`
Expected: `"dotenv": "^17.0.0"` (or higher minor/patch).

- [ ] **Step 7: Verify ADRs exist**

Run: `ls docs/adrs/adr_05_astro_seo.md docs/adrs/adr_06_header_footer_grid.md`
Expected: both files exist.

- [ ] **Step 8: Verify Playwright report exists and has no unresolved defects**

Run: `grep -A5 "New defects found" docs/superpowers/m3-5-playwright-report.md`
Expected: either "None — all listed defects are resolved and no new defects surfaced." or a list of defects that were fixed in Task 10 Step 14.

- [ ] **Step 9: Final commit (if any remaining changes)**

If all prior tasks committed cleanly, there is nothing to commit here. If there are uncommitted changes (e.g., from Task 10 Step 14 defect fixes), commit them now:

```bash
git status
git add -A
git commit -m "M3.5 final verification gate fixes"
```

If `git status` shows "nothing to commit, working tree clean", the milestone is complete.
