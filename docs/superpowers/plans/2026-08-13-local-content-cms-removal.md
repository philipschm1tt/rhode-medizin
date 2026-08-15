# Local Content (Remove Contentful CMS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Contentful with version-controlled local content (MDX pages + two YAML collections + local image assets) while preserving the published content, DOM structure, image identity, metadata, and responsive visual output at cutover.

**Architecture:** File-routed MDX pages (`index.mdx`, `imprint.mdx`, `data-policy.mdx`) compose editor-facing blocks directly; two Astro `glob()` content collections (`employees`, `productGroups`) hold repeated records; images live as local binaries under `src/assets/content/` and flow through Astro's `ImageMetadata` type end to end. The Contentful loader, `ModuleRenderer` dispatcher, dynamic route, remote image domains, and Contentful-only dependencies are removed. A frozen capture of the published Contentful state is committed first and becomes the source of truth for every later value; deterministic `verify:*` scripts and switched parity fixtures gate the migration.

**Tech Stack:** Astro 7, `@astrojs/mdx`, `@astrojs/markdown-satteri` (Satteri processor with `smartPunctuation: false`), Astro `glob()` content loader, `astro:assets` `<Image />` / `<Picture />` / `getImage()`, YAML collections, Node ESM verification scripts, Cheerio, pnpm/Prettier, GitHub Actions CI.

## Global Constraints

- Source of truth for content is `docs/superpowers/specs/2026-08-11-local-content-cms-removal-design.md`.
- The migration is one pull request; operational retirement is delayed until the rollback window closes.
- Until the local-content build is live and accepted, the authority is the published Contentful Delivery API state. Announce a content freeze before Task 1; no Contentful entry or asset may be published/unpublished/edited until cutover succeeds or the migration is abandoned.
- Every later task derives exact values, IDs, counts, order, Markdown, and asset set from the committed frozen artifacts under `tests/fixtures/cutover/`, never from assumptions in this plan. Where a step needs prose or data, copy it verbatim from the named artifact field; do not paraphrase, reformat, or modernize.
- Migration must reproduce the frozen imprint and data-policy source exactly (headings, links, lists, emphasis, line breaks). Legal-copy approval is a separate human gate recorded in `tests/fixtures/cutover/provenance.json`.
- No replacement CMS, admin UI, redesign, SEO initiative, or prose rewrite.
- Do not delete historical fixtures in `tests/fixtures/live/` or ADRs; historical records remain with supersession noted.
- Do not delete the ignored `.env`; it simply stops being read.
- Prettier config: no semicolons, single quotes, ES5 trailing commas, 2-space indent, LF. `format`/`lint` must include `.mdx`, `.yaml`, and existing extensions.
- The build still runs `astro check` before `astro build`. `astro check` does not type-check component prop usage inside standalone `.mdx`; MDX composition is gated by build, fixture comparison, content integrity, and `verify:dist`.
- No comments in code unless explicitly requested.
- Run `pnpm lint` before considering any task done; record the shell error if `pnpm` is unavailable.
- Review for ADR need before completion; this plan adds ADR 08 and updates ADRs 02, 03, both 05s, and 07.

---

## File Structure

- Create: `scripts/capture-contentful.mjs` — temporary; deleted in Task 9.
- Create: `tests/fixtures/cutover/provenance.json` — capture timestamp, source commit, Contentful space/environment IDs, locale, production URLs, Netlify deploy ID, and legal-copy approval. No credentials.
- Create: `tests/fixtures/cutover/contentful-source.json` — sanitized export of the graph reachable from the three published page entries.
- Create: `tests/fixtures/cutover/asset-inventory.json` — initial inventory (source IDs, URLs, metadata, dimensions, usage) produced by the capture script.
- Create: `tests/fixtures/cutover/content-map.json` — one-to-one source-to-local ID map.
- Create: `tests/fixtures/cutover/pages/{index,imprint,data-policy}.html` — old Contentful-backed Astro build output, the new cutover fixtures.
- Create: `tests/fixtures/cutover/assets.json` — final asset manifest with local paths, SHA-256, dimensions, alt decisions, usage, rights.
- Create: `src/assets/content/` — downloaded approved image binaries.
- Create: `src/content/employees/*.yaml` — one employee per file.
- Create: `src/content/product-groups/*.yaml` — one product group per file.
- Modify: `src/content.config.ts` — replace Contentful loader with two `glob()` collections using the `image()` schema callback.
- Create: `src/layouts/PageLayout.astro` — MDX page shell composing `Layout.astro` + `MainContent.astro`, with `getImage()` social image.
- Create: `src/components/blocks/` — `Hero.astro`, `Section.astro`, `Aside.astro`, `Quote.astro`, `Tiles.astro`, `EmployeeTile.astro`, `ProductGroup.astro`, `README.md`.
- Modify: `src/components/HeroBlock.astro` — accept `ImageMetadata` + explicit `alt`, pass full metadata to `<Picture>`.
- Create: `src/pages/index.mdx`, `src/pages/imprint.mdx`, `src/pages/data-policy.mdx`.
- Delete: `src/pages/[...slug].astro`.
- Delete: `src/components/ModuleRenderer.astro`.
- Delete: `src/components/TileGrid.astro`, `src/components/TileList.astro` (after styles move into `Tiles.astro`).
- Delete: `src/content/loaders/contentful.ts` and `src/content/loaders/` directory.
- Create: `scripts/verify-content.mjs`, `scripts/verify-assets.mjs`, `scripts/verify-dist.mjs`.
- Modify: `scripts/compare-pages.mjs`, `scripts/compare-legal-pages.mjs` — switch to cutover fixtures, preserve exact `href`, full structural diff.
- Modify: `package.json` — add deps, remove Contentful deps, add `verify:*` scripts, extend `format`/`lint` globs.
- Modify: `astro.config.mjs` — add `mdx()` integration with Satteri `smartPunctuation: false`, remove `image.domains` and `@content-loaders` alias.
- Modify: `tsconfig.json` — remove `@content-loaders/*` path alias.
- Create: `.github/workflows/verify.yml` — PR CI running `pnpm install --frozen-lockfile && pnpm verify`.
- Modify: `README.md`, `AGENTS.md`, `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`.
- Create: `docs/adrs/adr_08_local_content.md`.
- Modify: `docs/adrs/adr_02_contentful_loader.md`, `docs/adrs/adr_03_content_loader_alias.md`, `docs/adrs/adr_05_image_strategy.md`, `docs/adrs/adr_05_astro_seo.md`, `docs/adrs/adr_07_netlify.md`.
- Create: `docs/superpowers/plans/2026-08-13-local-content-cutover-operator-runbook.md` — operational cutover/rollback/retirement runbook.

---

### Task 1: Freeze And Capture Contentful State

**Files:**
- Create: `scripts/capture-contentful.mjs`
- Create: `tests/fixtures/cutover/provenance.json`
- Create: `tests/fixtures/cutover/contentful-source.json`
- Create: `tests/fixtures/cutover/asset-inventory.json`
- Create: `tests/fixtures/cutover/content-map.json`
- Create: `tests/fixtures/cutover/pages/index.html`
- Create: `tests/fixtures/cutover/pages/imprint.html`
- Create: `tests/fixtures/cutover/pages/data-policy.html`

**Interfaces:**
- Consumes: `.env` with `CONTENTFUL_SPACE_ID` and `CONTENTFUL_DELIVERY_TOKEN`; the current `contentful` SDK and `src/content/loaders/contentful.ts`; the current `pnpm build` output.
- Produces: the five frozen artifacts and three cutover page fixtures that every later task treats as the source of truth. The capture script is temporary and is deleted in Task 9.

**Human gates before starting:** Announce the Contentful content freeze. Confirm the current local `master` builds against live Contentful (`pnpm build` succeeds). Record the current production Netlify deploy ID and current Git commit hash for `provenance.json`.

- [ ] **Step 1: Create the capture script**

Create `scripts/capture-contentful.mjs`. It uses the already-installed `contentful` SDK and `dotenv` to fetch the published graph, sanitize it (no credentials, no API responses unrelated to the three pages, no unpublished entries), and write the four JSON artifacts. It also reads `src/content/loaders/contentful.ts` content types implicitly via the same `contentType.sys.id` → `__typename` mapping. The script writes nothing to `dist/` and prints only paths.

```javascript
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import 'dotenv/config'
import { createClient } from 'contentful'

const OUT_DIR = 'tests/fixtures/cutover'
const PAGE_TYPENAME = 'ContentfulSeite'

const contentTypeToTypename = {
  seite: 'ContentfulSeite',
  heroBlock: 'ContentfulHeroBlock',
  zitat: 'ContentfulZitat',
  abschnitt: 'ContentfulAbschnitt',
  textabschnitt: 'ContentfulTextinhalt',
  kartenLayout: 'ContentfulKartenLayout',
  mitarbeiter: 'ContentfulMitarbeiter',
  produktgruppe: 'ContentfulProduktgruppe',
}

const refId = (value) => value?.sys?.id ?? null
const refIds = (value) =>
  Array.isArray(value)
    ? value.map(refId).filter(Boolean)
    : []

const collectReachable = (entries, assets) => {
  const entryIndex = new Map(entries.map((e) => [e.sys.id, e]))
  const assetIndex = new Map(assets.map((a) => [a.sys.id, a]))
  const reachableEntries = new Map()
  const reachableAssets = new Map()
  const queue = []

  const typename = (entry) =>
    contentTypeToTypename[entry.sys.contentType.sys.id] ?? null

  const visitEntry = (id) => {
    if (!id || reachableEntries.has(id)) return
    const entry = entryIndex.get(id)
    if (!entry) throw new Error(`Missing referenced entry: ${id}`)
    if (!typename(entry)) return
    reachableEntries.set(id, entry)
    queue.push(entry)
  }

  const visitAsset = (id) => {
    if (!id) return
    const asset = assetIndex.get(id)
    if (asset) reachableAssets.set(id, asset)
  }

  for (const entry of entries) {
    if (typename(entry) === PAGE_TYPENAME) visitEntry(entry.sys.id)
  }
  while (queue.length) {
    const entry = queue.shift()
    const fields = entry.fields
    for (const value of Object.values(fields)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item?.sys?.linkType === 'Entry') visitEntry(refId(item))
          else if (item?.sys?.linkType === 'Asset') visitAsset(refId(item))
        }
      } else if (value?.sys?.linkType === 'Entry') {
        visitEntry(refId(value))
      } else if (value?.sys?.linkType === 'Asset') {
        visitAsset(refId(value))
      }
    }
  }
  return {
    entries: [...reachableEntries.values()],
    assets: [...reachableAssets.values()],
  }
}

const normalizeAssetUrl = (url) => {
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('http://')) return url.replace('http://', 'https://')
  if (url.startsWith('https://')) return url
  return `https://${url}`
}

const sanitizeEntry = (entry) => ({
  id: entry.sys.id,
  contentType: entry.sys.contentType.sys.id,
  updatedAt: entry.sys.updatedAt,
  fields: entry.fields,
})

