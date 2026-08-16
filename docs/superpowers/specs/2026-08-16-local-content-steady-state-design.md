# Local Content Steady-State Improvements - Design

## Status

Proposed

## Context

The Contentful migration achieved its central architecture: three file-routed
MDX pages own page composition and prose, repeated employees and product groups
live in YAML collections, and images are local Astro assets. The later
inline-prose work corrected an implementation detour and restored page-specific
Markdown to the MDX pages.

The remaining system is still shaped around proving a one-time migration.
`pnpm verify` compares every build with frozen Contentful-backed page fixtures,
which makes intentional future content edits fail until historical fixtures are
changed. At the same time, some specified invariants are not enforced: asset
usage can be miswired, manifest completeness is not checked, built metadata and
links are only partially covered, and deployment currently runs `pnpm build`
rather than the complete verification suite.

The repository also lacks a task-oriented authoring guide, and ADR 08 still
describes the removed HTML-fragment prose implementation. This design moves the
project from migration verification to a maintainable steady state without
adding a replacement CMS or current-content snapshots.

## Goals

- Let intentional content edits proceed without rewriting frozen migration
  fixtures.
- Preserve `tests/fixtures/cutover/` as immutable historical provenance.
- Replace steady-state page snapshots with explicit content, asset, build, and
  output invariants.
- Make image identity, usage, alt policy, and social-image wiring verifiable.
- Run the same aggregate gate locally, in pull-request CI, and before hosting
  deployment.
- Document common Git-based content-editing tasks and required human review.
- Align active documentation and ADRs with the implemented inline-MDX model.

## Non-goals

- No CMS, browser editor, admin UI, or workflow for non-technical editors.
- No prose rewrite, legal review, redesign, or SEO initiative.
- No automated judgment of whether new wording, image choice, or visual design
  is appropriate.
- No reconstruction of missing migration-time visual, preview, retirement, or
  production-reconciliation evidence.
- No new current-page HTML snapshots, screenshot baselines, or golden prose
  files.

## Verification Policy

### Historical cutover evidence

The files under `tests/fixtures/cutover/` remain migration records. The source
export, content map, initial asset inventory, original page captures, and
provenance are not regenerated for routine content changes.

`compare:pages` and `compare:legal` remain available as explicitly historical
diagnostic commands. They are removed from the steady-state `pnpm verify`
aggregate and are not deployment gates. Their documentation states that they
answer only whether the current output still matches the 2026 cutover, not
whether a current edit is valid.

The unresolved `frozen-source vs production` reconciliation entry in
`provenance.json` remains unchanged as an honest historical record. Active
documentation must not describe all original migration acceptance gates as
completed.

### Steady-state aggregate

`pnpm verify` runs, in deterministic order:

1. formatting/lint checks;
2. source-content integrity checks;
3. asset integrity and usage checks;
4. `astro check` and production build;
5. built-output contract checks.

The aggregate proves objective properties. It does not freeze prose or visual
output. Pull-request review and deployment previews cover semantic and visual
judgment.

## Source Content Integrity

The two Astro collection schemas remain the primary validation for YAML field
types and local image resolution. `verify:content` becomes a steady-state check
rather than a comparison with Contentful field values.

It validates:

- exactly the three expected page route files exist;
- employee and product-group filenames are unique readable IDs;
- each collection has unique positive integer `order` values;
- order values are contiguous from 1 through the collection size;
- required string values are non-empty after trimming, except explicit empty
  image alt values allowed by the asset policy;
- product groups contain a non-empty examples array with non-empty values;
- no active page or content source uses `set:html`, `?raw`, the removed prose
  store, Contentful APIs, or Contentful asset hosts.

The frozen source-to-local content map is no longer used to constrain future
collection membership, order, or wording. It remains historical provenance.

## Asset Model And Integrity

### Operational manifest

`tests/fixtures/cutover/assets.json` remains frozen migration evidence and is not
repurposed as a mutable steady-state database. Add an operational local asset
manifest under `src/content/assets.yaml`. It contains one entry for every image
that may be referenced by page or collection content:

- stable local asset ID;
- path relative to the repository root;
- SHA-256 digest;
- MIME type, byte size, width, and height;
- explicit alt policy: decorative, or a required semantic default;
- rights status and concise provenance note.

Content records refer to the stable asset ID as well as using an Astro-resolved
image path. The page-level hero declaration uses the same asset ID. This small
duplication gives Astro its native `ImageMetadata` value while giving verification
a stable, machine-readable identity to compare.

`verify:assets` validates:

- every manifest path exists and every local content image is represented once;
- no manifest ID or path is duplicated;
- checksum, byte size, decoded dimensions, and MIME type match the file;
- rights status and provenance are present;
- decorative assets require empty rendered alt text;
- semantic assets require non-empty alt text;
- every employee, product group, and hero asset ID resolves to the same path and
  alt policy declared in the manifest;
- no unreferenced manifest entries or unmanifested content images remain;
- the homepage hero and social image use the same declared asset.

The verifier parses YAML with the same YAML library available through Astro's
dependency graph or adds a direct lightweight YAML dependency if relying on a
transitive package would be unstable. It does not parse YAML with regular
expressions.

## Built-Output Contract

`verify:dist` validates the complete deployable contract:

- `/`, `/imprint/`, `/data-policy/`, and the custom 404 output exist;
- exact page titles and homepage description;
- canonical URL on each routable page;
- homepage Open Graph title, type, URL, locale, site name, and local image;
- homepage Twitter card, title, description, and the same local image;
- legal pages retain their intentional absence of homepage-only metadata;
- sitemap contains exactly the intended public routes and excludes 404;
- header/footer internal links resolve to built routes;
- selected legal external links match explicit expected URLs including scheme;
- every local `img[src]` and `source[srcset]` candidate resolves to a file in
  `dist`;
