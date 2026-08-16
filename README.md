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

No application or content environment variables are required. The build uses
local content under `src/content/`, `src/pages/*.mdx`, and
`src/assets/content/`.

## Develop

```sh
pnpm develop
```

## Author content

Follow the [content authoring guide](docs/content-authoring.md) for the complete
editing and review workflow. Page prose lives in `src/pages/*.mdx`; employee and
product records live in `src/content/employees/` and
`src/content/product-groups/`; homepage data lives in `src/content/homepage/`;
and image files live in `src/assets/content/`.

`src/content/assets.yaml` is the operational image manifest. Collection
`order` values must remain contiguous from `1`, and every image usage must keep
its manifest identity, local path, and alt text consistent. Confirm image usage
rights and record specific provenance in the manifest rather than inferring
approval from possession of a file.

Preview every changed page at desktop and mobile widths, and obtain human
review for wording, legal accuracy, image choice, crop, alt semantics, and
responsive layout. Before opening a pull request, run the complete required
gate:

```sh
pnpm verify
```

## Build

```sh
pnpm build
```

Output is written to `dist/`. The build runs `astro check` then
`astro build` and does not need Contentful credentials or network access.

## Verification

```sh
pnpm verify              # lint + content + assets + build + tests + dist checks
pnpm verify:content      # local source-content invariants
pnpm verify:assets       # operational asset identity, usage, and policy
pnpm verify:dist         # deployable output: routes, metadata, links, images, sitemap
pnpm compare:legal       # optional historical legal-page diagnostic
pnpm compare:pages       # optional historical homepage + legal-page diagnostic
```

The `pnpm verify` aggregate includes `pnpm test` and is snapshot-free. The
`compare:*` commands compare built pages with frozen cutover fixtures only as
optional historical diagnostics; they are not part of the required gate and
may report expected differences after intentional content changes.

## Deploy

The site is served by Netlify as a fully static build (no SSR adapter).
Cloudflare Pages remains configured as a dormant fallback. GitHub Actions runs
`pnpm verify` for pull requests targeting `master` and pushes to `master`. See
`docs/adrs/adr_07_netlify.md` for the decision and
`docs/superpowers/plans/2026-08-13-local-content-cutover-operator-runbook.md`
for the cutover/retirement operator runbook.

### Netlify (primary)

Build configuration is committed in `netlify.toml`:

```text
Build command: pnpm install --frozen-lockfile && pnpm verify
Publish directory: dist
NODE_VERSION: 22
Application/content environment variables: none required
```

The verification aggregate performs the production build and produces `dist/`,
which Netlify publishes without running a second build. Content edits are Git
changes; pushing to `master` triggers a Netlify deploy through its GitHub
integration.

DNS stays at the registrar (do not transfer to Netlify DNS):

- Apex `rhode-medizin.de`: ALIAS/ANAME → `apex-loadbalancer.netlify.com`.
- `www.rhode-medizin.de`: CNAME → `<site-slug>.netlify.app`.

Netlify auto-provisions the TLS certificate via DCV.

### Cloudflare Pages fallback

The Cloudflare Pages project keeps building through its GitHub integration with
the same `pnpm install --frozen-lockfile && pnpm verify` command, Node 22,
publish directory `dist`, and no application or content environment variables.
Node 22 remains required build-runtime configuration. The command is a
Cloudflare Pages dashboard setting; `pnpm verify` produces `dist/`, so no
second build runs. The `*.pages.dev` URL remains functional as an emergency
fallback. To revert traffic, repoint DNS at the Cloudflare Pages target. See
`docs/adrs/adr_06_cloudflare_pages.md` (superseded for production traffic)
and the operator runbook.

Wrangler does not configure the Pages build command; `wrangler.jsonc` retains
only the deployment output setting `assets.directory: ./dist`.