const sanitizeAsset = (asset) => {
  const file = asset.fields?.file
  return {
    id: asset.sys.id,
    updatedAt: asset.sys.updatedAt,
    title: asset.fields?.title ?? null,
    description: asset.fields?.description ?? null,
    url: file?.url ? normalizeAssetUrl(file.url) : null,
    mimeType: file?.contentType ?? null,
    byteSize: file?.details?.size ?? null,
    width: file?.details?.image?.width ?? null,
    height: file?.details?.image?.height ?? null,
  }
}

const buildAssetInventory = (entries, assets) => {
  const usage = new Map()
  for (const asset of assets) usage.set(asset.id, { asset, usedBy: [] })
  const typename = (e) =>
    contentTypeToTypename[e.sys.contentType.sys.id] ?? null
  for (const entry of entries) {
    const tn = typename(entry)
    if (!tn) continue
    for (const [fieldName, value] of Object.entries(entry.fields)) {
      const collect = (v) => {
        const id = v?.sys?.linkType === 'Asset' ? refId(v) : null
        if (id && usage.has(id)) {
          usage.get(id).usedBy.push({
            entryId: entry.sys.id,
            typename: tn,
            field: fieldName,
          })
        }
      }
      if (Array.isArray(value)) value.forEach(collect)
      else collect(value)
    }
  }
  return [...usage.values()].map(({ asset, usedBy }) => ({
    ...asset,
    usedBy,
  }))
}

