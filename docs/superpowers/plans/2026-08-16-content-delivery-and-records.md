# Content Delivery And Records Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `pnpm verify` the required GitHub, Netlify, and Cloudflare delivery gate and align active architecture records without rewriting cutover provenance.

**Architecture:** Restore GitHub Actions for pull requests and `master`; both hosts install reproducibly and run Plan 1's aggregate. Correct ADR 08, add ADR 09 for invariant verification and the operational manifest, and label the cutover runbook honestly as historical.

**Tech Stack:** GitHub Actions, Node 22, pnpm, Astro static builds, Netlify, Cloudflare Pages, Markdown ADRs.

## Global Constraints

- Begin only after Plans 1 and 2 pass `pnpm verify`.
- Preserve the exact Plan 1 aggregate, including its required `pnpm test` stage.
- Do not modify `tests/fixtures/cutover/` or its unresolved reconciliation.
- GitHub runs on pull requests to and pushes to `master`.
- Netlify and Cloudflare use `pnpm install --frozen-lockfile && pnpm verify`, publish `dist`, and use Node 22.
- Completion requires a successful workflow run for the final commit; never remove the workflow to work around token scope.
- Use `commit-workflow` and run `pnpm lint` before commits.

---

## File Structure

- Create `.github/workflows/verify.yml`.
- Modify `netlify.toml`, README, AGENTS, hosting runbook, ADR 07.
- Correct ADR 08; create `adr_09_steady_state_content_verification.md`.
- Add historical status to the cutover runbook; leave provenance unchanged.

### Task 1: Confirm Dependencies And Preserve Provenance

- [ ] Run `git status --short`, `git diff`, and `git log --oneline -10`.
- [ ] Print `package.json.scripts.verify`; require exactly `pnpm lint && pnpm verify:content && pnpm verify:assets && pnpm build && pnpm test && pnpm verify:dist`.
- [ ] Run `pnpm verify`; expected: pass under Node 22.
- [ ] Record `git hash-object tests/fixtures/cutover/provenance.json` for later comparison; do not hard-code a repository hash in source.

### Task 2: Restore GitHub Verification And Align Netlify

**Files:**
- Create: `.github/workflows/verify.yml`
- Modify: `netlify.toml`

- [ ] **Step 1: Create workflow**

```yaml
name: verify
on:
  pull_request:
    branches: [master]
  push:
    branches: [master]
permissions:
  contents: read
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm verify
```

Use pnpm 9 because the committed lockfile is lockfile version 9 and the previous repository workflow used pnpm 9.

- [ ] **Step 2: Change Netlify command**

Set `command = "pnpm install --frozen-lockfile && pnpm verify"`; retain `publish = "dist"` and `NODE_VERSION = "22"`.

- [ ] **Step 3: Verify and commit**

Run `pnpm install --frozen-lockfile && pnpm verify`, validate workflow YAML fields, and run `git diff --check`. Use `commit-workflow`; commit with `Restore steady-state delivery verification`.

### Task 3: Align Active Hosting Documentation

**Files:**
- Modify: `README.md`, `AGENTS.md`, `docs/adrs/adr_07_netlify.md`, `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`
- Verify unchanged: `wrangler.jsonc`

- [ ] Replace every active host build command with `pnpm install --frozen-lockfile && pnpm verify`; explain that it produces `dist` and no second build runs.
- [ ] Document GitHub triggers, Node 22, no environment variables, Netlify primary, and Cloudflare fallback.
- [ ] State Cloudflare's command is a Pages dashboard setting; retain only `assets.directory: ./dist` in Wrangler.
- [ ] Update ADR 07's accepted decision and consequences to match these gates.
- [ ] Run `rg` to ensure no active hosting doc still prescribes `&& pnpm build`; run `pnpm lint`.
- [ ] Use `commit-workflow`; commit with `Align active hosting verification`.

### Task 4: Correct Architecture And Historical Records

**Files:**
- Modify: `docs/adrs/adr_08_local_content.md`
- Create: `docs/adrs/adr_09_steady_state_content_verification.md`
- Modify: `docs/superpowers/plans/2026-08-13-local-content-cutover-operator-runbook.md`

- [ ] **Step 1: Correct ADR 08**

Replace the stale prose decision with inline Markdown in file-routed MDX, explicit HTML only where needed, local YAML collections, local images, and no `set:html`/`?raw`. State that cutover fixtures are immutable history, current verification is invariant-based, historical comparators are optional, and the unresolved reconciliation remains unclaimed.

- [ ] **Step 2: Add ADR 09**

Record context (snapshots obstruct intentional edits), decision (operational `src/content/assets.yaml`, stable IDs plus Astro paths, deterministic invariant aggregate, historical comparators outside gates, same local/CI/host command), and consequences (objective regressions automated; wording/legal/visual judgment remains human).

- [ ] **Step 3: Label cutover runbook**

Add a `Historical status` section near the top stating that original commands/checklists are preserved, unrecorded steps must not be marked complete retroactively, and provenance still says reconciliation was not verified. Point to authoring docs and ADR 09. Do not rewrite the original checklist.

- [ ] **Step 4: Verify and commit**

Compare the current provenance object hash with Task 1 and run `git diff --exit-code -- tests/fixtures/cutover`. Run `pnpm lint`. Use `commit-workflow`; commit with `Record steady-state content verification`.

### Task 5: Configure Cloudflare Pages Settings

- [ ] In the Pages dashboard set production branch `master`, build command `pnpm install --frozen-lockfile && pnpm verify`, output `dist`, and `NODE_VERSION=22`; remove Contentful variables.
- [ ] Save the settings without triggering a deployment yet; branch push and same-commit preview verification happen in Task 6.

### Task 6: Obtain Successful GitHub And Host Runs

- [ ] Run `gh auth status`; if workflow scope is missing, reauthenticate rather than deleting the workflow.
- [ ] Push a non-`master` branch and open/locate a PR targeting `master`.
- [ ] Locate the `verify.yml` run for `git rev-parse HEAD`; run `gh run watch <id> --exit-status`.
- [ ] Require conclusion `success` and matching `headSha`.
- [ ] Inspect the same-commit Netlify preview; require its log to run the exact verify command and publish `dist`.
- [ ] Inspect the Cloudflare preview triggered by the same pushed commit; require its log to run the exact verify command and publish `dist`.
- [ ] Smoke-test `/`, `/imprint/`, `/data-policy/`, and an unknown route on both host previews.
- [ ] Record GitHub, Netlify, and Cloudflare URLs in the PR body.

### Task 7: Final Verification

- [ ] Run `pnpm install --frozen-lockfile && pnpm verify` under Node 22.
- [ ] Confirm historical comparators exist but are absent from `verify`.
- [ ] Confirm active delivery docs use the exact host command.
- [ ] Recompare provenance hash and require no cutover fixture diff.
- [ ] Run `pnpm lint && git diff --check && git status --short`.
- [ ] Report: local aggregate, final-commit GitHub run, both host previews, unchanged cutover fixtures, unresolved historical reconciliation, corrected ADR 08, and added ADR 09.
