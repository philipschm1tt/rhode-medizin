# Netlify Primary Hosting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch production traffic for `rhode-medizin.de` to Netlify as primary host, keeping Cloudflare Pages as a dormant fallback, with no Astro build/code changes.

**Architecture:** The Astro static build (`astro build` → `dist/`) is host-agnostic. This change adds a `netlify.toml`, updates ADRs and docs to describe Netlify-primary hosting, and provides operator runbook steps for DNS/TLS cutover, Contentful webhook setup, and Cloudflare fallback. No source code, dependencies, or build scripts change.

**Tech Stack:** Astro 7, Netlify (static hosting), Cloudflare Pages (dormant fallback), Contentful (CMS), pnpm.

## Global Constraints

- No changes to `astro.config.mjs`, `package.json`, or any `.astro`/`.ts` source file.
- Build command is identical on both platforms: `pnpm install --frozen-lockfile && pnpm build`; output directory `dist`.
- Production env vars are `CONTENTFUL_SPACE_ID` and `CONTENTFUL_DELIVERY_TOKEN` only — no `CONTENTFUL_PREVIEW_TOKEN` in production.
- `NODE_VERSION` is `22`.
- ADR numbering is append-only (Approach A): new ADR is `adr_07_netlify.md`; existing `adr_05_*` / `adr_06_*` filename collisions are left in place.
- Prettier config: no semicolons, single quotes, ES5 trailing commas, 2-space indent, LF. Markdown is in Prettier's scope (`.md`).
- Secrets are never committed; they are set in the Netlify dashboard.
- Operator-runbook steps (DNS cutover, Netlify dashboard config, Contentful webhook) are documented in committed files and are not executed by this plan's author — they are performed by a human operator.

---

### Task 1: Add `netlify.toml`

**Files:**
- Create: `netlify.toml`

**Interfaces:**
- Consumes: spec §1.
- Produces: a committed `netlify.toml` at repo root that Netlify reads at build time (build command, publish dir, NODE_VERSION). Downstream docs (Tasks 5, 6, 7) reference this file.

- [ ] **Step 1: Create `netlify.toml`**

```toml
[build]
  command = "pnpm install --frozen-lockfile && pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
```

- [ ] **Step 2: Verify Prettier is happy with the new file**

Run: `pnpm lint`
Expected: PASS (no errors). If Prettier complains about the TOML formatting, run `pnpm format` and re-run `pnpm lint`.

- [ ] **Step 3: Confirm the file is not gitignored**

Run: `git check-ignore netlify.toml`
Expected: no output (the file is not ignored) and exit code 1.

- [ ] **Step 4: Commit**

```bash
git add netlify.toml
git commit -m "Add netlify.toml for Netlify primary hosting"
```

---

### Task 2: Create ADR 07 — Netlify primary hosting

**Files:**
- Create: `docs/adrs/adr_07_netlify.md`

**Interfaces:**
- Consumes: spec §5; ADR 06 (`docs/adrs/adr_06_cloudflare_pages.md`); `netlify.toml` from Task 1.
- Produces: `docs/adrs/adr_07_netlify.md` with status `Accepted`, referenced by ADR 06 (Task 3), README.md (Task 6), and AGENTS.md (Task 7). Uses the ADR shape defined in `docs/adrs/README.md`.

- [ ] **Step 1: Write the ADR**