const guessLocalId = (entry) => {
  const tn = contentTypeToTypename[entry.sys.contentType.sys.id]
  const fields = entry.fields
  if (tn === 'ContentfulSeite') {
    const slug = (fields.slug ?? '').replace(/^\/+/, '').replace(/\/+$/, '')
    return slug === '' ? 'index' : slug
  }
  if (tn === 'ContentfulMitarbeiter') {
    return (fields.name ?? 'mitarbeiter')
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  if (tn === 'ContentfulProduktgruppe') {
    return (fields.name ?? 'produktgruppe')
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  return null
}

const buildContentMap = (entries) => {
  const pages = []
  const employees = []
  const productGroups = []
  for (const entry of entries) {
    const tn = contentTypeToTypename[entry.sys.contentType.sys.id]
    const localId = guessLocalId(entry)
    if (tn === 'ContentfulSeite') {
      const slug = (entry.fields.slug ?? '').replace(/^\/+/, '').replace(/\/+$/, '')
      const route = slug === '' ? 'src/pages/index.mdx' : `src/pages/${slug}.mdx`
      pages.push({ sourceId: entry.sys.id, route })
    } else if (tn === 'ContentfulMitarbeiter') {
      employees.push({ sourceId: entry.sys.id, localId })
    } else if (tn === 'ContentfulProduktgruppe') {
      productGroups.push({ sourceId: entry.sys.id, localId })
    }
  }
  return { pages, employees, productGroups }
}

const main = async () => {
  const space = process.env.CONTENTFUL_SPACE_ID
  const token = process.env.CONTENTFUL_DELIVERY_TOKEN
  if (!space || !token) {
    throw new Error('CONTENTFUL_SPACE_ID and CONTENTFUL_DELIVERY_TOKEN are required')
  }
  const client = createClient({ space, accessToken: token, host: 'cdn.contentful.com' })
  const response = await client.getEntries({ include: 10, limit: 1000 })
  const allEntries = response.items
  const allAssets = response.includes?.Asset ?? []
  const { entries, assets } = collectReachable(allEntries, allAssets)

  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(resolve(OUT_DIR, 'pages'), { recursive: true })

  const source = {
    entries: entries.map(sanitizeEntry),
    assets: assets.map(sanitizeAsset),
  }
  writeFileSync(
    resolve(OUT_DIR, 'contentful-source.json'),
    JSON.stringify(source, null, 2) + '\n',
  )

  const inventory = buildAssetInventory(entries, assets)
  writeFileSync(
    resolve(OUT_DIR, 'asset-inventory.json'),
    JSON.stringify(inventory, null, 2) + '\n',
  )

  const contentMap = buildContentMap(entries)
  writeFileSync(
    resolve(OUT_DIR, 'content-map.json'),
    JSON.stringify(contentMap, null, 2) + '\n',
  )

  console.log(`capture: ${entries.length} entries, ${assets.length} assets`)
  console.log(`wrote tests/fixtures/cutover/{contentful-source,asset-inventory,content-map}.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Run the capture script**

Run:

```bash
node scripts/capture-contentful.mjs
```

Expected: the script prints entry/asset counts and writes `contentful-source.json`, `asset-inventory.json`, and `content-map.json` under `tests/fixtures/cutover/`. No credential is written to any artifact.

- [ ] **Step 3: Write provenance.json**

Create `tests/fixtures/cutover/provenance.json`. Fill these fields verbatim from the live state; never include tokens:

```json
{
  "captureTimestamp": "<ISO 8601 UTC of capture>",
  "sourceGitCommit": "<git rev-parse HEAD output>",
  "contentfulSpaceId": "<CONTENTFUL_SPACE_ID value>",
  "contentfulEnvironment": "master",
  "locale": "de",
  "productionUrls": ["https://www.rhode-medizin.de", "https://rhode-medizin.de"],
  "netlifyDeployId": "<current production Netlify deploy ID from dashboard>",
  "legalCopyApproval": {
    "status": "pending",
    "approvedBy": null,
    "approvedAt": null,
    "notes": "Content owner must confirm frozen imprint and data-policy copy is intentional before this capture is accepted."
  }
}
```

- [ ] **Step 4: Build the old Contentful-backed Astro implementation and save cutover fixtures**

The current `master` still builds from Contentful. Build and copy the three rendered pages as the new cutover fixtures:

```bash
pnpm build
mkdir -p tests/fixtures/cutover/pages
cp dist/index.html tests/fixtures/cutover/pages/index.html
cp dist/imprint/index.html tests/fixtures/cutover/pages/imprint.html
cp dist/data-policy/index.html tests/fixtures/cutover/pages/data-policy.html
```

Expected: three fixture files exist under `tests/fixtures/cutover/pages/`. These become the parity oracle for Tasks 8 and 11.

- [ ] **Step 5: Reconcile source, old Astro build, and production**

Open the three new cutover fixtures and compare against current production (`https://www.rhode-medizin.de/`, `/imprint/`, `/data-policy/`) and the frozen source. Any content difference must be resolved with the content owner before continuing. Record the resolution in `provenance.json` under a new `reconciliation` field (array of `{ check, status, notes }`). The historical `tests/fixtures/live/` Gatsby fixtures are explicitly NOT the oracle; leave them untouched.

- [ ] **Step 6: Obtain legal-copy approval**

The content owner must confirm the frozen imprint and data-policy copy is intentional. If a legal correction is required, it happens as a separate Contentful content-only change before re-running Step 2. Update `provenance.json` `legalCopyApproval` to `{ "status": "approved", "approvedBy": "<name>", "approvedAt": "<ISO 8601>", "notes": "..." }`. Do not proceed to Task 2 without an approved status.

- [ ] **Step 7: Review artifacts for token leakage**

Run:

```bash
rg -n "CONTENTFUL_DELIVERY_TOKEN|CONTENTFUL_PREVIEW_TOKEN|CONTENTFUL_ACCESS_TOKEN" tests/fixtures/cutover/ || echo "no token leakage"
```

Expected: "no token leakage". If any match appears, sanitize the offending artifact and re-run.

- [ ] **Step 8: Lint and commit the capture gate**

Run:

```bash
pnpm lint
git add scripts/capture-contentful.mjs tests/fixtures/cutover/
git commit -m "Capture frozen Contentful state for local-content migration"
```

Expected: one commit contains the temporary capture script and the frozen artifacts only. The script will be deleted in Task 9.

---

### Task 2: Download Approved Image Binaries And Finalize Asset Manifest

**Files:**
- Create: `src/assets/content/<local-id>.<ext>` for every used asset.
- Modify: `tests/fixtures/cutover/assets.json` (created from `asset-inventory.json`).

**Interfaces:**
- Consumes: `tests/fixtures/cutover/asset-inventory.json` (source IDs, URLs, metadata, dimensions, usage). Requires human rights review for each asset.
- Produces: `tests/fixtures/cutover/assets.json` with local paths, SHA-256 digests, MIME/byte/width/height, alt decisions, usage mappings, and rights status. `verify:assets` (Task 8) reads this manifest.

**Human gates:** For each asset, confirm whether the original untransformed Contentful binary may be committed. If not, commit an approved web-resolution derivative and record the exact transformation. Record an explicit alt decision per asset (semantic text, or empty-with-decorative-justification).

- [ ] **Step 1: Create the local assets directory**

Run:

```bash
mkdir -p src/assets/content
```

- [ ] **Step 2: Download each approved binary**

For each entry in `tests/fixtures/cutover/asset-inventory.json`, download the approved binary to `src/assets/content/<local-id>.<ext>`. Choose `<local-id>` from the using entry's local ID in `content-map.json`; if an asset is used by multiple entries (e.g. the hero social image), pick one stable local id. Use `curl` against the `url` in the inventory (or the approved derivative URL). Example for the hero:

```bash
curl -fsSL "<inventory url for hero asset>" -o src/assets/content/hero-image-blue2.jpg
```

Repeat for every used asset. Do not mirror unused Contentful assets.

- [ ] **Step 3: Compute SHA-256, dimensions, and byte size for each binary**

Run a small one-off Node snippet (do not commit it) to compute the manifest fields:

```bash
node --input-type=module -e '
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import sharp from "sharp"
import { readFileSync } from "node:fs"
const inv = JSON.parse(readFileSync("tests/fixtures/cutover/asset-inventory.json", "utf8"))
for (const a of inv) {
  const path = `src/assets/content/${a.localId}.${a.ext}` // adjust per asset
  const buf = await readFile(path)
  const sha = createHash("sha256").update(buf).digest("hex")
  const meta = await sharp(buf).metadata()
  console.log(JSON.stringify({ id: a.id, path, sha, bytes: buf.length, width: meta.width, height: meta.height, mime: meta.mime }))
}
' > /tmp/opencode/asset-dims.json
```

Expected: `/tmp/opencode/asset-dims.json` contains one JSON line per asset with digest and decoded dimensions. (This snippet is a throwaway; it is not committed.)

- [ ] **Step 4: Write the final assets.json**

Create `tests/fixtures/cutover/assets.json` as a JSON array. For every used asset, record exactly these fields (values from the inventory plus Step 3 output plus human decisions):

```json
[
  {
    "contentfulAssetId": "<source id>",
    "sourceUpdatedAt": "<sys.updatedAt from inventory>",
    "sourceUrl": "<original or approved derivative URL>",
    "localPath": "src/assets/content/<local-id>.<ext>",
    "sha256": "<digest hex>",
    "mimeType": "<mime>",
    "byteSize": <number>,
    "width": <number>,
    "height": <number>,
    "contentfulTitle": "<title or null>",
    "contentfulDescription": "<description or null>",
    "alt": "<explicit alt string; may be empty only if decorative>",
    "decorativeEmptyAlt": false,
    "usedBy": [
      { "entryId": "<source entry id>", "typename": "<__typename>", "field": "<field name>" }
    ],
    "rights": {
      "status": "approved-original" | "approved-derivative",
      "derivation": "<exact transformation if derivative, else null>",
      "notes": "<provenance and rights status for committing the chosen binary>"
    }
  }
]
```

`alt` may be empty only when the frozen source has no semantic description AND `decorativeEmptyAlt` is `true` with a justification in `rights.notes`.

- [ ] **Step 5: Verify every used asset has a manifest entry**

Run:

```bash
node --input-type=module -e '
import { readFileSync } from "node:fs"
const inv = JSON.parse(readFileSync("tests/fixtures/cutover/asset-inventory.json", "utf8"))
const man = JSON.parse(readFileSync("tests/fixtures/cutover/assets.json", "utf8"))
const invIds = new Set(inv.map((a) => a.id))
const manIds = new Set(man.map((a) => a.contentfulAssetId))
const missing = [...invIds].filter((id) => !manIds.has(id))
const extra = [...manIds].filter((id) => !invIds.has(id))
if (missing.length) { console.error("missing manifest entries:", missing); process.exit(1) }
if (extra.length) { console.error("manifest entries not in inventory:", extra); process.exit(1) }
console.log("manifest covers all used assets")
'
```

Expected: "manifest covers all used assets".

- [ ] **Step 6: Lint and commit**

Run:

```bash
pnpm lint
git add src/assets/content/ tests/fixtures/cutover/assets.json
git commit -m "Add local image binaries and final asset manifest"
```

Expected: one commit contains the binary assets and `assets.json` only.

---

### Task 3: Add MDX Integration And Satteri Processor

**Files:**
- Modify: `package.json`
- Modify: `astro.config.mjs`
- Create (throwaway): `src/pages/_mdx-smoke.mdx` (deleted in Step 4)

**Interfaces:**
- Consumes: none new.
- Produces: `mdx()` integration registered with Satteri `smartPunctuation: false` and GFM enabled, so Task 7 MDX pages render frozen prose without smart-punctuation drift.

- [ ] **Step 1: Add the MDX and Satteri dependencies**

Run:

```bash
pnpm add @astrojs/mdx @astrojs/markdown-satteri
```

Expected: `package.json` gains `@astrojs/mdx` and `@astrojs/markdown-satterx`/`-satteri` under `dependencies`; lockfile updated.

- [ ] **Step 2: Register mdx() with the Satteri processor in astro.config.mjs**

Replace `astro.config.mjs` with:

```javascript
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  output: 'static',
  site: 'https://www.rhode-medizin.de',
  integrations: [
    sitemap(),
    mdx({
      markdown: {
        smartPunctuation: false,
        gfm: true,
      },
    }),
  ],
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

The `image.domains` and `@content-loaders` alias remain for now; Task 9 removes them once the local build is the only build. `smartPunctuation: false` preserves straight quotes, dashes, and ellipses in frozen prose. If the installed `@astrojs/markdown-satteri` package exposes the processor via a different option key, follow the package's documented option name but keep `smartPunctuation: false` semantics; record the exact option used in the Task 10 ADR.

- [ ] **Step 3: Smoke-test MDX rendering**

Create `src/pages/_mdx-smoke.mdx`:

```mdx
---
import Layout from '../layouts/Layout.astro'
---
<Layout title="MDX smoke">
  <article><h1>MDX smoke "straight quotes" — en dash</h1></article>
</Layout>
```

Run:

```bash
pnpm build
```

Expected: build succeeds; `dist/_mdx-smoke/index.html` exists; the rendered HTML contains `MDX smoke "straight quotes" — en dash` with unchanged straight quotes and en dash (no smart curly quotes or em dash conversion). The existing Contentful-backed `[...slug].astro` pages still build.

- [ ] **Step 4: Remove the smoke page**

Run:

```bash
rm src/pages/_mdx-smoke.mdx
```

- [ ] **Step 5: Lint and commit**

Run:

```bash
pnpm lint
git add astro.config.mjs package.json pnpm-lock.yaml
git commit -m "Add MDX integration with Satteri smartPunctuation disabled"
```

Expected: one commit adds the integration and deps; no smoke file is committed.

---

### Task 4: Replace Contentful Collection With Two Local YAML Collections

**Files:**
- Create: `src/content/employees/*.yaml` — one file per employee from `content-map.json`.
- Create: `src/content/product-groups/*.yaml` — one file per product group from `content-map.json`.
- Modify: `src/content.config.ts`

**Interfaces:**
- Consumes: `tests/fixtures/cutover/content-map.json` (source→local ID map), `tests/fixtures/cutover/contentful-source.json` (field values), `tests/fixtures/cutover/assets.json` (local image paths + alt).
- Produces: `employees` and `productGroups` collections with `image()`-typed photos, consumed by Task 7's homepage MDX via `getCollection`.

- [ ] **Step 1: Write employee YAML files**

For each entry in `content-map.json.employees`, create `src/content/employees/<localId>.yaml`. Copy `order`, `name`, and `department` (`dienstbereich`) verbatim from the matching `ContentfulMitarbeiter` entry in `contentful-source.json`. The local `order` integer is the entry's position in the frozen employee sequence; assign unique sequential integers starting at 1 in frozen order (derive order from the order the employees appear in the homepage's `ContentfulKartenLayout.elemente` array, NOT alphabetical). For `photo`, reference the local path from `assets.json` using an import-relative path that the `image()` schema callback can resolve, and set `alt` from the manifest.

File shape:

```yaml
order: <int>
name: "<verbatim name>"
department: "<verbatim dienstbereich, or omit if absent>"
photo: ../assets/content/<local-id>.<ext>
alt: "<explicit alt from assets.json>"
```

Create exactly one file per employee; the count must equal `content-map.json.employees.length`.

- [ ] **Step 2: Write product-group YAML files**

For each entry in `content-map.json.productGroups`, create `src/content/product-groups/<localId>.yaml`. Copy `order`, `name`, `beschreibung` (`description`), and `beispiele` (`examples`) verbatim from the matching `ContentfulProduktgruppe` entry. Assign unique sequential `order` integers in frozen homepage order. `photo` and `alt` come from `assets.json`.

File shape:

```yaml
order: <int>
name: "<verbatim name>"
description: "<verbatim beschreibung, or omit if absent>"
examples:
  - "<verbatim beispiele entry>"
  - "<...>"
photo: ../assets/content/<local-id>.<ext>
alt: "<explicit alt from assets.json>"
```

Create exactly one file per product group; the count must equal `content-map.json.productGroups.length`.

- [ ] **Step 3: Replace content.config.ts with two glob() collections**

Replace `src/content.config.ts` with:

```typescript
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { image } from 'astro:assets'

const employees = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/employees' }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      name: z.string(),
      department: z.string().optional(),
      photo: image(),
      alt: z.string(),
    }),
})

const productGroups = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/product-groups' }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      name: z.string(),
      description: z.string().optional(),
      examples: z.array(z.string()),
      photo: image(),
      alt: z.string(),
    }),
})

export const collections = { employees, productGroups }
```

The old `imageSchema`, `moduleSchema` discriminated union, `Contentful*` literals, and `pages` collection are removed. The `@content-loaders/contentful` import is gone (Task 9 deletes the file). The `image()` callback resolves local images under `src/assets/`.

- [ ] **Step 4: Verify collections load**

Run:

```bash
pnpm build
```

Expected: build still succeeds for the existing `[...slug].astro` pages (Contentful loader still wired through the old file until Task 9; if removing the `pages` collection breaks `[...slug].astro`, that is expected — proceed to Task 5–7 which replace the route). If the build fails solely because `pages` is gone, continue to Task 5; do not restore the Contentful collection.

- [ ] **Step 5: Lint and commit**

Run:

```bash
pnpm lint
git add src/content/ src/content.config.ts
git commit -m "Replace Contentful collection with local employees and productGroups"
```

Expected: one commit adds the YAML files and the new `content.config.ts`.

---

### Task 5: Add PageLayout With Local Social Image

**Files:**
- Create: `src/layouts/PageLayout.astro`

**Interfaces:**
- Consumes: `src/layouts/Layout.astro` (`{ title?, seo? }`), `src/components/MainContent.astro` (`{ gridRow }`), `astro:assets` `getImage()`, `astro:assets` `ImageMetadata` type.
- Produces: `PageLayout.astro` with props `{ title: string, description?: string, socialImage?: ImageMetadata }` and a default slot, consumed by the three MDX pages in Task 7.

- [ ] **Step 1: Create PageLayout.astro**

Create `src/layouts/PageLayout.astro`:

```astro
---
import '../styles/global.css'
import { SEO, type SEOProps } from 'astro-seo'
import { getImage, type ImageMetadata } from 'astro:assets'
import Layout from './Layout.astro'
import MainContent from '../components/MainContent.astro'

interface Props {
  title: string
  description?: string
  socialImage?: ImageMetadata
}

const { title, description, socialImage } = Astro.props

let seo: SEOProps | undefined
if (description) {
  const socialSrc = socialImage
    ? (await getImage({ src: socialImage, format: 'jpeg' })).src
    : undefined
  const socialUrl = socialSrc
    ? new URL(socialSrc, Astro.site).toString()
    : undefined
  seo = {
    title,
    description,
    openGraph: {
      basic: {
        title,
        type: 'website',
        image: socialUrl ?? 'https://www.rhode-medizin.de/favicon.png',
        url: new URL(Astro.url.pathname, Astro.site).toString(),
      },
      optional: {
        locale: 'de_DE',
        siteName: 'Heinrich Rhode GmbH',
      },
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      image: socialUrl,
    },
  }
}
---

<Layout title={title} seo={seo}>
  <MainContent gridRow="2">
    <slot />
  </MainContent>
</Layout>
```

When `description` is present and `socialImage` is provided, Open Graph and Twitter both use the absolute site-origin `/_astro/` URL produced by `getImage()`; this is the intentional exception to exact metadata parity (the frozen Contentful CDN URL is replaced by the local URL). When `description` is present but `socialImage` is absent, Open Graph keeps the favicon fallback and Twitter omits its image. Legal pages pass only `title`, so they retain the plain-title policy (no SEO tags beyond `<title>`).

- [ ] **Step 2: Verify type check**

Run:

```bash
pnpm exec astro check
```

Expected: no diagnostics for `PageLayout.astro`.

- [ ] **Step 3: Lint and commit**

Run:

```bash
pnpm lint
git add src/layouts/PageLayout.astro
git commit -m "Add PageLayout with local social image support"
```

Expected: one commit adds `PageLayout.astro`.

---

### Task 6: Create Editor-Facing Blocks And Update Image Contracts

**Files:**
- Create: `src/components/blocks/Hero.astro`
- Create: `src/components/blocks/Section.astro`
- Create: `src/components/blocks/Aside.astro`
- Create: `src/components/blocks/Quote.astro`
- Create: `src/components/blocks/Tiles.astro`
- Create: `src/components/blocks/EmployeeTile.astro`
- Create: `src/components/blocks/ProductGroup.astro`
- Create: `src/components/blocks/README.md`
- Modify: `src/components/HeroBlock.astro`
- Delete: `src/components/EmployeeTile.astro`, `src/components/ProductGroup.astro`, `src/components/TileGrid.astro`, `src/components/TileList.astro` (moved/absorbed)

**Interfaces:**
- Consumes: `src/components/HeroBlock.astro` (updated), `src/components/CallToActionButton.astro`, `src/components/MainSection.astro`, `src/components/MainGrid.astro`, `src/components/ContentBox.astro`, `src/components/AsideSection.astro`, `src/components/Quote.astro` (existing), `astro:assets` `ImageMetadata`.
- Produces: the `blocks/` directory consumed by Task 7 MDX pages. `Tiles` validates `layout`/`items`/`itemComponent` and throws on misuse at build time.

- [ ] **Step 1: Create blocks/Hero.astro**

Create `src/components/blocks/Hero.astro`:

```astro
---
import type { ImageMetadata } from 'astro:assets'
import HeroBlock from '../HeroBlock.astro'

interface Props {
  headline: string
  subhead?: string
  cta?: string
  image: ImageMetadata
  alt: string
}

const { headline, subhead, cta, image, alt } = Astro.props
---

<HeroBlock
  mainHeadline={headline}
  subHeadline={subhead}
  callToAction={cta}
  image={image}
  alt={alt}
/>
```

- [ ] **Step 2: Update HeroBlock.astro to accept ImageMetadata and explicit alt**

Replace `src/components/HeroBlock.astro` with a version that accepts `ImageMetadata` + an explicit `alt` string and passes the full metadata object to `<Picture>`:

```astro
---
import type { ImageMetadata } from 'astro:assets'
import { Picture } from 'astro:assets'
import CallToActionButton from './CallToActionButton.astro'

interface Props {
  mainHeadline: string
  subHeadline?: string
  callToAction?: string
  image?: ImageMetadata
  alt?: string
}

const { mainHeadline, subHeadline, callToAction, image, alt = '' } = Astro.props
---

<header class="hero-area">
  {
    image && (
      <Picture
        class="hero-image"
        src={image}
        alt={alt}
        formats={['avif', 'webp']}
        fallbackFormat="jpeg"
        widths={[480, 768, 1024, 1366, 1600, 1920]}
        sizes="(max-width: 1920px) 100vw, 1920px"
        quality={70}
        layout="full-width"
        loading="eager"
        fetchpriority="high"
      />
    )
  }
  <div class="hero-content">
    <div class="overlay">
      <h1>{mainHeadline}</h1>
      {subHeadline && <p class="subheadline">{subHeadline}</p>}
    </div>
    <br />
    {
      callToAction && (
        <CallToActionButton text={callToAction} href="/imprint/" />
      )
    }
  </div>
</header>

<style>
  .hero-area {
    grid-column: 1 / 5;
    margin-bottom: var(--base-line-height);
    grid-template-rows:
      var(--triple-base-line-height)
      fit-content(0)
      var(--triple-base-line-height);
    position: relative;
    padding: var(--triple-base-line-height) var(--outer-padding);
    display: grid;
  }

  @media (min-width: 800px) {
    .hero-area {
      display: flex;
      flex-direction: column;
      display: grid;
      grid-template-columns: var(--main-grid-columns);
      justify-items: stretch;
      padding: 0;
    }

    .hero-area > :global(*) {
      grid-column: main-column-start / side-column-end;
    }
  }

  .hero-image {
    grid-column: 1 / 5;
    grid-row: 1 / 4;
    position: absolute;
    z-index: 0;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 50%;
  }

  .hero-content {
    grid-column: main-column-start / main-column-end;
    grid-row: 2;
    position: relative;
    z-index: 1;
    padding: 0;
  }

  .overlay {
    background-color: var(--color-overlay);
    border: 1px solid white;
    border-radius: 3px;
    overflow: hidden;
    box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.5);
    margin-bottom: var(--base-line-height);
    display: inline-block;
    justify-self: start;
    align-self: start;
    padding: var(--inner-padding);
  }

  .overlay > :global(:last-child) {
    margin-bottom: 0;
  }

  .overlay h1,
  .overlay .subheadline {
    font-family: var(--font-bold);
    color: var(--color-company-blue);
    text-shadow: 0 0 15px white;
  }
</style>
```

The previous `<Picture src={image.src} width={image.width} ...>` form is replaced by passing the full `ImageMetadata` object; formats, widths, sizes, loading, and fetch priority are unchanged.

- [ ] **Step 3: Create blocks/Section.astro**

Create `src/components/blocks/Section.astro`:

```astro
---
import MainSection from '../MainSection.astro'
import MainGrid from '../MainGrid.astro'
import ContentBox from '../ContentBox.astro'

interface Props {
  fullWidth?: boolean
  dark?: boolean
}

const { fullWidth = false, dark = false } = Astro.props
---

{
  fullWidth ? (
    <MainSection fullWidth darkBackground={dark}>
      <MainGrid>
        <ContentBox>
          <slot />
        </ContentBox>
      </MainGrid>
    </MainSection>
  ) : (
    <MainSection darkBackground={dark}>
      <ContentBox>
        <slot />
      </ContentBox>
    </MainSection>
  )
}
```

`ContentBox` is included to preserve the existing `inhalte[0] → ContentBox` wrapper that `ModuleRenderer` produced for sections.

- [ ] **Step 4: Create blocks/Aside.astro**

Create `src/components/blocks/Aside.astro`:

```astro
---
import AsideSection from '../AsideSection.astro'
import ContentBox from '../ContentBox.astro'
---

<AsideSection>
  <ContentBox>
    <slot />
  </ContentBox>
</AsideSection>
```

- [ ] **Step 5: Create blocks/Quote.astro**

Create `src/components/blocks/Quote.astro`:

```astro
---
import Quote from '../Quote.astro'

interface Props {
  text: string
}

const { text } = Astro.props
---

<Quote text={text} />
```

- [ ] **Step 6: Create blocks/Tiles.astro absorbing TileGrid and TileList styles**

Create `src/components/blocks/Tiles.astro`. It owns the `<ul>`, validates props, and renders the dynamic item component inside each `<li>`:

```astro
---
import type { Component } from 'astro'

interface Props {
  layout: 'grid' | 'list'
  items: unknown[]
  itemComponent: Component
}

const { layout, items, itemComponent } = Astro.props

if (layout !== 'grid' && layout !== 'list') {
  throw new Error(
    `Tiles: "layout" must be "grid" or "list", got: ${String(layout)}`,
  )
}
if (!itemComponent) {
  throw new Error('Tiles: "itemComponent" is required')
}
if (!Array.isArray(items)) {
  throw new Error(`Tiles: "items" must be an array, got: ${typeof items}`)
}

const Item = itemComponent
const listClass = layout === 'grid' ? 'tile-grid' : 'tile-list'
---

<ul class={listClass}>
  {items.map((item) => <li><Item {...item} /></li>)}
</ul>

<style>
  .tile-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    margin: 0;
    padding: 0;
  }

  .tile-grid > :global(*) {
    list-style: none;
    max-width: 100%;
    margin-bottom: var(--base-line-height);
    margin-right: var(--base-line-height);
  }

  @supports (display: grid) {
    .tile-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(141px, 1fr));
      grid-gap: var(--base-line-height);
    }

    .tile-grid > :global(*) {
      width: auto;
      margin: 0;
    }
  }

  .tile-list {
    margin: 0;
    padding: 0;
  }

  .tile-list > :global(*) {
    list-style: none;
    max-width: 100%;
    margin-bottom: var(--base-line-height);
  }
</style>
```

The scoped CSS from `TileGrid.astro` and `TileList.astro` is absorbed here; the old wrappers are deleted in Step 9.

- [ ] **Step 7: Create blocks/EmployeeTile.astro**

Create `src/components/blocks/EmployeeTile.astro` with the existing `EmployeeTile.astro` markup and scoped CSS, updated to accept `ImageMetadata` + explicit `alt`:

```astro
---
import type { ImageMetadata } from 'astro:assets'
import { Image } from 'astro:assets'

interface Props {
  name: string
  department?: string
  photo?: ImageMetadata
  alt?: string
}

const { name, department, photo, alt = '' } = Astro.props
---

<div class="employee-tile">
  {
    photo && (
      <Image
        class="photo"
        src={photo}
        alt={alt}
        layout="fixed"
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

The original fixed 300x182 box is preserved via `layout="fixed"` on the `<Image>` and the `.employee-tile` height.

- [ ] **Step 8: Create blocks/ProductGroup.astro**

Create `src/components/blocks/ProductGroup.astro` with the existing `ProductGroup.astro` markup and scoped CSS, updated for `ImageMetadata` + explicit `alt`:

```astro
---
import type { ImageMetadata } from 'astro:assets'
import { Image } from 'astro:assets'
import ContentBox from '../ContentBox.astro'

interface Props {
  name: string
  description?: string
  examples?: string[]
  photo?: ImageMetadata
  alt?: string
}

const { name, description, examples = [], photo, alt = '' } = Astro.props
---

<section class="product-group">
  {
    photo && (
      <Image
        class="product-image"
        src={photo}
        alt={alt}
        layout="constrained"
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
      width: 100%;
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

- [ ] **Step 9: Create blocks/README.md**

Create `src/components/blocks/README.md` documenting each block's contract and composition, mirroring the spec's table. Keep it concise: one block per heading, props, and which technical components it composes.

- [ ] **Step 10: Delete the moved technical wrappers**

Run:

```bash
git rm src/components/EmployeeTile.astro src/components/ProductGroup.astro src/components/TileGrid.astro src/components/TileList.astro
```

Their CSS now lives in `blocks/EmployeeTile.astro`, `blocks/ProductGroup.astro`, and `blocks/Tiles.astro`.

- [ ] **Step 11: Verify type check and build**

Run:

```bash
pnpm exec astro check
pnpm build
```

Expected: `astro check` passes. The build will fail on `[...slug].astro` because `ModuleRenderer` imports the deleted `TileGrid`/`TileList`/`EmployeeTile`/`ProductGroup`. That is expected; Task 7 deletes `[...slug].astro` and `ModuleRenderer.astro`. Do not commit until Task 7; instead keep these changes staged locally and proceed to Task 7 in the same working tree. (If your workflow requires a green build per commit, combine Tasks 6 and 7 into one commit.)

- [ ] **Step 12: Lint and commit (combined with Task 7 if needed)**

If committing separately is not possible because the build is red, defer this step to the end of Task 7 and commit Tasks 6 + 7 together:

```bash
pnpm lint
git add src/components/blocks/ src/components/HeroBlock.astro
git rm src/components/EmployeeTile.astro src/components/ProductGroup.astro src/components/TileGrid.astro src/components/TileList.astro
git commit -m "Add editor-facing blocks and update image contracts for local assets"
```

Expected: the `blocks/` directory, updated `HeroBlock.astro`, and deletions of the four moved components are in one commit (possibly combined with Task 7).

---

### Task 7: Add The Three MDX Pages And Delete The Dynamic Route

**Files:**
- Create: `src/pages/index.mdx`
- Create: `src/pages/imprint.mdx`
- Create: `src/pages/data-policy.mdx`
- Delete: `src/pages/[...slug].astro`
- Delete: `src/components/ModuleRenderer.astro`

**Interfaces:**
- Consumes: `PageLayout.astro` (Task 5), `blocks/` (Task 6), `getCollection('employees')` and `getCollection('productGroups')` (Task 4), local hero asset import from `src/assets/content/`. Verbatim prose from `contentful-source.json` `ContentfulTextinhalt.text` and `ContentfulZitat.zitat` fields, in frozen order from each page's `module` array.
- Produces: three file-routed routes (`/`, `/imprint/`, `/data-policy/`) that replace the dynamic route.

- [ ] **Step 1: Write src/pages/index.mdx**

Create `src/pages/index.mdx`. Structure follows the spec's example. Import `PageLayout`, the hero asset (the exact local file from `assets.json` used as the social+hero image), `getCollection`, and the blocks. Load and sort both collections, then map entries to the props each item component expects. Insert the frozen prose sections and quotes in the order they appear in the homepage's frozen `module` array.

```mdx
import { getCollection } from 'astro:content'
import PageLayout from '../layouts/PageLayout.astro'
import heroImage from '../assets/content/<hero-local-id>.<ext>'
import Hero from '../components/blocks/Hero.astro'
import Section from '../components/blocks/Section.astro'
import Aside from '../components/blocks/Aside.astro'
import Quote from '../components/blocks/Quote.astro'
import Tiles from '../components/blocks/Tiles.astro'
import EmployeeTile from '../components/blocks/EmployeeTile.astro'
import ProductGroup from '../components/blocks/ProductGroup.astro'

export const employees = (await getCollection('employees'))
  .sort((a, b) => a.data.order - b.data.order)
  .map(({ data }) => ({
    name: data.name,
    department: data.department,
    photo: data.photo,
    alt: data.alt,
  }))

export const productGroups = (await getCollection('productGroups'))
  .sort((a, b) => a.data.order - b.data.order)
  .map(({ data }) => ({
    name: data.name,
    description: data.description,
    examples: data.examples,
    photo: data.photo,
    alt: data.alt,
  }))

<PageLayout
  title="Rhode Medizintechnik – Heinrich Rhode GmbH"
  description="Heinrich Rhode GmbH – Medizintechnik für Praxen und Kliniken. Beratung, Service und Produkte aus einer Hand."
  socialImage={heroImage}
>
  <Hero
    headline="<verbatim hauptueberschrift from frozen ContentfulHeroBlock>"
    subhead="<verbatim unterueberschrift, or omit if absent>"
    cta="<verbatim callToAction.text, or omit if absent>"
    image={heroImage}
    alt="<explicit alt from assets.json for the hero image>"
  />

  <Section>
    <verbatim prose from the first ContentfulTextinhalt in frozen order, copied from contentful-source.json textMarkdown — not the rendered fixture HTML>

    <Tiles
      layout="grid"
      items={employees}
      itemComponent={EmployeeTile}
    />
  </Section>

  <Quote text="<verbatim zitat from frozen ContentfulZitat>" />

  <Section fullWidth dark>
    <verbatim prose for the product-groups section>

    <Tiles
      layout="list"
      items={productGroups}
      itemComponent={ProductGroup}
    />
  </Section>
</PageLayout>
```

Replace every `<...>` placeholder with the verbatim frozen value. Copy page-specific prose from the raw Markdown in `contentful-source.json` (`ContentfulTextinhalt.text`), not from rendered fixture HTML. Use syntax-only escapes to preserve the old DOM where Markdown would otherwise change it:

- The services heading remains one `<h2>` with three lines separated by `<br />` rather than a single Markdown heading. Author it as raw HTML inside the MDX where the frozen source had it, e.g. `<h2>Line one<br />Line two<br />Line three</h2>`.
- A standalone date such as `09. Dezember 2027` is authored as `09\\. Dezember 2027` so Markdown does not interpret it as an ordered-list marker.
- Quote punctuation, including en dashes, is copied exactly.
- The employees and product groups appear inside their existing section and content-box hierarchy (provided by `Section` + `Tiles`).
- Any frozen `ContentfulAbschnitt` with `seitenabschnitt` (aside) renders the main content in `<Section>` and the aside in `<Aside>`, in frozen order.

- [ ] **Step 2: Write src/pages/imprint.mdx**

Create `src/pages/imprint.mdx` with a `PageLayout` (title `Impressum`, no description) and one `<Section>` containing the complete imprint prose inline, copied verbatim from the frozen imprint page's `ContentfulTextinhalt.text` fields in frozen module order. Preserve headings, links, lists, emphasis, and line breaks exactly. Use Markdown for structure and explicit HTML where Markdown would change the frozen DOM.

```mdx
import PageLayout from '../layouts/PageLayout.astro'
import Section from '../components/blocks/Section.astro'

<PageLayout title="Impressum">
  <Section>
    <verbatim imprint prose>
  </Section>
</PageLayout>
```

- [ ] **Step 3: Write src/pages/data-policy.mdx**

Create `src/pages/data-policy.mdx` analogously with title `Datenschutzhinweis` and the frozen data-policy prose.

```mdx
import PageLayout from '../layouts/PageLayout.astro'
import Section from '../components/blocks/Section.astro'

<PageLayout title="Datenschutzhinweis">
  <Section>
    <verbatim data-policy prose>
  </Section>
</PageLayout>
```

- [ ] **Step 4: Delete the dynamic route and ModuleRenderer**

Run:

```bash
git rm 'src/pages/[...slug].astro' src/components/ModuleRenderer.astro
```

- [ ] **Step 5: Verify the build produces all three routes**

Run:

```bash
pnpm build
ls dist/index.html dist/imprint/index.html dist/data-policy/index.html
```

Expected: build succeeds; all three files exist; no Contentful fetch occurred (the build runs offline against local content once `content.config.ts` no longer references the Contentful loader — note the Contentful loader file is still present until Task 9, but is no longer imported by `content.config.ts`).

- [ ] **Step 6: Lint and commit**

If Task 6 was deferred, commit both together now. Otherwise:

```bash
pnpm lint
git add src/pages/index.mdx src/pages/imprint.mdx src/pages/data-policy.mdx
git rm 'src/pages/[...slug].astro' src/components/ModuleRenderer.astro
git commit -m "Add file-routed MDX pages and remove dynamic route"
```

Expected: the three MDX pages exist; the dynamic route and `ModuleRenderer.astro` are gone.

---

### Task 8: Add Verification Scripts And Switch Parity Fixtures

**Files:**
- Create: `scripts/verify-content.mjs`
- Create: `scripts/verify-assets.mjs`
- Create: `scripts/verify-dist.mjs`
- Modify: `scripts/compare-pages.mjs`
- Modify: `scripts/compare-legal-pages.mjs`
- Modify: `package.json`
- Create: `.github/workflows/verify.yml`

**Interfaces:**
- Consumes: `tests/fixtures/cutover/{contentful-source,asset-inventory,content-map,assets}.json`, `src/content/{employees,product-groups}/*.yaml`, `src/pages/*.mdx`, `dist/`, `astro.config.mjs`, `package.json`.
- Produces: `pnpm verify:content`, `pnpm verify:assets`, `pnpm verify:dist`, and `pnpm verify` (aggregate). Parity scripts compare built pages against `tests/fixtures/cutover/pages/`.

- [ ] **Step 1: Add the `diff` devDependency**

Run:

```bash
pnpm add -D diff
```

Expected: `diff` is added under `devDependencies`. It is used by the parity scripts for a real structural diff instead of the first 600 characters.

- [ ] **Step 2: Write scripts/verify-content.mjs**

Create `scripts/verify-content.mjs`. It validates that every frozen page maps to a route file, every frozen employee/product group maps to a local ID, the local collection counts match, order values are unique, and the ordered sequences match the frozen source's homepage card-layout order.

```javascript
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const readJson = (path) => JSON.parse(readFileSync(resolve(path), 'utf8'))

const source = readJson('tests/fixtures/cutover/contentful-source.json')
const map = readJson('tests/fixtures/cutover/content-map.json')

const errors = []

const typename = (e) => {
  const ctToTn = {
    seite: 'ContentfulSeite',
    heroBlock: 'ContentfulHeroBlock',
    zitat: 'ContentfulZitat',
    abschnitt: 'ContentfulAbschnitt',
    textabschnitt: 'ContentfulTextinhalt',
    kartenLayout: 'ContentfulKartenLayout',
    mitarbeiter: 'ContentfulMitarbeiter',
    produktgruppe: 'ContentfulProduktgruppe',
  }
  return ctToTn[e.contentType] ?? null
}

const entryById = new Map(source.entries.map((e) => [e.id, e]))

const expectedRoutes = new Map(map.pages.map((p) => [p.sourceId, p.route]))
const expectedEmployees = new Map(map.employees.map((e) => [e.sourceId, e.localId]))
const expectedProductGroups = new Map(
  map.productGroups.map((p) => [p.sourceId, p.localId]),
)

for (const [sourceId, route] of expectedRoutes) {
  if (!existsSync(resolve(route))) {
    errors.push(`missing route file for page ${sourceId}: ${route}`)
  }
}
for (const entry of source.entries) {
  if (typename(entry) === 'ContentfulSeite' && !expectedRoutes.has(entry.id)) {
    errors.push(`frozen page ${entry.id} has no content-map route`)
  }
  if (typename(entry) === 'ContentfulMitarbeiter' && !expectedEmployees.has(entry.id)) {
    errors.push(`frozen employee ${entry.id} has no content-map local id`)
  }
  if (typename(entry) === 'ContentfulProduktgruppe' && !expectedProductGroups.has(entry.id)) {
    errors.push(`frozen product group ${entry.id} has no content-map local id`)
  }
}

const employeeFiles = new Set(
  readdirSync('src/content/employees')
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => f.replace(/\.yaml$/, '')),
)
const productGroupFiles = new Set(
  readdirSync('src/content/product-groups')
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => f.replace(/\.yaml$/, '')),
)

const localEmployeeIds = new Set(expectedEmployees.values())
const localProductGroupIds = new Set(expectedProductGroups.values())

for (const id of localEmployeeIds) {
  if (!employeeFiles.has(id)) errors.push(`missing employee yaml: src/content/employees/${id}.yaml`)
}
for (const id of localProductGroupIds) {
  if (!productGroupFiles.has(id)) errors.push(`missing product-group yaml: src/content/product-groups/${id}.yaml`)
}
for (const id of employeeFiles) {
  if (!localEmployeeIds.has(id)) errors.push(`employee yaml has no frozen mapping: ${id}`)
}
for (const id of productGroupFiles) {
  if (!localProductGroupIds.has(id)) errors.push(`product-group yaml has no frozen mapping: ${id}`)
}

const checkUniqueOrder = (dir, label) => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.yaml'))
  const orders = new Map()
  for (const f of files) {
    const text = readFileSync(resolve(dir, f), 'utf8')
    const m = text.match(/^order:\s*(\d+)\s*$/m)
    if (!m) {
      errors.push(`${label}/${f}: missing or invalid order`)
      return
    }
    const n = Number(m[1])
    if (orders.has(n)) errors.push(`${label}: duplicate order ${n} in ${f} and ${orders.get(n)}`)
    orders.set(n, f)
  }
}
checkUniqueOrder('src/content/employees', 'employees')
checkUniqueOrder('src/content/product-groups', 'product-groups')

const homepageOrder = (typeName) => {
  const seite = source.entries.find((e) => typename === 'ContentfulMitarbeiter' ? false : false)
  const page = source.entries.find((e) => typename(e) === 'ContentfulSeite' && (e.fields.slug ?? '').replace(/^\/+|\/+$/g, '') === '')
  if (!page) return []
  const moduleIds = (page.fields.module ?? []).map((v) => v?.sys?.id).filter(Boolean)
  const layout = moduleIds
    .map((id) => entryById.get(id))
    .filter((e) => e && typename(e) === 'ContentfulKartenLayout')
  if (!layout.length) return []
  const wanted = typeName === 'ContentfulMitarbeiter' ? 'ContentfulMitarbeiter' : 'ContentfulProduktgruppe'
  const order = []
  const walk = (entry) => {
    const tn = typename(entry)
    if (tn === wanted) {
      order.push(entry.id)
      return
    }
    for (const value of Object.values(entry.fields)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const id = item?.sys?.id
          if (id && entryById.has(id)) walk(entryById.get(id))
        }
      } else if (value?.sys?.id && entryById.has(value.sys.id)) {
        walk(entryById.get(value.sys.id))
      }
    }
  }
  for (const l of layout) walk(l)
  return order
}

const employeeOrder = homepageOrder('ContentfulMitarbeiter')
const productGroupOrder = homepageOrder('ContentfulProduktgruppe')

const checkSequence = (dir, frozenOrder, localMap, label) => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.yaml'))
  const byOrder = new Map()
  for (const f of files) {
    const text = readFileSync(resolve(dir, f), 'utf8')
    const m = text.match(/^order:\s*(\d+)\s*$/m)
    byOrder.set(Number(m[1]), f.replace(/\.yaml$/, ''))
  }
  const sorted = [...byOrder.entries()].sort((a, b) => a[0] - b[0]).map(([, id]) => id)
  for (let i = 0; i < frozenOrder.length; i++) {
    const expectedLocal = localMap.get(frozenOrder[i])
    if (sorted[i] !== expectedLocal) {
      errors.push(`${label} order mismatch at position ${i}: expected ${expectedLocal}, got ${sorted[i]}`)
    }
  }
  if (sorted.length !== frozenOrder.length) {
    errors.push(`${label} count mismatch: ${sorted.length} local vs ${frozenOrder.length} frozen`)
  }
}
checkSequence('src/content/employees', employeeOrder, expectedEmployees, 'employees')
checkSequence('src/content/product-groups', productGroupOrder, expectedProductGroups, 'product-groups')

if (errors.length) {
  console.error(`verify:content: ${errors.length} problem(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`verify:content: ok (${map.employees.length} employees, ${map.productGroups.length} product groups, ${map.pages.length} pages)`)
```

- [ ] **Step 3: Write scripts/verify-assets.mjs**

Create `scripts/verify-assets.mjs`. It validates the manifest, checksums, file decoding, dimensions, alt decisions, usage mappings, and rights status.

```javascript
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { resolve } from 'node:path'

const readJson = (path) => JSON.parse(readFileSync(resolve(path), 'utf8'))

const manifest = readJson('tests/fixtures/cutover/assets.json')
const inventory = readJson('tests/fixtures/cutover/asset-inventory.json')
const source = readJson('tests/fixtures/cutover/contentful-source.json')

const errors = []
const invById = new Map(inventory.map((a) => [a.id, a]))
const entryById = new Map(source.entries.map((e) => [e.id, e]))

for (const asset of manifest) {
  if (!asset.contentfulAssetId) { errors.push('asset manifest entry missing contentfulAssetId'); continue }
  if (!invById.has(asset.contentfulAssetId)) {
    errors.push(`manifest asset ${asset.contentfulAssetId} not in inventory`)
  }
  if (!asset.localPath || !existsSync(resolve(asset.localPath))) {
    errors.push(`asset ${asset.contentfulAssetId}: missing localPath file ${asset.localPath}`)
    continue
  }
  const buf = readFileSync(resolve(asset.localPath))
  const sha = createHash('sha256').update(buf).digest('hex')
  if (sha !== asset.sha256) {
    errors.push(`asset ${asset.contentfulAssetId}: sha256 mismatch (expected ${asset.sha256}, got ${sha})`)
  }
  if (buf.length !== asset.byteSize) {
    errors.push(`asset ${asset.contentfulAssetId}: byteSize mismatch (expected ${asset.byteSize}, got ${buf.length})`)
  }
  let meta
  try {
    meta = await sharp(buf).metadata()
  } catch (e) {
    errors.push(`asset ${asset.contentfulAssetId}: cannot decode image: ${e.message}`)
    continue
  }
  if (meta.width !== asset.width || meta.height !== asset.height) {
    errors.push(`asset ${asset.contentfulAssetId}: dimensions mismatch (expected ${asset.width}x${asset.height}, got ${meta.width}x${meta.height})`)
  }
  if (meta.mime && meta.mime !== asset.mimeType) {
    errors.push(`asset ${asset.contentfulAssetId}: mime mismatch (expected ${asset.mimeType}, got ${meta.mime})`)
  }
  if (typeof asset.alt !== 'string') {
    errors.push(`asset ${asset.contentfulAssetId}: alt must be a string`)
  } else if (asset.alt === '' && !asset.decorativeEmptyAlt) {
    errors.push(`asset ${asset.contentfulAssetId}: empty alt requires decorativeEmptyAlt=true with justification`)
  }
  if (!Array.isArray(asset.usedBy) || asset.usedBy.length === 0) {
    errors.push(`asset ${asset.contentfulAssetId}: usedBy must be a non-empty array`)
  } else {
    for (const use of asset.usedBy) {
      const entry = entryById.get(use.entryId)
      if (!entry) { errors.push(`asset ${asset.contentfulAssetId}: usedBy entry ${use.entryId} not in frozen source`); continue }
      if (!entry.fields || !(use.field in entry.fields)) {
        errors.push(`asset ${asset.contentfulAssetId}: usedBy field ${use.field} not present on entry ${use.entryId}`)
      }
    }
  }
  if (!asset.rights || !['approved-original', 'approved-derivative'].includes(asset.rights.status)) {
    errors.push(`asset ${asset.contentfulAssetId}: rights.status must be approved-original or approved-derivative`)
  }
  if (asset.rights?.status === 'approved-derivative' && !asset.rights.derivation) {
    errors.push(`asset ${asset.contentfulAssetId}: approved-derivative requires rights.derivation`)
  }
}

if (errors.length) {
  console.error(`verify:assets: ${errors.length} problem(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`verify:assets: ok (${manifest.length} assets)`)
```

- [ ] **Step 4: Write scripts/verify-dist.mjs**

Create `scripts/verify-dist.mjs`. It checks built route files, titles, homepage social metadata, legal-page metadata policy, sitemap links, local asset references, and absence of Contentful API/CDN URLs in active output.

```javascript
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import * as cheerioNS from 'cheerio'

const cheerio = cheerioNS.default ?? cheerioNS

const errors = []
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null)

const checkRoute = (file, label) => {
  const html = read(resolve('dist', file))
  if (!html) { errors.push(`missing built route: dist/${file}`); return null }
  return cheerio.load(html)
}

const homepage = checkRoute('index.html', 'homepage')
const imprint = checkRoute('imprint/index.html', 'imprint')
const dataPolicy = checkRoute('data-policy/index.html', 'data-policy')
if (!homepage || !imprint || !dataPolicy) {
  console.error(`verify:dist: ${errors.length} problem(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

const expectTitle = ($, expected) => {
  const t = $('title').text().trim()
  if (t !== expected) errors.push(`title mismatch: expected "${expected}", got "${t}"`)
}
expectTitle(homepage, 'Rhode Medizintechnik – Heinrich Rhode GmbH')
expectTitle(imprint, 'Impressum')
expectTitle(dataPolicy, 'Datenschutzhinweis')

const desc = homepage('meta[name="description"]').attr('content')
const expectedDesc = 'Heinrich Rhode GmbH – Medizintechnik für Praxen und Kliniken. Beratung, Service und Produkte aus einer Hand.'
if (desc !== expectedDesc) errors.push(`homepage description mismatch: ${desc}`)

const ogImage = homepage('meta[property="og:image"]').attr('content')
const twitterImage = homepage('meta[name="twitter:image"]').attr('content')
const siteOrigin = 'https://www.rhode-medizin.de'
const isLocalAstro = (url) => url && url.startsWith(`${siteOrigin}/_astro/`) && /\.(jpe?g|png|webp|avif)$/i.test(url)
if (!isLocalAstro(ogImage)) errors.push(`og:image must be a local /_astro/ URL, got: ${ogImage}`)
if (!isLocalAstro(twitterImage)) errors.push(`twitter:image must be a local /_astro/ URL, got: ${twitterImage}`)
for (const url of [ogImage, twitterImage].filter(Boolean)) {
  const path = url.replace(siteOrigin, '')
  if (!existsSync(resolve('dist', path.replace(/^\//, '')))) {
    errors.push(`social image file missing in dist: ${path}`)
  }
}

for (const [$, label, title] of [[imprint, 'imprint', 'Impressum'], [dataPolicy, 'data-policy', 'Datenschutzhinweis']]) {
  if ($('meta[name="description"]').length) errors.push(`${label} must not have a description meta tag`)
  if ($('meta[property="og:title"]').length) errors.push(`${label} must not have Open Graph metadata`)
  if ($('meta[name="twitter:card"]').length) errors.push(`${label} must not have Twitter card metadata`)
}

const sitemap = read('dist/sitemap-index.xml') || read('dist/sitemap-0.xml')
if (!sitemap) {
  errors.push('missing sitemap file')
} else {
  const $ = cheerio.load(sitemap, { xmlMode: true })
  const locs = $('loc').map((_, el) => $(el).text()).get()
  for (const expected of ['https://www.rhode-medizin.de/', 'https://www.rhode-medizin.de/imprint/', 'https://www.rhode-medizin.de/data-policy/']) {
    if (!locs.includes(expected)) errors.push(`sitemap missing ${expected}`)
  }
}

const builtFiles = []
const walk = (dir) => {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, name.name)
    if (name.isDirectory()) walk(full)
    else if (/\.(html|xml|css|js|mjs|json)$/i.test(name.name)) builtFiles.push(full)
  }
}
walk('dist')
const ctfPattern = /ctfassets\.net|ctfapps\.net|cdn\.contentful\.com|preview\.contentful\.com/i
for (const f of builtFiles) {
  const text = readFileSync(f, 'utf8')
  if (ctfPattern.test(text)) {
    errors.push(`Contentful URL found in active output: ${f.replace(resolve('dist'), '.')}`)
  }
}

if (errors.length) {
  console.error(`verify:dist: ${errors.length} problem(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('verify:dist: ok')
```

- [ ] **Step 5: Switch parity scripts to cutover fixtures and add a real diff**

In both `scripts/compare-pages.mjs` and `scripts/compare-legal-pages.mjs`:

1. Change every `fixture: 'tests/fixtures/live/...'` to the cutover fixture:
   - `index` → `tests/fixtures/cutover/pages/index.html`
   - `imprint` → `tests/fixtures/cutover/pages/imprint.html`
   - `data-policy` → `tests/fixtures/cutover/pages/data-policy.html`
2. The cutover fixtures are Astro output, not Gatsby. Remove the Gatsby-specific normalization steps that no longer apply to Astro-vs-Astro comparison: `collapseGatsbyImages` and `unwrapAnchoredButtons` (the cutover fixtures contain no Gatsby markup). Keep `collapsePictureElements`, `normalizeAttributes`, `stripPresentationalAttributes`, `normalizeWhitespace`, and `stripNoise` (trim `STRIP_SELECTORS` to the cookie-consent entries only, since the Gatsby script selectors are no longer relevant).
3. Preserve exact link `href` values: in `normalizeAttributes`, do not canonicalize `a[href]` beyond protocol/host normalization. Specifically, keep `href` values like `/imprint/` and `/data-policy/` and external legal links byte-for-byte; only strip `http:` vs `https:` and trailing query strings on image URLs. Implement this by changing the `a[href]` branch to use a new `normalizeLinkHref` that only lowercases the scheme and removes a trailing slash only if the frozen fixture and build agree (safest: do not alter `href` at all; compare must pass with the same `/imprint/` form both sides already use).
4. Replace the 600-char preview diff with a full structural diff using the `diff` package. In `printDiff`, when content differs, import `diffWords` from `diff` and print the full diff:

```javascript
import { diffWords } from 'diff'

const printDiff = (result) => {
  if (result.status !== 'fail') return
  console.error(`\n[${result.page}] FAIL: ${result.reason}`)
  if (result.fixtureHtml !== undefined) {
    const parts = diffWords(result.fixtureHtml, result.builtHtml)
    for (const part of parts) {
      const marker = part.added ? '+' : part.removed ? '-' : ' '
      process.stderr.write(marker + part.value)
    }
    process.stderr.write('\n')
  }
}
```

Update `comparePage` to store `fixtureHtml` and `builtHtml` (the full normalized strings) instead of `fixturePreview`/`builtPreview`.

In `compare-pages.mjs`, the `KEEP_ATTRIBUTES` set should still exclude `alt` only if the cutover fixtures (old Astro build) and the new build agree on alt. Since both are Astro builds with the same alt source, keep `alt` in `KEEP_ATTRIBUTES` for `compare-pages.mjs` so alt regressions are caught; the legal-page comparator already keeps `alt`. Apply the same `alt`-keeping behavior to `compare-pages.mjs`.

- [ ] **Step 6: Add package.json scripts and extend format/lint globs**

In `package.json`, add the verify scripts and extend `format`/`lint` to include `.mdx` and `.yml`:

```json
"scripts": {
  "build": "astro check && astro build",
  "compare:legal": "node scripts/compare-legal-pages.mjs",
  "compare:pages": "node scripts/compare-pages.mjs",
  "develop": "astro dev",
  "format": "prettier --write \"**/*.{js,ts,astro,json,md,mdx,yml,yaml,css}\"",
  "lint": "prettier --check \"**/*.{js,ts,astro,json,md,mdx,yml,yaml,css}\"",
  "verify:content": "node scripts/verify-content.mjs",
  "verify:assets": "node scripts/verify-assets.mjs",
  "verify:dist": "node scripts/verify-dist.mjs",
  "verify": "pnpm lint && pnpm verify:content && pnpm verify:assets && pnpm build && pnpm compare:legal && pnpm compare:pages && pnpm verify:dist",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

- [ ] **Step 7: Add PR CI workflow**

Create `.github/workflows/verify.yml`:

```yaml
name: verify
on:
  pull_request:
    branches: [master]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm verify
```

CI runs `pnpm verify` (lint, content integrity, asset integrity, build, both fixture comparisons, and built-output checks). No Contentful credentials are set in CI; the local build must not need them.

- [ ] **Step 8: Run the aggregate verification**

Run:

```bash
pnpm verify
```

Expected: lint, `verify:content`, `verify:assets`, `build`, `compare:legal`, `compare:pages`, and `verify:dist` all pass. If `compare:pages` reports a structural diff, fix the MDX content in Task 7 to match the frozen fixture exactly before continuing.

- [ ] **Step 9: Lint and commit**

Run:

```bash
pnpm lint
git add scripts/ package.json .github/workflows/verify.yml pnpm-lock.yaml
git commit -m "Add verify scripts, switch parity fixtures to cutover, add PR CI"
```

Expected: one commit adds the three verify scripts, switches the comparators, adds the CI workflow, and the `diff` devDependency.

---

### Task 9: Remove Contentful Loader, Dispatcher, Dependencies, And Aliases

**Files:**
- Delete: `src/content/loaders/contentful.ts` and the `src/content/loaders/` directory.
- Delete: `scripts/capture-contentful.mjs` (temporary, per spec).
- Modify: `astro.config.mjs` — remove `image.domains` and `@content-loaders` alias.
- Modify: `tsconfig.json` — remove `@content-loaders/*` path alias.
- Modify: `package.json` — remove `contentful`, `dotenv`, `unified`, `remark-parse`, `remark-rehype`, `rehype-stringify`.

**Interfaces:**
- Consumes: the working local build from Tasks 3–8.
- Produces: a clean checkout that builds without `.env`, Contentful credentials, or network access to Contentful.

- [ ] **Step 1: Delete the Contentful loader, dispatcher, and capture script**

Run:

```bash
git rm src/content/loaders/contentful.ts
rmdir src/content/loaders 2>/dev/null || true
git rm scripts/capture-contentful.mjs
```

`ModuleRenderer.astro` and `[...slug].astro` were deleted in Task 7. Confirm they are gone:

```bash
ls src/components/ModuleRenderer.astro 'src/pages/[...slug].astro' 2>/dev/null || echo "dynamic route and dispatcher already removed"
```

Expected: "dynamic route and dispatcher already removed".

- [ ] **Step 2: Remove remote image domains and the @content-loaders alias from astro.config.mjs**

Replace `astro.config.mjs` with:

```javascript
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'

export default defineConfig({
  output: 'static',
  site: 'https://www.rhode-medizin.de',
  integrations: [
    sitemap(),
    mdx({
      markdown: {
        smartPunctuation: false,
        gfm: true,
      },
    }),
  ],
})
```

The `fileURLToPath` import, `image.domains`, and `vite.resolve.alias` are all gone.

- [ ] **Step 3: Remove the @content-loaders TypeScript path alias**

Replace `tsconfig.json` with:

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

- [ ] **Step 4: Remove Contentful-only dependencies**

Run:

```bash
pnpm remove contentful dotenv unified remark-parse remark-rehype rehype-stringify
```

Expected: `package.json` no longer lists those packages; `pnpm-lock.yaml` updated. `sharp` and `astro-seo` remain (still used).

- [ ] **Step 5: Confirm no stale references remain**

Run:

```bash
rg -n "@content-loaders|contentful|dotenv|remark-parse|remark-rehype|rehype-stringify|unified" src astro.config.mjs tsconfig.json scripts --glob '!tests/fixtures/cutover/**' || echo "no active references"
```

Expected: "no active references". Matches inside `tests/fixtures/cutover/` are records, not runtime dependencies, and are excluded.

- [ ] **Step 6: Build and verify from the current checkout**

Run:

```bash
pnpm verify
```

Expected: passes end to end without any Contentful credential.

- [ ] **Step 7: Lint and commit**

Run:

```bash
pnpm lint
git add -A
git commit -m "Remove Contentful loader, dependencies, aliases, and capture script"
```

Expected: one commit deletes the loader, capture script, aliases, image domains, and Contentful dependencies.

---

### Task 10: Update Documentation And ADRs

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`
- Create: `docs/adrs/adr_08_local_content.md`
- Modify: `docs/adrs/adr_02_contentful_loader.md`
- Modify: `docs/adrs/adr_03_content_loader_alias.md`
- Modify: `docs/adrs/adr_05_image_strategy.md`
- Modify: `docs/adrs/adr_05_astro_seo.md`
- Modify: `docs/adrs/adr_07_netlify.md`

**Interfaces:**
- Consumes: the completed migration from Tasks 1–9.
- Produces: active documentation that no longer says builds need Contentful credentials or webhooks, and ADRs that record the local-content decision and supersede the Contentful-specific records.

- [ ] **Step 1: Add ADR 08**

Create `docs/adrs/adr_08_local_content.md`:

```markdown
# ADR 08: Local Git content (remove Contentful CMS)

## Status

Accepted

Supersedes ADR 02 (`adr_02_contentful_loader.md`) and ADR 03
(`adr_03_content_loader_alias.md`) in full. Supersedes the
remote-Contentful-source portions of `adr_05_image_strategy.md` while
keeping its Astro image-optimization decision accepted. Supersedes the
hard-coded/Contentful metadata consequence noted in
`adr_05_astro_seo.md` while keeping its `astro-seo` decision accepted.
Updates `adr_07_netlify.md` to remove Contentful credentials/webhooks.

## Context

The site is a three-page brochure (`/`, `/imprint`, `/data-policy`)
maintained by one developer, changed infrequently. Contentful added
credentials, a build-time network dependency, webhook and account
administration, and a normalization layer whose only consumer was this
site. The local-content migration design
(`docs/superpowers/specs/2026-08-11-local-content-cms-removal-design.md`)
replaced Contentful with version-controlled local content while
retaining Astro's static rendering and image optimization.

## Decision

Store page content in file-routed MDX pages (`src/pages/*.mdx`), repeated
records in two Astro `glob()` content collections (`employees`,
`productGroups`) as small YAML files, and used images as local binaries
under `src/assets/content/`. Pages own their data loading explicitly via
`getCollection` and compose editor-facing blocks from
`src/components/blocks/`. The MDX integration uses the Satteri processor
with `smartPunctuation: false` so frozen prose keeps straight quotes,
dashes, and ellipses. Social images use `getImage()` on a local
`ImageMetadata` so OG/Twitter image URLs point at a site-origin
`/_astro/` URL instead of a Contentful CDN URL.

The Contentful loader, `ModuleRenderer` dispatcher, dynamic route,
remote image domains, `@content-loaders` alias, and Contentful-only
dependencies were removed. Integrity is enforced by `pnpm verify`
(`verify:content`, `verify:assets`, `verify:dist`, plus fixture
comparison against `tests/fixtures/cutover/pages/`), run in PR CI and on
both Netlify and Cloudflare before publishing.

## Consequences

- A clean checkout builds without `.env`, Contentful credentials, or
  network access to Contentful or its asset CDN after dependencies are
  installed.
- Future content changes are reviewed Git changes that must update the
  applicable regression expectations in the same pull request.
  Generated output never regenerates its own expected fixture silently.
- The frozen capture under `tests/fixtures/cutover/` is migration
  provenance and the cutover integrity oracle; `tests/fixtures/live/`
  remains a labeled historical Gatsby fixture.
- ADR 02 and ADR 03 are superseded (no Contentful loader, no loader
  alias). The remote-Contentful-source portion of ADR 05
  (image_strategy) is superseded; its Astro image-optimization decision
  remains accepted with local `ImageMetadata` sources. The
  hard-coded/Contentful metadata consequence in ADR 05 (astro_seo) is
  superseded; the `astro-seo` decision remains accepted with the
  homepage description now authored in `index.mdx`. ADR 07 is updated
  to remove Contentful credentials/webhooks and point to the
  local-content deployment process.
```

- [ ] **Step 2: Mark ADR 02 and ADR 03 superseded**

In `docs/adrs/adr_02_contentful_loader.md`, change the Status block to:

```markdown
## Status

Superseded by ADR 08 (`adr_08_local_content.md`).
```

In `docs/adrs/adr_03_content_loader_alias.md`, change the Status block to:

```markdown
## Status

Superseded by ADR 08 (`adr_08_local_content.md`). The `@content-loaders`
alias no longer exists.
```

- [ ] **Step 3: Partially supersede ADR 05 image_strategy**

In `docs/adrs/adr_05_image_strategy.md`, change the Status block to:

```markdown
## Status

Partially superseded by ADR 08. The remote-Contentful-source portions
(`image.domains` for `images.ctfassets.net` / `videos.ctfassets.net`,
and the remote-asset download path) no longer apply. The Astro
image-optimization decision (`astro:assets` `<Image />` / `<Picture />`
with local `ImageMetadata` sources) remains accepted.
```

- [ ] **Step 4: Partially supersede ADR 05 astro_seo**

In `docs/adrs/adr_05_astro_seo.md`, append to the Context/Consequences a supersession note. Add a Status block at the top:

```markdown
## Status

Accepted. The "homepage SEO description is hardcoded in code (not
sourced from Contentful)" consequence is superseded by ADR 08: the
description is now authored in `src/pages/index.mdx`. The `astro-seo`
decision remains accepted.
```

- [ ] **Step 5: Update ADR 07 to remove Contentful credentials and webhooks**

In `docs/adrs/adr_07_netlify.md`, replace the bullet list items and the "Content rebuilds" content that reference Contentful. Specifically:

- Change the env-var bullet to: `Production env vars: none required for content. No Contentful credentials are set.`
- Remove the "Content rebuilds via a Contentful webhook to a Netlify build hook" bullet.
- Replace the "Content edits trigger a Netlify rebuild automatically via the Contentful webhook" consequence with: "Content edits are Git changes; a push triggers a Netlify rebuild via git integration. No Contentful webhook is configured."
- Add a final consequence: "See ADR 08 for the local-content decision and `docs/superpowers/plans/2026-08-13-local-content-cutover-operator-runbook.md` for the retirement steps."

- [ ] **Step 6: Update README.md**

Rewrite the Environment, Develop, Build, Parity checks, and Deploy sections so they no longer mention Contentful credentials or webhooks:

- Remove the "Copy `.env.example`" / Contentful credentials block; replace with a note that no environment variables are required to build.
- Update "Parity checks" to describe `pnpm verify` and the cutover fixtures.
- In the Deploy section, remove the Contentful env vars from the Netlify build config description and remove the "Content rebuilds" subsection about the Contentful webhook; replace with "Content edits are Git changes; pushing to `master` triggers a Netlify rebuild."
- Keep the Cloudflare fallback description but remove Contentful env var references; note both hosts run `pnpm verify` before publishing.

- [ ] **Step 7: Update AGENTS.md**

In `AGENTS.md`:

- Replace the Environment section: remove `CONTENTFUL_SPACE_ID` / `CONTENTFUL_DELIVERY_TOKEN` / `dotenv` / `CONTENTFUL_ACCESS_TOKEN` / `CONTENTFUL_PREVIEW_TOKEN` content. State that the build uses local content under `src/content/`, `src/pages/*.mdx`, and `src/assets/content/`; no environment variables are required.
- Replace the "Architecture" bullets about the Contentful loader, `content.config.ts` Contentful schema, and `[...slug].astro` with the local-content architecture: file-routed MDX pages, two `glob()` collections, `PageLayout.astro`, editor-facing `blocks/`, and `ImageMetadata` end to end.
- Update the Commands section: add `pnpm verify`, `pnpm verify:content`, `pnpm verify:assets`, `pnpm verify:dist`; note `pnpm build` runs `astro check` then `astro build` and no longer needs Contentful.
- Update the Deploy section reference to point to the new operator runbook (Task 12) and ADR 08.

- [ ] **Step 8: Update the Netlify operator runbook**

In `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`:

- Remove the "Contentful → Netlify build webhook" section (section 3).
- Update the Netlify site setup env-var step to state no Contentful env vars are set.
- Add a pointer to the new local-content cutover/retirement runbook created in Task 12.

- [ ] **Step 9: Lint and commit**

Run:

```bash
pnpm lint
git add README.md AGENTS.md docs/
git commit -m "Update docs and ADRs for local-content migration"
```

Expected: one commit updates the active docs and adds/updates the ADRs. Historical specs in `docs/superpowers/specs/` remain unchanged.

---

### Task 11: Clean-Build Proof And Visual Review

**Files:**
- None modified; verification and evidence only.

**Interfaces:**
- Consumes: the completed migration from Tasks 1–10.
- Produces: evidence (recorded in the PR body) that `pnpm verify` passes in a credential-free, Contentful-blocked clean checkout, and that desktop/mobile visual review passes for all three pages.

- [ ] **Step 1: Run the normal-checkout verification**

Run:

```bash
pnpm verify
```

Expected: passes. Record the output summary in the PR body.

- [ ] **Step 2: Run the clean-build proof**

From a clean checkout with no `.env` and all `CONTENTFUL_*` variables unset:

```bash
rm -rf .astro dist node_modules/.astro
unset CONTENTFUL_SPACE_ID CONTENTFUL_DELIVERY_TOKEN CONTENTFUL_PREVIEW_TOKEN CONTENTFUL_ACCESS_TOKEN CONTENTFUL_USE_PREVIEW
pnpm install --frozen-lockfile
# After install, block Contentful hosts (Linux example; adapt to your platform):
#   sudo sh -c 'echo "127.0.0.1 cdn.contentful.com preview.contentful.com images.ctfassets.net videos.ctfassets.net" >> /etc/hosts'
pnpm verify
# Restore /etc/hosts afterwards.
```

Expected: `pnpm verify` succeeds. Active source, configuration, direct dependencies, and `dist/` contain no Contentful API/CDN dependency. `verify:dist` already enforces the absence of Contentful URLs in built output.

- [ ] **Step 3: Desktop and mobile visual review**

Compare screenshots of the frozen old Astro build (the cutover fixtures rendered, or the recorded pre-cutover Netlify deploy) and the candidate preview at 390 x 844 and 1440 x 900 for all three pages. Use the `playwright-cli` skill or equivalent. Review the complete pages: header, footer, hero crop and overlay, CTA, employee grid, product list, legal layout, and responsive wrapping. Attach the review evidence to the pull request; screenshots do not need to be committed.

- [ ] **Step 4: Verify Netlify and Cloudflare previews of the candidate commit**

Push the branch and confirm both Netlify and Cloudflare preview builds pass `pnpm verify` (or their equivalent build) for the same commit. Record both preview URLs in the PR body.

- [ ] **Step 5: Commit any evidence files (optional)**

If the team prefers committed evidence, add a short summary file under `docs/superpowers/plans/` referencing the PR. Otherwise, no commit is needed for this task.

---

### Task 12: Write The Cutover And Retirement Operator Runbook

**Files:**
- Create: `docs/superpowers/plans/2026-08-13-local-content-cutover-operator-runbook.md`

**Interfaces:**
- Consumes: the completed migration PR from Tasks 1–11 and ADR 08.
- Produces: the human-only operational runbook for production cutover, rollback, and 14-day Contentful retirement (spec migration steps 10–14). This task creates a plan document only; it performs no code changes.

- [ ] **Step 1: Create the operator runbook**

Create `docs/superpowers/plans/2026-08-13-local-content-cutover-operator-runbook.md` mirroring the Netlify runbook's structure. Cover, in order:

1. **Record pre-cutover state**: record the current production Netlify deploy ID and Git commit before merge.
2. **Verify previews**: confirm Netlify and Cloudflare previews of the candidate commit pass.
3. **Disable the Contentful→Netlify webhook** immediately before merge so CMS changes can no longer imply publication. Retain the hook details and credentials during rollback.
4. **Merge, deploy, and smoke test**: merge the migration PR; after deployment, verify `/`, `/imprint/`, `/data-policy/` return 200; an unknown route serves the expected 404; titles, homepage description, canonical URL, Open Graph, and Twitter data; footer legal links and exact external legal links; sitemap entries; all rendered image and source URLs return 200; the hero retains eager loading and high fetch priority; below-the-fold images remain lazy-loaded.
5. **Rollback**: the immediate rollback is to republish the recorded pre-cutover Netlify deploy (no rebuild). If the code change must also be reversed, revert the migration PR and rebuild the old implementation with the retained frozen Contentful space and credentials. Do not use the Cloudflare fallback as a substitute unless its retained deployment is independently verified to contain the pre-cutover build. Re-enable the Contentful webhook only if Contentful again becomes the active authoring source.
6. **14-day retention**: keep Contentful frozen and retain its space, credentials, prior Netlify deploy, and export for a 14-calendar-day rollback window.
7. **Retirement**: after 14 days without a rollback, remove Contentful environment variables from every Netlify and Cloudflare context, revoke tokens, delete the Contentful webhook and unused Netlify build hook, retain the sanitized export as migration provenance, and archive or cancel the Contentful space per the account owner's retention needs.

Include the prerequisite that the migration PR (Tasks 1–11) is merged and the clean-build proof (Task 11) is recorded.

- [ ] **Step 2: Lint and commit**

Run:

```bash
pnpm lint
git add docs/superpowers/plans/2026-08-13-local-content-cutover-operator-runbook.md
git commit -m "Add local-content cutover and retirement operator runbook"
```

Expected: one commit adds the operator runbook. The migration PR now contains all twelve tasks' commits and is ready for review.

---

## Notes on the frozen-content source of truth

Because the spec deliberately defers exact content values to the committed capture artifacts, the prose/data steps in Tasks 2, 4, and 7 instruct verbatim copying from `tests/fixtures/cutover/contentful-source.json` and `assets.json` rather than hardcoding values in this plan. This is the spec's design, not a placeholder: the implementer reads the named artifact field at execution time and copies the exact frozen value. The structural code (component interfaces, config, schemas, verification scripts) is written in full above.

## Self-Review summary

Spec coverage: every section of the design spec maps to a task — freeze/capture (Task 1), asset rights/download/manifest (Task 2), MDX+Satteri (Task 3), collections+schemas with `image()` (Task 4), `PageLayout` + `getImage` social image (Task 5), editor-facing blocks + `Tiles` validation + `ImageMetadata` contracts + deletion of `TileGrid`/`TileList` (Task 6), three MDX pages + deletion of dynamic route and `ModuleRenderer` (Task 7), `verify:content`/`verify:assets`/`verify:dist` + aggregate `pnpm verify` + switched parity fixtures + full diff + PR CI (Task 8), removal of loader/dispatcher/deps/aliases/domains/capture-script (Task 9), docs + ADR 08 + ADR supersessions (Task 10), clean-build proof + visual review + preview verification (Task 11), operational cutover/rollback/retirement runbook (Task 12).

Type consistency: `ImageMetadata` is used consistently across `HeroBlock`, `blocks/Hero`, `blocks/EmployeeTile`, `blocks/ProductGroup`, `PageLayout`, and the collection schemas. `Tiles` props (`layout`, `items`, `itemComponent`) and the mapped item shapes (`{ name, department?, photo, alt }` and `{ name, description?, examples, photo, alt }`) match the schemas in Task 4 and the item components in Task 6. Verification script artifact field names (`contentfulAssetId`, `localPath`, `sha256`, `usedBy`, `rights.status`) match the `assets.json` shape defined in Task 2.
