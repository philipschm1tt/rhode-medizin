# Netlify Primary Hosting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch production traffic for `rhode-medizin.de` from Cloudflare Pages to Netlify by adding a committed `netlify.toml`, updating docs/ADRs, and providing an operator runbook for the dashboard/DNS/webhook steps that cannot be performed from the repo shell.

**Architecture:** The Astro static build (`astro build` → `dist/`) is host-agnostic and requires no code changes. Repo-side work (Tasks 1–3) adds `netlify.toml`, ADR 07 supersedes ADR 06, and README/AGENTS.md are updated. Operator-side work (Task 4) covers Netlify site setup, env vars, custom domains, DNS records at the registrar, TLS verification, and the Contentful → Netlify build webhook — none of which can be committed. Cloudflare Pages stays configured as a dormant fallback.

**Tech Stack:** Astro static build, Netlify (build via `netlify.toml`, hosting, build hooks), Contentful (webhook), DNS registrar (ALIAS/ANAME + CNAME), Cloudflare Pages (fallback).

## Global Constraints

- Consumes master spec: `docs/superpowers/specs/2026-07-23-netlify-primary-hosting-design.md`.
- No SSR adapter; the site is fully static (`astro build` → `dist/`).
- Netlify build command: `pnpm install --frozen-lockfile && pnpm build`.
- Netlify publish directory: `dist`.
- Production env vars: `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN` (set in the Netlify dashboard, not committed).
- No `CONTENTFUL_PREVIEW_TOKEN` for production builds.
- Set `NODE_VERSION` to current LTS (22) supported by Astro and Netlify.
- No `requirements.txt`; the legacy file was for `subfont` only and is not reintroduced.
- No custom `[[redirects]]` or `[[headers]]` in `netlify.toml`; platform defaults are sufficient.
- ADR numbering is append-only (Approach A): existing `adr_05_*` and `adr_06_*` filename collisions are left in place; the new ADR is `adr_07_netlify.md`.
- Run `pnpm lint` before considering repo-side work done (AGENTS.md).
- Cloudflare Pages project is NOT deleted; it keeps building on git push as a dormant fallback.
- DNS stays at the current registrar (the motivation for this whole change); no transfer to Netlify DNS or Cloudflare DNS.

---

## File Structure

- Create: `netlify.toml` (repo root) — Netlify build config; single source of truth for build command, publish dir, NODE_VERSION.
- Create: `docs/adrs/adr_07_netlify.md` — Supersedes ADR 06 for production traffic; records motivation (DNS), decision (Netlify primary + Cloudflare fallback), build config, DNS records, and Contentful webhook.
- Modify: `docs/adrs/adr_06_cloudflare_pages.md` — Status changed to `Superseded by adr_07_netlify.md`; one-line note in Context pointing to ADR 07. Body left intact as historical record.
- Modify: `README.md` — Deploy section rewritten: Netlify primary with `netlify.toml` reference, env vars, DNS records, Contentful webhook; short "Cloudflare Pages fallback" subsection.
- Modify: `AGENTS.md` — Deploy section updated: Netlify primary + Cloudflare fallback; build command and env-var names same on both platforms; reference `netlify.toml`.
- Operator-only (no file changes, recorded in completion summary): Netlify dashboard (site, env vars, custom domains, build hook), registrar DNS records, Contentful webhook.

---

### Task 1: Add `netlify.toml`

**Files:**
- Create: `netlify.toml`

**Interfaces:**
- Consumes: build command `pnpm install --frozen-lockfile && pnpm build` and publish dir `dist` from the spec and from `docs/adrs/adr_06_cloudflare_pages.md`.
- Produces: a committed `netlify.toml` at repo root that Netlify auto-detects on the next build. Tasks 2 and 3 reference the same build command and env-var names.

- [ ] **Step 1: Create `netlify.toml` at repo root**

```
[build]
  command = "pnpm install --frozen-lockfile && pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
```

Notes for the implementer:
- No `[[redirects]]` or `[[headers]]` block. Astro emits `dist/404.html`, which Netlify serves automatically. Platform defaults are acceptable per the spec.
- Do NOT add `CONTENTFUL_SPACE_ID` or `CONTENTFUL_DELIVERY_TOKEN` here — they are secrets and stay in the Netlify dashboard, matching the Cloudflare convention documented in `docs/adrs/adr_06_cloudflare_pages.md`.
- Do NOT reintroduce `requirements.txt`. The legacy file was for `subfont` (fonttools/brotli/zopfli), which is gone; Astro handles fonts per ADR 04 (`docs/adrs/adr_04_fonts.md`). No Python runtime is needed.
- `NODE_VERSION = "22"` matches current LTS supported by Astro and Netlify.

