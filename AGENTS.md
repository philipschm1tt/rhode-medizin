# AGENTS.md

Gatsby v2 marketing site for Heinrich Rhode GmbH. Content comes from Contentful; the build is essentially a renderer for Contentful pages.

## Commands

- `npm run develop` — dev server (needs Contentful creds, see below)
- `npm run build` — production build to `public/`
- `npm run build-subfont` / `build-subfont-preload` — build then inline fonts via `subfont` (Python deps in `requirements.txt`, currently disabled — see git history before re-enabling)
- `npm run lint` — runs `lint:es` (eslint, airbnb + prettier) then `lint:style` (stylelint over `src/**/*.{js,jsx}`, processes styled-components)
- `npm run format` — prettier write
- `npm test` — no tests configured; do not assume a test runner exists

Run `lint` before considering work done. There is no typecheck step (plain JS, no Flow/TS).

## Environment

`.env` (gitignored) must define `CONTENTFUL_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN`, loaded by `gatsby-config.js` via `dotenv`. Without these, `gatsby-source-contentful` returns empty data and `gatsby-node.js`'s `createPages` produces no pages. Do not commit `.env`.

## Architecture

- `gatsby-node.js` queries `allContentfulSeite` and creates one page per `slug` using `src/templates/contentful-page.jsx`. There is only a `404.jsx` page in `src/pages/`; all real routes are Contentful-driven.
- `src/templates/contentful-page.jsx` is the central dispatcher: `ModuleTemplate` switches on `module.__typename` (e.g. `ContentfulHeroBlock`, `ContentfulAbschnitt`, `ContentfulKartenlayout`) to render the matching component. New Contentful content types must be added to both the GraphQL fragment and the switch.
- Contentful field names are German (`hauptueberschrift`, `unterueberschrift`, `volleBreite`, `seitenabschnitt`, `inhalte`). Preserve this convention when extending queries.
- `src/components/layout.jsx` runs a `StaticQuery` for site metadata + a `contentfulFontContainer` ("NeuzeitOffice") used for webfonts and license text. Font inlining is handled via `subfont` build scripts, not Gatsby.
- Styling: styled-components with a theme in `src/styles/`. `GlobalWrapper` is centered at 960px and flips to full-width CSS grid on large screens (`@supports (display: grid)`).

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
- ESLint: airbnb base with prettier integration; `react/destructuring-assignment` and `react/jsx-one-expression-per-line` are off, tagged-template expressions are allowed (for styled-components).
- Stylelint is configured to lint CSS inside styled-components — keep `lint:style` green when touching `src/**/*.{js,jsx}`.

## Deploy

Deployed to Netlify (see README button). `requirements.txt` is read by Netlify's Python build step for `subfont`; lines are currently commented out after "Disable subfont requirements" — re-enable there if you revive subfont builds.
