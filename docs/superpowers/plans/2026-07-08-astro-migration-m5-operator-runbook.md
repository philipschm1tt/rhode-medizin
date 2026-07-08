# Astro Migration M5 Cloudflare Operator Runbook

> **For the human operator:** This is a manual runbook for the Cloudflare Pages
> dashboard, DNS, and Netlify decommission steps that cannot be performed from
> the repository shell. Execute it task-by-task, recording results as you go, then
> report back so the completion summary can be finalized. Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** Deploy the static Astro site to Cloudflare Pages, cut DNS over, and
decommission Netlify after verification.

**Prerequisite:** Task 1 of the M5 plan is complete — deployment docs and ADR 06
are committed (`324bf0b`). The Astro static build from M4 is verified locally.

**Architecture:** Use Astro's default static output (`astro build` to `dist/`)
on Cloudflare Pages with no SSR adapter. Keep Netlify live until the Cloudflare
Pages preview and custom-domain verification gates pass.

**Tech Stack:** Astro static build, Cloudflare Pages, Contentful production
delivery token, optional Contentful deploy webhook, DNS/custom domains, HTTPS
verification.

## Global Constraints

- Consumes master spec: `docs/superpowers/specs/2026-07-04-astro-migration-design.md`.
- Consumes planning design: `docs/superpowers/specs/2026-07-04-astro-migration-planning-design.md`.
- Depends on completed M4 image optimization and Task 1 deployment docs.
- M5 goal: site deployed on Cloudflare Pages static, Netlify decommissioned, DNS
  cut over.
- No `@astrojs/cloudflare` SSR adapter; the site is fully static.
- Cloudflare Pages build command: `pnpm install --frozen-lockfile && pnpm build`.
- Cloudflare Pages output directory: `dist`.
- Production env vars: `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`.
- No preview token is needed for production Cloudflare builds.
- Set `NODE_VERSION` to current LTS supported by Astro and Cloudflare Pages.
- Keep Netlify alive during verification and remove old Netlify DNS/records only
  after the new site is confirmed serving correctly.
- Configure a Contentful webhook to a Cloudflare Pages deploy hook for `publish`
  and `unpublish`, or document manual rebuilds as the selected alternative.
- Drop old PWA manifest/service worker behavior.
- After completion, report results so an ADR/completion summary update can be
  made if the actual setup differs from what ADR 06 documents.

---

## File Structure

- Modify if actual setup differs: `README.md`.
- Modify if actual setup differs: `docs/adrs/adr_06_cloudflare_pages.md`.
- Cloudflare dashboard changes are external and must be recorded in the
  completion summary.

---

### Task 2: Cloudflare Preview Deployment

**Files:**
- None expected unless deployment notes are added.

**Interfaces:**
- Consumes: Cloudflare Pages project and repository settings.
- Produces: verified `*.pages.dev` preview URL.

- [ ] **Step 1: Create or configure Cloudflare Pages project**

In the Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to
Git. Select the `rhode-medizin` repository and the production branch
(`astro-migration-v2-m5` merged into your default branch, or set the production
branch to the branch you deploy from).

Configure with the settings documented in `README.md` and ADR 06:

```text
Framework preset: Astro
Build command: pnpm install --frozen-lockfile && pnpm build
Output directory: dist
```

- [ ] **Step 2: Add production environment variables**

In the Pages project → Settings → Environment variables (Production), set:

```text
CONTENTFUL_SPACE_ID    = <from .env>
CONTENTFUL_DELIVERY_TOKEN = <from .env>
NODE_VERSION           = <current LTS, e.g. 20>
```

Do **not** add `CONTENTFUL_PREVIEW_TOKEN` for production.

- [ ] **Step 3: Run preview deployment**

Trigger a Cloudflare Pages build (Save and Deploy, or Retry deployment). Record
the `*.pages.dev` URL once the build succeeds:

```text
Preview URL: https://<project>.pages.dev
```

- [ ] **Step 4: Verify preview URL**

Open the preview URL and confirm all of the following. Record status for each:

```text
/                          → 200, homepage renders
/imprint/                  → 200, legal page renders
/data-policy/              → 200, legal page renders
/this-route-does-not-exist → Astro 404 page (not a generic Cloudflare 404)
HTTPS                      → valid, no browser SSL warning
Set-Cookie headers         → none
Cookie banner              → not present
Service worker             → none registered (DevTools → Application → Service Workers)
Client-side storage        → none written (DevTools → Application → Local/Session Storage empty)
```

If any check fails, stop and fix before proceeding to Task 3.

- [ ] **Step 5: Configure content rebuild trigger**

Choose one and record which:

```text
[ ] Preferred: Created a Cloudflare Pages deploy hook and configured Contentful
    publish/unpublish webhooks to call it.
    Deploy hook URL: https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/...
    Contentful webhook URL: ...
    Events: publish, unpublish

[ ] Alternative: Documented manual deploy trigger for Contentful updates.
    Trigger: git push to production branch, or Cloudflare dashboard "Retry deployment".
```

Expected: content changes have an explicit rebuild path.

---

### Task 3: DNS Cutover And Netlify Decommission

**Files:**
- Modify if needed: `README.md`.
- Modify if needed: `docs/adrs/adr_06_cloudflare_pages.md`.

**Interfaces:**
- Consumes: verified Cloudflare Pages preview deployment (Task 2 Step 4 passed).
- Produces: production `rhode-medizin.de` and `www.rhode-medizin.de` serving the
  Astro build over Cloudflare HTTPS.

- [ ] **Step 1: Add custom domains**

In the Pages project → Custom domains → Set up a custom domain. Add both:

```text
rhode-medizin.de
www.rhode-medizin.de
```

Wait for Cloudflare to provision the edge certificate for each (status → Active).

- [ ] **Step 2: Cut DNS over**

Move DNS to Cloudflare, or point current DNS at Cloudflare as appropriate for
the registrar setup. Do **not** remove old Netlify DNS/records until Cloudflare
production verification (Step 3) passes.

```text
DNS action taken: ...
Old Netlify records still present: yes/no
```

- [ ] **Step 3: Verify production domains**

Confirm all of the following and record status:

```text
https://rhode-medizin.de/                  → 200
https://www.rhode-medizin.de/              → 200
https://rhode-medizin.de/imprint/          → 200
https://rhode-medizin.de/data-policy/      → 200
https://rhode-medizin.de/this-route-does-not-exist → Astro 404 page
HTTPS certificate                          → valid, no browser SSL warning
Set-Cookie headers                         → none
Cookie banner                              → not present
Service worker                             → none registered
Client-side storage                        → none written
```

- [ ] **Step 4: Decommission Netlify**

After production verification passes:

1. Remove old Netlify DNS/records (only after confirming Cloudflare is serving
   correctly).
2. Delete the Netlify site.

```text
Netlify DNS removed: yes/no (date)
Netlify site deleted: yes/no (date)
```

- [ ] **Step 5: Update docs if external setup differs**

If the actual DNS/webhook/setup differs from what `README.md` and
`docs/adrs/adr_06_cloudflare_pages.md` document, update those files and commit:

```bash
git status --short
git diff -- README.md docs/adrs/adr_06_cloudflare_pages.md
git add README.md docs/adrs/adr_06_cloudflare_pages.md
git commit -m "Record Cloudflare production setup"
```

Expected: repository docs match the real Cloudflare production setup.

- [ ] **Step 6: Completion summary**

Report back so the M5 completion summary can be finalized. Include:

```text
Cloudflare preview URL: ...
Production URLs: https://rhode-medizin.de, https://www.rhode-medizin.de
Route/status verification: / 200, /imprint/ 200, /data-policy/ 200, 404 page works
HTTPS result: valid, no SSL warning
Cookie/storage/service-worker result: none
Contentful rebuild trigger choice: webhook / manual
Netlify decommission result: DNS removed, site deleted
ADR status: adr_06_cloudflare_pages.md added (and updated if setup differed)
Commit hashes: 324bf0b (docs), <this commit if docs updated>
```
