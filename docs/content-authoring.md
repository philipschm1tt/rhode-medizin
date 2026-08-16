# Content Authoring

Use this guide to edit the version-controlled MDX, YAML, and image content. There
is no CMS.

## Prerequisites

Use Node.js 22 and run commands from the repository root:

```bash
node --version
pnpm install --frozen-lockfile
pnpm develop
```

Open the local URL printed by `pnpm develop`. Before opening a pull request, stop
the development server and run `pnpm verify`.

## Where Content Lives

- Homepage prose and composition: `src/pages/index.mdx`
- Imprint: `src/pages/imprint.mdx`
- Data policy: `src/pages/data-policy.mdx`
- Employees: `src/content/employees/*.yaml`
- Product groups: `src/content/product-groups/*.yaml`
- Homepage hero record: `src/content/homepage/hero.yaml`
- Image files: `src/assets/content/`
- Image manifest: `src/content/assets.yaml`

## Edit Homepage Or Legal Prose

1. Edit `src/pages/index.mdx`, `src/pages/imprint.mdx`, or
   `src/pages/data-policy.mdx` directly.
2. Preserve the surrounding component structure and indentation. Write prose as
   Markdown inside `<Section>` and `<Aside>`.
3. Run `pnpm develop` and inspect the changed page at desktop and mobile widths.
4. Have an appropriate person review all legal wording. Passing automation does
   not establish legal accuracy.

## MDX Syntax Hazards

MDX interprets Markdown punctuation and JSX. Preserve deliberate source forms:

- Escape a period after a number when it must remain text rather than become a
  list: `09\. Dezember 2027`.
- Use explicit JSX for intentional line breaks, for example
  `<h2>Beratung,<br />Service,<br />Reparatur</h2>`.
- `src/pages/data-policy.mdx` contains invisible U+00A0 non-breaking spaces.
  Count them before and after editing; an unrelated edit should not change the
  count:

```bash
node -e 'const fs=require("node:fs"); const s=fs.readFileSync("src/pages/data-policy.mdx","utf8"); console.log((s.match(/\u00a0/g)||[]).length)'
```

Do not introduce raw-file imports or `set:html`. If MDX parses intended text as
syntax, use the smallest explicit escape or HTML/JSX element that preserves it.

## Add An Employee

1. Confirm existing `order` values in `src/content/employees/*.yaml` are
   contiguous from `1` through `5`.
2. Create `src/content/employees/jane-doe.yaml` with the next order:

```yaml
order: 6
name: Jane Doe
department: Kundenservice
assetId: employee-placeholder
photo: ../../assets/content/mitarbeiter-icon.webp
alt: ''
```

3. Keep `assetId` and the relative `photo` path matched to the same entry in
   `src/content/assets.yaml`. A decorative image requires `alt: ''`; a semantic
   image requires meaningful, non-empty alt text compatible with the manifest
   policy.
4. Run `pnpm verify:content && pnpm verify:assets`.

## Remove An Employee

1. Delete the employee's YAML file from `src/content/employees/`.
2. Renumber the remaining files so `order` is contiguous from `1` with no gaps
   or duplicates.
3. If its image is now unused, remove both the file from `src/assets/content/`
   and its complete entry from `src/content/assets.yaml`. Do not remove a shared
   image.
4. Run `pnpm verify:content && pnpm verify:assets`.

## Reorder Employees

Change only the `order` values in `src/content/employees/*.yaml`. Assign each
integer from `1` through the number of employees exactly once, then run:

```bash
pnpm verify:content
```

## Add A Product Group

