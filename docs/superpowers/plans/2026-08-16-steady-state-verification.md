# Steady-State Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace migration-era snapshot gates with deterministic source, asset, and built-output invariants while retaining cutover comparisons as historical diagnostics.

**Architecture:** Verification functions accept a repository root and return accumulated errors; thin CLI wrappers print results and set exit status. Node 22's built-in test runner exercises each verifier against temporary mutated copies. A mutable operational YAML manifest owns local asset identity while Astro collections continue to resolve native image metadata.

**Tech Stack:** Node.js 22, pnpm, Astro 7, Node `node:test`, YAML 2.x, Sharp, Cheerio, Prettier.

## Global Constraints

- Source of truth: `docs/superpowers/specs/2026-08-16-local-content-steady-state-design.md`.
- Do not modify `tests/fixtures/cutover/`.
- Do not add current-page HTML, prose, screenshot, or visual snapshots.
- Preserve `compare:pages` and `compare:legal` as manual historical diagnostics only.
- Add `yaml` as a direct development dependency; do not rely on Astro's transitive dependency.
- Parse YAML with `yaml.parse`, never regular expressions.
- Verifiers accumulate file-specific errors instead of stopping at the first problem.
- Use Node's built-in test runner; add no test framework.
- Run `pnpm lint` before each commit and `pnpm verify` before completion.
- Use the `commit-workflow` skill before every commit.
- Plan 2 owns strict component contracts and authoring documentation. Plan 3 owns CI, hosting, and ADRs.

---

## File Structure

- Create `src/content/assets.yaml`: operational asset identity and policy.
- Create `src/content/homepage/hero.yaml`: shared hero/social-image declaration.
- Modify `src/content.config.ts`, collection YAML, and `src/pages/index.mdx`: stable asset references.
- Create `scripts/lib/verification.mjs`: shared YAML/filesystem/CLI helpers.
- Replace `scripts/verify-{content,assets,dist}.mjs`: importable invariant verifiers.
- Create `tests/verifiers/{helpers,content,assets,dist}.test.mjs`: mutation tests.
- Modify comparator scripts and `package.json`: historical notices and steady-state aggregate.

### Task 1: Testable Verifier Infrastructure

**Files:**
- Create: `scripts/lib/verification.mjs`
- Create: `tests/verifiers/helpers.mjs`
- Create: `tests/verifiers/helpers.test.mjs`
- Modify: `package.json`, `pnpm-lock.yaml`

**Interfaces:**
- Produces `readText(root, path)`, `readYaml(root, path, errors)`, `listFiles(root, dir, extension?)`, `toPosix(path)`, `isNonEmptyString(value)`, `resolveContentImage(recordPath, imagePath)`, `sha256(buffer)`, `scanActiveSources(root)`, `isDirectExecution(url)`, and `runCli(label, verify)`.

- [ ] **Step 1: Write failing YAML-helper tests**

Create `tests/verifiers/helpers.test.mjs`:

```js
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { temporaryRoot } from './helpers.mjs'
import { readYaml } from '../../scripts/lib/verification.mjs'

test('readYaml parses mappings', () => {
  const root = temporaryRoot()
  mkdirSync(join(root, 'content'), { recursive: true })
  writeFileSync(join(root, 'content/record.yaml'), 'order: 1\nname: Example\n')
  const errors = []
  assert.deepEqual(readYaml(root, 'content/record.yaml', errors), {
    order: 1,
    name: 'Example',
  })
  assert.deepEqual(errors, [])
})

test('readYaml reports malformed YAML without throwing', () => {
  const root = temporaryRoot()
  mkdirSync(join(root, 'content'), { recursive: true })
  writeFileSync(join(root, 'content/record.yaml'), 'name: [broken\n')
  const errors = []
  assert.equal(readYaml(root, 'content/record.yaml', errors), null)
  assert.match(errors[0], /^content\/record\.yaml: invalid YAML:/)
})
```

- [ ] **Step 2: Prove the tests fail**

Run `node --test tests/verifiers/helpers.test.mjs`.