```markdown
# ADR 07: Netlify primary hosting

## Status

Accepted

Supersedes ADR 06 (`adr_06_cloudflare_pages.md`) for production traffic only;
ADR 06 is retained as a historical record.

## Context

ADR 06 chose Cloudflare Pages for static hosting. Provisioning an apex TLS
certificate on Cloudflare requires moving DNS management fully to Cloudflare.
The project prefers to keep DNS at the existing registrar. Netlify provisions
apex TLS via DCV using an ALIAS/ANAME record at the apex and a CNAME for
`www`, so DNS can stay at the registrar.

The Astro static build (`astro build` → `dist/`) is host-agnostic and requires
no code or build changes to move hosts.

## Decision

Make Netlify the primary host for `rhode-medizin.de` and
`www.rhode-medizin.de`; keep the Cloudflare Pages project configured and
building on every git push as a dormant fallback.

- Build config lives in `netlify.toml` at the repo root.
- Build command: `pnpm install --frozen-lockfile && pnpm build`; publish
  directory `dist`; `NODE_VERSION` `22`.
- Production env vars (set in the Netlify dashboard, not committed):
  `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`. No preview token in
  production.
- DNS stays at the registrar: apex `rhode-medizin.de` as ALIAS/ANAME →
  `apex-loadbalancer.netlify.com`; `www.rhode-medizin.de` as CNAME →
  `<site-slug>.netlify.app`.
- Netlify auto-provisions the TLS certificate via DCV.
- Content rebuilds via a Contentful webhook to a Netlify build hook
  (`publish`/`unpublish` events on Entry and Asset).
- Cloudflare Pages keeps building on git push; the `*.pages.dev` URL remains
  available as an emergency fallback. To revert traffic, repoint DNS at the
  Cloudflare Pages target.

## Consequences

- Production traffic is served by Netlify; DNS remains at the registrar.
- Cloudflare Pages is a dormant safety net: it builds but is not actively
  verified against the real domain. If Cloudflare is ever needed, run a fresh
  build and a parity check (`pnpm compare:pages`) before repointing DNS.
- Content edits trigger a Netlify rebuild automatically via the Contentful
  webhook; Cloudflare rebuilds remain on git push / manual deploy only.
- The static build itself is unchanged and remains host-agnostic.
```

- [ ] **Step 2: Run Prettier on the new file**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add docs/adrs/adr_07_netlify.md
git commit -m "Add ADR 07: Netlify primary hosting"
```

---

### Task 3: Mark ADR 06 superseded

**Files:**
- Modify: `docs/adrs/adr_06_cloudflare_pages.md`

**Interfaces:**
- Consumes: ADR 07 from Task 2.
- Produces: ADR 06 with status `Superseded by adr_07_netlify.md` and a one-line pointer in Context. Body otherwise left intact as historical record.

- [ ] **Step 1: Update the Status section**

Replace the `## Status` block (currently):

```markdown
## Status

Accepted
```

with:

```markdown
## Status

Superseded by `adr_07_netlify.md`.
```

- [ ] **Step 2: Add a one-line pointer in Context**

In the `## Context` section, after the existing first paragraph, add this line as a new paragraph immediately after the paragraph ending with "...Contentful-driven updates.":

```markdown
ADR 07 supersedes this decision for production traffic because Cloudflare
requires moving DNS to Cloudflare to provision the apex TLS certificate;
Netlify allows the apex domain to remain at the existing registrar.
```

- [ ] **Step 3: Run Prettier**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/adrs/adr_06_cloudflare_pages.md
git commit -m "Mark ADR 06 superseded by ADR 07"
```

---

### Task 4: Add Netlify operator runbook

**Files:**
- Create: `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`

**Interfaces:**
- Consumes: spec §2 (DNS/TLS), §3 (Cloudflare fallback), §4 (Contentful webhook); `netlify.toml` from Task 1; ADR 07 from Task 2.
- Produces: a committed operator runbook covering Netlify site setup, DNS/TLS cutover, Contentful webhook, and Cloudflare fallback. Referenced by README.md and AGENTS.md (Tasks 5, 6). Matches the convention of the existing M5 Cloudflare runbook at `docs/superpowers/plans/2026-07-08-astro-migration-m5-operator-runbook.md`.

- [ ] **Step 1: Create the runbook file**

```markdown
# Netlify Primary Hosting Operator Runbook

