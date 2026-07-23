# ADR 07: Netlify primary hosting (Cloudflare Pages fallback)

## Status

Accepted

## Context

ADR 06 chose Cloudflare Pages as the production host. Cloudflare requires
moving DNS management fully to Cloudflare in order to provision an apex TLS
certificate. The project prefers to keep DNS at the current registrar.

Netlify permits the apex domain to remain at the existing registrar and
provisions its certificate via DCV using an ALIAS/ANAME record at the apex
and a CNAME for `www`. Keeping DNS at the registrar is preferable, so
Netlify becomes the primary host.

The Astro static build (`astro build` → `dist/`) is host-agnostic and
requires no code or build changes; only hosting and DNS configuration
change. The legacy `requirements.txt` was for `subfont` only and is not
reintroduced (ADR 04 handles fonts).

## Decision

Host the production Astro static build on Netlify. Keep the existing
Cloudflare Pages project configured and building on every git push as a
dormant fallback.

- No `@astrojs/netlify` SSR adapter; the site is fully static.
- Build config committed to the repo as `netlify.toml`:
  `pnpm install --frozen-lockfile && pnpm build`, publish `dist`,
  `NODE_VERSION = "22"`.
- Production env vars `CONTENTFUL_SPACE_ID` and
  `CONTENTFUL_DELIVERY_TOKEN` are set in the Netlify dashboard, not
  committed. No preview token in production.
- DNS at the registrar: apex `rhode-medizin.de` ALIAS/ANAME →
  `apex-loadbalancer.netlify.com`; `www.rhode-medizin.de` CNAME →
  `<site-slug>.netlify.app`. Netlify provisions the TLS certificate via
  DCV.
- Content rebuilds via git push, manual Netlify deploy, or a Contentful
  webhook to a Netlify build hook (`publish`/`unpublish` on Entry and
  Asset).
- Cloudflare Pages fallback: the `*.pages.dev` URL stays functional; to
  switch traffic to Cloudflare, repoint DNS and let Cloudflare provision
  the apex cert.

## Consequences

- DNS stays at the registrar; Netlify manages TLS via DCV. This is the
  primary motivation for the switch.
- The deploy is fully static and host-agnostic; the same `dist/` runs on
  Netlify or Cloudflare Pages with no code change.
- `dist/404.html` is served automatically by Netlify.
- Content edits in Contentful do not appear until a rebuild; the
  Contentful → Netlify build webhook triggers that rebuild automatically.
- Cloudflare Pages remains configured as a fallback but is not actively
  verified against the real domain; if it is ever needed, run a fresh
  build and parity check before repointing DNS.
- ADR 06 is superseded for the production-traffic decision only; it is
  retained as a historical record of the Cloudflare setup and fallback
  config.