- [ ] **Step 2: Verify `netlify.toml` parses and the build still succeeds locally**

Run: `pnpm lint`
Expected: PASS (Prettier checks `**/*.{js,ts,astro,json,md,yml,css}`; TOML is not in the lint glob, so this only confirms no other files were touched.)

Run: `pnpm build`
Expected: `astro check` passes and `astro build` writes `dist/`. `netlify.toml` does not affect the local Astro build.

- [ ] **Step 3: Commit**

```bash
git add netlify.toml
git commit -m "Add netlify.toml for Netlify build config" -m "Mirrors the Cloudflare build command and publish dir so the same static Astro build can be served from either host. Secrets stay in the dashboard."
```

---

### Task 2: Add ADR 07 and mark ADR 06 superseded

**Files:**
- Create: `docs/adrs/adr_07_netlify.md`
- Modify: `docs/adrs/adr_06_cloudflare_pages.md`

**Interfaces:**
- Consumes: motivation (DNS), decision (Netlify primary + Cloudflare fallback), build config, DNS records, and Contentful webhook from the spec.
- Produces: `docs/adrs/adr_07_netlify.md` as the authoritative decision record for production hosting. Task 3's README/AGENTS.md updates reference both ADR 07 and ADR 06 by filename.

- [ ] **Step 1: Create `docs/adrs/adr_07_netlify.md`**

```
# ADR 07: Netlify primary hosting (Cloudflare Pages fallback)

## Status

Accepted

## Context

ADR 06 chose Cloudflare Pages as the production host. Cloudflare requires
moving DNS management fully to Cloudflare in order to provision an apex TLS
certificate. The project prefers to keep DNS at the current registrar.

Netlify permits the apex domain to remain at the existing registrar and
provisions its certificate via DCV using an ALIAS/ANAME record at the apex
and a CNAME for `www`. Keeping DNS at the registrar is preferable, so
Netlify becomes the primary host.

The Astro static build (`astro build` → `dist/`) is host-agnostic and
requires no code or build changes; only hosting and DNS configuration
change. The legacy `requirements.txt` was for `subfont` only and is not
reintroduced (ADR 04 handles fonts).

## Decision

Host the production Astro static build on Netlify. Keep the existing
Cloudflare Pages project configured and building on every git push as a
dormant fallback.

- No `@astrojs/netlify` SSR adapter; the site is fully static.
- Build config committed to the repo as `netlify.toml`:
  `pnpm install --frozen-lockfile && pnpm build`, publish `dist`,
  `NODE_VERSION = "22"`.
- Production env vars `CONTENTFUL_SPACE_ID` and
  `CONTENTFUL_DELIVERY_TOKEN` are set in the Netlify dashboard, not
  committed. No preview token in production.
- DNS at the registrar: apex `rhode-medizin.de` ALIAS/ANAME →
  `apex-loadbalancer.netlify.com`; `www.rhode-medizin.de` CNAME →
  `<site-slug>.netlify.app`. Netlify provisions the TLS certificate via
  DCV.
- Content rebuilds via git push, manual Netlify deploy, or a Contentful
  webhook to a Netlify build hook (`publish`/`unpublish` on Entry and
  Asset).
- Cloudflare Pages fallback: the `*.pages.dev` URL stays functional; to
  switch traffic to Cloudflare, repoint DNS and let Cloudflare provision
  the apex cert.

## Consequences

- DNS stays at the registrar; Netlify manages TLS via DCV. This is the
  primary motivation for the switch.
- The deploy is fully static and host-agnostic; the same `dist/` runs on
  Netlify or Cloudflare Pages with no code change.
- `dist/404.html` is served automatically by Netlify.
- Content edits in Contentful do not appear until a rebuild; the
  Contentful → Netlify build webhook triggers that rebuild automatically.
- Cloudflare Pages remains configured as a fallback but is not actively
  verified against the real domain; if it is ever needed, run a fresh
  build and parity check before repointing DNS.
- ADR 06 is superseded for the production-traffic decision only; it is
  retained as a historical record of the Cloudflare setup and fallback
  config.
```

- [ ] **Step 2: Mark `docs/adrs/adr_06_cloudflare_pages.md` as Superseded**

Change the `## Status` section from:

```
## Status

Accepted
```

to:

