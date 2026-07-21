# Astro Migration M4 Astro Image Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace plain `<img>` Contentful-URL rendering from M3 with Astro's built-in image service (`astro:assets`), without tying image optimization to Contentful and without changing content or layout.

**Architecture:** Authorize the Contentful asset hosts in `astro.config.mjs` so Astro's image service can download and transform remote assets at build time. Replace the M3 plain `<img>` tags in `HeroBlock.astro` (LCP, `<Picture />` with AVIF/WebP), `EmployeeTile.astro`, and `ProductGroup.astro` (below-the-fold, `<Image />`) with Astro image components. Extend the comparison scripts to collapse `<picture>` wrappers and normalize Astro's `/_astro/<hash>.<ext>` output so content parity against the M3 baseline still passes.

**Tech Stack:** Astro 7, `astro:assets` `<Image />` and `<Picture />` components, Cheerio-based comparison scripts.

## Global Constraints

- Consumes design: `docs/superpowers/specs/2026-07-21-m4-astro-image-optimization-design.md`.
- Consumes master spec: `docs/superpowers/specs/2026-07-04-astro-migration-design.md`.
- Depends on completed M3 parity build (commit `ac71660` "Remove Gatsby after Astro parity").
- Do not combine image optimization with M2 or M3.
- Images must retain appropriate `width`, `height`, `alt`, and lazy/eager loading behavior.
- The homepage must not regress visually compared with the M3 plain-image baseline.
- No cookies, service worker, or client-side storage may be introduced.
- The Contentful loader's `ContentfulImage` shape (`{ src, width, height, title?, description? }`) is unchanged.
- `src/lib/contentful-images.ts` must not exist at the end of M4 (it does not exist at the M3 baseline either — do not reintroduce it).
- Run `pnpm build`, `pnpm compare:pages`, and `npm run lint` before considering work done.
- Review for ADR need before completion and state whether ADRs were added or why none were needed.
- Prettier config: no semicolons, single quotes, ES5 trailing commas, 2-space indent, LF.
- No comments in code unless explicitly requested.

---

## File Structure

- Reset: branch `astro-migration-v2-m4` to M3 baseline `ac71660`.
- Modify: `astro.config.mjs` — add `image.domains` authorization.
- Modify: `src/components/HeroBlock.astro` — replace `<img>` with `<Picture />`.
- Modify: `src/components/EmployeeTile.astro` — replace `<img>` with `<Image />`.
- Modify: `src/components/ProductGroup.astro` — replace `<img>` with `<Image />`.
- Modify: `scripts/compare-pages.mjs` — add `collapsePictureElements()` and `/_astro/<hash>` normalization.
- Modify: `scripts/compare-legal-pages.mjs` — add `collapsePictureElements()` and `/_astro/<hash>` normalization.
- Create: `docs/adrs/adr_05_image_strategy.md` — record Astro image service decision.
- Modify: `docs/superpowers/specs/2026-07-04-astro-migration-design.md` — update M4 decision point, Final stack Images line, and deliberate behavior changes.

---

### Task 1: Reset Branch To M3 Baseline

**Files:**
- None (git history operation only).

**Interfaces:**
- Consumes: M3 baseline commit `ac71660` "Remove Gatsby after Astro parity".
- Produces: a clean `astro-migration-v2-m4` branch at `ac71660` with the two Contentful-CDN M4 commits (`5cf10e3`, `0ea8cfa`) removed from history.

- [ ] **Step 1: Confirm current branch and commits to be removed**

Run:

```bash
git rev-parse --abbrev-ref HEAD
git log --oneline ac71660..HEAD
```

Expected: current branch is `astro-migration-v2-m4`; log shows exactly two commits: `0ea8cfa Optimize Astro image delivery` and `5cf10e3 Choose Contentful CDN image strategy`.

- [ ] **Step 2: Confirm working tree is clean (ignoring untracked)**

Run:

```bash
git status --porcelain
```

Expected: only untracked entries (`.idea/` and the new design doc `docs/superpowers/specs/2026-07-21-m4-astro-image-optimization-design.md`). No staged or modified tracked files.

- [ ] **Step 3: Reset branch hard to M3 baseline**

Run:

```bash
git reset --hard ac71660
```

Expected: HEAD now at `ac71660 Remove Gatsby after Astro parity`. The two Contentful M4 commits are gone from the branch.

- [ ] **Step 4: Verify M3 baseline state**

Run:

```bash
git log --oneline -3
git status --porcelain
```

Expected: top commit is `ac71660 Remove Gatsby after Astro parity`; working tree shows only the untracked design doc (`.idea/` is gitignored or untracked).

- [ ] **Step 5: Verify no Contentful image helper exists at baseline**

Run:

```bash
ls src/lib/ 2>/dev/null || echo "src/lib does not exist (expected at M3 baseline)"
ls docs/adrs/adr_05_image_strategy.md 2>/dev/null || echo "adr_05 does not exist (expected at M3 baseline)"
```

