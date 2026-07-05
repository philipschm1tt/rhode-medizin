# ADR 02: Contentful Build-Time Loader

## Status

Accepted

## Context

The current site renders Contentful pages from Gatsby GraphQL. The Astro migration needs the same Contentful content available at static build time.

## Decision

Use Astro Content Collections populated by a custom Contentful loader (`src/content/loaders/contentful.ts`) that fetches entries at build time via the `contentful.js` SDK and denormalizes referenced modules into `__typename`-tagged objects. Only `Seite` entries are stored as collection entries; referenced modules are embedded under each page's module tree. The loader uses `CONTENTFUL_DELIVERY_TOKEN` for normal builds and `CONTENTFUL_PREVIEW_TOKEN` only when preview mode is intentionally enabled.

## Consequences

Content edits require a rebuild before they appear on the static site. The normalized module tree preserves the current dispatcher shape while removing the Gatsby GraphQL dependency from the Astro path.
