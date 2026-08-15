# rhode-medizin

Astro marketing site for Heinrich Rhode GmbH. Content is version-controlled
as local MDX pages, YAML collections, and image assets.

## Prerequisites

- Node.js (current LTS)
- pnpm

## Install

```sh
pnpm install
```

## Environment

No environment variables are required. The build uses local content under
`src/content/`, `src/pages/*.mdx`, and `src/assets/content/`.

## Develop

```sh
pnpm develop
```

## Build

```sh
pnpm build
```

Output is written to `dist/`. The build runs `astro check` then
`astro build` and does not need Contentful credentials or network access.

## Parity checks

```sh
pnpm verify              # lint + content + assets + build + parity + dist checks
pnpm verify:content     # content integrity against frozen capture
pnpm verify:assets      # asset checksums, dimensions, manifest
pnpm verify:dist        # built output: routes, metadata, sitemap, no Contentful URLs
pnpm compare:legal      # legal pages against cutover fixtures
pnpm compare:pages      # homepage + legal pages against cutover fixtures
```

Cutover fixtures live under `tests/fixtures/cutover/pages/`. The frozen
Contentful capture is the migration provenance and integrity oracle.

## Deploy

The site is served by Netlify as a fully static build (no SSR adapter).
Cloudflare Pages remains configured and builds on every git push as a
dormant fallback. See `docs/adrs/adr_07_netlify.md` for the decision and
`docs/superpowers/plans/2026-08-13-local-content-cutover-operator-runbook.md`
for the cutover/retirement operator runbook.

### Netlify (primary)

Build configuration is committed in `netlify.toml`:

```text
Build command: pnpm install --frozen-lockfile && pnpm build
Publish directory: dist
NODE_VERSION: 22
Environment variables: none required
```

Content edits are Git changes; pushing to `master` triggers a Netlify
rebuild.

DNS stays at the registrar (do not transfer to Netlify DNS):

- Apex `rhode-medizin.de`: ALIAS/ANAME → `apex-loadbalancer.netlify.com`.
- `www.rhode-medizin.de`: CNAME → `<site-slug>.netlify.app`.

Netlify auto-provisions the TLS certificate via DCV.

### Cloudflare Pages fallback

The Cloudflare Pages project keeps building on every git push with the same
build command; the `*.pages.dev` URL remains functional as an emergency
fallback. Both hosts run `pnpm verify` before publishing. To revert
traffic, repoint DNS at the Cloudflare Pages target. See
`docs/adrs/adr_06_cloudflare_pages.md` (superseded for production traffic)
and the operator runbook.

For Cloudflare deploy pipelines that run `npx wrangler versions upload`,
`wrangler.jsonc` defines `assets.directory` as `./dist`.