Expected: both prints report non-existence.

- [ ] **Step 6: Preserve the design doc across the reset**

The design doc at `docs/superpowers/specs/2026-07-21-m4-astro-image-optimization-design.md` is untracked, so `git reset --hard` does not remove it. Confirm it still exists:

Run:

```bash
ls docs/superpowers/specs/2026-07-21-m4-astro-image-optimization-design.md
```

Expected: the file path prints (no "No such file" error).

- [ ] **Step 7: Build the M3 baseline to confirm a clean starting point**

Run:

```bash
pnpm install --frozen-lockfile
pnpm build
```

Expected: `pnpm build` succeeds (Astro check + build). This confirms the M3 baseline is healthy before any M4 change. If this fails, stop and fix the baseline before proceeding.

- [ ] **Step 8: Commit the design doc**

The design doc is the contract for the rest of M4. Commit it now so subsequent tasks have a stable reference.

Run:

```bash
git add docs/superpowers/specs/2026-07-21-m4-astro-image-optimization-design.md
git commit -m "Add M4 Astro image optimization design"
```

Expected: commit contains only the design doc.

---

### Task 2: Authorize Contentful Remote Images

**Files:**
- Modify: `astro.config.mjs`

**Interfaces:**
- Consumes: `ContentfulImage.src` absolute HTTPS URLs on `images.ctfassets.net` (and legacy `videos.ctfassets.net`) from the Contentful loader.
- Produces: an Astro config that permits the image service to download and transform Contentful assets at build time. Later tasks' `<Image />` / `<Picture />` components rely on this authorization to optimize remote images.

- [ ] **Step 1: Read the current astro.config.mjs**

Run:

```bash
cat astro.config.mjs
```

Expected output (exactly):

```js
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  output: 'static',
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

- [ ] **Step 2: Add image.domains authorization**

Edit `astro.config.mjs` to add an `image` key with `domains` listing the Contentful asset hosts. The full file content after the edit:

```js
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  output: 'static',
  image: {
    domains: ['images.ctfassets.net', 'videos.ctfassets.net'],
  },
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

- [ ] **Step 3: Verify the build still succeeds with the new config**

Run:

```bash
pnpm build
```

Expected: `pnpm build` succeeds. No image transformation happens yet (components still use plain `<img>`), but the config must be accepted by Astro.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS (no prettier formatting errors).

- [ ] **Step 5: Commit the config change**

Run:

```bash
git status --short
git diff -- astro.config.mjs
git add astro.config.mjs
git commit -m "Authorize Contentful images for Astro image service"
```

Expected: commit contains only `astro.config.mjs`.

---

### Task 3: Optimize Hero Image With Picture Component

**Files:**
- Modify: `src/components/HeroBlock.astro`

**Interfaces:**
- Consumes: `image?: ContentfulImage` prop (`{ src, width, height, title?, description? }`) from `ModuleRenderer.astro`.
- Produces: an optimized hero `<picture>` with AVIF and WebP `<source>` entries and a fallback `<img>`, eager-loaded with `fetchpriority="high"`. The hero is the LCP element.

- [ ] **Step 1: Read the current HeroBlock.astro**

Run:

```bash
cat src/components/HeroBlock.astro
```

Expected: the M3 baseline version (plain `<img>` with `image.src`, `image.width`, `image.height`, `alt`, `fetchpriority="high"`). The frontmatter imports `MainGrid`, `ContentBox`, and `CallToActionButton`; computes `const alt = image?.description || image?.title || ''`.

- [ ] **Step 2: Replace the frontmatter to import Picture from astro:assets**

Edit `src/components/HeroBlock.astro`. Replace the import block and `alt` computation. The new frontmatter (everything between the `---` fences):

```astro
---
// Native Astro port of src/components/heroBlock.jsx.
// The hero area is a MainGrid variant with an absolutely positioned
// background image, a content overlay (headline + subheadline), and a
// call-to-action button. The hero image is the LCP element: it is eager
// loaded with fetchpriority="high" and width/height attributes.
import { Picture } from 'astro:assets'
import MainGrid from './MainGrid.astro'
import ContentBox from './ContentBox.astro'
import CallToActionButton from './CallToActionButton.astro'

interface Image {
  src: string
  width: number
  height: number
  title?: string
  description?: string
}

interface Props {
  mainHeadline: string
  subHeadline?: string
  callToAction?: string
  image?: Image
}

const { mainHeadline, subHeadline, callToAction, image } = Astro.props
const alt = image?.description || image?.title || ''
---
```

- [ ] **Step 3: Replace the img with a Picture component**

In the same file, replace the `<img class="hero-image" ... />` JSX block with a `<Picture />` component. The hero image fills the full viewport width as a background-style cover image, so `sizes="100vw"` and `layout="full-width"` let Astro generate a responsive srcset covering common viewport widths. The new markup block (replacing the old `{image && (<img .../>)}` block):

