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
`www.rhode-medizin.de`; retain Cloudflare Pages as the intended dormant
fallback.

- Build config lives in `netlify.toml` at the repo root.
- Netlify and Cloudflare Pages are required to use
  `pnpm install --frozen-lockfile && pnpm verify`, publish directory `dist`,
  and the required Node 22 build runtime. No application or content environment
  variables are required. The aggregate performs the production build and
  produces `dist/`, so neither host should run a second build.
- Cloudflare's build command must be configured in the Pages dashboard.
  Wrangler does not configure the Pages build and retains only
  `assets.directory: ./dist` as its deployment output setting.
- The committed GitHub Actions workflow requires `pnpm verify` for pull
  requests targeting `master` and pushes to `master`.
- DNS stays at the registrar: apex `rhode-medizin.de` as ALIAS/ANAME →
  `apex-loadbalancer.netlify.com`; `www.rhode-medizin.de` as CNAME →
  `<site-slug>.netlify.app`.
- Netlify is intended to provision the TLS certificate via DCV.
- Cloudflare Pages is intended to build through its GitHub integration and
  retain its `*.pages.dev` URL as an emergency fallback. To revert traffic,
  repoint DNS at the Cloudflare Pages target after verifying the fallback.

## Consequences

- The accepted production target is Netlify while DNS remains at the
  registrar.
- Pull requests targeting `master` and pushes to `master` must pass the same
  aggregate used by both hosts.
- Cloudflare Pages is the accepted dormant safety net. If it is needed, verify
  its settings and URL, then run a fresh build and parity check
  (`pnpm compare:pages`) before repointing DNS.
- Content edits are Git changes; pushes to `master` are intended to trigger a
  Netlify deploy through its GitHub integration. No Contentful webhook is
  required.
- Host deploys must install from the frozen lockfile and run the full
  verification gate before publishing generated `dist/`; there should be no
  separate build step. Host build configuration must set Node 22, but the
  application and content require no environment variables of their own.
- Final GitHub Actions runs, Netlify and Cloudflare settings, deploy behavior,
  DNS, TLS, and fallback availability remain pending external verification.
- The static build itself is unchanged and remains host-agnostic.
- See ADR 08 for the local-content decision and
  `docs/superpowers/plans/2026-08-13-local-content-cutover-operator-runbook.md`
  for the retirement steps.

Operator runbook: `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`.
