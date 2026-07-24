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
building on every git push as a dormant fallback.

- Build config lives in `netlify.toml` at the repo root.
- Build command: `pnpm install --frozen-lockfile && pnpm build`; publish
  directory `dist`; `NODE_VERSION` `22`.
- Production env vars (set in the Netlify dashboard, not committed):
  `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`. No preview token in
  production.
- DNS stays at the registrar: apex `rhode-medizin.de` as ALIAS/ANAME →
  `apex-loadbalancer.netlify.com`; `www.rhode-medizin.de` as CNAME →
  `<site-slug>.netlify.app`.
- Netlify auto-provisions the TLS certificate via DCV.
- Content rebuilds via a Contentful webhook to a Netlify build hook
  (`publish`/`unpublish` events on Entry and Asset).
- Cloudflare Pages keeps building on git push; the `*.pages.dev` URL remains
  available as an emergency fallback. To revert traffic, repoint DNS at the
  Cloudflare Pages target.

## Consequences

- Production traffic is served by Netlify; DNS remains at the registrar.
- Cloudflare Pages is a dormant safety net: it builds but is not actively
  verified against the real domain. If Cloudflare is ever needed, run a fresh
  build and a parity check (`pnpm compare:pages`) before repointing DNS.
- Content edits trigger a Netlify rebuild automatically via the Contentful
  webhook; Cloudflare rebuilds remain on git push / manual deploy only.
- The static build itself is unchanged and remains host-agnostic.

Operator runbook: `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`.
