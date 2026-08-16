# Content Authoring Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make local content editing safe and task-oriented by enforcing required image contracts and documenting complete Git-based workflows.

**Architecture:** Plan 1's schemas, manifest, and verifiers remain authoritative. Image-bearing components render required images unconditionally. Active documentation explains practical MDX, YAML, image, preview, and review workflows without treating Contentful migration concepts as the current model.

**Tech Stack:** Astro 7, MDX, YAML, `astro:assets`, Node 22, pnpm, Prettier, Git.

## Global Constraints

- Begin only after Plan 1 passes `pnpm verify`.
- Preserve Plan 1's manifest schema and stable IDs.
- Required alt props may contain `''` only for manifest-declared decorative assets.
- Preserve eager/high-priority hero and lazy employee/product loading.
- Do not modify cutover fixtures, CI, hosting, runbooks, or ADRs.
- Do not rewrite current page content.
- Use `commit-workflow`; run `pnpm lint` before commits and `pnpm verify` before completion.

---

## File Structure

- Modify `src/components/blocks/EmployeeTile.astro`, `src/components/blocks/ProductGroup.astro`, and `src/components/HeroBlock.astro`: strict props.
- Create `docs/content-authoring.md`: task recipes.
- Replace `src/components/blocks/README.md`: local block contracts.
- Modify `README.md`, `AGENTS.md`: authoring entry points.

### Task 1: Enforce Required Image Contracts

**Files:** `src/components/blocks/EmployeeTile.astro`, `ProductGroup.astro`, `src/components/HeroBlock.astro`

- [ ] **Step 1: Record baseline**

Run `pnpm verify`. Expected: Plan 1 passes.

- [ ] **Step 2: Create a temporary failing contract probe**

Create an uncommitted Astro page invoking `<EmployeeTile name="Probe" />`, `<ProductGroup name="Probe" />`, and `<HeroBlock mainHeadline="Probe" />`. Run `pnpm build`; current permissive contracts should allow it.

- [ ] **Step 3: Make contracts strict**

Use these interfaces, remove defaults and conditional image branches, and render images directly:

```ts
// EmployeeTile
interface Props { name: string; department?: string; photo: ImageMetadata; alt: string }
// ProductGroup
interface Props { name: string; description?: string; examples: string[]; photo: ImageMetadata; alt: string }
// HeroBlock
interface Props { mainHeadline: string; subHeadline?: string; callToAction?: string; image: ImageMetadata; alt: string }
```

Render the product examples list unconditionally because Plan 1 requires at least one example.

- [ ] **Step 4: Prove red then green**

Run `pnpm build` with the probe. Expected: missing-prop diagnostics or image-source failure. Delete the probe; run `pnpm build && pnpm verify:dist`. Expected: pass.

- [ ] **Step 5: Commit**

Run `pnpm lint`; confirm no `photo?`, `image?`, `alt?`, `examples = []`, `photo &&`, or `image &&` remains in these components. Use `commit-workflow`; commit with `Enforce required block image contracts`.

### Task 2: Add The Authoring Guide

**Files:**
- Create: `docs/content-authoring.md`

- [ ] **Step 1: Write task-oriented sections**

The guide must contain these exact headings and complete path/command examples:

```markdown
# Content Authoring
## Prerequisites
## Where Content Lives
## Edit Homepage Or Legal Prose
## MDX Syntax Hazards
## Add An Employee
## Remove An Employee
## Reorder Employees
## Add A Product Group
## Remove A Product Group
## Reorder Product Groups
## Add Or Replace An Image
## Review Before Opening A Pull Request
## Historical Comparison Commands
```

Specify Node 22, `pnpm install --frozen-lockfile`, `pnpm develop`, and `pnpm verify`. Show `09\.` escaping, explicit `<br />`, and a Node command counting `\u00a0`. Employee/product recipes must show contiguous order, `assetId`, relative image path, and policy-compatible alt. Image recipes must show a Node+Sharp command computing SHA-256/MIME/bytes/dimensions, the exact Plan 1 manifest record shape, rights provenance, content wiring, `pnpm verify:assets`, and replacement rules. State that legal accuracy, wording, image choice, crop, alt semantics, and responsive layout need human review.

