# AGENTS.md

Astro marketing site for Heinrich Rhode GmbH. Content comes from Contentful at build time; the build is essentially a renderer for Contentful pages.

## Commands

- `pnpm develop` — dev server (needs Contentful creds, see below)
- `pnpm build` — production build to `dist/` (runs `astro check` then `astro build`)
- `pnpm compare:legal` — compare built legal pages against captured fixtures
- `pnpm compare:pages` — compare built homepage + legal pages against captured fixtures
- `pnpm format` — prettier write
- `pnpm lint` — prettier check (no eslint/stylelint after Astro migration)
- `pnpm test` — no tests configured; do not assume a test runner exists

Run `lint` before considering work done. The build also runs `astro check` (TypeScript diagnostics for `.astro` and `.ts` files).

## Environment

`.env` (gitignored) must define `CONTENTFUL_SPACE_ID` and `CONTENTFUL_DELIVERY_TOKEN`, loaded by `src/content/loaders/contentful.ts` via `dotenv`. Without these, the Contentful loader throws and the build fails. Do not commit `.env`.

`CONTENTFUL_ACCESS_TOKEN` exists only for the legacy Gatsby build and is no longer used by the Astro stack. `CONTENTFUL_PREVIEW_TOKEN` is optional for preview builds (set `CONTENTFUL_USE_PREVIEW=true` to use it against `preview.contentful.com`).

## Architecture

- `src/pages/[...slug].astro` reads the `pages` content collection and creates one page per `slug`. A Contentful slug of `/` or empty maps to the site root.
- `src/components/ModuleRenderer.astro` is the central dispatcher: it switches on `module.__typename` (e.g. `ContentfulHeroBlock`, `ContentfulAbschnitt`, `ContentfulKartenLayout`) to render the matching `.astro` component. New Contentful content types must be added to both the Zod schema in `src/content.config.ts` and the dispatcher.
- Contentful field names are German (`hauptueberschrift`, `unterueberschrift`, `volleBreite`, `seitenabschnitt`, `inhalte`). Preserve this convention when extending schemas.
- `src/content/loaders/contentful.ts` is a custom Astro Content Loader that fetches from Contentful via the `contentful.js` SDK, resolves cross-references, renders Markdown to HTML, and normalizes image data to `{ src, width, height, title?, description? }`.
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

- As part of spec-driven work, identify cohesive changes that warrant commits while executing implementation plans.
- When completing a spec, commit the completed changes before considering the work done.
- Prefer meaningful commit boundaries. Implementation-plan steps are often suitable commit boundaries when they represent independently coherent changes.
- Avoid tiny mechanical commits that do not help review or history.
- Avoid broad commits that mix unrelated steps or concerns.
- Match existing repository commit messages: short active-voice subjects, no conventional commit prefixes.
- Use commit bodies when helpful to summarize the change, explain reasoning, or include the verbatim prompt that led to the change.
- Before committing, inspect `git status`, `git diff`, and `git log --oneline -10`; stage only intended files; never commit secrets or unrelated user changes.

## Style conventions

- Prettier: no semicolons, single quotes, ES5 trailing commas. 2-space indent, LF.
- Astro components use scoped CSS in `<style>` blocks. CSS custom properties in `src/styles/tokens.css` carry the design tokens.

## Deploy

To be deployed to Cloudflare Pages (M5). The build output is `dist/` with no SSR adapter — fully static, cookie-free, no service worker.