```astro
  {
    image && (
      <Picture
        class="hero-image"
        src={image.src}
        width={image.width}
        height={image.height}
        alt={alt}
        formats={['avif', 'webp']}
        sizes="100vw"
        layout="full-width"
        loading="eager"
        fetchpriority="high"
      />
    )
  }
```

Leave the rest of the component (the `.hero-content` block and the entire `<style>` section) unchanged. The existing scoped `.hero-image` rule (`width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%`) continues to drive the layout box; Astro's responsive `:where()` styles have specificity 0 and are overridden by the scoped rule.

- [ ] **Step 4: Verify the build succeeds**

Run:

```bash
pnpm build
```

Expected: `pnpm build` succeeds. Astro downloads the hero asset from `images.ctfassets.net`, transforms it into AVIF and WebP variants, and emits them under `/_astro/`. The build may be slower than M3 because of the remote download and transform.

If the build fails with an unauthorized-domains error, confirm Task 2's `astro.config.mjs` change is present (`git diff astro.config.mjs`).

- [ ] **Step 5: Inspect the built hero markup**

Run:

```bash
grep -A 12 'class="hero-image"' dist/index.html
```

Expected: a `<picture>` element containing two `<source>` entries (`type="image/avif"`, `type="image/webp"`) with `srcset` attributes pointing at `/_astro/<hash>.avif` and `/_astro/<hash>.webp`, followed by an `<img class="hero-image" ... fetchpriority="high">` fallback whose `src` points at `/_astro/<hash>.<ext>`.

- [ ] **Step 6: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit the hero optimization**

Run:

```bash
git status --short
git diff -- src/components/HeroBlock.astro
git add src/components/HeroBlock.astro
git commit -m "Optimize hero image with Astro Picture"
```

Expected: commit contains only `src/components/HeroBlock.astro`.

---

### Task 4: Optimize Below-The-Fold Images With Image Component

**Files:**
- Modify: `src/components/EmployeeTile.astro`
- Modify: `src/components/ProductGroup.astro`

**Interfaces:**
- Consumes: `photo?: ContentfulImage` prop on each component.
- Produces: optimized single-format WebP `<img>` output (via `<Image />`) with `loading="lazy"` for below-the-fold employee and product images.

- [ ] **Step 1: Read the current EmployeeTile.astro**

Run:

```bash
cat src/components/EmployeeTile.astro
```

Expected: the M3 baseline version (plain `<img class="photo" src={photo.src} width={300} height={182} alt={alt} loading="lazy" />`).

- [ ] **Step 2: Replace EmployeeTile img with Image component**

Edit `src/components/EmployeeTile.astro`. Add the `Image` import to the frontmatter and replace the `<img>` block. The employee photo renders at a fixed 300x182 box with `object-fit: cover`; pass the intrinsic `photo.width`/`photo.height` so Astro preserves the source aspect ratio, and let the existing scoped CSS crop to the tile. The full file content after the edit:

```astro
---
// Native Astro port of src/components/employeeTile.jsx.
// Renders a Mitarbeiter tile: a fixed 300x182 photo with a caption
// overlay (name + department). The original used gatsby-image fixed
// (300x182); the Astro port uses an optimized <Image> with
// object-fit: cover to preserve the layout box.
import { Image } from 'astro:assets'

interface Image {
  src: string
  width: number
  height: number
  title?: string
  description?: string
}

interface Props {
  name: string
  department?: string
  photo?: Image
}

const { name, department, photo } = Astro.props
const alt = photo?.description || photo?.title || ''
---

<div class="employee-tile">
  {
    photo && (
      <Image
        class="photo"
        src={photo.src}
        width={photo.width}
        height={photo.height}
        alt={alt}
        loading="lazy"
      />
    )
  }
  <div class="caption">
    {name}
    <br />
    {department}
  </div>
</div>

<style>
  .employee-tile {
    min-width: 141px;
    height: 182px;
    border-radius: 3px;
    overflow: hidden;
    box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.5);
    position: relative;
  }

  .photo {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 50%;
  }

  .caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--color-overlay);
    border: 1px solid white;
    font-family: var(--font-bold);
    font-size: 14px;
    line-height: 1.235714286;
    padding: 5px 10px;
  }
</style>
```

- [ ] **Step 3: Read the current ProductGroup.astro**

Run:

```bash
cat src/components/ProductGroup.astro
```

Expected: the M3 baseline version (plain `<img class="product-image" src={photo.src} width={photo.width} height={photo.height} alt={alt} loading="lazy" />`).

- [ ] **Step 4: Replace ProductGroup img with Image component**