> **For the human operator:** This is a manual runbook for the Netlify
> dashboard, DNS/TLS cutover, Contentful webhook, and emergency Cloudflare
> reversion steps that cannot be performed from the repository shell.
> Execute it task-by-task, recording results as you go, then report back so
> the completion summary can be finalized. Steps use checkbox (`- [ ]`)
> syntax for tracking.

**Goal:** Make Netlify the primary host for `rhode-medizin.de` and
`www.rhode-medizin.de`, with Cloudflare Pages retained as a dormant fallback.

**Prerequisite:** `netlify.toml` and `docs/adrs/adr_07_netlify.md` are
committed. The Astro static build is verified locally (`pnpm build` succeeds,
`dist/` produced).

**Architecture:** The Astro static build (`astro build` → `dist/`) is
host-agnostic. Only hosting and DNS configuration change; no code or build
changes. DNS stays at the existing registrar.

**Tech Stack:** Astro static build, Netlify (primary), Cloudflare Pages
(fallback), Contentful (CMS), DNS at the registrar.

## Global Constraints

- No changes to `astro.config.mjs`, `package.json`, or any `.astro`/`.ts`
  source.
- Build command is identical on both platforms:
  `pnpm install --frozen-lockfile && pnpm build`; publish directory `dist`.
- Production env vars are `CONTENTFUL_SPACE_ID` and
  `CONTENTFUL_DELIVERY_TOKEN` only — no `CONTENTFUL_PREVIEW_TOKEN` in
  production.
- `NODE_VERSION` is `22`.
- DNS stays at the registrar; do not transfer to Netlify DNS or Cloudflare
  DNS.
- Secrets are set in the Netlify dashboard, never committed.

See `docs/adrs/adr_07_netlify.md` for the decision and `netlify.toml` for the
build configuration.

## Prerequisites

- Netlify account with access to the `rhode-medizin` site.
- Registrar access for `rhode-medizin.de` (DNS stays here — do not transfer).
- Cloudflare Pages project still configured (builds on git push).
- Local checkout with `CONTENTFUL_SPACE_ID` and
  `CONTENTFUL_DELIVERY_TOKEN` in `.env` for parity checks.

## 1. Netlify site setup

1. Netlify → Sites → Add site → Import an existing project → connect the
   GitHub repo.
2. Confirm the build picks up `netlify.toml` (deploy log shows build command
   `pnpm install --frozen-lockfile && pnpm build`, publish directory `dist`,
   `NODE_VERSION` `22`).
3. Netlify → Site → Settings → Environment variables: set
   `CONTENTFUL_SPACE_ID` and `CONTENTFUL_DELIVERY_TOKEN`. Do not set
   `CONTENTFUL_PREVIEW_TOKEN` for production.
4. Trigger a build (Netlify → Deploys → Trigger deploy). Confirm it succeeds
   and `dist/` is published.

## 2. DNS and TLS cutover

DNS stays at the current registrar. Do not transfer DNS to Netlify or
Cloudflare.

1. Netlify → Site → Domain settings → Add custom domain
   `rhode-medizin.de` and `www.rhode-medizin.de`.
2. At the registrar:
   - Apex `rhode-medizin.de`: **ALIAS/ANAME** →
     `apex-loadbalancer.netlify.com`.
   - `www.rhode-medizin.de`: **CNAME** → `<site-slug>.netlify.app` (copy the
     exact target from the Netlify dashboard).
3. Wait for Netlify to issue and verify the certificate (dashboard shows
   "Certificate verified"; typically minutes).
4. Verify the site serves over `https://rhode-medizin.de` and
   `https://www.rhode-medizin.de` with a valid cert.
5. Verify `dist/404.html` is served for an unknown path (Netlify serves
   `dist/404.html` automatically — no redirects/headers block in
   `netlify.toml`).

## 3. Contentful → Netlify build webhook

Content edits must trigger a Netlify rebuild automatically (Netlify is
primary; Cloudflare rebuilds stay on git push / manual).

