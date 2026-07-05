# ADR 03: Content Loader Path Alias

## Status

Accepted

## Context

Astro 7 / Vite 8 cannot resolve relative `.ts` imports from `src/content.config.ts`. The SSR module runner used to load the content config never converts relative specifiers (e.g. `./loaders/contentful`) to absolute paths, so any relative import from the content config fails with `Failed to load url ./loaders/... Does the file exist?`. This was reproduced in a clean Astro 7 project and affects both extensionless and explicit `.ts`/`.mjs` imports. Bare imports (e.g. `contentful`) resolve normally.

## Decision

Keep the Contentful loader in `src/content/loaders/contentful.ts` (as the plan intended) and import it via a Vite resolve alias `@content-loaders` → `src/content/loaders`, configured in `astro.config.mjs` and mirrored as a `paths` mapping in `tsconfig.json` so `astro check` can resolve it too.

## Consequences

All content loader imports in `src/content.config.ts` (and any future content config files) must use the `@content-loaders/*` alias instead of relative paths. This constraint persists until the Astro 7 / Vite 8 relative-import regression is fixed upstream. If the loader is ever moved or split, the alias and tsconfig paths must be updated together.
