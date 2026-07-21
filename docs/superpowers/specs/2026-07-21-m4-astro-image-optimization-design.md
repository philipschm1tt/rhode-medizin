# M4 Astro Image Optimization Design

Replace the M4 image approach for the Astro migration. The previous M4
design relied on Contentful CDN query-parameter transforms and a
hand-rolled `src/lib/contentful-images.ts` helper. This design drops
that approach in favor of Astro's built-in image pipeline
(`astro:assets`), so the site is not tied to Contentful for image
delivery.

This design supersedes the M4 decision point in
`docs/superpowers/specs/2026-07-04-astro-migration-design.md` and the
existing M4 implementation plan at
`docs/superpowers/plans/2026-07-04-astro-migration-m4-images.md`.

## Goal

Improve image delivery after M3 page parity is proven, without
changing content or layout, using Astro's image service as the sole
image optimization provider.

## Non-goals

- Changing the Contentful loader's normalized image data shape.
- Introducing a third-party image CDN or SDK.
- Changing which images render on which pages.
- Re-litigating M2/M3 component structure or scoped CSS.

## Architecture

### Image pipeline

Astro's built-in `<Image />` and `<Picture />` components from
`astro:assets` perform build-time transforms on remote Contentful
assets that are explicitly authorized in `astro.config.mjs`.

`astro.config.mjs` authorizes the Contentful asset hosts via
`image.domains`:

- `images.ctfassets.net`
- `videos.ctfassets.net` (defensive; some legacy assets use this host)

Astro downloads each authorized remote asset once per build, transforms
it into the requested formats and widths, and emits the optimized
binaries under `/_astro/<hash>.<ext>`. Repeat builds reuse Astro's
content cache.

### Loader data shape

The Contentful loader's existing `ContentfulImage` type is unchanged:

```ts
type ContentfulImage = {
  src: string
  width: number
  height: number
  title?: string
  description?: string
}
```

This shape already matches what Astro needs for remote `<Image />` and
`<Picture />`: `src` is an absolute HTTPS URL, and `width`/`height`
are passed as component props to preserve aspect ratio and prevent CLS.
`description` (or `title`) is used as `alt`.

### Per-component component choice

Mixed per-context, matching the LCP / below-the-fold split:

- **`HeroBlock.astro`** (LCP image): use `<Picture />` from
  `astro:assets` with `formats={['avif', 'webp']}`,
  `fetchpriority="high"`, and `loading="eager"`. The hero is the
  highest-value image and benefits from AVIF/WebP format negotiation
  via `<picture>`.
- **`EmployeeTile.astro`** and **`ProductGroup.astro`** (below-the-fold
  images): use `<Image />` from `astro:assets` with `loading="lazy"`.
  Single-format WebP output keeps the markup simple where format
  negotiation is not worth the extra bytes.

`sizes` and (where relevant) `densities` are passed explicitly on each
component so Astro's generated `srcset` matches the component's layout
box, not the asset's intrinsic size. The existing scoped
`object-fit`/`object-position` rules continue to target the rendered
`<img>` and remain in place.

### Helper removal

`src/lib/contentful-images.ts` is deleted. No transform helper is
needed because Astro's image service performs all transforms. This is
the key decoupling point: switching the CMS or image source later means
changing one `image.domains` entry and the `src` data, not a helper
module.

## History rewrite

The branch `astro-migration-v2-m4` currently contains two commits that
implement the Contentful-CDN approach:

- `5cf10e3` Choose Contentful CDN image strategy
- `0ea8cfa` Optimize Astro image delivery

Both are reset off the branch. The branch is reset to the M3 baseline
`ac71660` ("Remove Gatsby after Astro parity") and the new M4 work is
committed on top. The Contentful detour never appears in the branch
history.

The rewritten ADR 05 and rewritten M4 plan replace the existing
versions; the superseded versions are discarded with the reset commits.

## Spec, plan, and ADR updates

### Master spec

`docs/superpowers/specs/2026-07-04-astro-migration-design.md`:

- Replace the M4 *Decision point* section. Remove the two-option
  choice (Contentful CDN transforms vs. Astro image service) and state
  the Astro image service as the chosen approach, with authorization of
  `images.ctfassets.net` / `videos.ctfassets.net` and the mixed
  `<Picture />` / `<Image />` component choice.
- Update the *Final stack* **Images:** line to reference Astro image
  optimization instead of plain `<img>` deferral.
