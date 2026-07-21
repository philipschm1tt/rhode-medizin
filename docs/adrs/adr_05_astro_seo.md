# ADR 5: Use astro-seo for SEO tag management

## Context

The M3 Astro port emitted only `<title>` in the `<head>`. The production-readiness milestone (M3.5) requires meta description, Open Graph, Twitter card, canonical, and favicon tags on the homepage. These could be hand-rolled as static meta tags in `Layout.astro`, or delegated to a component that structures the prop surface and emits tags according to the Open Graph and Twitter Card specifications.

## Decision

Add `astro-seo` as a dependency and use its `<SEO>` component inside `Layout.astro`'s `<head>`. Pass SEO props only from the homepage; legal pages and the 404 render a plain `<title>`.

## Consequences

- `Layout.astro` accepts an optional `seo` prop whose shape mirrors `astro-seo`'s `<SEO>` component props.
- SEO tags are structured and validated against the OG/Twitter specs by the component, rather than hand-maintained strings.
- Trade-off: a runtime dependency for what could be static tags. Accepted because the OG/Twitter tag surface is large enough that hand-rolling invites drift, and `astro-seo` is a single `.astro` component with no client-side JavaScript.
- The homepage SEO description is hardcoded in code (not sourced from Contentful) because the `Seite` Contentful type has no description field. A future Contentful schema change would require code changes here.
