# Astro Migration Planning Design

The Astro migration keeps `docs/superpowers/specs/2026-07-04-astro-migration-design.md` as the master migration spec. Implementation work is split into one plan per milestone so each milestone can be executed with fresh context, a clear verification gate, ADR review, and a clean commit boundary.

## Source Of Truth

The master Astro migration design remains the migration contract. Milestone plans must consume it and should not redefine final architecture, stack choices, or deliberate behavior changes unless the master spec is explicitly updated first.

Each milestone plan should reference the master spec and expand only one milestone into executable work.

## Plan Structure

Create milestone implementation plans under `docs/superpowers/plans/` using names like:

```text
2026-07-04-astro-migration-m1-foundation.md
2026-07-04-astro-migration-m2-legal-pages.md
2026-07-04-astro-migration-m3-homepage.md
2026-07-04-astro-migration-m4-images.md
2026-07-04-astro-migration-m5-cloudflare.md
```

Each plan should include:

- Goal and scope for that milestone only.
- A `Consumes` reference to the master Astro migration design.
- Expected files to create, modify, or delete.
- Step-by-step tasks with checkbox syntax for execution tracking.
- The milestone verification gate from the master spec, adapted only where the implementation plan needs more concrete commands.
- ADR review before completion.
- Commit guidance for the milestone.

## Execution Boundaries

Do not combine milestone execution unless the user explicitly asks for that. Each milestone should end in a clean state before the next milestone plan is executed.

A clean milestone state means:

- Required verification commands and manual checks have been completed or explicitly documented as blocked.
- The ADR review has been performed and any needed ADRs have been added under `docs/adrs/`.
- Relevant changes have been committed, following the repository commit guidance.
- The completion summary states verification results and whether ADRs were added or why none were needed.

## ADR Timing

Architecture decisions should be documented when a milestone implementation confirms or makes the decision, not speculatively before the work starts.

Likely ADR moments are:

- Milestone 1: Astro static output, native Astro without a React bridge, and Contentful build-time loading if these are confirmed by implementation.
- Milestone 2: font hosting or substitution if the license check requires a concrete decision.
- Milestone 4: the selected image optimization strategy.
- Milestone 5: Cloudflare Pages static hosting and DNS cutover if not already covered by an existing ADR.

Routine component ports, small refactors, fixture scripts, and verification mechanics do not need ADRs unless they introduce a significant architecture decision.

## Out Of Scope

This planning design does not change the Astro migration requirements. It only defines how to split implementation planning and execution.

It also does not create the milestone implementation plans. Those are written separately, starting with Milestone 1 after this planning design is approved.
