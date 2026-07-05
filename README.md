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

Static output in `dist/` is served by Cloudflare Pages (no SSR adapter).
