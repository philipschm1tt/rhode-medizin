# Local Content (Remove Contentful CMS) - Design

## Status

Proposed

## Context

The site is an Astro static build that fetches all content from Contentful at
build time through `src/content/loaders/contentful.ts`. Content edits require a
Contentful change followed by a rebuild. The site is effectively a three-page
brochure (`/`, `/imprint`, and `/data-policy`), has changed infrequently, and is
maintained by one developer.

Contentful now adds credentials, a build-time network dependency, webhook and
account administration, and a normalization layer whose only consumer is this
site. This design replaces Contentful with local, version-controlled content
while retaining Astro's static rendering and image optimization.

The existing files in `tests/fixtures/live/` are historical Gatsby captures.
They are not a safe migration source: the repository already documents that the
homepage fixture is stale relative to published Contentful content. The
migration therefore needs a new, frozen source snapshot and matching cutover
fixtures before the Contentful loader is removed.

## Goals

- Make a clean checkout build without `.env`, Contentful credentials, or network
  access to Contentful or its asset CDN after dependencies are installed.
- Store page content in file-routed MDX pages, repeated records in Astro content
  collections, and used image assets in `src/assets/`.
- Keep editing approachable: page-specific prose and composition in each page,
  repeated records in small YAML files, explicit data loading in the page that
  uses it, and layout-only editor-facing blocks.
- Preserve the published content, DOM structure, image identity and metadata,
  page metadata, and responsive visual output at cutover.
- Establish deterministic verification, deployment, and rollback procedures.

## Non-goals

- No replacement CMS, admin UI, or non-technical editor workflow.
- No redesign, SEO initiative, or prose rewrite as part of the migration.
- No attempt to preserve Contentful's generic content graph or `__typename`
  model locally.
- No deletion of historical fixtures or ADRs. Historical records remain, with
  supersession noted where appropriate.

## Source of Truth and Freeze

### Pre-cutover authority

Until the local-content build is live and accepted in production, the authority
is the published Contentful Delivery API state used by the production build,
using the production space, default locale, and delivery environment. Existing
Gatsby fixtures and a previously generated `dist/` directory are not authoring
sources.

Immediately before migration work begins:

1. Announce a content freeze. No Contentful entry or asset may be published,
   unpublished, or edited until cutover succeeds or the migration is abandoned.
2. Record the capture timestamp, source Git commit, Contentful space and
   environment identifiers, locale, current production URLs, and current
   Netlify deploy ID in `tests/fixtures/cutover/provenance.json`. No credential
   or token is recorded.
3. Export the complete graph reachable from the three published page entries to
   `tests/fixtures/cutover/contentful-source.json`. The sanitized export retains
   entry and asset IDs, content types, `sys.updatedAt`, raw field values, raw
   Markdown, relationship order, and asset metadata. It excludes credentials,
   API responses unrelated to the three pages, and unpublished entries.
4. Generate `tests/fixtures/cutover/asset-inventory.json` from the export. This
   initial inventory contains source IDs, URLs, metadata, dimensions, and usage
   relationships only; local paths, checksums, rights decisions, and alt
   decisions are added later to the final asset manifest.
5. Define readable local IDs and record the one-to-one source mapping in
   `tests/fixtures/cutover/content-map.json`. Each frozen page maps to its MDX
   route file; each employee and product group maps to its collection and local
   entry ID.
6. Build the unchanged Contentful-backed Astro implementation against that
   frozen state and save its rendered pages as the new cutover fixtures under
   `tests/fixtures/cutover/pages/`.
7. Compare the frozen source, the old Astro build, and current production. Any
   difference is resolved explicitly with the content owner before migration.

The capture is the first gated phase of the implementation plan. It uses a
temporary `scripts/capture-contentful.mjs` while the existing Contentful
dependency and credentials are still available. The script writes only the
sanitized artifacts above, is reviewed for token leakage, and is deleted in the
same pull request after the artifacts are accepted. All later migration tasks
derive their exact values, IDs, counts, order, Markdown, and asset set from the
committed artifacts rather than assumptions in the plan.

The files in `tests/fixtures/live/` remain labeled historical Gatsby fixtures.
They are not updated and are no longer the active cutover oracle.

### Legal copy

Migration fidelity and legal accuracy are separate approvals:

- The migration must reproduce the frozen imprint and data-policy source
  exactly, including headings, links, lists, emphasis, and line breaks.
