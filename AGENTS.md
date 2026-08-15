# AGENTS.md

Astro marketing site for Heinrich Rhode GmbH. Content is version-controlled
as local MDX pages, YAML collections, and image assets — no CMS.

## Commands

- `pnpm develop` — dev server
- `pnpm build` — production build to `dist/` (runs `astro check` then `astro build`; no Contentful credentials needed)
- `pnpm verify` — aggregate: lint + content + assets + build + parity + dist checks
- `pnpm verify:content` — content integrity against frozen capture
- `pnpm verify:assets` — asset checksums, dimensions, manifest
- `pnpm verify:dist` — built output: routes, metadata, sitemap, no Contentful URLs
- `pnpm compare:legal` — compare built legal pages against cutover fixtures
- `pnpm compare:pages` — compare homepage + legal pages against cutover fixtures
- `pnpm format` — prettier write
- `pnpm lint` — prettier check (no eslint/stylelint after Astro migration)
- `pnpm test` — no tests configured; do not assume a test runner exists

Run `lint` before considering work done. The build also runs `astro check` (TypeScript diagnostics for `.astro` and `.ts` files).

## Environment

No environment variables are required. The build uses local content under
`src/content/`, `src/pages/*.mdx`, and `src/assets/content/`. The gitignored
`.env` file is no longer read.

## Architecture

- `src/pages/*.mdx` are file-routed pages (`index.mdx`, `imprint.mdx`, `data-policy.mdx`) that compose editor-facing blocks and load data via `getCollection`.
- `src/content.config.ts` defines two `glob()` collections: `employees` and `productGroups`, backed by YAML files under `src/content/employees/` and `src/content/product-groups/` with `image()`-typed photos.
- `src/layouts/PageLayout.astro` is the MDX page shell composing `Layout.astro` + `MainContent.astro`, with `getImage()` social image support.
- `src/components/blocks/` holds editor-facing blocks: `Hero`, `Section`, `Aside`, `Quote`, `Tiles`, `EmployeeTile`, `ProductGroup`. `Tiles` validates `layout`/`items`/`itemComponent` and throws on misuse at build time.
- `src/content/prose/` holds pre-rendered HTML fragments for frozen legal and homepage prose, injected via `set:html` so Prettier cannot reflow the text.
- Images are local `ImageMetadata` objects under `src/assets/content/`, passed to `astro:assets` `<Image />` / `<Picture />` end to end.
- The MDX integration uses the Satteri processor with `smartPunctuation: false` and `gfm: false`.
- `src/layouts/Layout.astro` is the HTML shell with header, footer, and global grid.
- Styling: native `.astro` scoped CSS with custom properties in `src/styles/tokens.css` and global element styles in `src/styles/global.css`. No styled-components, no React runtime.

## Spec-driven work and ADRs

- For every completed spec implementation, review the work for significant architecture decisions before considering the task done.
- Document significant architecture decisions in `docs/adrs/` when they are not already covered by an existing ADR.
- ADR filenames use the next available two-digit number plus a short lowercase topic, e.g. `adr_01_astro.md`.
- Keep ADRs concise. Include reasons only when they are known from the spec, implementation, or conversation; do not invent rationale.
- Skip ADRs for routine implementation details, small refactors, or decisions already documented elsewhere.
- In the completion summary, state whether ADRs were added or why none were needed.

## Commits

- Use the local `commit-workflow` skill before creating any commit in this repository.

## Style conventions

- Prettier: no semicolons, single quotes, ES5 trailing commas. 2-space indent, LF.
- Astro components use scoped CSS in `<style>` blocks. CSS custom properties in `src/styles/tokens.css` carry the design tokens.

## Deploy

Deployed to Netlify as a fully static build (`astro build` → `dist/`), no SSR adapter — fully static, cookie-free, no service worker. Build config is committed in `netlify.toml`: build command `pnpm install --frozen-lockfile && pnpm build`, publish directory `dist`, `NODE_VERSION` `22`. No Contentful credentials are set. Content edits are Git changes; pushing to `master` triggers a Netlify rebuild. See `docs/superpowers/plans/2026-08-13-local-content-cutover-operator-runbook.md` for the cutover/retirement operator runbook and `docs/adrs/adr_08_local_content.md` for the decision.

Cloudflare Pages remains configured as a dormant fallback and builds on every git push with the same build command; the `*.pages.dev` URL stays functional for emergency reversion. See `docs/adrs/adr_06_cloudflare_pages.md` (superseded for production traffic), `docs/adrs/adr_07_netlify.md`, and `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`.

If the Cloudflare deployment pipeline uses `npx wrangler versions upload`, `wrangler.jsonc` must define `assets.directory` as `./dist`.