Edit `src/components/ProductGroup.astro`. Add the `Image` import and replace the `<img>` block. The product image is full-width on mobile and ~38vw on desktop; pass intrinsic dimensions and `sizes` so Astro generates an appropriate responsive srcset. The full file content after the edit:

```astro
---
// Native Astro port of src/components/productGroup.jsx.
// Renders a Produktgruppe tile: a two-column grid (image | text) on
// large screens with header, description, and examples list. The
// original used gatsby-image fluid; the Astro port uses an optimized
// <Image> with object-fit: cover and the Contentful image dimensions.
import { Image } from 'astro:assets'
import ContentBox from './ContentBox.astro'

interface Image {
  src: string
  width: number
  height: number
  title?: string
  description?: string
}

interface Props {
  name: string
  description?: string
  examples?: string[]
  photo?: Image
}

const { name, description, examples = [], photo } = Astro.props
const alt = photo?.description || photo?.title || ''
---

<section class="product-group">
  {
    photo && (
      <Image
        class="product-image"
        src={photo.src}
        width={photo.width}
        height={photo.height}
        alt={alt}
        sizes="(min-width: 900px) 38vw, 100vw"
        loading="lazy"
      />
    )
  }
  <ContentBox class="product-text">
    <header class="product-header">
      <h3>{name}</h3>
    </header>
    {description && <p class="product-description">{description}</p>}
    {
      examples.length > 0 && (
        <ul class="product-examples">
          {examples.map((example) => (
            <li>{example}</li>
          ))}
        </ul>
      )
    }
  </ContentBox>
</section>

<style>
  .product-group {
    background-color: var(--color-light-yellow);
    border-radius: 3px;
    overflow: hidden;
    box-shadow: 6px 6px 5px 0px rgba(0, 0, 0, 0.5);
  }

  .product-image {
    max-width: 100%;
    height: 260px;
    object-fit: cover;
    object-position: 50% 50%;
  }

  @media (min-width: 900px) {
    .product-group {
      display: grid;
      grid-template-columns: 1fr 1.618fr;
      grid-template-rows: min-content 1fr;
    }

    @supports (display: grid) {
      .product-group {
        max-width: none;
      }

      .product-group :global(h3) {
        margin-top: 0;
      }
    }

    .product-image {
      grid-row: span 2;
    }
  }

  @media (min-width: 550px) {
    .product-text {
      padding: var(--base-line-height);
    }

    @supports (display: grid) {
      .product-text {
        display: grid;
        grid-column-gap: var(--base-line-height);
        grid-template-columns: 1.618fr 1fr;
      }

      .product-text :global(p),
      .product-text :global(ol),
      .product-text :global(ul) {
        margin: 0;
      }
    }
  }

  .product-header {
    grid-column: span 2;
  }

  .product-group :global(h3) {
    color: var(--color-company-blue);
    font-size: var(--font-size-l-small);
    line-height: var(--line-height-l-small);
  }

  @media (min-width: 800px) {
    .product-group :global(h3) {
      font-size: var(--font-size-l-large);
      line-height: var(--line-height-l-large);
    }
  }

  .product-description {
    font-size: var(--font-size-m-small);
    line-height: var(--line-height-m-small);
  }

  @media (min-width: 800px) {
    .product-description {
      font-size: var(--font-size-m-large);
      line-height: var(--line-height-m-large);
    }
  }

  .product-examples > li {
    font-size: var(--font-size-s-small);
    line-height: var(--line-height-s-small);
  }

  @media (min-width: 800px) {
    .product-examples > li {
      font-size: var(--font-size-s-large);
      line-height: var(--line-height-s-large);
    }
  }
</style>
```

- [ ] **Step 5: Verify the build succeeds**

Run:

```bash
pnpm build
```

Expected: `pnpm build` succeeds. Astro transforms employee and product images to WebP under `/_astro/`.

- [ ] **Step 6: Inspect the built markup**

Run:

```bash
grep -A 2 'class="photo"' dist/index.html
grep -A 2 'class="product-image"' dist/index.html
```

Expected: each match is an `<img class="photo" ...>` (or `<img class="product-image" ...>`) whose `src` points at `/_astro/<hash>.webp` and whose `srcset` (if present) also points at `/_astro/<hash>.webp`. `<Image />` does not emit a `<picture>` wrapper, so no `<source>` elements should appear here.

- [ ] **Step 7: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 8: Commit the below-the-fold optimization**

Run:

```bash
git status --short
git diff -- src/components/EmployeeTile.astro src/components/ProductGroup.astro
git add src/components/EmployeeTile.astro src/components/ProductGroup.astro
git commit -m "Optimize below-the-fold images with Astro Image"
```

Expected: commit contains only the two modified component files.

---

### Task 5: Extend Comparison Scripts For Astro Image Output

**Files:**
- Modify: `scripts/compare-pages.mjs`
- Modify: `scripts/compare-legal-pages.mjs`