Expected: `ERR_MODULE_NOT_FOUND` for the unimplemented helpers.

- [ ] **Step 3: Add the direct YAML dependency**

Run `corepack enable && pnpm add --save-dev yaml@^2.9.0`.

Expected: root `devDependencies` and lockfile importer contain `yaml`.

- [ ] **Step 4: Implement shared helpers**

Create `scripts/lib/verification.mjs`. Use `resolve(root, relativePath)` for all reads, `yaml.parse` inside `try/catch`, recursive sorted file listing, `dirname(recordPath)` plus the YAML image path for image resolution, SHA-256 via `node:crypto`, and direct-execution detection with `pathToFileURL(resolve(process.argv[1])).href === import.meta.url`. `runCli` must await the verifier, print every returned error, and set `process.exitCode = 1` on errors or exceptions.

Create `tests/verifiers/helpers.mjs` with:

```js
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

export const repositoryRoot = resolve(import.meta.dirname, '../..')
export const temporaryRoot = () => mkdtempSync(join(tmpdir(), 'rhode-verifier-'))
export const copyPaths = (paths) => {
  const root = temporaryRoot()
  for (const path of paths) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    cpSync(join(repositoryRoot, path), join(root, path), { recursive: true })
  }
  return root
}
export const replaceInFile = (root, path, from, to) => {
  const absolute = join(root, path)
  const source = readFileSync(absolute, 'utf8')
  if (!source.includes(from)) throw new Error(`${path}: mutation source not found`)
  writeFileSync(absolute, source.replace(from, to))
}
export const removePath = (root, path) =>
  rmSync(join(root, path), { recursive: true, force: true })
```

- [ ] **Step 5: Enable verifier tests**

Set `package.json` script: `"test": "node --test tests/verifiers/*.test.mjs"`.

- [ ] **Step 6: Verify and commit**

Run `node --test tests/verifiers/helpers.test.mjs && pnpm lint`.

Expected: 2 tests pass. Use `commit-workflow`, then commit the four new/modified files and lockfile with `Add testable verifier infrastructure`.

### Task 2: Source Content Invariants

**Files:**
- Replace: `scripts/verify-content.mjs`
- Create: `tests/verifiers/content.test.mjs`

**Interfaces:**
- Produces `verifyContent(root): Promise<{ errors: string[], summary: string }>`.

- [ ] **Step 1: Write mutation tests**

Copy `src/content`, `src/content.config.ts`, `src/pages`, `src/components`, `src/layouts`, and `astro.config.mjs` into a temporary root. Use a table-driven test with these exact mutations and expected diagnostic fragments:

```js
const cases = [
  ['duplicate order', 'src/content/employees/werner-schmitt.yaml', 'order: 2', 'order: 1', 'duplicate order 1'],
  ['empty example', 'src/content/product-groups/motorensysteme.yaml', '  - Elan 4', "  - ''", 'examples[0] must be non-empty'],
  ['set:html', 'src/components/blocks/Section.astro', '<slot />', '<div set:html={"bad"} />', 'set:html is forbidden'],
  ['raw import', 'src/pages/index.mdx', "from '../layouts/PageLayout.astro'", "from '../layouts/PageLayout.astro?raw'", 'raw import is forbidden'],
  ['Contentful API', 'astro.config.mjs', "site: 'https://www.rhode-medizin.de'", "site: 'https://cdn.contentful.com'", 'Contentful API is forbidden'],
  ['Contentful asset host', 'src/layouts/Layout.astro', '<head>', '<head><!-- images.ctfassets.net -->', 'Contentful asset host is forbidden'],
]
```

Add separate tests deleting `imprint.mdx`, adding `src/pages/extra.mdx`, adding nested `src/content/employees/team/bad.yaml`, and renaming a copied record to `Bad_Name.yaml`. Assert diagnostics name the route or record. The baseline asserts `errors` equals `[]`.

- [ ] **Step 2: Prove tests fail against the old script**

Run `node --test tests/verifiers/content.test.mjs`.