Use these exact examples in the guide:

```yaml
# employee
order: 6
name: Jane Doe
department: Kundenservice
assetId: employee-placeholder
photo: ../../assets/content/mitarbeiter-icon.webp
alt: ''
```

```yaml
# product group
order: 6
name: Diagnostik
description: Geräte und Instrumente für die medizinische Diagnostik.
examples:
  - Stethoskope
  - Otoskope
assetId: diagnostik
photo: ../../assets/content/diagnostik.jpg
alt: Diagnostische Instrumente auf einer Arbeitsfläche
```

Use this inspection command:

```bash
node --input-type=module -e 'import fs from "node:fs"; import crypto from "node:crypto"; import sharp from "sharp"; const p="src/assets/content/diagnostik.jpg"; const b=fs.readFileSync(p); const m=await sharp(b).metadata(); console.log({sha256:crypto.createHash("sha256").update(b).digest("hex"),mimeType:m.format==="jpeg"?"image/jpeg":`image/${m.format}`,byteSize:b.length,width:m.width,height:m.height})'
```

Show the exact Plan 1 manifest entry fields: `id`, `path`, `sha256`, `mimeType`, `byteSize`, `width`, `height`, nested `alt.policy/default`, and nested `rights.status/provenance`.

- [ ] **Step 2: Document historical commands precisely**

State that `compare:pages` and `compare:legal` compare against 2026 cutover output, may fail after intentional edits, are not in `verify`, and never justify changing cutover fixtures for routine edits.

- [ ] **Step 3: Verify and commit**

Run `pnpm exec prettier --check docs/content-authoring.md && pnpm verify`. Use `commit-workflow`; commit with `Add local content authoring guide`.

### Task 3: Replace Block Documentation

**Files:**
- Replace: `src/components/blocks/README.md`

- [ ] **Step 1: Document practical local contracts**

For Hero, Section, Aside, Quote, Tiles, EmployeeTile, and ProductGroup, include one MDX example and the exact prop interfaces from their source. Use `<Section>## Heading\n\nParagraph.</Section>`, `<Aside>### Heading\n\nParagraph.</Aside>`, `<Quote text="..." />`, and `<Tiles layout="grid" items={employees} itemComponent={EmployeeTile} />` as examples. Explain slots, strict image props, alt policy, and loading. Link `docs/content-authoring.md`. Remove Contentful type mappings, deleted-component history, and migration vocabulary.

- [ ] **Step 2: Verify and commit**

Run `rg -n "Contentful|ModuleRenderer|old normalized|deleted" src/components/blocks/README.md`; expect no output. Run `pnpm lint && pnpm build`. Use `commit-workflow`; commit with `Document local editor-facing block contracts`.

### Task 4: Update README And AGENTS

**Files:**
- Modify: `README.md`, `AGENTS.md`

- [ ] **Step 1: Add active authoring entry points**

Link `docs/content-authoring.md`. Explain page prose locations, collection directories, operational manifest, contiguous order, identity/path/alt consistency, rights provenance, preview review, and `pnpm verify`.

- [ ] **Step 2: Replace migration-era command descriptions**

Describe `verify:content` as local invariants, `verify:assets` as operational identity/usage/policy, `verify:dist` as deployable output, and `compare:*` as optional historical diagnostics. State the aggregate is snapshot-free. Do not alter deployment sections reserved for Plan 3.

- [ ] **Step 3: Verify and commit**

Run `pnpm lint && pnpm verify`. Use `commit-workflow`; commit with `Document active local authoring workflow`.

### Task 5: Final Review

- [ ] Confirm all required props and loading attributes with `rg`.
- [ ] Confirm every required authoring-guide heading exists.
- [ ] Confirm no Plan 3 file (`.github`, `netlify.toml`, hosting runbooks, ADRs) changed in this plan.
- [ ] Run `pnpm lint && pnpm verify && git diff --check` under Node 22.
- [ ] Review ADR need; record that Plan 3 owns the approved ADR changes.