1. Netlify → Site → Build & deploy → Continuous deployment → Build hooks →
   create a hook named `contentful-content-published`. Copy the hook URL.
2. Contentful → Settings → Webhooks → Add webhook:
   - URL: the Netlify build hook URL.
   - Triggers: `publish` and `unpublish` on Entry and Asset.
   - Filters: target this space only.
3. Publish or unpublish a test entry in Contentful.
4. In Netlify → Deploys, confirm a new deploy appears with
   "Triggered by webhook".

## 4. Emergency revert to Cloudflare Pages

Cloudflare Pages keeps building on every git push; the `*.pages.dev` URL
remains functional.

1. Before repointing DNS, run a fresh Cloudflare build and confirm it
   succeeds. Run `pnpm compare:pages` against the Cloudflare URL if parity
   is in doubt.
2. At the registrar, repoint:
   - Apex `rhode-medizin.de`: ALIAS/ANAME → Cloudflare Pages apex target.
   - `www.rhode-medizin.de`: CNAME → Cloudflare Pages `www` target.
3. Cloudflare provisions the apex cert once DNS points at it; no DNS transfer
   is required for the fallback. Netlify's cert remains valid; only DNS
   changes.
4. Verify `https://rhode-medizin.de` serves the Cloudflare build.

This fallback path is documented but not load-tested. It is a dormant safety
net, not an active mirror.
```

- [ ] **Step 2: Run Prettier**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md
git commit -m "Add Netlify primary hosting operator runbook"
```

---

### Task 5: Update README.md Deploy section

**Files:**
- Modify: `README.md` (replace the current `## Deploy` section, lines 53–77).

**Interfaces:**
- Consumes: `netlify.toml` (Task 1); ADR 06 (Task 3) and ADR 07 (Task 2); runbook (Task 4) at `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`.
- Produces: a README Deploy section describing Netlify as primary with Cloudflare Pages fallback.

- [ ] **Step 1: Replace the Deploy section**

Replace the entire `## Deploy` section (from `## Deploy` through the end of the file, currently lines 53–77) with:

````markdown
## Deploy

The site is served by Netlify as a fully static build (no SSR adapter).
Cloudflare Pages remains configured and builds on every git push as a
dormant fallback. See `docs/adrs/adr_07_netlify.md` for the decision and
`docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md` for the operator
runbook.

### Netlify (primary)

Build configuration is committed in `netlify.toml`:

```text
Build command: pnpm install --frozen-lockfile && pnpm build
Publish directory: dist
NODE_VERSION: 22
Environment variables: CONTENTFUL_SPACE_ID, CONTENTFUL_DELIVERY_TOKEN
```

Secrets are set in the Netlify dashboard, not committed. No
`CONTENTFUL_PREVIEW_TOKEN` is set for production builds.

DNS stays at the registrar (do not transfer to Netlify DNS):

- Apex `rhode-medizin.de`: ALIAS/ANAME → `apex-loadbalancer.netlify.com`.
- `www.rhode-medizin.de`: CNAME → `<site-slug>.netlify.app`.

Netlify auto-provisions the TLS certificate via DCV.

### Content rebuilds

Content is fetched from Contentful at build time, so content edits do not
appear until a rebuild. Trigger a Netlify rebuild via git push, a manual
Netlify deploy, or a Contentful webhook pointing at a Netlify build hook
(`publish`/`unpublish` events on Entry and Asset).

### Cloudflare Pages fallback

The Cloudflare Pages project keeps building on every git push with the same
build command and env vars; the `*.pages.dev` URL remains functional as an
emergency fallback. To revert traffic, repoint DNS at the Cloudflare Pages
target. See `docs/adrs/adr_06_cloudflare_pages.md` (superseded for production
traffic) and the operator runbook.

For Cloudflare deploy pipelines that run `npx wrangler versions upload`,
`wrangler.jsonc` defines `assets.directory` as `./dist`.
````