- Before the freeze is accepted, the content owner must confirm that the frozen
  legal copy is intentional. If a legal correction is required, it happens as
  a separate content-only change before the final snapshot. This migration does
  not silently correct or modernize legal text.

### Post-cutover authority

After production verification succeeds, the committed local content becomes
the authoring source. Future content changes are reviewed Git changes and must
update the applicable regression expectations in the same pull request.
Generated output must never regenerate its own expected fixture silently.

## Architecture

### Page files and collections

Add the Astro MDX integration (`@astrojs/mdx`) and the official Astro Satteri
processor (`@astrojs/markdown-satteri`). Register `mdx()` in `astro.config.mjs`
with an explicit Satteri processor configured with `smartPunctuation: false`.
The Contentful loader's current Unified pipeline does not rewrite punctuation;
disabling Satteri's default smart punctuation prevents straight quotes, dashes,
and ellipses in frozen prose from changing during migration. GitHub-Flavored
Markdown remains enabled. Astro's file-based routing creates the three routes
directly:

| Page file | Route | Purpose |
| --- | --- | --- |
| `src/pages/index.mdx` | `/` | Homepage content, data loading, and block composition. |
| `src/pages/imprint.mdx` | `/imprint/` | Imprint content. |
| `src/pages/data-policy.mdx` | `/data-policy/` | Data-policy content. |

Delete `src/pages/[...slug].astro`. There is no `pages` collection,
`getStaticPaths()`, slug normalization, or generic page renderer. Adding a
future page means adding the corresponding `.mdx` file under `src/pages/`, which
makes route ownership visible from the filesystem.

Define only the repeated data as content collections with Astro's `glob()`
loader:

| Collection | Path | Format | Purpose |
| --- | --- | --- | --- |
| `employees` | `src/content/employees/*.yaml` | YAML | One employee per file with a stable local ID from its filename, explicit order, name, department, photo, and alt text. |
| `productGroups` | `src/content/product-groups/*.yaml` | YAML | One product group per file with a stable local ID from its filename, explicit order, name, description, examples, photo, and alt text. |

There is no separate prose collection. DIN/ISO, company-history, and legal prose
are each used by one page and remain inline in that page's MDX. This removes a
lookup layer without creating large frontmatter trees.

Local collection IDs are readable lowercase kebab-case filenames and do not
pretend to be Contentful IDs. `tests/fixtures/cutover/content-map.json` maps
frozen page IDs to route files and frozen repeated-entry IDs to local collection
IDs. The map is migration provenance and the input to cutover integrity checks;
it is not part of the editor-facing schemas.

### Data schemas

The two collection schemas use the schema callback so Astro's `image()` helper
can resolve local images:

- `employees`: `order`, `name`, optional `department`, `photo: image()`, and
  required explicit `alt`.
- `productGroups`: `order`, `name`, optional `description`, `examples` as a
  string array, `photo: image()`, and required explicit `alt`.

`alt` may be empty only when the frozen source has no semantic description and
the asset manifest marks the image decorative. This keeps the choice explicit
without inventing metadata during a fidelity migration.

The old remote `imageSchema`, `__typename` union, and `Contentful*` literals are
removed. Local image values use Astro's `ImageMetadata` type end to end.

### Editor-facing blocks

Editor-facing components live in `src/components/blocks/` and are documented in
`src/components/blocks/README.md`. Visible content components used by page MDX
come from this directory. Pages also import `PageLayout.astro`, `getCollection`,
and local assets where needed; those imports make page-level layout, data, and
asset dependencies explicit.

| Block | Contract | Composition |
| --- | --- | --- |
| `Hero.astro` | `headline`, `subhead?`, `cta?`, `image`, `alt`. | Adapts names and passes `ImageMetadata` plus explicit alt text to `HeroBlock`. |
| `Section.astro` | `fullWidth?`, `dark?`; slot contains MDX. | With `fullWidth`, renders `MainSection fullWidth darkBackground={dark} > MainGrid > ContentBox`; otherwise renders `MainSection darkBackground={dark} > ContentBox`. |
| `Aside.astro` | Slot contains MDX. | `AsideSection` and `ContentBox`. |
| `Quote.astro` | `text`. | Thin wrapper around the existing quote renderer. |
| `Tiles.astro` | Required `layout="grid"` or `layout="list"`, `items`, and `itemComponent`. | Validates its props, renders `<ul>` with the selected layout styles, maps `items` to `<li>` elements, and renders the dynamic item component with each item spread as props. It performs no data loading or sorting. |
| `EmployeeTile.astro` | `name`, `department?`, `photo`, `alt`. | Renders one employee. This is the existing technical component moved into the editor-facing folder and updated for local images. |
| `ProductGroup.astro` | `name`, `description?`, `examples`, `photo`, `alt`. | Renders one product group. This is the existing technical component moved into the editor-facing folder and updated for local images. |

