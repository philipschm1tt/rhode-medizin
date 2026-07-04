# Astro Migration M5 Cloudflare Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the static Astro site to Cloudflare Pages, cut DNS over, and decommission Netlify after verification.

**Architecture:** Use Astro's default static output (`astro build` to `dist/`) on Cloudflare Pages with no SSR adapter. Keep Netlify live until the Cloudflare Pages preview and custom-domain verification gates pass.

**Tech Stack:** Astro static build, Cloudflare Pages, Contentful production delivery token, optional Contentful deploy webhook, DNS/custom domains, HTTPS verification.

## Global Constraints

- Consumes master spec: `docs/superpowers/specs/2026-07-04-astro-migration-design.md`.
- Consumes planning design: `docs/superpowers/specs/2026-07-04-astro-migration-planning-design.md`.
- Depends on completed M4 image optimization.
- M5 goal: site deployed on Cloudflare Pages static, Netlify decommissioned, DNS cut over.
- No `@astrojs/cloudflare` SSR adapter; the site is fully static.
- Cloudflare Pages build command: `pnpm install --frozen-lockfile && pnpm build`.
- Cloudflare Pages output directory: `dist`.
- Production env vars: `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`.
- No preview token is needed for production Cloudflare builds.
- Set `NODE_VERSION` to current LTS supported by Astro and Cloudflare Pages.
- Keep Netlify alive during verification and remove old Netlify DNS/records only after the new site is confirmed serving correctly.
- Configure a Contentful webhook to a Cloudflare Pages deploy hook for `publish` and `unpublish`, or document manual rebuilds as the selected alternative.
- Drop old PWA manifest/service worker behavior.
- Review for ADR need before completion and state whether ADRs were added or why none were needed.

---

## File Structure

- Modify: `README.md` — document Cloudflare Pages build/deploy settings and Contentful webhook/manual rebuild process.
- Modify: `AGENTS.md` — update deploy guidance from Netlify to Cloudflare if not already done in M3.
- Delete if still present and obsolete: `requirements.txt`.
- Create if needed: `docs/adrs/adr_XX-cloudflare-pages.md`.
- Cloudflare dashboard changes are external and must be recorded in the completion summary.

---

### Task 1: Cloudflare Pages Configuration Documentation

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Delete if obsolete: `requirements.txt`
- Create if needed: `docs/adrs/adr_XX-cloudflare-pages.md`

**Interfaces:**
- Consumes: verified Astro static build from M4.
- Produces: repository documentation that matches the Cloudflare Pages deployment setup.

- [ ] **Step 1: Document Cloudflare Pages settings**

Update `README.md` with:

```text
Framework preset: Astro
Build command: pnpm install --frozen-lockfile && pnpm build
Output directory: dist
Environment variables: CONTENTFUL_SPACE_ID, CONTENTFUL_DELIVERY_TOKEN
NODE_VERSION: current LTS supported by Astro and Cloudflare Pages
```

- [ ] **Step 2: Update agent deploy guidance**

Update `AGENTS.md` deploy section to describe Cloudflare Pages static hosting and remove stale Netlify/subfont guidance that no longer applies after M3.

- [ ] **Step 3: Remove obsolete Netlify/subfont files if still present**

Remove `requirements.txt` only if the disabled subfont Python step is gone and no deploy process reads it.

- [ ] **Step 4: Review for ADR need**

Add an ADR if Cloudflare Pages static hosting is a significant decision not already covered by an existing ADR.

- [ ] **Step 5: Commit deployment docs**

Run:

```bash
git status --short
git diff -- README.md AGENTS.md requirements.txt docs/adrs
git add README.md AGENTS.md docs/adrs
git add -u requirements.txt
git commit -m "Document Cloudflare Pages deployment"
```

Expected: commit contains only deployment documentation, obsolete-file removal, and ADRs if added.

---

### Task 2: Cloudflare Preview Deployment

**Files:**
- None expected unless deployment notes are added.

**Interfaces:**
- Consumes: Cloudflare Pages project and repository settings.
- Produces: verified `*.pages.dev` preview URL.

- [ ] **Step 1: Create or configure Cloudflare Pages project**

Configure Cloudflare Pages with the settings documented in Task 1.

- [ ] **Step 2: Add production environment variables**

Set `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`, and `NODE_VERSION`. Do not add `CONTENTFUL_PREVIEW_TOKEN` for production.

- [ ] **Step 3: Run preview deployment**

Trigger a Cloudflare Pages build and record the `*.pages.dev` URL.

- [ ] **Step 4: Verify preview URL**

Confirm `/`, `/imprint/`, and `/data-policy/` return 200, a missing route returns the Astro 404 page, HTTPS is valid, no cookies are set, no cookie banner appears, no service worker is registered, and no client-side storage is written.

- [ ] **Step 5: Configure content rebuild trigger**

Choose one:

```text
Preferred: Create a Cloudflare Pages deploy hook and configure Contentful publish/unpublish webhooks to call it.
Alternative: Document manual deploy trigger for Contentful updates.
```

Expected: content changes have an explicit rebuild path.

---

### Task 3: DNS Cutover And Netlify Decommission

**Files:**
- Modify if needed: `README.md`

**Interfaces:**
- Consumes: verified Cloudflare Pages preview deployment.
- Produces: production `rhode-medizin.de` and `www.rhode-medizin.de` serving the Astro build over Cloudflare HTTPS.

- [ ] **Step 1: Add custom domains**

Add `rhode-medizin.de` and `www.rhode-medizin.de` to the Cloudflare Pages project and wait for certificate provisioning.

- [ ] **Step 2: Cut DNS over**

Move DNS to Cloudflare or point current DNS at Cloudflare as appropriate for the registrar setup. Do not remove old Netlify DNS/records until Cloudflare production verification passes.

- [ ] **Step 3: Verify production domains**

Confirm:

```text
https://rhode-medizin.de/ returns 200
https://www.rhode-medizin.de/ returns 200
/imprint/ returns 200
/data-policy/ returns 200
missing routes return the Astro 404 page
HTTPS certificate is valid and no browser SSL warning appears
no Set-Cookie headers
no cookie banner
no service worker
no client-side storage
```

- [ ] **Step 4: Decommission Netlify**

After production verification passes, remove old Netlify DNS/records and delete the Netlify site.

- [ ] **Step 5: Update docs if external setup differs**

If the actual DNS/webhook setup differs from Task 1 docs, update `README.md` and commit:

```bash
git status --short
git diff -- README.md
git add README.md
git commit -m "Record Cloudflare production setup"
```

- [ ] **Step 6: Completion summary**

Report production URLs, Cloudflare preview URL, route/status verification, HTTPS result, cookie/storage/service-worker result, Contentful rebuild trigger choice, Netlify decommission result, ADR status, and commit hashes.
