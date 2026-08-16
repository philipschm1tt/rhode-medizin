# AGENTS.md

Astro marketing site for Heinrich Rhode GmbH. Content is version-controlled
as local MDX pages, YAML collections, and image assets — no CMS.

## Commands

- `pnpm develop` — dev server
- `pnpm build` — production build to `dist/` (runs `astro check` then `astro build`; no Contentful credentials needed)
- `pnpm verify` — snapshot-free aggregate: lint + content + assets + build + tests + dist checks
- `pnpm verify:content` — local source-content invariants
- `pnpm verify:assets` — operational asset identity, usage, and policy
- `pnpm verify:dist` — deployable output: routes, metadata, links, images, and sitemap
- `pnpm compare:legal` — optional historical legal-page diagnostic against cutover fixtures
- `pnpm compare:pages` — optional historical homepage and legal-page diagnostic against cutover fixtures
- `pnpm format` — prettier write
- `pnpm lint` — prettier check (no eslint/stylelint after Astro migration)
- `pnpm test` — Node test suite for verifier behavior; included in `pnpm verify`

Run `pnpm verify` before considering work done. The build also runs `astro check` (TypeScript diagnostics for `.astro` and `.ts` files). The optional `compare:*` commands are historical diagnostics, not part of the required aggregate, and may differ after intentional content edits.

## Environment

No environment variables are required. The build uses local content under
`src/content/`, `src/pages/*.mdx`, and `src/assets/content/`. The gitignored
`.env` file is no longer read.

## Content authoring

Follow `docs/content-authoring.md` for active editing procedures and review
requirements.

- Edit page prose in `src/pages/*.mdx`, collection records in
  `src/content/employees/` and `src/content/product-groups/`, homepage data in
  `src/content/homepage/`, and image files in `src/assets/content/`.
- Treat `src/content/assets.yaml` as the operational image manifest. Keep each
  content image's manifest identity, local path, and alt text consistent with
  its manifest record.
- Keep each collection's `order` values contiguous from `1`, without gaps or
  duplicates.
- Confirm image usage rights and record a specific rights status and provenance
  in the manifest; possession of a file is not approval.
- Preview changed pages at desktop and mobile widths. Human review remains
  required for wording, legal accuracy, image choice, crop, alt semantics, and
  responsive layout.
- Run the snapshot-free `pnpm verify` aggregate before opening a pull request.
  Use `pnpm compare:pages` and `pnpm compare:legal` only to investigate
  historical cutover differences; do not update fixtures for routine content
  edits.

## Architecture

- `src/pages/*.mdx` are file-routed pages (`index.mdx`, `imprint.mdx`, `data-policy.mdx`) that compose editor-facing blocks and load data via `getCollection`.
- `src/content.config.ts` defines two `glob()` collections: `employees` and `productGroups`, backed by YAML files under `src/content/employees/` and `src/content/product-groups/` with `image()`-typed photos.
- `src/layouts/PageLayout.astro` is the MDX page shell composing `Layout.astro` + `MainContent.astro`, with `getImage()` social image support.
- `src/components/blocks/` holds editor-facing blocks: `Hero`, `Section`, `Aside`, `Quote`, `Tiles`, `EmployeeTile`, `ProductGroup`. `Section` and `Aside` render MDX in their default slot; pages compose prose Markdown and block components as children. `Tiles` validates `layout`/`items`/`itemComponent` and throws on misuse at build time.
- Page-specific prose (legal copy, homepage sections, asides) is inlined as Markdown in each `.mdx` page. Explicit HTML is used only where Markdown would change the frozen DOM (e.g. the homepage service heading's `<br />`-separated lines). No separate prose store, no `set:html` for frozen prose. Prettier reflows the inline Markdown; the fixture comparators confirm parity.
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

Deployed to Netlify as a fully static build (`astro build` → `dist/`), no SSR adapter — fully static, cookie-free, no service worker. Build config is committed in `netlify.toml`: build command `pnpm install --frozen-lockfile && pnpm verify`, publish directory `dist`, `NODE_VERSION` `22`, and no environment variables. The aggregate produces `dist/`, which Netlify publishes without a second build. Content edits are Git changes; pushing to `master` triggers a Netlify deploy through its GitHub integration. GitHub Actions runs `pnpm verify` for pull requests targeting `master` and pushes to `master`. See `docs/superpowers/plans/2026-08-13-local-content-cutover-operator-runbook.md` for the cutover/retirement operator runbook and `docs/adrs/adr_08_local_content.md` for the decision.

Cloudflare Pages remains configured as a dormant fallback through its GitHub integration. Its Pages dashboard uses the same build command, Node 22, `dist` publish directory, and no environment variables; no second build runs. The `*.pages.dev` URL stays functional for emergency reversion. See `docs/adrs/adr_06_cloudflare_pages.md` (superseded for production traffic), `docs/adrs/adr_07_netlify.md`, and `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`.

Wrangler does not configure the Cloudflare Pages build command; `wrangler.jsonc` retains only the deployment output setting `assets.directory: ./dist`.