Expected: import/export failure because the old script is CLI-only and cutover-based.

- [ ] **Step 3: Implement `verifyContent`**

Use these constants and rules:

```js
const EXPECTED_MDX = ['data-policy.mdx', 'imprint.mdx', 'index.mdx']
const COLLECTIONS = [
  { dir: 'src/content/employees', label: 'employees', strings: ['name', 'photo'] },
  { dir: 'src/content/product-groups', label: 'product-groups', strings: ['name', 'photo'] },
]
const FORBIDDEN = [
  ['set:html', /\bset:html\s*=/],
  ['raw import', /\?raw(?:['"]|$)/],
  ['removed prose store', /content\/prose/],
  ['Contentful API', /(?:cdn|preview)\.contentful\.com/i],
  ['Contentful asset host', /(?:images|videos)\.ctfassets\.net/i],
]
```

For every collection record, require a mapping, positive integer order, unique contiguous orders `1..N`, non-empty required strings, and string `alt`. Require each filename stem to match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, reject nested YAML records, and reject duplicate stems across each collection. Product groups require a non-empty `examples` array whose values trim non-empty. Require exactly the expected MDX files. Scan active source under `src/pages`, `src/content`, `src/components`, `src/layouts`, `src/content.config.ts`, and `astro.config.mjs`. The CLI calls `runCli('verify:content', verifyContent)`.

- [ ] **Step 4: Verify and commit**

Run `node --test tests/verifiers/content.test.mjs && pnpm verify:content && pnpm lint`.

Expected summary: `5 employees, 5 product groups, 3 pages`; all mutation tests pass. Use `commit-workflow` and commit with `Replace cutover content checks with source invariants`.

### Task 3: Operational Asset Identity

**Files:**
- Create: `src/content/assets.yaml`, `src/content/homepage/hero.yaml`
- Modify: `src/content.config.ts`, all employee/product YAML, `src/pages/index.mdx`

**Interfaces:**
- Manifest root: `{ assets: AssetRecord[] }`.
- `AssetRecord`: `id`, `path`, `sha256`, `mimeType`, `byteSize`, `width`, `height`, `alt: { policy, default }`, `rights: { status, provenance }`.
- Usage records provide `assetId`, Astro image path, and `alt`.

- [ ] **Step 1: Generate the manifest values from existing assets**

Run:

```bash
node --input-type=module -e '
import fs from "node:fs";
import crypto from "node:crypto";
import sharp from "sharp";
const frozen=JSON.parse(fs.readFileSync("tests/fixtures/cutover/assets.json","utf8"));
for(const asset of frozen){
  const buffer=fs.readFileSync(asset.localPath);
  const metadata=await sharp(buffer).metadata();
  console.log(JSON.stringify({path:asset.localPath,sha256:crypto.createHash("sha256").update(buffer).digest("hex"),mimeType:metadata.format==="jpeg"?"image/jpeg":`image/${metadata.format}`,byteSize:buffer.length,width:metadata.width,height:metadata.height,rights:asset.rights},null,2));
}'
```

Expected: seven JSON objects. Use these generated values; do not hand-copy unchecked values.

- [ ] **Step 2: Create `src/content/assets.yaml`**

Use stable IDs: `homepage-hero`, `employee-placeholder`, and `product-{chirurgische-instrumente,motorensysteme,medizinisches-mobiliar,medizinische-geraete,rehabereich}`. All current images use `alt.policy: decorative` and `alt.default: ''`. Preserve factual approved-original provenance from the cutover asset records.

- [ ] **Step 3: Add usage IDs and hero collection**

Add `assetId: employee-placeholder` to every employee. Add the matching product ID to every product. Create:

```yaml
# src/content/homepage/hero.yaml
assetId: homepage-hero
image: ../../assets/content/hero-image.jpg
alt: ''
```

Extend schemas with required `assetId`. Add `homepageHero` glob collection for `hero.yaml` with required `assetId`, `image: image()`, and `alt`.

