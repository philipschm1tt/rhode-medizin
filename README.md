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

The site is served by Netlify as a fully static build (no SSR adapter).
Cloudflare Pages remains configured and builds on every git push as a
dormant fallback. See `docs/adrs/adr_07_netlify.md` for the decision and
`docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md` for the operator
runbook.

### Netlify (primary)

Build configuration is committed in `netlify.toml`:

```text
Build command: pnpm install --frozen-lockfile && pnpm build
Publish directory: dist
NODE_VERSION: 22
Environment variables: CONTENTFUL_SPACE_ID, CONTENTFUL_DELIVERY_TOKEN
```

Secrets are set in the Netlify dashboard, not committed. No
`CONTENTFUL_PREVIEW_TOKEN` is set for production builds.

DNS stays at the registrar (do not transfer to Netlify DNS):

- Apex `rhode-medizin.de`: ALIAS/ANAME → `apex-loadbalancer.netlify.com`.
- `www.rhode-medizin.de`: CNAME → `<site-slug>.netlify.app`.

Netlify auto-provisions the TLS certificate via DCV.

### Content rebuilds

Content is fetched from Contentful at build time, so content edits do not
appear until a rebuild. Trigger a Netlify rebuild via git push, a manual
Netlify deploy, or a Contentful webhook pointing at a Netlify build hook
(`publish`/`unpublish` events on Entry and Asset).

### Cloudflare Pages fallback

The Cloudflare Pages project keeps building on every git push with the same
build command and env vars; the `*.pages.dev` URL remains functional as an
emergency fallback. To revert traffic, repoint DNS at the Cloudflare Pages
target. See `docs/adrs/adr_06_cloudflare_pages.md` (superseded for production
traffic) and the operator runbook.

For Cloudflare deploy pipelines that run `npx wrangler versions upload`,
`wrangler.jsonc` defines `assets.directory` as `./dist`.