```
## Status

Superseded by `docs/adrs/adr_07_netlify.md` for the production-traffic
decision. This ADR is retained as the historical record of the Cloudflare
Pages setup, which remains configured as a dormant fallback.
```

Do NOT modify the rest of the file. The Decision and Consequences sections
stay intact as the historical record referenced by the Cloudflare Pages
fallback path.

- [ ] **Step 3: Verify lint passes**

Run: `pnpm lint`
Expected: PASS (Markdown files are in the Prettier glob.)

- [ ] **Step 4: Commit**

```bash
git add docs/adrs/adr_07_netlify.md docs/adrs/adr_06_cloudflare_pages.md
git commit -m "Add ADR 07 Netlify primary, supersede ADR 06" -m "Netlify permits ALIAS/ANAME at the existing registrar for apex TLS, while Cloudflare requires moving DNS to Cloudflare. Cloudflare Pages stays configured as a dormant fallback."
```

---

### Task 3: Update README and AGENTS.md Deploy sections

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: `netlify.toml` from Task 1 and ADR 07/06 from Task 2.
- Produces: README and AGENTS.md Deploy sections that describe Netlify as primary with Cloudflare Pages as fallback, referencing the committed `netlify.toml` and both ADRs.

- [ ] **Step 1: Replace the Deploy section in `README.md`**

The current Deploy section (lines 53–74 of `README.md`) reads:

```
## Deploy

The site is served by Cloudflare Pages as a fully static build (no SSR adapter).

Cloudflare Pages project settings:

```text
Framework preset: Astro
Build command: pnpm install --frozen-lockfile && pnpm build
Output directory: dist
Environment variables: CONTENTFUL_SPACE_ID, CONTENTFUL_DELIVERY_TOKEN
NODE_VERSION: current LTS supported by Astro and Cloudflare Pages
```

No `CONTENTFUL_PREVIEW_TOKEN` is set for production Cloudflare builds.

### Content rebuilds

Content is fetched from Contentful at build time, so content edits do not
appear until a rebuild. Trigger a rebuild via git push, a manual Cloudflare
deploy, or a Contentful webhook pointing at a Cloudflare Pages deploy hook
(`publish`/`unpublish` events).
```

Replace that entire block with:

```
## Deploy

The site is served by Netlify as a fully static build (no SSR adapter). The
build config is committed in `netlify.toml`:

```toml
[build]
  command = "pnpm install --frozen-lockfile && pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
```

Production env vars (set in the Netlify dashboard, not committed):
`CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`. No
`CONTENTFUL_PREVIEW_TOKEN` is set for production builds.

### DNS and TLS

DNS stays at the current registrar. Netlify provisions the TLS certificate
via DCV:

- Apex `rhode-medizin.de`: ALIAS/ANAME → `apex-loadbalancer.netlify.com`
- `www.rhode-medizin.de`: CNAME → `<site-slug>.netlify.app`

### Content rebuilds

Content is fetched from Contentful at build time, so content edits do not
appear until a rebuild. Trigger a rebuild via git push, a manual Netlify
deploy, or a Contentful webhook pointing at a Netlify build hook
(`publish`/`unpublish` events on Entry and Asset).

### Cloudflare Pages fallback

The Cloudflare Pages project stays configured and builds on every git push
with the same build command and env vars. Its `*.pages.dev` URL remains
functional as an emergency fallback. To switch traffic to Cloudflare,
repoint DNS and let Cloudflare provision the apex cert. See
`docs/adrs/adr_06_cloudflare_pages.md` and
`docs/adrs/adr_07_netlify.md`.
```

- [ ] **Step 2: Update the Deploy section in `AGENTS.md`**

The current Deploy section in `AGENTS.md` reads:

```
## Deploy

Deployed to Cloudflare Pages as a fully static build (`astro build` → `dist/`), no SSR adapter — fully static, cookie-free, no service worker. Build command: `pnpm install --frozen-lockfile && pnpm build`. Production env vars: `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`. Content is fetched from Contentful at build time, so content edits require a rebuild via git push, manual Cloudflare deploy, or a Contentful webhook to a Cloudflare Pages deploy hook.
```

Replace it with:

