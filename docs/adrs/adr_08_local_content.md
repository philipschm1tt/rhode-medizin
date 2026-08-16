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
records in two Astro `glob()` content collections (`employees` and
`productGroups`) as small YAML files, the homepage hero in the single-entry
`homepageHero` collection, and used images as local binaries under
`src/assets/content/`. Pages own their data loading explicitly via
`getCollection` and compose editor-facing blocks from
`src/components/blocks/`. Page-specific prose is authored as inline
Markdown in those MDX pages. Explicit HTML is used only where Markdown
would change the intended structure, such as the homepage service
heading's `<br />`-separated lines. Active content does not use a separate
prose store, `set:html`, or `?raw` imports. The MDX integration uses the
Satteri processor with `smartPunctuation: false` and `gfm: false`. Social
images use `getImage()` on a local `ImageMetadata` so OG/Twitter image
URLs point at a site-origin `/_astro/` URL instead of a Contentful CDN
URL.

The Contentful loader, `ModuleRenderer` dispatcher, dynamic route,
remote image domains, `@content-loaders` alias, and Contentful-only
dependencies were removed. Current integrity is enforced by the
invariant-based `pnpm verify` aggregate, run locally, in PR CI, and on
both Netlify and Cloudflare before publishing. The historical
`compare:pages` and `compare:legal` commands remain optional diagnostics
outside that gate.

## Consequences

- A clean checkout builds without `.env`, Contentful credentials, or
  network access to Contentful or its asset CDN after dependencies are
  installed.
- Future content changes are reviewed Git changes. Objective source,
  asset, build, test, and distribution invariants are automated; wording,
  legal accuracy, image choice, and visual results require human review.
- The frozen capture under `tests/fixtures/cutover/` is immutable
  migration history, not the steady-state integrity oracle.
  `tests/fixtures/live/` remains labeled historical Gatsby output.
  Historical comparators may diagnose differences but do not gate
  intentional content changes.
- The cutover provenance still records `frozen-source vs production` as
  `not verified`. This ADR does not claim that unresolved reconciliation
  was performed.
- ADR 02 and ADR 03 are superseded (no Contentful loader, no loader
  alias). The remote-Contentful-source portion of ADR 05
  (image_strategy) is superseded; its Astro image-optimization decision
  remains accepted with local `ImageMetadata` sources. The
  hard-coded/Contentful metadata consequence in ADR 05 (astro_seo) is
  superseded; the `astro-seo` decision remains accepted with the
  homepage description now authored in `src/pages/index.mdx`. ADR 07 is
  updated to remove Contentful credentials/webhooks and point to the
  local-content deployment process.