- rendered image alt values follow the operational manifest usage policy;
- hero output is eager and high priority;
- employee and product images are lazy-loaded;
- no active output contains Contentful API or asset-host URLs.

Generated Astro filenames are not compared with frozen names. Social-image
identity is established by comparing its generated bytes or digest to an image
generated from the manifest-declared hero source during the same build, rather
than accepting any `/_astro/` URL.

Expected metadata and fixed navigation/legal URLs live in a small explicit
configuration object in the verification script. This is an interface contract,
not a page snapshot.

## Component Contracts

Editor-facing block props match the content schemas:

- `EmployeeTile` requires `photo` and `alt`; only `department` remains optional.
- `ProductGroup` requires `examples`, `photo`, and `alt`; only `description`
  remains optional.
- `Hero` continues to require its image and alt value.

Optional rendering branches for required images are removed so incorrect MDX
wiring fails during build rather than silently dropping content. The block README
describes local authoring concepts and practical usage instead of mapping every
block back to obsolete Contentful type names.

## Authoring Experience

Add `docs/content-authoring.md` as the entry point for the developer editor. It
covers:

- prerequisites and local preview;
- editing homepage and legal prose in MDX;
- the few syntax hazards used by existing content, including escaped numeric
  periods, explicit `<br />`, and invisible non-breaking spaces;
- adding, removing, and reordering employees and product groups;
- adding or replacing an image, updating the operational manifest, choosing alt
  policy, and preserving rights provenance;
- running `pnpm verify` before opening a pull request;
- reviewing the Git diff and deployment preview for wording, image choice,
  responsive layout, and legal accuracy;
- when historical `compare:*` commands are useful and why their failure is
  expected after an intentional content change.

The guide favors task recipes with complete file paths and commands. It does not
duplicate component implementation details.

## CI And Deployment

Restore `.github/workflows/verify.yml` for pull requests and pushes to `master`.
It uses Node 22, enables pnpm through Corepack or the repository's chosen pnpm
setup, installs with `--frozen-lockfile`, and runs `pnpm verify`.

Change Netlify's build command to `pnpm install --frozen-lockfile && pnpm verify`.
Because `verify` performs the production build, Netlify publishes the resulting
`dist/` without a second build. Active Cloudflare documentation and configuration
use the same command. GitHub workflow creation requires credentials with workflow
scope; the implementation is not complete until the workflow is committed and a
run succeeds.

The local environment currently lacks Node and pnpm. Implementation verification
must therefore run in an environment with Node 22 and pnpm before any plan is
reported complete.

## Documentation And Architecture Records

Update README, AGENTS, block documentation, hosting documentation, and ADRs so
they consistently state:

- page prose is inline Markdown in MDX;
- cutover fixtures are immutable historical diagnostics;
- current verification is invariant-based and snapshot-free;
- `pnpm verify` is the local, CI, and hosting gate;
- editing is a developer Git workflow requiring preview review.

Update ADR 08 in place because the intended local-content decision remains
accepted; the current text contains a stale implementation detail rather than a
new competing decision. Record the steady-state verification and operational
asset-manifest decisions in a new ADR because they materially change the role of
the cutover fixtures and establish a durable content contract.

## Error Handling

Verification scripts accumulate actionable errors and report the file, record,
and expected rule where possible. They must reject malformed manifests and YAML
cleanly rather than crashing with an unhandled property access.

Examples include:

- `employees/robert-renz.yaml: duplicate order 2`;
- `asset employee-placeholder: expected image/jpeg, decoded image/webp`;
- `product group medizinische-geraete: assetId points to X but photo resolves to Y`;
- `imprint: external link changed from https://... to http://...`;
- `homepage hero: expected loading=eager and fetchpriority=high`.

## Implementation Decomposition

The work is split into three ordered plans:

1. **Steady-state verification:** operational asset manifest, source checks,
   complete output checks, removal of snapshots from `verify`, and focused script
   tests or mutation checks proving each verifier rejects representative bad
   inputs.
2. **Authoring experience:** strict component contracts, authoring guide, block
   documentation, README/AGENTS updates, and removal of obsolete Contentful
   terminology from active editing guidance.
3. **Delivery and records:** GitHub CI, Netlify/Cloudflare gate alignment, ADR 08
   correction, new steady-state verification ADR, and honest migration-record
   documentation.

Plan 2 depends on the manifest and commands defined by Plan 1. Plan 3 depends on
the final aggregate from Plan 1 and documentation terminology from Plan 2.

## Acceptance Criteria

- Routine intentional prose changes do not require changing any cutover fixture.
- `pnpm verify` contains no current-page snapshot comparison.
- Historical comparison commands remain available and clearly labeled.
- Representative wrong image, wrong alt policy, omitted manifest record,
  duplicate order, broken metadata, wrong link scheme, missing image output, and
  loading regressions fail the appropriate verifier.
- The complete aggregate passes with Node 22 and pnpm in a clean checkout.
- GitHub Actions runs the aggregate for pull requests and `master`.
- Netlify and Cloudflare run the aggregate before publishing.
- A developer can follow `docs/content-authoring.md` to complete each supported
  content-editing task without consulting migration plans.
- Active documentation and ADRs describe the current architecture accurately.
- Cutover provenance remains unchanged except for documentation that explains
  its historical and incomplete status.
