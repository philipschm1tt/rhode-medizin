# ADR 04: Defer NeuzeitOffice font self-hosting in M2

## Status

Accepted

## Context

The live site renders text in NeuzeitOffice (bold/medium/light), a
commercial font licensed through MyFonts (Webfont Build ID 3645311,
250,000 monthly pageviews, single-domain license for
`rhode-medizin.de`). The license text embedded in the live HTML
explicitly restricts use to the licensed website owner and prohibits
redistribution by third parties.

The Astro migration design (`docs/superpowers/specs/2026-07-04-astro-migration-design.md`)
calls for self-hosting the woff2 files under `src/fonts/` with
`@font-face` rules in `src/styles/global.css`, conditional on license
verification.

## Decision

M2 ships **without** `@font-face` rules and **without** committing the
woff2 files to the repository. The legal pages render in the system
fallback font (`Arial, sans-serif`) for M2. The font decision is
deferred to a later milestone where the repository's visibility
(currently private, but the spec targets a public deploy on Cloudflare
Pages) and the font-file handling strategy can be decided together.

Content parity for the legal pages is proven by the fixture comparison
in `scripts/compare-legal-pages.mjs`, which strips class names and
presentational attributes and compares the article's HTML structure
and text. Visual typography parity is **not** claimed for M2; it is
deferred until the font question is resolved.

## Consequences

- M2's verification gate is met for content, structure, cookies, and
  build health. Visual typography parity is explicitly out of scope
  for M2.
- The global stylesheet (`src/styles/global.css`) references the font
  family names (`font-bold`, `font-medium`, `font-light`) in
  `--font-*` custom properties, but browsers will fall back to
  `Arial, sans-serif` because no `@font-face` rules are emitted.
- When the font decision is made, only `src/styles/global.css` (and
  optionally `src/fonts/`) needs to change; the component tree is
  unaffected.