**Interfaces:**
- Consumes: the built HTML output from Tasks 3 and 4 (which now contains `<picture>` wrappers from `<Picture />` and `/_astro/<hash>.<ext>` asset paths).
- Produces: parity scripts that collapse `<picture>` to its `<img>` child and normalize `/_astro/<hash>.<ext>` paths so optimized output compares equal to the M3 plain-`<img>` baseline.

- [ ] **Step 1: Read the current compare-pages.mjs normalizeAssetUrl**

Run:

```bash
sed -n '46,56p' scripts/compare-pages.mjs
```

Expected: the M3 baseline `normalizeAssetUrl` function:

```js
const normalizeAssetUrl = (value) => {
  if (!value) return value
  return value
    .replace(/\/static\/[a-f0-9]+\//g, '/static/')
    .replace(/\?[^#\s]+/g, '')
    .replace(/^https?:/, '')
    .replace(/^\/\//, '/')
}
```

- [ ] **Step 2: Extend normalizeAssetUrl in compare-pages.mjs**

Edit `scripts/compare-pages.mjs`. Replace the existing `normalizeAssetUrl` function with a version that also collapses Astro's `/_astro/<hash>.<ext>` paths to `/_astro/<ext>` so build-to-build hash variations do not break parity. The new function:

```js
// Reduce a Contentful CDN URL (or any asset URL) to a canonical path so
// that Gatsby's transformed variants (?w=300&h=182&q=50&fit=fill), the
// Astro loader's raw URLs, and Astro's optimized /_astro/<hash>.<ext>
// output all compare equal. Strips protocol, query, and content hashes.
const normalizeAssetUrl = (value) => {
  if (!value) return value
  return value
    .replace(/\/static\/[a-f0-9]+\//g, '/static/')
    .replace(/\/_astro\/[a-f0-9]+\./g, '/_astro/.')
    .replace(/\?[^#\s]+/g, '')
    .replace(/^https?:/, '')
    .replace(/^\/\//, '/')
}
```

- [ ] **Step 3: Add collapsePictureElements to compare-pages.mjs**

The `<Picture />` component from Task 3 emits a `<picture>` wrapper with AVIF/WebP `<source>` entries. `<source>` entries are delivery optimization, not content: the `<img>` fallback carries the same asset and alt. Collapse each `<picture>` to its `<img>` child so content parity compares the canonical image, not the format-negotiation wrapper.

Edit `scripts/compare-pages.mjs`. Add a new `collapsePictureElements` function immediately after the `collapseGatsbyImages` function definition (i.e. after the closing `}` of `collapseGatsbyImages`, before the `normalizeWhitespace` function). Insert:

```js
// The Astro <Picture /> component wraps Contentful images in <picture>
// with AVIF/WebP <source> elements for format negotiation. <source>
// entries are delivery optimization, not content: the <img> fallback
// carries the same asset and alt. Collapse each <picture> to its <img>
// child so content parity compares the canonical image, not the
// format-negotiation wrapper.
const collapsePictureElements = ($) => {
  $('picture').each((_, picture) => {
    const $picture = $(picture)
    const img = $picture.find('img').first()
    if (img.length) {
      $picture.replaceWith(img)
    } else {
      $picture.remove()
    }
  })
}
```

- [ ] **Step 4: Call collapsePictureElements in compare-pages.mjs extractMainContent**

Edit `scripts/compare-pages.mjs`. In the `extractMainContent` function, add a call to `collapsePictureElements($)` immediately after the `collapseGatsbyImages($)` call. The updated `extractMainContent` should read:

```js
const extractMainContent = (rawHtml) => {
  const $ = cheerio.load(rawHtml)
  stripNoise($)
  collapseGatsbyImages($)
  collapsePictureElements($)
  normalizeAttributes($)
  stripPresentationalAttributes($)
  // Both the live Gatsby fixture and the Astro build wrap the page
  // content in <article>. Fall back to <main> if <article> is absent.
  const root = $('article').first()
  const target = root.length ? root : $('main').first()
  if (!target.length) {
    return { found: false, html: '' }
  }
  return { found: true, html: normalizeWhitespace(target.html() ?? '') }
}
```

- [ ] **Step 5: Extend normalizeAssetUrl in compare-legal-pages.mjs**

Run:

```bash
sed -n '42,50p' scripts/compare-legal-pages.mjs
```

Expected: the M3 baseline `normalizeAssetUrl`:

```js
const normalizeAssetUrl = (value) => {
  if (!value) return value
  return value
    .replace(/\/static\/[a-f0-9]+\//g, '/static/')
    .replace(/\?[a-f0-9]+/g, '')
    .replace(/^https?:/, '')
    .replace(/^\/\//, '/')
}
```

Edit `scripts/compare-legal-pages.mjs`. Replace the existing `normalizeAssetUrl` with:

```js
// Normalise asset URLs that carry build hashes (e.g. /static/<hash>/logo.png),
// protocol-relative CDN URLs, and Astro's optimized /_astro/<hash>.<ext>
// output. We collapse hashes so build-to-build variations compare equal.
const normalizeAssetUrl = (value) => {
  if (!value) return value
  return value
    .replace(/\/static\/[a-f0-9]+\//g, '/static/')
    .replace(/\/_astro\/[a-f0-9]+\./g, '/_astro/.')
    .replace(/\?[a-f0-9]+/g, '')
    .replace(/^https?:/, '')
    .replace(/^\/\//, '/')
}
```

- [ ] **Step 6: Add collapsePictureElements to compare-legal-pages.mjs**

Edit `scripts/compare-legal-pages.mjs`. Add the same `collapsePictureElements` function as in Step 3, inserted immediately before the `normalizeWhitespace` function definition. Insert:

```js
// The Astro <Picture /> component wraps Contentful images in <picture>
// with AVIF/WebP <source> elements for format negotiation. <source>
// entries are delivery optimization, not content: the <img> fallback
// carries the same asset and alt. Collapse each <picture> to its <img>
// child so content parity compares the canonical image, not the
// format-negotiation wrapper.
const collapsePictureElements = ($) => {
  $('picture').each((_, picture) => {
    const $picture = $(picture)
    const img = $picture.find('img').first()
    if (img.length) {
      $picture.replaceWith(img)
    } else {
      $picture.remove()
    }
  })
}
```

- [ ] **Step 7: Call collapsePictureElements in compare-legal-pages.mjs extractMainContent**

Edit `scripts/compare-legal-pages.mjs`. In `extractMainContent`, add a call to `collapsePictureElements($)` immediately after `stripNoise($)` (this script has no `collapseGatsbyImages` call). The updated `extractMainContent` should read:

```js
const extractMainContent = (rawHtml) => {
  const $ = cheerio.load(rawHtml)
  stripNoise($)
  collapsePictureElements($)
  normalizeAttributes($)
  stripPresentationalAttributes($)
  // Both the live Gatsby fixture and the Astro build wrap the legal-page
  // content in <article>. Fall back to <main> if <article> is absent.
  const root = $('article').first()
  const target = root.length ? root : $('main').first()
  if (!target.length) {
    return { found: false, html: '' }
  }
  return { found: true, html: normalizeWhitespace(target.html() ?? '') }
}
```

- [ ] **Step 8: Rebuild and run the comparison**

Run:

```bash
pnpm build
pnpm compare:pages
```

Expected: all three pages PASS (`[imprint] PASS`, `[data-policy] PASS`, `[homepage] PASS`). The legal pages contain no `<picture>` (they have no Contentful images), but the new `collapsePictureElements` is a no-op there; the homepage's hero `<picture>` collapses to its `<img>` and the `/_astro/<hash>.<ext>` paths normalize to `/_astro/.<ext>`.

If the homepage fails, inspect the diff preview the script prints and confirm whether the failure is a real content difference (stop and investigate) or a normalization gap (extend `normalizeAssetUrl` further).

- [ ] **Step 9: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 10: Commit the comparison script changes**

Run:

```bash
git status --short
git diff -- scripts/compare-pages.mjs scripts/compare-legal-pages.mjs
git add scripts/compare-pages.mjs scripts/compare-legal-pages.mjs
git commit -m "Normalize Astro image output in page comparison"
```

Expected: commit contains only the two comparison scripts.

---

### Task 6: Document Image Strategy Decision

**Files:**
- Create: `docs/adrs/adr_05_image_strategy.md`
- Modify: `docs/superpowers/specs/2026-07-04-astro-migration-design.md`

**Interfaces:**
- Consumes: the M4 design (`docs/superpowers/specs/2026-07-21-m4-astro-image-optimization-design.md`) and the implemented work from Tasks 2-5.
- Produces: ADR 05 recording the Astro image service decision, and a master spec whose M4 section, Final stack Images line, and deliberate behavior changes reflect the new approach.

- [ ] **Step 1: Create ADR 05**

Create `docs/adrs/adr_05_image_strategy.md` with the following content:

