# ADR 06: Cloudflare Pages static hosting

## Status

Superseded by `docs/adrs/adr_07_netlify.md` for the production-traffic
decision. This ADR is retained as the historical record of the Cloudflare
Pages setup, which remains configured as a dormant fallback.

## Context

The Astro migration (ADR 01) replaces the Gatsby v2 + Netlify stack. The
master spec requires a static, cookie-free, service-worker-free deploy with
no SSR adapter. M5 is the deploy cutover milestone: the Astro static build
must be served from a host that provisions TLS for `rhode-medizin.de` and
`www.rhode-medizin.de`, serves `dist/` directly, and supports a content
rebuild trigger for Contentful-driven updates.

## Decision

Host the Astro static build on Cloudflare Pages.

- No `@astrojs/cloudflare` SSR adapter; the site is fully static
  (`astro build` → `dist/`).
- Build command: `pnpm install --frozen-lockfile && pnpm build`.
- Production env vars: `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`.
  No preview token in production.
- `NODE_VERSION` set to current LTS supported by Astro and Cloudflare Pages.
- Custom domains `rhode-medizin.de` and `www.rhode-medizin.de` attached to
  the Pages project; Cloudflare provisions the edge certificate.
- Content rebuilds via git push, manual Cloudflare deploy, or a Contentful
  webhook to a Cloudflare Pages deploy hook.

Netlify is decommissioned after production verification passes.

## Consequences

- The deploy is fully static, which matches the cookie-free and
  no-service-worker goals; there is no runtime to set cookies or storage.
- Cloudflare Pages serves `dist/404.html` automatically with no extra
  configuration.
- Content edits in Contentful do not appear until a rebuild; the rebuild
  path must be triggered explicitly (webhook, git push, or manual deploy).
- Switching hosts later would require migrating DNS and the deploy
  pipeline; the static build itself is host-agnostic.
