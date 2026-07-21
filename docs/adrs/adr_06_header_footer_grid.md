# ADR 6: Header and Footer as grid containers

## Context

The M2/M3 Astro port wrapped `Header.astro` and `Footer.astro` in a child `<MainGrid>` component. `Layout.astro` then placed them as children of an outer `<MainGrid>`, whose `> *` rule constrained every child (including the header and footer) to `grid-column: main-column-start / side-column-end`. This caused two visual defects:

- The header rendered collapsed in the main column with a centered logo, rather than spanning full width with the logo in the left column.
- The footer's background color did not fill the full width.

The original styled-components structure had `HeaderArea` and `FooterArea` *extend* `MainGrid` — they were grid containers themselves with `grid-column: 1 / 5`, not grid items.

## Decision

Refactor `Header.astro` and `Footer.astro` to carry the grid container rules (`display: grid; grid-template-columns: var(--main-grid-columns); justify-items: stretch;` and the `> * { grid-column: main-column-start / side-column-end }` rule) directly, rather than wrapping a `<MainGrid>`. `Layout.astro`'s `.global-wrapper` becomes the outer grid container at the `min-width: 800px` breakpoint, with Header, MainContent, and Footer as direct children. The side-background spans `side-column-start / 5` to fill the right margin column with light blue.

## Consequences

- The Astro structure now mirrors the original styled-components component model.
- The visual defects (header position, footer width, side-background right strip) are fixed structurally rather than by CSS overrides.
- The fixture comparison scripts (`pnpm compare:legal`, `pnpm compare:pages`) are re-run as the regression canary after the refactor.
- `MainGrid.astro` is retained for the article region and `HeroBlock.astro` (which uses it as its grid container). Header and Footer do not import `MainGrid.astro`.
