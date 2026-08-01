# Content Box Vertical Padding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure `extraVerticalPadding` increases only the vertical padding of content boxes.

**Architecture:** Change the existing scoped `.extra-vertical` modifier in `ContentBox.astro` from a shorthand padding override to explicit top and bottom declarations. The base `.content-box` rule continues to provide horizontal `--inner-padding`, so header and footer retain their current inline spacing without interface or consumer changes.

**Tech Stack:** Astro components, scoped native CSS, pnpm/Prettier.

## Global Constraints

- Change only `src/components/ContentBox.astro`; do not alter header, footer, global layout, or other padding rules.
- Preserve the `extraVerticalPadding` component interface.
- Set only `padding-top` and `padding-bottom` in `.extra-vertical`, both to `var(--outer-padding)`.
- Do not set horizontal padding in `.extra-vertical`; base `.content-box` horizontal padding remains in effect.
- No ADR is required because this is a localized CSS correction.
- Run `git diff --check` and `pnpm lint` when Node tooling is available.
- Commit and push the completed change directly to `master`; do not create a pull request.

---

## File Structure

- Modify: `src/components/ContentBox.astro` — preserve base inline padding while giving the modifier outer vertical padding only.

### Task 1: Correct Content Box Vertical Padding

**Files:**
- Modify: `src/components/ContentBox.astro:2-4,28-30`

**Interfaces:**
- Consumes: Existing `extraVerticalPadding = false` Astro prop.
- Produces: Existing header and footer calls to `<ContentBox extraVerticalPadding>` receive `26px` top/bottom padding while retaining the base `13px` inline padding.

- [ ] **Step 1: Inspect the current modifier**

Read `src/components/ContentBox.astro` and confirm the base and modifier cascade:

```css
.content-box {
  padding: var(--inner-padding);
}

.content-box.extra-vertical {
  padding: var(--outer-padding);
}
```

Expected: the modifier currently replaces all four sides of the base padding.

- [ ] **Step 2: Apply the vertical-only modifier**

Update the component comment and replace the modifier declaration with:

```css
.content-box.extra-vertical {
  padding-top: var(--outer-padding);
  padding-bottom: var(--outer-padding);
}
```

Expected: the base shorthand retains `var(--inner-padding)` at left and right, while the modifier overrides only top and bottom.

- [ ] **Step 3: Verify the CSS cascade and formatting**

Run:

```bash
git diff --check
pnpm lint
```

Expected: `git diff --check` exits 0 and `pnpm lint` exits 0. If `pnpm` is unavailable, record its shell error; do not treat it as a passing lint result.

- [ ] **Step 4: Review the architecture decision**

Confirm no ADR is required: the component prop and all consumers are unchanged, and the correction is a single scoped CSS modifier behavior.

- [ ] **Step 5: Commit and push directly to master**

First update the local `master` branch from its remote before applying or committing this task. Once the worktree is on current `master` and only the intended `ContentBox.astro` and spec/plan documentation changes are staged, run:

```bash
git add src/components/ContentBox.astro docs/superpowers/specs/2026-08-01-content-box-vertical-padding-design.md docs/superpowers/plans/2026-08-01-content-box-vertical-padding.md
git commit -m "Fix content box vertical padding"
git push origin master
```

Expected: the commit is present on `origin/master`; no pull request is created.
