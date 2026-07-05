# ADR 01: Native Astro Static Migration

## Status

Accepted

## Context

The site is migrating from Gatsby v2, React, styled-components, Contentful, and Netlify to the stack described in the Astro migration design (`docs/superpowers/specs/2026-07-04-astro-migration-design.md`).

## Decision

Use Astro static output for the migrated site. Port rendered UI directly to native `.astro` components instead of adding a React island bridge for the migration. Do not add `@astrojs/react`, `react`, `react-dom`, or styled-components as Astro migration dependencies.

## Consequences

The migrated path does not ship React for page rendering. Existing Gatsby files remain temporarily until the migration reaches the cleanup milestone.
