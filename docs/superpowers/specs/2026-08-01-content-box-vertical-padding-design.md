# Content Box Vertical Padding Design

## Scope

Correct the scoped `extraVerticalPadding` modifier in `ContentBox.astro` without changing its Astro prop or any consumers.

## Design

The base `.content-box` rule keeps `padding: var(--inner-padding)`, providing 13px padding on every side. The `.content-box.extra-vertical` modifier sets only `padding-top` and `padding-bottom` to `var(--outer-padding)` (26px). The inherited base shorthand therefore continues to supply 13px left and right padding.

## Verification

Check the resulting diff for whitespace errors and run the repository formatter check when Node tooling is available. No automated test is added because this is a scoped CSS declaration correction and the repository has no test runner configured.

## Architecture Decision

No ADR is required. The component interface and consumers are unchanged; this is a localized CSS cascade correction.
