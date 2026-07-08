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

The site is served by Cloudflare Pages as a fully static build (no SSR adapter).

Cloudflare Pages project settings:

```text
Framework preset: Astro
Build command: pnpm install --frozen-lockfile && pnpm build
Output directory: dist
Environment variables: CONTENTFUL_SPACE_ID, CONTENTFUL_DELIVERY_TOKEN
NODE_VERSION: current LTS supported by Astro and Cloudflare Pages
```

No `CONTENTFUL_PREVIEW_TOKEN` is set for production Cloudflare builds.

### Content rebuilds

Content is fetched from Contentful at build time, so content edits do not
appear until a rebuild. Trigger a rebuild via git push, a manual Cloudflare
deploy, or a Contentful webhook pointing at a Cloudflare Pages deploy hook
(`publish`/`unpublish` events).
