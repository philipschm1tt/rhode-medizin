# rhode-medizin

Astro marketing site for Heinrich Rhode GmbH. Content is fetched from Contentful at build time.

## Prerequisites

- Node.js (current LTS)
- pnpm

## Install

```sh
pnpm install
```

## Environment

Copy `.env.example` to `.env` and fill in Contentful credentials:

```
CONTENTFUL_SPACE_ID=...
CONTENTFUL_DELIVERY_TOKEN=...
```

For preview builds against `preview.contentful.com`, also set:

```
CONTENTFUL_PREVIEW_TOKEN=...
CONTENTFUL_USE_PREVIEW=true
```

## Develop

```sh
pnpm develop
```

## Build

```sh
pnpm build
```

Output is written to `dist/`.

## Parity checks

```sh
pnpm compare:legal   # legal pages against captured fixtures
pnpm compare:pages   # homepage + legal pages against captured fixtures
```

## Deploy

The site is served by Netlify as a fully static build (no SSR adapter). The
build config is committed in `netlify.toml`:

```toml
[build]
  command = "pnpm install --frozen-lockfile && pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
```

Production env vars (set in the Netlify dashboard, not committed):
`CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`. No
`CONTENTFUL_PREVIEW_TOKEN` is set for production builds.

### DNS and TLS

DNS stays at the current registrar. Netlify provisions the TLS certificate
via DCV:

- Apex `rhode-medizin.de`: ALIAS/ANAME → `apex-loadbalancer.netlify.com`
- `www.rhode-medizin.de`: CNAME → `<site-slug>.netlify.app`

### Content rebuilds

Content is fetched from Contentful at build time, so content edits do not
appear until a rebuild. Trigger a rebuild via git push, a manual Netlify
deploy, or a Contentful webhook pointing at a Netlify build hook
(`publish`/`unpublish` events on Entry and Asset).

### Cloudflare Pages fallback

The Cloudflare Pages project stays configured and builds on every git push
with the same build command and env vars. Its `*.pages.dev` URL remains
functional as an emergency fallback. To switch traffic to Cloudflare,
repoint DNS and let Cloudflare provision the apex cert. See
`docs/adrs/adr_06_cloudflare_pages.md` and
`docs/adrs/adr_07_netlify.md`.
