# Astro Migration M4 Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve image delivery after page parity is proven, without changing content or layout.

**Architecture:** Choose one image optimization strategy, document it if significant, and apply it consistently to the Astro components introduced in M2/M3. Treat the M3 plain-image build as the visual baseline and avoid mixing image optimization with layout changes.

**Tech Stack:** Astro components, Contentful CDN image URLs or Astro image service, responsive image markup, `<picture>`/`srcset`/`sizes` where appropriate, build and visual regression checks.

## Global Constraints

- Consumes master spec: `docs/superpowers/specs/2026-07-04-astro-migration-design.md`.
- Consumes planning design: `docs/superpowers/specs/2026-07-04-astro-migration-planning-design.md`.
- Depends on completed M3 parity build.
- M4 goal: improve image delivery after page parity is proven, without changing content or layout.
- Do not combine image optimization with M2 or M3.
- Choose exactly one image strategy and apply it consistently.
- Do not claim Astro is optimizing remote Contentful images unless the implementation proves that behavior.
- Images must retain appropriate `width`, `height`, `alt`, and lazy/eager loading behavior.
- The homepage must not regress visually compared with the M3 plain-image baseline.
- No cookies, service worker, or client-side storage may be introduced.
- Run `pnpm build`, page comparisons, visual checks, and `npm run lint` before considering work done.
- Review for ADR need before completion and state whether ADRs were added or why none were needed.

---

## File Structure

- Modify: image rendering helpers/components created in M3, likely `HeroBlock.astro`, `EmployeeTile.astro`, and `ProductGroup.astro`.
- Modify if using Contentful transforms: `src/content/loaders/contentful.ts` or create `src/lib/contentful-images.ts` for URL generation.
- Modify if using Astro image service: `astro.config.mjs` and selected components.
- Create if needed: `docs/adrs/adr_XX-image-strategy.md`.

---

### Task 1: Choose And Document Image Strategy

**Files:**
- Create if needed: `docs/adrs/adr_XX-image-strategy.md`
- Modify if needed: `astro.config.mjs`

**Interfaces:**
- Consumes: M3 plain-image components and M4 decision point in the master spec.
- Produces: one selected image strategy for implementation tasks.

- [ ] **Step 1: Evaluate the two allowed strategies**

Compare:

```text
1. Contentful CDN transforms with plain <img>/<picture>: generate URLs with w, h, q, fm parameters and add srcset/sizes manually.
2. Astro image service: configure remote Contentful images explicitly, then replace selected <img> tags where build/runtime behavior is understood.
```

Expected: choose one strategy. Prefer Contentful CDN transforms unless Astro image service behavior is verified for remote Contentful assets.

- [ ] **Step 2: Record ADR if the choice is significant and undocumented**

If no existing ADR covers the image strategy, create the next `docs/adrs/adr_XX-image-strategy.md` with context, decision, and consequences.

- [ ] **Step 3: Commit decision docs/config**

Run:

```bash
git status --short
git diff -- docs/adrs astro.config.mjs
git add docs/adrs astro.config.mjs
git commit -m "Choose Astro image optimization strategy"
```

Expected: commit includes only ADR/config changes if any. Skip commit if no files changed.

---

### Task 2: Implement Responsive Image Generation

**Files:**
- Modify or create: `src/lib/contentful-images.ts`
- Modify: `src/components/HeroBlock.astro`
- Modify: `src/components/EmployeeTile.astro`
- Modify: `src/components/ProductGroup.astro`

**Interfaces:**
- Consumes: selected strategy from Task 1 and normalized image data from M1.
- Produces: optimized image markup for homepage images.

- [ ] **Step 1: Add URL generation helper if using Contentful CDN transforms**

Create a helper that accepts the original Contentful image URL and returns transformed URLs with width, quality, and format parameters. Preserve absolute HTTPS URLs.

- [ ] **Step 2: Optimize hero image**

Update `HeroBlock.astro` so the LCP image uses optimized sources, explicit `width`/`height`, descriptive `alt`, `fetchpriority="high"`, and no `loading="lazy"`.

- [ ] **Step 3: Optimize below-the-fold images**

Update employee and product images to use responsive sources, explicit dimensions, descriptive `alt`, and `loading="lazy"`. Do not add `fetchpriority="low"` to standard below-the-fold lazy images.

- [ ] **Step 4: Verify markup**

Inspect built HTML and confirm optimized images include `width`, `height`, `alt`, and correct lazy/eager behavior.

- [ ] **Step 5: Commit optimized image rendering**

Run:

```bash
git status --short
git diff -- src
git add src
git commit -m "Optimize Astro image delivery"
```

Expected: commit contains only image rendering/helper changes.

---

### Task 3: M4 Verification Gate

**Files:**
- None required unless verification notes are documented.

**Interfaces:**
- Consumes: optimized image implementation from Tasks 1-2.
- Produces: verified M4 image optimization milestone.

- [ ] **Step 1: Run build and comparisons**

Run:

```bash
pnpm build
pnpm compare:pages
npm run lint
```

Expected: all commands PASS.

- [ ] **Step 2: Manual visual regression check**

Compare `/`, `/imprint/`, and `/data-policy/` against the M3 baseline and live references. Confirm no content or layout changes were introduced by image optimization.

- [ ] **Step 3: Cookie/storage check**

Confirm no cookies, service worker, or client-side storage were introduced.

- [ ] **Step 4: Completion summary**

Report selected image strategy, verification results, visual regression result, cookie/storage result, ADR status, and commit hashes. State that M5 can start only after this M4 gate is accepted.
