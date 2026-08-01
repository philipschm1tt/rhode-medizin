# Homepage Layout Parity Design

## Scope

Correct the four reported homepage layout differences between the Astro site and
the archived Gatsby site. Ignore archive UI, consent UI, fonts, and images. Do
not audit or alter other pages.

## Changes

- Keep the hero CTA left-aligned and restore the archived Gatsby desktop values:
  18px text with 13px horizontal padding.
- Remove default list indentation from the employee tile grid and product-group
  tile list so their first tiles align with their section headings.
- At desktop widths, make each product-group image occupy the full width of its
  assigned grid column while retaining its existing height and `object-fit:
  cover`. This fixes the Motorensysteme image coverage.

## Implementation Boundaries

Apply the corrections in the existing CTA, tile-grid, tile-list, and
product-group Astro components. Do not introduce page-specific overrides or
refactor shared layout architecture.

## Verification

Inspect the homepage at desktop and mobile widths. Run `pnpm lint` and, when
the configured Contentful environment permits, run the homepage comparison
script or production build.

## Architecture Decision

No ADR is required. These are localized CSS parity corrections and do not
change the site architecture or component interfaces.