```
## Deploy

Deployed to Netlify as a fully static build (`astro build` → `dist/`), no SSR adapter — fully static, cookie-free, no service worker. Build config is committed in `netlify.toml` at the repo root; build command `pnpm install --frozen-lockfile && pnpm build`, publish dir `dist`, `NODE_VERSION = "22"`. Production env vars: `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN` (set in the Netlify dashboard, not committed). DNS stays at the registrar: apex `rhode-medizin.de` ALIAS/ANAME → `apex-loadbalancer.netlify.com`, `www.rhode-medizin.de` CNAME → `<site-slug>.netlify.app`; Netlify provisions TLS via DCV. Content is fetched from Contentful at build time, so content edits require a rebuild via git push, manual Netlify deploy, or a Contentful webhook to a Netlify build hook (`publish`/`unpublish` on Entry and Asset).

The Cloudflare Pages project stays configured and builds on every git push as a dormant fallback; its `*.pages.dev` URL remains functional. To switch traffic to Cloudflare, repoint DNS and let Cloudflare provision the apex cert. See `docs/adrs/adr_07_netlify.md` (decision) and `docs/adrs/adr_06_cloudflare_pages.md` (Cloudflare setup, superseded).
```

- [ ] **Step 3: Verify lint passes**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add README.md AGENTS.md
git commit -m "Document Netlify primary deploy with Cloudflare fallback" -m "README and AGENTS.md Deploy sections now describe Netlify primary (netlify.toml, ALIAS/ANAME at registrar, Contentful -> Netlify webhook) with Cloudflare Pages as a dormant fallback."
```

---

### Task 4: Operator runbook — Netlify site setup, DNS, and Contentful webhook

> **For the human operator:** This is a manual runbook for the Netlify dashboard, the DNS registrar, and the Contentful webhook settings. None of these steps can be performed from the repo shell. Execute them in order, recording results as you go, then report back so the completion summary can be finalized. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Tasks 1–3 are committed and pushed; `netlify.toml` is on the default branch.

**Files:**
- None. All changes are external to the repo and must be recorded in the completion summary.

**Interfaces:**
- Consumes: `netlify.toml` from Task 1; ADR 07 from Task 2; README/AGENTS.md from Task 3.
- Produces: a live Netlify production site at `https://rhode-medizin.de` and `https://www.rhode-medizin.de`, a Contentful → Netlify build webhook, and a still-functional Cloudflare Pages fallback at its `*.pages.dev` URL.

- [ ] **Step 1: Connect the repo to Netlify and confirm the build picks up `netlify.toml`**

In Netlify:
1. Create a new site from Git → connect the `maeh2k/rhode-medizin` repository.
2. Set the production branch to the default branch.
3. Confirm Netlify detects `netlify.toml` and shows build command
   `pnpm install --frozen-lockfile && pnpm build`, publish dir `dist`,
   `NODE_VERSION = "22"`. Do not override these in the dashboard.
4. Trigger the first build and confirm it succeeds with a green deploy.

- [ ] **Step 2: Set production env vars in the Netlify dashboard**

In Netlify → Site settings → Environment variables, add:
- `CONTENTFUL_SPACE_ID` = the production Contentful space ID (same value as Cloudflare Pages).
- `CONTENTFUL_DELIVERY_TOKEN` = the production Contentful delivery token (same value as Cloudflare Pages).

Do NOT set `CONTENTFUL_PREVIEW_TOKEN` or `CONTENTFUL_USE_PREVIEW` for production.

Trigger a new build and confirm it succeeds (env vars are present at build time).

- [ ] **Step 3: Add custom domains in Netlify**

In Netlify → Site settings → Domain management → Domains:
1. Add custom domain `rhode-medizin.de`.
2. Add custom domain `www.rhode-medizin.de`.
3. Set `www.rhode-medizin.de` as the primary domain (or apex, per preference); Netlify will set up a redirect from the secondary to the primary if configured.

- [ ] **Step 4: Point DNS at the registrar**

At the current DNS registrar, set:
- Apex `rhode-medizin.de`: ALIAS/ANAME → `apex-loadbalancer.netlify.com`.
- `www.rhode-medizin.de`: CNAME → `<site-slug>.netlify.app` (use the exact subdomain Netlify shows in the dashboard).

Do NOT transfer DNS to Netlify DNS or Cloudflare DNS — keeping DNS at the registrar is the motivation for this change.

- [ ] **Step 5: Wait for TLS provisioning and verify**

1. In Netlify → Site settings → Domain management → HTTPS, wait for "Certificate verified" (typically minutes).
2. Visit `https://rhode-medizin.de` and `https://www.rhode-medizin.de`; confirm the Astro site loads and the TLS cert is issued by Netlify.
3. Visit an unknown path (e.g. `https://rhode-medizin.de/this-does-not-exist`) and confirm `dist/404.html` is served (status 404, not a Netlify-branded error page).