`Tiles` keeps `<ul>` and `<li>` ownership together. It assigns the capitalized
`itemComponent` prop to a local component variable and renders that dynamic
Astro component inside each `<li>`, spreading the current item as props. Item
components remain independent of list semantics and can be reused outside
`Tiles`. The page remains responsible for choosing, loading, sorting, and
shaping the item list. `Tiles` frontmatter throws a descriptive build error for
a missing or unsupported `layout`, missing item component, or non-array `items`
because standalone MDX callers are not prop-checked by `astro check`.

`Tiles.astro` absorbs the existing scoped CSS from `TileGrid.astro` and
`TileList.astro`, applying the grid or list class to its own `<ul>`. The old
technical wrappers are deleted. This keeps the public API, semantic list
structure, iteration, and corresponding layout styles in one component while
preserving the current responsive behavior.

The technical components retain their markup and scoped CSS except for the
image contract required by local assets:

- `HeroBlock.astro`, `blocks/EmployeeTile.astro`, and
  `blocks/ProductGroup.astro` accept `ImageMetadata` and an explicit alt string.
- They pass the complete metadata object to `<Picture>` or `<Image>` rather than
  passing `image.src` as a remote URL and restating dimensions.
- Existing formats, responsive widths, sizes, loading behavior, fetch priority,
  classes, and crop rules remain unchanged.

`ModuleRenderer.astro` is deleted. Direct page composition replaces recursive
dispatch.

### Page MDX shape

`src/pages/index.mdx` imports the shared `PageLayout`, local hero asset,
`getCollection`, and visible blocks. It loads and sorts both collections at the
top level, then maps each collection entry to the props expected by its item
component before passing the resulting list and component to `Tiles`:

```mdx
import { getCollection } from 'astro:content'
import PageLayout from '../layouts/PageLayout.astro'
import heroImage from '../assets/content/hero-image-blue2.jpg'
import Hero from '../components/blocks/Hero.astro'
import Section from '../components/blocks/Section.astro'
import Tiles from '../components/blocks/Tiles.astro'
import EmployeeTile from '../components/blocks/EmployeeTile.astro'
import ProductGroup from '../components/blocks/ProductGroup.astro'

export const employees = (await getCollection('employees'))
  .sort((a, b) => a.data.order - b.data.order)
  .map(({ data }) => data)

export const productGroups = (await getCollection('productGroups'))
  .sort((a, b) => a.data.order - b.data.order)
  .map(({ data }) => data)

<PageLayout
  title="Rhode Medizintechnik – Heinrich Rhode GmbH"
  description="Heinrich Rhode GmbH – Medizintechnik für Praxen und Kliniken. Beratung, Service und Produkte aus einer Hand."
  socialImage={heroImage}
>
  <Hero
    headline="Medizintechnik mit Tradition"
    subhead="Medizinische Geräte, Instrumente und Mobilar für Ärzte und Krankenhäuser mit Liefer- und Aufstellservice in Oberbayern."
    cta="Jetzt Kontakt aufnehmen"
    image={heroImage}
    alt="iStock-74179470"
  />

  <Section>
    ## Wer wir sind

    <Tiles
      layout="grid"
      items={employees}
      itemComponent={EmployeeTile}
    />
  </Section>

  <Section fullWidth dark>
    ## Unser Warensortiment

    <Tiles
      layout="list"
      items={productGroups}
      itemComponent={ProductGroup}
    />
  </Section>
</PageLayout>
```

The example omits the intervening prose sections and quotes only to focus on the
component and data flow. The implemented page replaces example values with the
approved frozen values where they differ and contains the complete frozen text
and asset metadata.

Page-specific text is copied from the raw Markdown in the frozen source export,
not reconstructed from rendered fixture HTML. Syntax-only escapes or explicit
HTML are used where necessary to preserve the old rendered DOM. In particular:

- the services heading remains one `<h2>` with three lines separated by
  `<br />`, rather than a single Markdown heading without line breaks;
- a standalone date such as `09. Dezember 2027` is authored as
  `09\\. Dezember 2027` so Markdown does not interpret it as an ordered-list
  marker;
- quote punctuation, including en dashes, is copied exactly;
- the employees and product groups appear inside their existing section and
  content-box hierarchy.

`imprint.mdx` and `data-policy.mdx` each contain a `<PageLayout>` and one
`<Section>` with the complete legal prose inline. They do not load either data
collection.

### Shared page layout and metadata

`src/layouts/PageLayout.astro` is the shared MDX page shell. It accepts:

- required `title`;
- optional `description`;
- optional local `socialImage: ImageMetadata`;
- the page body through its default slot.

It composes the existing `Layout.astro` and `MainContent.astro`. When
`description` is present, it constructs the existing homepage Open Graph and
Twitter values. It uses `getImage()` with `socialImage` to produce a deployable
local social image and computes its absolute URL with `Astro.site`; if a page has
a description but no social image, Open Graph retains the existing favicon
fallback while Twitter omits its image. The homepage passes the same imported
`heroImage` object to `PageLayout` and `Hero`, so the visible and social images
have one page-level source reference. Legal pages pass only `title` and
therefore retain their current plain-title metadata policy.

The MDX pages import and use `PageLayout` manually rather than using MDX's
special `layout` frontmatter property. Manual composition is intentional: the
homepage must pass an imported `ImageMetadata` object that cannot be represented
in YAML frontmatter, and showing the page shell in the page source makes the
rendering structure explicit.

The generated title, description, canonical URL, Open Graph title/type/URL,
locale/site name, Twitter card/title/description, and legal-page absence of
homepage-only metadata must match the frozen Contentful-backed Astro output
exactly. The intentional exception is the Open Graph and Twitter image URL:
both point to the same absolute, site-origin `/_astro/` URL generated from the
imported `heroImage`, not the frozen Contentful CDN URL. `verify:dist` confirms
that both tags use that local URL, the URL returns 200, and its source asset is
the manifest-verified hero binary.

### Images and asset manifest

Download every published image reachable from the three frozen page graphs to
`src/assets/content/`. Use the original untransformed Contentful asset when its
license permits repository storage. If repository distribution of an original
is not permitted, commit an approved web-resolution derivative and record the
exact transformation in the manifest.

After rights review and binary selection, convert the initial inventory into
the final `tests/fixtures/cutover/assets.json`. It records, for every used asset:

- Contentful asset ID and `sys.updatedAt`;
- original URL or approved derivative URL;
- local path and SHA-256 digest;
- MIME type, byte size, decoded width, and decoded height;
- Contentful title and description;
- local alt value;
- whether an empty alt is intentionally decorative;
- every entry and field that uses the asset;
- provenance and rights status for committing the chosen binary.

The migration includes only assets reachable from the three published pages,
including the homepage social image. It does not mirror unused Contentful
assets. An asset verification script rejects missing files, checksum or
dimension mismatches, broken usage mappings, absent alt decisions, unjustified
empty alt values, and unapproved rights status.

Astro continues to emit optimized hashed files under `/_astro/`. Structural
parity may canonicalize generated URLs, but image identity is proven separately
by the asset manifest and usage mapping.

## Verification Strategy

### Fixture policy

Update `scripts/compare-pages.mjs` and `scripts/compare-legal-pages.mjs` to use
the frozen Contentful-backed Astro fixtures in
`tests/fixtures/cutover/pages/`. The comparator remains a semantic DOM check,
but must preserve exact link `href` values and report a useful structural diff
rather than only the first 600 characters.

The comparator may normalize generated image URLs and non-semantic Astro build
attributes. It does not prove image identity, alt text, styling, head metadata,
or responsive rendering; the other gates below cover those concerns.

### Automated verification

Add focused scripts and one aggregate command:

- `verify:content`: validates each `content-map.json` source-to-local mapping,
  expected page files/routes, repeated-entry counts, unique order values, and
  ordered employee/product sequences against `contentful-source.json`.
- `verify:assets`: validates the asset manifest, checksums, file decoding,
  dimensions, alt values, usage mappings, and rights status.