Also add `assetId` to both collection `requiredStrings` arrays in `verify-content.mjs`, and extend `content.test.mjs` with a mutation deleting one `assetId`; expect `<record path>: assetId must be non-empty`.

- [ ] **Step 4: Make one hero record feed visible and social images**

In `index.mdx`, replace the direct hero import with `getEntry('homepageHero', 'hero')`, throw if absent, and pass `hero.image` to both `PageLayout.socialImage` and `Hero.image`, with `hero.alt` to `Hero.alt`.

- [ ] **Step 5: Verify and commit**

Run `pnpm verify:content && pnpm build && pnpm lint`. Expected: all pass. Use `commit-workflow`; commit with `Add operational asset identities`.

### Task 4: Asset Integrity And Usage

**Files:**
- Replace: `scripts/verify-assets.mjs`
- Create: `tests/verifiers/assets.test.mjs`

**Interfaces:**
- Produces `verifyAssets(root): Promise<{ errors: string[], summary: string }>`.

- [ ] **Step 1: Write failing asset mutation tests**

Baseline-copy `src/assets/content` and `src/content`. The baseline asserts no errors. Add one test per mutation below, using `replaceInFile`, `removePath`, or `writeFileSync`, and assert the diagnostic fragment:

```text
duplicate manifest id                 -> duplicate asset id homepage-hero
duplicate manifest path               -> duplicate asset path src/assets/content/hero-image.jpg
delete one manifest record            -> unmanifested content image
add src/assets/content/unlisted.jpg   -> unmanifested asset file
delete one referencing product YAML   -> asset product-rehabereich is not referenced
replace one sha256 character          -> sha256 mismatch
replace width 4820 with 1             -> dimensions mismatch
replace image/jpeg with image/png     -> MIME type mismatch
replace provenance with empty string  -> rights.provenance must be non-empty
change product assetId to another ID  -> assetId and photo identify different assets
change photo while retaining assetId  -> assetId and photo identify different assets
set decorative usage alt non-empty    -> decorative asset requires empty alt
set manifest policy semantic only     -> semantic asset requires non-empty alt
```

- [ ] **Step 2: Prove tests fail**

Run `node --test tests/verifiers/assets.test.mjs`.

Expected: old verifier has no importable function and reads cutover records.

- [ ] **Step 3: Implement `verifyAssets`**

Parse the operational manifest defensively. Build maps by ID/path; validate uniqueness, `src/assets/content/` confinement, file existence, SHA-256, bytes, Sharp MIME/dimensions, `decorative|semantic` policy, default alt, and non-empty rights status/provenance. Load employees, products, and hero; resolve each image path relative to its YAML; require ID and path to identify the same manifest record and usage alt to satisfy policy. Reject unreferenced entries and every file in `src/assets/content/` absent from the manifest.

- [ ] **Step 4: Verify and commit**

Run `node --test tests/verifiers/assets.test.mjs && pnpm verify:assets && pnpm lint`.

Expected: tests pass and summary is `7 assets, 11 content usages`. Use `commit-workflow`; commit with `Verify operational assets and content usage`.

### Task 5: Complete Built-Output Contract

**Files:**
- Replace: `scripts/verify-dist.mjs`
- Create: `tests/verifiers/dist.test.mjs`
- Modify: `src/layouts/PageLayout.astro`: make social JPEG quality explicit for identity verification.
- Modify: `src/layouts/Layout.astro`: emit a canonical supplied by page layouts.

**Interfaces:**
- Produces `verifyDist(root): Promise<{ errors: string[], summary: string }>`.

- [ ] **Step 1: Write failing output mutation tests**

Copy `dist`, operational content, and source assets. Baseline must pass. Add table-driven HTML replacements for canonical, every OG/Twitter value, legal-link `https:` to `http:`, hero `loading="eager"` to `lazy`, hero `fetchpriority="high"` to `auto`, and first below-fold `loading="lazy"` to `eager`. Add file mutations deleting `dist/404.html` and one image selected from homepage `src`; add sitemap mutations removing `/imprint/` and adding `/extra/`; add `images.ctfassets.net` to built HTML. Each test asserts a diagnostic containing page/element and expected value. Add a dedicated wrong-alt replacement and a `srcset` candidate deletion test.

