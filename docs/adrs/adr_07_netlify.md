# ADR 07: Netlify primary hosting

## Status

Accepted

Supersedes ADR 06 (`adr_06_cloudflare_pages.md`) for production traffic only;
ADR 06 is retained as a historical record.

## Context

ADR 06 chose Cloudflare Pages for static hosting. Provisioning an apex TLS
certificate on Cloudflare requires moving DNS management fully to Cloudflare.
The project prefers to keep DNS at the existing registrar. Netlify provisions
apex TLS via DCV using an ALIAS/ANAME record at the apex and a CNAME for
`www`, so DNS can stay at the registrar.

The Astro static build (`astro build` → `dist/`) is host-agnostic and requires
no code or build changes to move hosts.

## Decision

Make Netlify the primary host for `rhode-medizin.de` and
`www.rhode-medizin.de`; keep the Cloudflare Pages project configured and
building through its GitHub integration as a dormant fallback.

- Build config lives in `netlify.toml` at the repo root.
- Netlify and Cloudflare Pages use
  `pnpm install --frozen-lockfile && pnpm verify`, publish directory `dist`,
  and the required Node 22 build runtime. No application or content environment
  variables are required. The aggregate performs the production build and
  produces `dist/`; neither host runs a second build.
- Cloudflare's build command is configured in the Pages dashboard. Wrangler
  does not configure the Pages build and retains only
  `assets.directory: ./dist` as its deployment output setting.
- GitHub Actions runs `pnpm verify` for pull requests targeting `master` and
  pushes to `master`.
- DNS stays at the registrar: apex `rhode-medizin.de` as ALIAS/ANAME →
  `apex-loadbalancer.netlify.com`; `www.rhode-medizin.de` as CNAME →
  `<site-slug>.netlify.app`.
- Netlify auto-provisions the TLS certificate via DCV.
- Cloudflare Pages keeps building through its GitHub integration; the
  `*.pages.dev` URL remains available as an emergency fallback. To revert
  traffic, repoint DNS at the Cloudflare Pages target.

## Consequences

- Production traffic is served by Netlify; DNS remains at the registrar.
- Pull requests targeting `master` and pushes to `master` must pass the same
  aggregate used by both hosts.
- Cloudflare Pages is a dormant safety net: it builds but is not actively
  verified against the real domain. If Cloudflare is ever needed, run a fresh
  build and a parity check (`pnpm compare:pages`) before repointing DNS.
- Content edits are Git changes; a push to `master` triggers a Netlify deploy
  through its GitHub integration. No Contentful webhook is configured.
- Host deploys install from the frozen lockfile and run the full verification
  gate before publishing its generated `dist/`; there is no separate build
  step. Host build configuration must set Node 22, but the application and
  content require no environment variables of their own.
- The static build itself is unchanged and remains host-agnostic.
- See ADR 08 for the local-content decision and
  `docs/superpowers/plans/2026-08-13-local-content-cutover-operator-runbook.md`
  for the retirement steps.

Operator runbook: `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`.