```markdown
# ADR 05: Image optimization strategy

## Status

Accepted

## Context

M3 delivered the Astro parity build using plain `<img>` tags with raw
Contentful CDN URLs (no query parameters) and the Contentful asset's
intrinsic `width`/`height`. The M4 milestone requires improving image
delivery without changing content or layout, and without tying the
feature to Contentful.

The M4 design
(`docs/superpowers/specs/2026-07-21-m4-astro-image-optimization-design.md`)
chose Astro's built-in image service over hand-rolled Contentful CDN
query-parameter transforms, so that switching the CMS or image source
later means changing one `image.domains` entry and the loader's `src`
data, not a Contentful-specific helper module.

## Decision

Use **Astro's built-in image service** (`astro:assets` `<Image />` and
`<Picture />` components) for all Contentful images rendered by the
Astro site.

`astro.config.mjs` authorizes the Contentful asset hosts
(`images.ctfassets.net` and `videos.ctfassets.net`) via `image.domains`
so Astro downloads each remote asset once at build time, transforms it
into the requested formats and widths, and emits optimized binaries
under `/_astro/<hash>.<ext>`.

Component choice is mixed per-context:

- `HeroBlock.astro` (LCP image) uses `<Picture />` with
  `formats={['avif', 'webp']}`, `fetchpriority="high"`, and
  `loading="eager"` for AVIF/WebP format negotiation.
- `EmployeeTile.astro` and `ProductGroup.astro` (below-the-fold images)
  use `<Image />` with `loading="lazy"` for single-format WebP output.

The Contentful loader's `ContentfulImage` shape is unchanged; its
`src`, `width`, `height`, `title`, and `description` fields are passed
directly to the Astro image components.

No Contentful-specific image transform helper exists in the repo.

## Consequences

- Astro downloads and transforms authorized remote Contentful assets at
  build time, increasing build time and `dist/` size. Astro's content
  cache mitigates repeat builds.
- The repo has no Contentful-specific image helper. Changing the image
  source later means updating `image.domains` and the loader's `src`
  data, not a transform module.
- `<Picture />` emits a `<picture>` wrapper that the comparison scripts
  collapse to its `<img>` child during content parity checks.
- `/_astro/<hash>.<ext>` asset paths are normalized by the comparison
  scripts so build-to-build hash variations do not break parity.
- Build requires network access to `images.ctfassets.net`. The
  Contentful loader already requires this for entry data, so no new
  network dependency is introduced.
```

- [ ] **Step 2: Read the current master spec M4 section**

Run:

```bash
sed -n '22,22p' docs/superpowers/specs/2026-07-04-astro-migration-design.md
sed -n '262,286p' docs/superpowers/specs/2026-07-04-astro-migration-design.md
sed -n '350,354p' docs/superpowers/specs/2026-07-04-astro-migration-design.md
```

Expected:
- Line 22: the Final stack **Images:** line: `**Images:** Plain \`<img>\` tags first, using Contentful CDN asset URLs and width/height attributes from Contentful metadata. Astro image optimization is deferred to a later milestone after page parity is proven.`
- Lines 262-286: the `## Milestone 4 — Image optimization pass` section including the two-option decision point.
- Lines 350-354: the deliberate behavior changes list, ending with entry 5 about image optimization deferral.

- [ ] **Step 3: Update the Final stack Images line**

Edit `docs/superpowers/specs/2026-07-04-astro-migration-design.md`. Replace line 22 with:

```text
**Images:** Astro's built-in image service (`astro:assets` `<Image />` and `<Picture />`) optimizes Contentful images at build time. The Contentful asset hosts are authorized in `astro.config.mjs`; the loader's normalized image data is passed directly to the Astro image components.
```

- [ ] **Step 4: Replace the M4 decision point section**

Edit `docs/superpowers/specs/2026-07-04-astro-migration-design.md`. Replace the `### Decision point` subsection (the heading and the two numbered options and the "Do not claim..." paragraph) with the following new subsection. The replacement target starts at the line `### Decision point` and ends immediately before `### Verification gate`:

```markdown
### Decision point

Use Astro's built-in image service (`astro:assets` `<Image />` and `<Picture />`) as the sole image optimization provider. Authorize the Contentful asset hosts (`images.ctfassets.net`, `videos.ctfassets.net`) in `astro.config.mjs` so the image service downloads and transforms remote assets at build time.

Component choice is mixed per-context:

- **Hero (LCP):** `<Picture />` with `formats={['avif', 'webp']}`, `fetchpriority="high"`, and `loading="eager"`.
- **Below-the-fold (employee, product):** `<Image />` with `loading="lazy"`.

The Contentful loader's `ContentfulImage` shape is unchanged; no Contentful-specific image transform helper is introduced. See `docs/superpowers/specs/2026-07-21-m4-astro-image-optimization-design.md` for the full design and `docs/adrs/adr_05_image_strategy.md` for the decision record.
```

- [ ] **Step 5: Update the deliberate behavior change entry**

Edit `docs/superpowers/specs/2026-07-04-astro-migration-design.md`. Replace the existing entry 5 in the *Deliberate behavior changes* list:

```text
5. **Image optimization deferred.** The first Astro parity build uses plain `<img>` tags. Optimized responsive images are handled separately after parity is verified.
```

with:

```text
5. **Image optimization via Astro image service.** M3 parity used plain `<img>` tags; M4 replaces them with Astro's `astro:assets` `<Image />` and `<Picture />` components, which transform Contentful assets at build time. No Contentful-specific image helper ships in the repo.
```

- [ ] **Step 6: Verify the build and lint still pass**

Run:

```bash
pnpm build
npm run lint
```