- [ ] **Step 2: Implement route and metadata checks**

Use explicit contracts for three routes, exact titles, homepage description, canonical URLs, OG title/type/url/locale/site name, Twitter card/title/description, equal social image URLs, legal metadata absence, 404 existence, and sitemap exactly `/`, `/imprint/`, `/data-policy/`.

Add `canonical?: string` to `Layout.astro`, render `<link rel="canonical" href={canonical} />` in `<head>` when supplied, and have `PageLayout.astro` pass `new URL(Astro.url.pathname, Astro.site).toString()`. This gives all three routed `PageLayout` pages canonicals while leaving `404.astro` without one. Legal pages must still omit description, Open Graph, and Twitter metadata.

- [ ] **Step 3: Implement links, images, and loading checks**

Resolve internal links to built files; require header `/` and footer legal routes. Require exact schemes for `https://www.e-recht24.de`, `https://dg-datenschutz.de/datenschutz-dienstleistungen/externer-datenschutzbeauftragter/`, and `https://www.wbs-law.de/`. Parse all local `src` and every `srcset` candidate and require files. Compare rendered hero/employee/product alts to sorted source records. Require one eager/high-priority hero, five lazy employees, and five lazy products. Scan textual output for Contentful hosts.

- [ ] **Step 4: Make social-image generation explicit and prove source identity**

Change `PageLayout.astro` to call:

```ts
await getImage({ src: socialImage, format: 'jpeg', quality: 80 })
```

Derive the expected social JPEG from the manifest-declared hero with:

```js
const expectedSocial = await sharp(heroSource).jpeg({ quality: 80 }).toBuffer()
```

Compare its SHA-256 with the local file referenced by `og:image`. Require Twitter to use the same URL. If the digests differ, fail with `homepage social image bytes do not match the manifest-declared hero source`; never weaken this to URL shape or dimensions.

- [ ] **Step 5: Verify and commit**

Run `pnpm build && node --test tests/verifiers/dist.test.mjs && pnpm verify:dist && pnpm lint`.

Expected: all mutation tests pass; summary names 3 routes, 404, sitemap, metadata, links, and 11 content images. Use `commit-workflow`; commit with `Complete built output contract checks`.

### Task 6: Steady-State Aggregate

**Files:**
- Modify: `package.json`, `scripts/compare-pages.mjs`, `scripts/compare-legal-pages.mjs`

- [ ] **Step 1: Label historical commands**

Both comparators print before comparison:

```js
console.log(
  'Historical diagnostic only: compares current output with the frozen 2026 cutover capture; it is not a current-content validity or deployment gate.\n',
)
```

- [ ] **Step 2: Set final scripts**

```json
"test": "node --test tests/verifiers/*.test.mjs",
"verify": "pnpm lint && pnpm verify:content && pnpm verify:assets && pnpm build && pnpm test && pnpm verify:dist"
```

Keep both `compare:*` scripts unchanged otherwise and outside `verify`.

- [ ] **Step 3: Run all gates**

Run `pnpm build`, both historical commands, then `pnpm verify`.

Expected: historical notice appears; the aggregate runs no comparator and passes all verifier mutation tests.

- [ ] **Step 4: Confirm frozen evidence and commit**

Run `git diff --exit-code -- tests/fixtures/cutover`. Expected: no output. Use `commit-workflow`; commit with `Make invariant checks the steady-state verification gate`.

### Task 7: Final Review

- [ ] Run `pnpm verify` under Node 22 and record all stages passing.
- [ ] Run `git diff --exit-code -- tests/fixtures/cutover`.
- [ ] Confirm representative wrong image, alt, manifest omission, order, metadata, link scheme, missing output, and loading mutations are covered by passing tests.
- [ ] Run `pnpm lint && git diff --check && git status --short`.
- [ ] State that no ADR was added because Plan 3 owns the steady-state verification ADR.
