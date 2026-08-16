# ADR 09: Steady-State Content Verification

## Status

Accepted

## Context

Snapshot comparisons against the cutover capture preserve useful migration
history, but using those snapshots as required regression expectations
obstructs intentional content edits. The maintained site needs deterministic
checks for objective content and deployment contracts without treating old
wording or markup as the current specification.

## Decision

Use `src/content/assets.yaml` as the operational image manifest. Each content
image has a stable manifest ID and an Astro-resolvable local path so identity
remains stable when generated asset URLs change.

Use the deterministic, invariant-based `pnpm verify` aggregate as the required
local command. Committed GitHub Actions and Netlify configuration require the
same aggregate; Cloudflare Pages is also required to use it as the dormant
fallback. It checks formatting, source content, assets, the production build,
verifier behavior, and built output. Historical `compare:pages` and
`compare:legal` commands remain available as optional diagnostics outside the
required gate. Cutover fixtures remain immutable historical records.

## Consequences

- Objective regressions in content structure, asset identity and usage,
  builds, routes, metadata, links, images, and sitemaps are automated.
- Intentional content edits do not require rewriting historical snapshots.
- Wording, legal accuracy, image choice, crop, alt semantics, and visual and
  responsive quality remain human review responsibilities.
- Local verification uses the aggregate. Repository configuration establishes
  the GitHub Actions and Netlify requirements; Cloudflare dashboard settings
  must match them. Final remote workflow runs, provider settings, and deploy
  behavior remain pending operator verification.
