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