Expected: both PASS. (Documentation-only changes should not affect the build, but `astro check` runs over the whole project and `npm run lint` covers `.md` files.)

- [ ] **Step 7: Commit the ADR and spec updates**

Run:

```bash
git status --short
git diff -- docs/adrs/adr_05_image_strategy.md docs/superpowers/specs/2026-07-04-astro-migration-design.md
git add docs/adrs/adr_05_image_strategy.md docs/superpowers/specs/2026-07-04-astro-migration-design.md
git commit -m "Document Astro image service as M4 strategy"
```

Expected: commit contains only the new ADR and the updated master spec.

---

### Task 7: M4 Verification Gate

**Files:**
- None required unless verification notes are documented.

**Interfaces:**
- Consumes: optimized image implementation from Tasks 2-6.
- Produces: a verified M4 image optimization milestone.

- [ ] **Step 1: Run the full build**

Run:

```bash
pnpm build
```

Expected: `pnpm build` succeeds (`astro check` + `astro build`). No TypeScript diagnostics, no unauthorized-image-domain errors, no transform failures.

- [ ] **Step 2: Run the page comparison**

Run:

```bash
pnpm compare:pages
```

Expected: all three pages PASS:

```text
[imprint] PASS
[data-policy] PASS
[homepage] PASS
```

- [ ] **Step 3: Run the legal-page comparison**

Run:

```bash
pnpm compare:legal
```

Expected: both legal pages PASS:

```text
[imprint] PASS
[data-policy] PASS
```

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS (no prettier formatting errors across `**/*.{js,ts,astro,json,md,yml,css}`).

- [ ] **Step 5: Manual visual regression check**

Open `dist/index.html`, `dist/imprint/index.html`, and `dist/data-policy/index.html` in a browser (or serve `dist/` via `pnpm exec astro preview`). Compare against the live site at `https://www.rhode-medizin.de/`, `https://www.rhode-medizin.de/imprint/`, and `https://www.rhode-medizin.de/data-policy/`.

Confirm:

- The hero image renders full-bleed with the same crop and overlay as the live site.
- Employee tile photos render at 300x182 with the same crop and caption overlay.
- Product group images render at the same dimensions and crop as the live site.
- Typography, layout, colors, and spacing are unchanged from M3.
- No layout shift is visible during page load beyond what the M3 plain-image baseline showed.

- [ ] **Step 6: Inspect image markup attributes**

Run:

```bash
grep -A 12 'class="hero-image"' dist/index.html
grep -A 2 'class="photo"' dist/index.html
grep -A 2 'class="product-image"' dist/index.html
```

Expected:

- Hero: `<picture>` with AVIF and WebP `<source>` entries; fallback `<img>` has `width`, `height`, `alt`, `fetchpriority="high"`, `loading="eager"`.
- Employee: `<img>` with `width`, `height`, `alt`, `loading="lazy"`; `src` at `/_astro/<hash>.webp`.
- Product: `<img>` with `width`, `height`, `alt`, `loading="lazy"`; `src` at `/_astro/<hash>.webp`.

- [ ] **Step 7: Cookie and storage check**

Open the browser dev tools on the previewed pages. Confirm:

- No cookies are set by the site (Application → Cookies is empty or contains only what the browser itself sets for `localhost`).
- No service worker is registered (Application → Service Workers shows none).
- No client-side storage is written (localStorage, sessionStorage, IndexedDB are empty).

- [ ] **Step 8: Confirm no Contentful image helper exists**

Run:

```bash
ls src/lib/contentful-images.ts 2>/dev/null && echo "UNEXPECTED: helper exists" || echo "OK: no Contentful image helper"
```

Expected: `OK: no Contentful image helper`.

- [ ] **Step 9: Confirm the branch history is clean**

Run:

```bash
git log --oneline ac71660..HEAD
```

Expected: the log contains only the new M4 commits from this plan (design doc, config, hero, below-the-fold, comparison scripts, ADR/spec). No `5cf10e3 Choose Contentful CDN image strategy` and no `0ea8cfa Optimize Astro image delivery`. The Contentful-CDN detour does not appear in the branch history.

- [ ] **Step 10: Completion summary**

Report:

- Selected image strategy: Astro image service (`astro:assets`).
- Component split: `<Picture />` for the LCP hero; `<Image />` for below-the-fold employee and product images.
- Verification results: `pnpm build`, `pnpm compare:pages`, `pnpm compare:legal`, `npm run lint` all PASS.
- Visual regression: confirmed against the live site for `/`, `/imprint/`, `/data-policy/`.
- Cookie/storage check: no cookies, no service worker, no client-side storage.
- ADR status: ADR 05 added at `docs/adrs/adr_05_image_strategy.md`.
- Commit hashes: list the commits from `git log --oneline ac71660..HEAD`.
- State that M5 can start only after this M4 gate is accepted.