- `verify:dist`: checks built route files, titles and homepage social metadata,
  legal-page metadata policy, sitemap links, local asset references, and the
  absence of Contentful API/CDN URLs in active output.
- `verify`: runs lint, content integrity, asset integrity, build, both fixture
  comparisons, and built-output checks in a deterministic order.

The intended aggregate sequence is:

```text
pnpm lint
pnpm verify:content
pnpm verify:assets
pnpm build
pnpm compare:legal
pnpm compare:pages
pnpm verify:dist
```

`format` and `lint` include `.mdx`, `.yaml`, and the existing file extensions.
The build still runs `astro check` before `astro build`.

`astro check` validates the `.astro` components and TypeScript but does not type
check component prop usage inside standalone `.mdx` pages. MDX composition is
therefore gated by `astro build`, semantic fixture comparison, content
integrity, and `verify:dist`; the spec does not rely on caller-side MDX prop
checking. Required block props remain typed within their `.astro` components,
and `Tiles` rejects an invalid layout, missing item component, or non-array item
value during build.

Add pull-request CI that runs `pnpm install --frozen-lockfile` followed by
`pnpm verify`. Netlify and Cloudflare use the same verification command before
publishing `dist/`; parity and integrity checks are therefore deployment gates,
not optional local commands.

### Clean-build proof

Before approval, run the final commit from a clean checkout with:

- no `.env` file;
- all `CONTENTFUL_*` variables unset;
- Astro/content caches removed;
- access to Contentful API and asset hosts blocked after dependency
  installation.

`pnpm verify` must succeed. Active source, configuration, direct dependencies,
and `dist/` must contain no Contentful API/CDN dependency. Historical ADRs,
fixtures, provenance, and migration manifests may retain Contentful names and
URLs because they are records, not runtime dependencies.

### Visual and deployed checks

Before merge, compare screenshots of the frozen old Astro build and candidate
preview at 390 x 844 and 1440 x 900 for all three pages. Review the complete
pages, including header, footer, hero crop and overlay, CTA, employee grid,
product list, legal layout, and responsive wrapping. Attach the review evidence
to the pull request; screenshots do not need to be committed.

Verify both Netlify and Cloudflare previews of the same commit. After production
deployment, smoke-test:

- `/`, `/imprint/`, and `/data-policy/` return 200;
- an unknown route serves the expected 404;
- titles, homepage description, canonical URL, Open Graph, and Twitter data;
- footer legal links and exact external legal links;
- sitemap entries;
- all rendered image and source URLs return 200;
- the hero retains eager loading and high fetch priority;
- below-the-fold images remain lazy-loaded.

## Dependencies and Cleanup

Add `@astrojs/mdx` and `@astrojs/markdown-satteri`. Remove dependencies used
only by the Contentful loader:

- `contentful`
- `dotenv`
- `unified`
- `remark-parse`
- `remark-rehype`
- `rehype-stringify`

Update the lockfile. Remove:

- `src/content/loaders/contentful.ts`;
- `src/components/ModuleRenderer.astro`;
- `src/components/TileGrid.astro` and `src/components/TileList.astro` after
  their styles move into `src/components/blocks/Tiles.astro`;
- `src/pages/[...slug].astro`;
- Contentful remote image domains from `astro.config.mjs`;
- the `@content-loaders` Vite alias and corresponding TypeScript path alias;
- active documentation that says builds need Contentful credentials or content
  webhooks.

Update `README.md`, `AGENTS.md`, the Netlify operator runbook, and deployment
instructions for local content and `pnpm verify`. Historical specs remain
unchanged. ADR 08 records the local-content decision and names the exact
affected records:

- `adr_02_contentful_loader.md` and `adr_03_content_loader_alias.md` are marked
  superseded;
- the remote-Contentful-source portions of `adr_05_image_strategy.md` are marked
  superseded while its Astro image-optimization decision remains accepted;
- the hard-coded/Contentful metadata consequence in `adr_05_astro_seo.md` is
  marked superseded while its `astro-seo` decision remains accepted;
- `adr_07_netlify.md` remains the hosting decision and is updated to remove
  Contentful credentials/webhooks and point to the local-content deployment
  process.

The ignored local `.env` file is not deleted by implementation. It is simply no
longer read or required.

## Migration and Cutover Sequence

The code cutover remains one pull request, but operational retirement is delayed
until the rollback window closes.