- [ ] **Step 6: Create a Netlify build hook**

In Netlify → Site settings → Build & deploy → Continuous deployment → Build hooks:
1. Create a build hook named `contentful-content-published`.
2. Copy the generated hook URL.

- [ ] **Step 7: Configure the Contentful webhook**

In Contentful → Settings → Webhooks:
1. Create a webhook with URL = the Netlify build hook URL from Step 6.
2. Triggers: `publish` and `unpublish` on Entry and Asset.
3. Filters: target this space only.
4. Save.

- [ ] **Step 8: Verify the Contentful → Netlify webhook fires**

1. In Contentful, publish a trivial content edit (or unpublish + republish an existing entry).
2. In Netlify → Deploys, confirm a new deploy appears with "Triggered by webhook" in the deploy log.
3. If no deploy appears, check Contentful → Settings → Webhooks → delivery history for the failed delivery and retry.

- [ ] **Step 9: Confirm the Cloudflare Pages fallback still works**

1. Push a trivial commit (or trigger a manual Cloudflare deploy) and confirm the Cloudflare Pages build succeeds.
2. Visit the Cloudflare Pages `*.pages.dev` URL and confirm the site loads. This is the dormant fallback; it is not attached to the production domain.

- [ ] **Step 10: Report results**

Record in the completion summary:
- Netlify site URL and the `*.netlify.app` subdomain used for the `www` CNAME.
- Confirmation that `netlify.toml` was picked up unmodified.
- Confirmation that env vars were set (names only — never values).
- The DNS records set at the registrar (ALIAS/ANAME apex + CNAME www).
- Confirmation that TLS is verified for both apex and `www`.
- Confirmation that `dist/404.html` is served for unknown paths.
- Confirmation that the Contentful webhook fires a Netlify build.
- Confirmation that the Cloudflare Pages fallback build still succeeds and the `*.pages.dev` URL serves the site.
- Any deviations from ADR 07 / this plan, so `docs/adrs/adr_07_netlify.md` can be amended if needed.

---

## Self-Review

**1. Spec coverage:**

- `netlify.toml` with build command, publish, NODE_VERSION, no headers/redirects → Task 1.
- Secrets in dashboard, not committed → Task 1 (note) + Task 4 Step 2.
- No `requirements.txt` reintroduction → Task 1 (note).
- DNS records (ALIAS apex + CNAME www), TLS via DCV, no DNS transfer → Task 4 Steps 3–5.
- Cloudflare Pages fallback stays configured and building → Task 4 Step 9; documented in README/AGENTS.md (Task 3) and ADR 07 (Task 2).
- Contentful → Netlify build webhook (`publish`/`unpublish` on Entry and Asset) → Task 4 Steps 6–8.
- New ADR 07 with motivation, decision, build config, DNS, webhook → Task 2 Step 1.
- ADR 06 marked Superseded, body intact → Task 2 Step 2.
- README Deploy section rewritten (Netlify primary + Cloudflare fallback subsection) → Task 3 Step 1.
- AGENTS.md Deploy section updated → Task 3 Step 2.
- ADR numbering append-only (Approach A); no renumbering → Global Constraints + Task 2 (filename `adr_07_netlify.md`).
- `pnpm lint` before completion → Tasks 1–3 verification steps.
- No code changes to `astro.config.mjs`, `package.json`, or source → confirmed; no such files appear in any task.
- Rollout ordering (build config → site setup → env vars → custom domains → DNS → TLS → webhook → docs) → Task order 1→2→3 (repo) then 4 (operator); operator runbook follows the spec's Rollout section.

**2. Placeholder scan:** No TBD/TODO. Every step shows exact content (the `netlify.toml` block, the ADR 07 body, the ADR 06 status replacement, the README/AGENTS.md before/after blocks, the operator dashboard paths and DNS records). `<site-slug>` is intentionally a placeholder for a value that only exists after the Netlify site is created; it is annotated as "use the exact subdomain Netlify shows in the dashboard."

**3. Type consistency:** ADR 07 references the same build command (`pnpm install --frozen-lockfile && pnpm build`), publish dir (`dist`), env var names (`CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`), NODE_VERSION (`22`), and DNS targets (`apex-loadbalancer.netlify.com`, `<site-slug>.netlify.app`) as `netlify.toml` (Task 1), README/AGENTS.md (Task 3), and the operator runbook (Task 4). ADR 06's filename is referenced consistently as `docs/adrs/adr_06_cloudflare_pages.md` across ADR 07, README, and AGENTS.md.
