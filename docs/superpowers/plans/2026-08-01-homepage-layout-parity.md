# Homepage Layout Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the homepage CTA, tile alignment, and desktop product-image coverage to the archived Gatsby layout.

**Architecture:** Make four localized CSS corrections in the existing Astro presentation components. No page-specific rules, component interfaces, content models, or global grid definitions change; the homepage gets the corrected component rendering from the Contentful modules it already uses.

**Tech Stack:** Astro components, scoped native CSS, CSS Grid, pnpm/Prettier.

## Global Constraints

- Scope is the homepage issues reported in `docs/superpowers/specs/2026-08-01-homepage-layout-parity-design.md`; do not audit or alter other pages.
- Ignore archive UI, consent UI, fonts, and images when comparing to Gatsby.
- Preserve the existing component interfaces and use scoped CSS only.
- Match the archived Gatsby CTA desktop values exactly: 18px text and 13px horizontal padding.
- Run `pnpm lint` before completion; the command may be unavailable in the current environment.
- Do not introduce an ADR: these are localized CSS parity corrections.

---

## File Structure

- Modify: `src/components/CallToActionButton.astro` — restores archived Gatsby desktop CTA metrics.
- Modify: `src/components/TileGrid.astro` — removes intrinsic list indentation from the employee tile container.
- Modify: `src/components/TileList.astro` — removes intrinsic list indentation from the product group container.
- Modify: `src/components/ProductGroup.astro` — makes desktop product images fill their grid cell.

### Task 1: Restore CTA Metrics And Tile Alignment

**Files:**
- Modify: `src/components/CallToActionButton.astro:36-42`
- Modify: `src/components/TileGrid.astro:12-16`
- Modify: `src/components/TileList.astro:10-15`

**Interfaces:**
- Consumes: Existing `CallToActionButton` props `{ text: string, href: string }` and default-slotted list items.
- Produces: The existing CTA anchor remains left-aligned; first employee and product-group tiles begin at their heading's left grid edge.

- [ ] **Step 1: Establish the current failure visually**

Run the local site at desktop width if `pnpm` and Contentful credentials are available:

```bash
pnpm develop
```

Expected: the homepage CTA has enlarged desktop text and padding; employee and product-group lists are indented relative to their headings.

- [ ] **Step 2: Apply the minimal scoped CSS corrections**

Replace the desktop CTA declaration in `src/components/CallToActionButton.astro` with:

```css
@media (min-width: 800px) {
  .cta-button {
    font-size: var(--font-size-l-small);
    line-height: var(--line-height-l-small);
    padding: 10px var(--inner-padding);
  }
}
```

Add the following declarations to the `.tile-grid` rule in `src/components/TileGrid.astro`:

```css
margin: 0;
padding: 0;
```

Add a `.tile-list` rule before the child selector in `src/components/TileList.astro`:

```css
.tile-list {
  margin: 0;
  padding: 0;
}
```

- [ ] **Step 3: Verify the corrected homepage layout**

At desktop width, confirm the CTA text begins at its left edge and is 18px, the CTA uses 13px horizontal padding, and the first employee tile and product-group tile are flush with their respective headings. At mobile width, confirm the lists have no default indentation and tiles still wrap or stack normally.

- [ ] **Step 4: Format and lint the focused changes**

Run:

```bash
pnpm lint
```

Expected: exit code 0. If `pnpm` is unavailable, record the shell error and continue to the available static checks in Task 2.

- [ ] **Step 5: Commit the focused correction**

```bash
git add src/components/CallToActionButton.astro src/components/TileGrid.astro src/components/TileList.astro
git commit -m "Align homepage CTA and tiles"
```

Expected: one commit contains only the CTA and list-alignment CSS edits.

### Task 2: Fill Desktop Product Image Grid Cell

**Files:**
- Modify: `src/components/ProductGroup.astro:93-95`

**Interfaces:**
- Consumes: Existing optional `photo` prop and rendered `<Image class="product-image">`.
- Produces: At `min-width: 900px`, every product image fills the width and height of the grid cell it spans, using the existing `object-fit: cover` crop behavior.

- [ ] **Step 1: Establish the current failure visually**

At a viewport of at least 900px, inspect the homepage's Motorensysteme product group.

Expected: its image does not span the full horizontal width of the left product-image grid column.

- [ ] **Step 2: Add full grid-cell width at desktop**

Update the desktop `.product-image` rule in `src/components/ProductGroup.astro` to:

```css
.product-image {
  grid-row: span 2;
  width: 100%;
}
```

The existing base `height: 260px`, `object-fit: cover`, and `object-position` declarations remain unchanged.

- [ ] **Step 3: Verify product-group image coverage**

At a viewport of at least 900px, confirm Motorensysteme fills the complete left grid column and has the same horizontal coverage as the other product groups. Confirm at widths below 900px that the image remains full-width and 260px high.

- [ ] **Step 4: Run static checks**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both commands exit 0. If `pnpm` is unavailable, run:

```bash
git diff --check
```

Expected fallback: exit code 0, with the unavailable `pnpm` error recorded in the final report.

- [ ] **Step 5: Review architecture decision and commit**

Confirm no ADR is needed because the change does not alter component interfaces, content modeling, or the page/grid architecture. Then run:

```bash
git add src/components/ProductGroup.astro
git commit -m "Fill product group images"
```

Expected: one commit contains only the product-image CSS correction.

### Task 3: Create And Verify The Pull Request

**Files:**
- No source files modified.

**Interfaces:**
- Consumes: The two implementation commits from Tasks 1 and 2.
- Produces: A pull request targeting the repository's default branch with verification and ADR status documented.

- [ ] **Step 1: Inspect the final branch state**

Run:

```bash
git status --short
```

Expected: only the specification, plan, and the intended component CSS changes are present on the branch.

- [ ] **Step 2: Push the branch and open the pull request**

Run:

```bash
git push -u origin HEAD
gh pr create --base master --title "Fix homepage layout parity" --body "## Summary
- restore Gatsby CTA desktop metrics and alignment
- remove homepage tile-list indentation
- make desktop product images fill their grid cell

## Verification
- `pnpm lint` (or record unavailable command)
- `pnpm build` (or record unavailable command)
- desktop and mobile homepage visual inspection

## ADR
No ADR required; these are localized CSS parity corrections."
```

Expected: `gh` returns the pull request URL.

- [ ] **Step 3: Confirm pull request metadata**

Run:

```bash
gh pr view --json url,baseRefName,headRefName,title
```

Expected: the title is `Fix homepage layout parity` and `baseRefName` is `master`.