- Update *Deliberate behavior changes* entry 5 ("Image optimization
  deferred") to reflect that optimization now lands in M4 via Astro's
  image service.
- Leave the M4 verification gate criteria intact (build succeeds, M3
  parity preserved, dimensions/alt/loading behavior correct, no
  cookies/storage introduced).

### Planning design

`docs/superpowers/specs/2026-07-04-astro-migration-planning-design.md`:
no structural change. The M4 ADR-moment line stays accurate (the
selected image optimization strategy is still the decision point); the
decision itself changes from "Contentful CDN" to "Astro image service".

### M4 implementation plan

`docs/superpowers/plans/2026-07-04-astro-migration-m4-images.md` is
rewritten to consume this design. New task structure:

1. Authorize Contentful remote images in `astro.config.mjs` and commit
   the config change.
2. Replace `HeroBlock.astro` with `<Picture />` (LCP, eager, AVIF/WebP).
3. Replace `EmployeeTile.astro` and `ProductGroup.astro` with `<Image />`
   (lazy, WebP).
4. Delete `src/lib/contentful-images.ts`.
5. Extend comparison-script asset URL normalization for Astro's
   `/_astro/<hash>.<ext>` output.
6. M4 verification gate: `pnpm build`, `pnpm compare:pages`,
   `npm run lint`, manual visual regression, cookie/storage check,
   ADR review, completion summary.

### ADR 05

`docs/adrs/adr_05_image_strategy.md` is rewritten (not amended) to
record the Astro image service decision. Because the branch is reset,
the old ADR content never lands in history. The rewritten ADR keeps the
same number (05) and filename.

The rewritten ADR records:

- **Context:** M3 shipped plain `<img>` tags with raw Contentful URLs.
  M4 needs to improve image delivery without changing content or layout,
  and without tying the feature to Contentful.
- **Decision:** use Astro's built-in image service (`astro:assets`
  `<Image />` and `<Picture />`). Authorize `images.ctfassets.net` and
  `videos.ctfassets.net` in `astro.config.mjs`. Mixed per-context:
  `<Picture />` for the LCP hero, `<Image />` for below-the-fold images.
- **Consequences:** Astro downloads and transforms authorized remote
  assets at build time, increasing build time and `dist/` size (cached
  on repeat builds). The repo has no Contentful-specific image helper;
  changing the image source later means updating `image.domains` and
  the loader's `src` data. `<picture>` wrappers from `<Picture />` are
  collapsed by the comparison scripts during parity checks.

## Comparison script changes

`scripts/compare-pages.mjs` and `scripts/compare-legal-pages.mjs`:

- Keep the existing `collapsePictureElements()` step. `<Picture />`
  emits a `<picture>` wrapper that must collapse to its `<img>` for
  content parity against the M3 plain-`<img>` baseline.
- Extend `normalizeAssetUrl` to collapse Astro's optimized asset paths
  (`/_astro/<hash>.<ext>`) to a canonical form (e.g. `/_astro/<ext>`)
  so that build-to-build hash variations do not break parity. The
  existing query-string and protocol normalization stays.

The legal-page scripts already share the same structure as the
homepage script; both receive the same `normalizeAssetUrl` extension.

## Verification

M4 is complete only when all of these are true:

- `pnpm build` succeeds.
- `pnpm compare:pages` passes (homepage + both legal pages).
- `npm run lint` passes.
- Manual visual comparison of `/`, `/imprint/`, and `/data-policy/`
  against the M3 plain-image baseline shows no content or layout
  regression.
- Images render with appropriate `width`, `height`, `alt`, and
  lazy/eager loading behavior.
- No cookies, service worker, or client-side storage are introduced.
- ADR 05 reflects the Astro image service decision.
- The Contentful image helper no longer exists in the repo.

## Trade-offs

**Pros**

- No Contentful-specific image code in the repo.
- Astro handles AVIF/WebP generation, `srcset`/`sizes`, dimensions,
  and `decoding=async` automatically.
- `<Picture />` gives format negotiation for the LCP hero; `<Image />`
  keeps below-the-fold markup simple.
- CLS protection and `width`/`height` inference come from Astro.

**Cons / consequences**

- Build now downloads Contentful images and transforms them,
  increasing build time and `dist/` size. Astro's content cache
  mitigates repeat builds.
- Requires network access to `images.ctfassets.net` at build time. The
  Contentful loader already requires this for entry data, so no new
  network dependency is introduced in practice.
- Astro's responsive-image layout styles (`--fit`/`--pos` custom
  properties) may interact with the existing scoped CSS. The existing
  `object-fit`/`object-position` rules target the rendered `<img>` and
  are expected to continue to apply; this is verified in the gate.

## Alternatives considered

### Pure `<Image />` everywhere

Single `<Image />` for all images, including the hero. Simpler, one
markup pattern, but loses multi-format delivery on the LCP image.
Rejected: the hero is the highest-value image and `<Picture />`'s
AVIF+WebP fallback is Astro's standard recommendation for it.

### No-op passthrough image service

Astro emits the raw Contentful URL with `width`/`height`/`alt` but no
transforms. Avoids build-time downloads and keeps `dist/` small, but
then Astro is not actually optimizing — Contentful would remain the de
facto image CDN, which is exactly what this change moves away from.
Rejected.