1. Add the approved image and manifest entry by following
   [Add Or Replace An Image](#add-or-replace-an-image).
2. Confirm existing `order` values in `src/content/product-groups/*.yaml` are
   contiguous, then create `src/content/product-groups/diagnostik.yaml`:

```yaml
order: 6
name: Diagnostik
description: Geräte und Instrumente für die medizinische Diagnostik.
examples:
  - Stethoskope
  - Otoskope
assetId: diagnostik
photo: ../../assets/content/diagnostik.jpg
alt: Diagnostische Instrumente auf einer Arbeitsfläche
```

3. Keep at least one non-empty `examples` item. The `assetId` and relative
   `photo` path must identify the same manifest entry. This semantic example has
   meaningful non-empty `alt`; use `alt: ''` only when the manifest policy is
   `decorative`.
4. Run `pnpm verify:content && pnpm verify:assets`.

## Remove A Product Group

1. Delete the product group's YAML file from `src/content/product-groups/`.
2. Renumber remaining product groups to contiguous `order` values beginning at
   `1`.
3. Remove an image and its manifest entry only if no other content references
   them; the asset verifier rejects orphaned files and entries.
4. Run `pnpm verify:content && pnpm verify:assets`.

## Reorder Product Groups

Change only `order` in `src/content/product-groups/*.yaml`. Use every integer
from `1` through the number of groups exactly once, then run:

```bash
pnpm verify:content
```

## Add Or Replace An Image

1. Confirm the image choice and usage rights with the content owner. Record a
   specific rights status and provenance; do not infer approval from possession
   of the file.
2. Put the original file under `src/assets/content/`, for example
   `src/assets/content/diagnostik.jpg`.
3. Inspect its checksum, MIME type, byte size, and dimensions:

```bash
node --input-type=module -e 'import fs from "node:fs"; import crypto from "node:crypto"; import sharp from "sharp"; const p="src/assets/content/diagnostik.jpg"; const b=fs.readFileSync(p); const m=await sharp(b).metadata(); console.log({sha256:crypto.createHash("sha256").update(b).digest("hex"),mimeType:m.format==="jpeg"?"image/jpeg":`image/${m.format}`,byteSize:b.length,width:m.width,height:m.height})'
```

4. Add this exact record shape under `assets:` in `src/content/assets.yaml`,
   replacing the metadata values with the command output and documenting the
   actual rights decision:

```yaml
- id: diagnostik
  path: src/assets/content/diagnostik.jpg
  sha256: <64-character SHA-256 from the inspection command>
  mimeType: image/jpeg
  byteSize: <byteSize from the inspection command>
  width: <width from the inspection command>
  height: <height from the inspection command>
  alt:
    policy: semantic
    default: Diagnostische Instrumente auf einer Arbeitsfläche
  rights:
    status: approved-original
    provenance: 'Original supplied and approved by the content owner on YYYY-MM-DD.'
```

5. Wire the same asset into content. Employee and product records use matching
   `assetId`, relative `photo`, and policy-compatible `alt`; the hero uses
   matching `assetId`, relative `image`, and `alt` in
   `src/content/homepage/hero.yaml`. Decorative policy requires empty manifest
   and content alt text. Semantic policy requires meaningful non-empty text.
6. Run `pnpm verify:assets`.

For an in-place replacement, overwrite the existing file and update its
`sha256`, `mimeType`, `byteSize`, `width`, `height`, rights provenance, and alt
policy/default as needed. Keep the existing `id` and `path` unless the content
identity or extension changes. If either changes, update every content
`assetId`, `photo`, or `image` reference atomically and remove the old file and
manifest entry. Never leave an unmanifested file, an unreferenced manifest
entry, or metadata copied from the previous binary.

## Review Before Opening A Pull Request

1. Run `pnpm develop` and inspect every changed page at desktop and mobile
   widths.
2. Have humans review legal accuracy, wording, image choice, crop, alt semantics,
   and responsive layout. Automated checks cannot approve these decisions.
3. Review the diff for accidental MDX escapes, changed non-breaking spaces,
   stale assets, and unrelated edits.
4. Run the complete required gate:

```bash
pnpm verify
```

## Historical Comparison Commands

These optional commands compare built pages against the frozen 2026 cutover
output:

```bash
pnpm compare:pages
pnpm compare:legal
```

`compare:pages` covers the homepage and legal pages; `compare:legal` covers the
legal pages. They may fail after intentional content edits and are not part of
`pnpm verify`. A routine content edit must never be used to justify changing the
cutover fixtures. Investigate differences and review intentional changes rather
than updating historical fixtures.
