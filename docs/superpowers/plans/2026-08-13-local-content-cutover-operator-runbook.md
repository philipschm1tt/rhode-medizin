# Local Content Cutover and Retirement Operator Runbook

> **For the human operator:** This is a manual runbook for production
> cutover, rollback, and 14-day Contentful retirement. It is performed
> after the migration PR (Tasks 1–11) is merged. Steps use checkbox
> (`- [ ]`) syntax for tracking.

## Historical status

This runbook is a historical cutover record. Its original commands and
checklists are preserved below; steps without contemporaneous evidence must
not be marked complete retroactively. The immutable cutover provenance still
records `frozen-source vs production` reconciliation as `not verified`.

For current procedures, follow `docs/content-authoring.md` and ADR 09
(`docs/adrs/adr_09_steady_state_content_verification.md`).

**Goal:** Cut production traffic from the Contentful-backed build to the
local-content build, verify it, retain rollback capability for 14 days,
then retire Contentful.

**Prerequisite:** The migration PR is merged and the clean-build proof
(Task 11) is recorded. `pnpm verify` passes in a credential-free,
Contentful-blocked clean checkout. ADR 08
(`docs/adrs/adr_08_local_content.md`) documents the decision.

## 1. Record pre-cutover state

- [ ] Record the current production Netlify deploy ID (Netlify → Deploys
      → latest production deploy).
- [ ] Record the current Git commit hash on `master` (`git rev-parse
      master`).
- [ ] Record both values in `tests/fixtures/cutover/provenance.json` if
      not already present.

## 2. Verify previews

- [ ] Push the migration branch (or merge to `master`).
- [ ] Confirm the Netlify preview build passes `pnpm verify` (or the
      equivalent build). Record the Netlify preview URL.
- [ ] Confirm the Cloudflare Pages preview build passes. Record the
      `*.pages.dev` preview URL.
- [ ] Visually compare the preview against the frozen cutover fixtures
      at desktop (1440×900) and mobile (390×844) for all three pages
      (`/`, `/imprint/`, `/data-policy/`).

## 3. Disable the Contentful → Netlify webhook

- [ ] In Contentful → Settings → Webhooks, disable (do not delete) the
      webhook pointing at the Netlify build hook. Retain the hook URL
      and webhook details for rollback.
- [ ] In Netlify → Site → Build & deploy → Build hooks, retain the
      `contentful-content-published` hook (it will be deleted in step 7).

This prevents Contentful publishes from triggering a rebuild after the
local-content build is live.

## 4. Merge, deploy, and smoke test

- [ ] Merge the migration PR into `master`.
- [ ] After the Netlify deploy completes, verify:
  - [ ] `https://www.rhode-medizin.de/` returns 200.
  - [ ] `https://www.rhode-medizin.de/imprint/` returns 200.
  - [ ] `https://www.rhode-medizin.de/data-policy/` returns 200.
  - [ ] An unknown route serves the expected 404 page.
  - [ ] `<title>` is correct on all three pages.
  - [ ] Homepage `<meta name="description">` matches the frozen value.
  - [ ] Canonical URL is `https://www.rhode-medizin.de/` on the homepage.
  - [ ] Open Graph and Twitter card metadata present on the homepage;
        `og:image` and `twitter:image` are local `/_astro/` URLs.
  - [ ] Legal pages have no description meta tag, no Open Graph, no
        Twitter card metadata.
  - [ ] Footer legal links point to `/imprint/` and `/data-policy/`.
  - [ ] External legal links (e.g. `e-recht24.de`, `dg-datenschutz.de`,
        `wbs-law.de`) match the frozen `href` values byte-for-byte.
  - [ ] `dist/sitemap-index.xml` / `sitemap-0.xml` lists all three
        routes.
  - [ ] All rendered `<img>` `src` and `<source>` `srcset` URLs return
        200 (no Contentful CDN URLs).
  - [ ] The hero image has `loading="eager"` and `fetchpriority="high"`.
  - [ ] Below-the-fold images have `loading="lazy"`.

## 5. Rollback

If the cutover fails or content is wrong:

- [ ] **Immediate rollback (no rebuild):** republish the recorded
      pre-cutover Netlify deploy (Netlify → Deploys → find the recorded
      deploy ID → “Publish deploy” / “Retry deploy”). This restores the
      Contentful-backed build without a rebuild.
- [ ] **Code rollback (if the code change must also be reversed):**
      revert the migration PR on `master` and rebuild. The old
      implementation requires the retained frozen Contentful space and
      credentials to be set in the Netlify environment.
- [ ] **Cloudflare fallback:** do not use the Cloudflare fallback as a
      substitute unless its retained deployment is independently
      verified to contain the pre-cutover build.
- [ ] **Re-enable the Contentful webhook** (step 3) only if Contentful
      again becomes the active authoring source.

## 6. 14-day retention

- [ ] Keep Contentful frozen: no publish, unpublish, or edit of entries
      or assets for 14 calendar days after cutover.
- [ ] Retain the Contentful space, credentials, and the recorded
      pre-cutover Netlify deploy.
- [ ] Retain the sanitized frozen export under
      `tests/fixtures/cutover/` as migration provenance.
- [ ] Retain the Contentful webhook details and Netlify build hook
      (disabled) for rollback.

## 7. Retirement

After 14 days without a rollback:

- [ ] Remove Contentful environment variables from every Netlify context
      (Site → Settings → Environment variables) and every Cloudflare
      context.
- [ ] Revoke Contentful API tokens (Contentful → Settings → API keys).
- [ ] Delete the Contentful webhook (Contentful → Settings → Webhooks).
- [ ] Delete the unused Netlify build hook (Netlify → Site → Build &
      deploy → Build hooks).
- [ ] Retain the sanitized frozen export under
      `tests/fixtures/cutover/` as migration provenance.
- [ ] Archive or cancel the Contentful space per the account owner's
      retention needs.