1. Freeze Contentful and capture provenance, sanitized source, initial asset
   inventory, content map, and old-Astro page fixtures. Review and commit these
   artifacts as the capture gate before relying on their exact values.
2. Resolve source/production differences, obtain legal-copy approval, and
   verify asset rights.
3. Download the approved local binaries and complete the final asset manifest
   with local paths, checksums, rights, and alt decisions.
4. Add MDX support, two local data collections and schemas, the three file-routed
   MDX pages, `PageLayout.astro`, and editor-facing blocks.
5. Update metadata and image component contracts, then delete the dynamic route.
6. Add integrity checks and switch parity scripts to the cutover fixtures.
7. Remove the Contentful loader, dispatcher, dependencies, aliases, and remote
   image configuration.
8. Update active documentation and ADRs.
9. Run `pnpm verify`, the clean-build proof, and desktop/mobile visual review.
10. Record the current production Netlify deploy ID and Git commit, then verify
    Netlify and Cloudflare previews of the candidate commit.
11. Disable the Contentful-to-Netlify webhook immediately before merge so CMS
    changes can no longer imply publication. Retain the hook details and
    credentials during rollback.
12. Merge, deploy, and run all production smoke checks. At this point Git becomes
    the content authority.
13. Keep Contentful frozen and retain its space, credentials, prior Netlify
    deploy, and export for a 14-calendar-day rollback window.
14. After 14 days without a rollback, remove Contentful environment variables
    from every Netlify and Cloudflare context, revoke tokens, delete the
    Contentful webhook and unused Netlify build hook, retain the sanitized
    export as migration provenance, and archive or cancel the Contentful space
    according to the account owner's retention needs.

## Error Handling and Rollback

Local authoring errors fail before deployment:

- invalid YAML fails collection validation;
- invalid `.astro` component implementations fail `astro check`;
- invalid MDX syntax or invalid `Tiles` props fail the build;
- incorrect MDX prop wiring or composition fails build output, fixture, content,
  or `verify:dist` checks rather than caller-side type checking;
- missing local images fail Astro image resolution;
- duplicate order values, missing entries, and manifest mismatches fail
  integrity scripts;
- fixture, metadata, or stale Contentful URL differences fail `pnpm verify`.

Rollback is triggered by missing or incorrect content, broken routes or images,
metadata regression, material visual regression, or failed production smoke
checks.

The immediate rollback is to republish the recorded pre-cutover Netlify deploy;
this does not require a rebuild. If the code change must also be reversed,
revert the migration pull request and rebuild the old implementation with the
retained frozen Contentful space and credentials. Do not use the Cloudflare
fallback as a substitute for the recorded pre-cutover build unless its retained
deployment is independently verified to contain that build.

After rollback, re-enable the Contentful webhook only if Contentful again
becomes the active authoring source. Investigate and repeat the capture if the
frozen source changes before another cutover attempt.

## Acceptance Criteria

The migration is complete only when all of the following are true:

- The frozen source, provenance, cutover fixtures, and verified asset manifest
  are committed without credentials.
- Every frozen page and structured entry maps to a local ID through
  `content-map.json`; each expected page route exists; and local values, counts,
  and ordering match the frozen source.
- Legal migration fidelity and separate content-owner approval are recorded.
- Every used image has verified identity, dimensions, metadata, usage, alt text,
  and repository-storage rights.
- `pnpm verify` passes in the normal checkout and the clean credential-free,
  Contentful-blocked checkout.
- Pull-request CI, Netlify preview, and Cloudflare preview pass for the same
  commit.
- Desktop and mobile visual review passes for all three pages.
- Production routes, metadata, links, sitemap, images, loading behavior, and 404
  pass smoke testing.
- Active source, configuration, dependencies, and built output no longer depend
  on Contentful.
- The pre-cutover deploy and Contentful state are retained for 14 days, then
  credentials, tokens, webhooks, build hook, and account resources are retired
  as specified.

## ADR

Add `docs/adrs/adr_08_local_content.md`. It records why local Git content is
appropriate for this three-page, developer-maintained site; file-routed MDX
pages plus two structured data collections; explicit page-owned data loading;
the local asset strategy; and the operational consequences. It marks ADR 02 and
ADR 03 superseded and identifies the Contentful-specific parts of both ADR 05
files and ADR 07 that no longer apply.