- [ ] **Step 2: Run Prettier**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Update README Deploy section for Netlify primary hosting"
```

---

### Task 6: Update AGENTS.md Deploy section

**Files:**
- Modify: `AGENTS.md` (the `## Deploy` section, lines 50–54).

**Interfaces:**
- Consumes: `netlify.toml` (Task 1); ADR 07 (Task 2); runbook (Task 4) at `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`.
- Produces: an AGENTS.md Deploy section describing Netlify primary + Cloudflare fallback, preserving the existing `wrangler.jsonc` note.

- [ ] **Step 1: Replace the Deploy section**

Replace the entire `## Deploy` section (from `## Deploy` through the end of file, currently lines 50–54) with:

```markdown
## Deploy

Deployed to Netlify as a fully static build (`astro build` → `dist/`), no SSR adapter — fully static, cookie-free, no service worker. Build config is committed in `netlify.toml`: build command `pnpm install --frozen-lockfile && pnpm build`, publish directory `dist`, `NODE_VERSION` `22`. Production env vars (`CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`) are set in the Netlify dashboard, not committed. Content is fetched from Contentful at build time, so content edits require a rebuild via git push, manual Netlify deploy, or a Contentful webhook to a Netlify build hook (`publish`/`unpublish` events). See `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md` for the operator runbook and `docs/adrs/adr_07_netlify.md` for the decision.

Cloudflare Pages remains configured as a dormant fallback and builds on every git push with the same build command and env vars; the `*.pages.dev` URL stays functional for emergency reversion. See `docs/adrs/adr_06_cloudflare_pages.md` (superseded for production traffic), `docs/adrs/adr_07_netlify.md`, and `docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`.

If the Cloudflare deployment pipeline uses `npx wrangler versions upload`, `wrangler.jsonc` must define `assets.directory` as `./dist`.
```

- [ ] **Step 2: Run Prettier**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "Update AGENTS.md Deploy section for Netlify primary hosting"
```

---

### Task 7: Final verification

**Files:**
- (no file changes; verification only)

**Interfaces:**
- Consumes: all prior tasks.
- Produces: confirmation that the committed changes are internally consistent and lint-clean before operator cutover.

- [ ] **Step 1: Confirm `netlify.toml` exists and is correct**

Run: `cat netlify.toml`
Expected output exactly:

```toml
[build]
  command = "pnpm install --frozen-lockfile && pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
```

- [ ] **Step 2: Confirm ADR 06 is superseded and ADR 07 exists**

Run: `grep -n "Superseded by" docs/adrs/adr_06_cloudflare_pages.md`
Expected: a line reading `Superseded by \`adr_07_netlify.md\`.`

Run: `ls docs/adrs/adr_07_netlify.md`
Expected: the file exists.

- [ ] **Step 3: Confirm docs cross-references**

Run: `grep -rn "adr_07_netlify" README.md AGENTS.md docs/adrs/adr_06_cloudflare_pages.md docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`
Expected: matches in all four files.

Run: `grep -n "netlify.toml" README.md AGENTS.md docs/adrs/adr_07_netlify.md docs/superpowers/plans/2026-07-24-netlify-primary-hosting-operator-runbook.md`
Expected: matches in all four files.

- [ ] **Step 4: Run Prettier across the repo**

Run: `pnpm lint`
Expected: PASS, no errors.

- [ ] **Step 5: Confirm no source/build files were changed**

Run: `git diff --name-only main -- astro.config.mjs package.json pnpm-lock.yaml 'src/**' 'scripts/**' 'public/**'`
Expected: no output (none of these files were modified by this plan).

(If working on a feature branch, replace `main` with the appropriate base branch name.)

- [ ] **Step 6: Confirm the build still works**

Run: `pnpm build`
Expected: build succeeds, `dist/` is produced, `astro check` passes. (Requires `CONTENTFUL_SPACE_ID` and `CONTENTFUL_DELIVERY_TOKEN` in `.env`.)
```
