# Netlify Primary Hosting Design

- **Date:** 2026-07-24
- **Status:** Approved
- **Supersedes:** ADR 06 (`docs/adrs/adr_06_cloudflare_pages.md`) — production-traffic decision only; ADR 06 retained as historical record
- **Related:** ADR 01 (Astro migration), ADR 04 (fonts), ADR 05 (`adr_05_image_strategy.md`)

## Summary

Switch production traffic for `rhode-medizin.de` from Cloudflare Pages to
Netlify, while keeping the Cloudflare Pages project configured and building as
a dormant fallback. The Astro static build (`astro build` → `dist/`) is
host-agnostic and requires no code or build changes; only hosting and DNS
configuration change.

## Motivation

The Cloudflare Pages setup documented in ADR 06 requires moving DNS
management fully to Cloudflare in order to provision an apex TLS certificate.
Netlify permits the apex domain to remain at the existing registrar and
provisions its certificate via DCV using an ALIAS/ANAME record at the apex and
a CNAME for `www`. Keeping DNS at the registrar is preferable, so Netlify
becomes the primary host.

## Goals

- Make Netlify the primary host for `rhode-medizin.de` and
  `www.rhode-medizin.de` without transferring DNS to Netlify or Cloudflare.
- Keep the existing Cloudflare Pages project configured and building on every
  git push, so a DNS-only cutover can revert traffic to Cloudflare at any
  time.
- Trigger Netlify rebuilds automatically when Contentful content is published
  or unpublished.
- Introduce no changes to the Astro build, source code, or dependencies.

## Non-goals

- Renumbering existing ADR files (Approach A — append-only).
- Custom HTTP headers, redirects, or Netlify Forms/Identity/Edge Functions.
- Switching DNS provider to Netlify DNS.
- Any change to `astro.config.mjs`, `package.json`, or `.astro`/`.ts` source.

## Background

### Current state (master baseline)

- The Astro build produces a fully static `dist/` with no SSR adapter, no
  service worker, and no runtime cookies (ADR 06). It is host-agnostic.
- Cloudflare Pages is configured entirely in the dashboard; no
  `wrangler.toml` or build config lives in the repo. (A `wrangler.jsonc` with
  `assets.directory` as `./dist` exists per the AGENTS.md Deploy note.)
- The Cloudflare build command is `pnpm install --frozen-lockfile && pnpm
  build`; output dir `dist`; env vars `CONTENTFUL_SPACE_ID` and
  `CONTENTFUL_DELIVERY_TOKEN` (AGENTS.md "Deploy").
- `dist/404.html` is emitted by Astro; both Cloudflare Pages and Netlify
  serve it automatically.
- README.md Deploy section (lines 53–77) describes Cloudflare Pages as
  primary, with Framework preset Astro, build command, output directory,
  env vars, NODE_VERSION, and Contentful webhook to a Cloudflare deploy hook.
- AGENTS.md Deploy section describes Cloudflare Pages as primary with the
  same build command and env vars, plus the `wrangler.jsonc` note.
- ADR 06 status is `Accepted` and states "Netlify is decommissioned after
  production verification passes." That decision is reversed by this design.

### Legacy Netlify stack (Gatsby)

The pre-Astro stack ran on Netlify and included a `requirements.txt` pinned to
`fonttools`, `brotli`, and `zopfli`. That file existed only to support
`subfont` for font subsetting; `subfont` is gone (ADR 04 handles fonts), so no
`requirements.txt` is reintroduced. No Python runtime is needed for the Astro
build on Netlify.

## Design

### 1. `netlify.toml` (committed to repo root)

A new `netlify.toml` makes the Netlify build reproducible and self-documenting,
mirroring the Cloudflare build command exactly:

```toml
[build]
  command = "pnpm install --frozen-lockfile && pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
```

- Same `pnpm` flow and same `dist` output as Cloudflare Pages.
- `NODE_VERSION` pinned to current LTS supported by Astro and Netlify.
- Secrets (`CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`) are set in the
  Netlify dashboard, not committed — matching the Cloudflare convention.
- No `[[redirects]]` or `[[headers]]` block. Astro emits `dist/404.html`,
  which Netlify serves automatically. Platform defaults are acceptable.
- `CONTENTFUL_PREVIEW_TOKEN` is not set for production builds, consistent with
  ADR 06.

### 2. DNS and TLS cutover

DNS stays at the current registrar (the driver for this whole change).

- Apex `rhode-medizin.de`: **ALIAS/ANAME** →
  `apex-loadbalancer.netlify.com`.
- `www.rhode-medizin.de`: **CNAME** → `<site-slug>.netlify.app` (per Netlify
  dashboard).

Netlify auto-provisions the TLS certificate via DCV (HTTP-01 over apex and
`www`, with DNS-01 fallback for the apex). No DNS transfer to Netlify DNS or
Cloudflare DNS is required.

#### Netlify domain setup (operator runbook)

1. Netlify → Site → Domain settings → Add custom domain
   `rhode-medizin.de` and `www.rhode-medizin.de`.
2. At the registrar: set the ALIAS (apex) and CNAME (`www`) per Netlify's
   instructions.
3. Wait for Netlify to issue and verify the certificate (dashboard shows
   "Certificate verified"; typically minutes).
4. Verify the site serves over `https://rhode-medizin.de` and
   `https://www.rhode-medizin.de` with a valid cert.
5. Verify `dist/404.html` is served for unknown paths.
6. Optional future step: enable Netlify DNS only if DNS-provider migration
   is ever desired — not required for this cutover.

### 3. Cloudflare Pages fallback

The Cloudflare Pages project is not deleted.

- It keeps building on every git push with the same build command and the
  same env vars.
- The `*.pages.dev` URL remains functional for verification and as an
  emergency fallback.
- To switch traffic to Cloudflare in an emergency: repoint DNS (apex
  ALIAS/ANAME and `www` CNAME) to the Cloudflare Pages target. Cloudflare
  will provision the apex cert once DNS points at it; no DNS transfer is
  required for the fallback itself. Netlify's cert remains valid; only DNS
  changes.
- This fallback path is documented but not load-tested as part of this
  change; it is a dormant safety net, not an active mirror.

### 4. Contentful → Netlify build webhook

Content edits in Contentful must trigger a Netlify rebuild automatically
(Netlify is primary; Cloudflare rebuilds stay on git push / manual).

1. Netlify → Site → Build & deploy → Continuous deployment → Build hooks →
   create a hook (e.g., `contentful-content-published`).
2. Contentful → Settings → Webhooks → create webhook:
   - URL: the Netlify build hook URL.
   - Triggers: `publish` and `unpublish` on Entry and Asset.
   - Filters: target this space only.
3. Verify a Contentful publish/unpublish triggers a Netlify build via the
   Netlify deploy log.

### 5. ADR updates

- **New: `docs/adrs/adr_07_netlify.md`** — Supersedes ADR 06 for production
  traffic. Captures motivation (Cloudflare requires DNS transfer for apex
  TLS; Netlify allows ALIAS/ANAME at the existing registrar), decision
  (Netlify primary, Cloudflare Pages configured as dormant fallback), build
  config, env vars, NODE_VERSION, DNS records, and the Contentful → Netlify
  webhook. References `netlify.toml` and the operator runbook.
- **Update: `docs/adrs/adr_06_cloudflare_pages.md`** — Status changed to
  `Superseded by adr_07_netlify.md`. Add a one-line note in Context pointing
  to ADR 07 for the reason. Body left intact as historical record.

### 6. Docs updates

- **`README.md` → Deploy section (lines 53–77):** replace the
  Cloudflare-primary instructions with Netlify-primary. Include the
  `netlify.toml` reference, env-var names, DNS records (apex ALIAS/ANAME +
  `www` CNAME), Contentful webhook setup, and a short "Cloudflare Pages
  fallback" subsection referencing `docs/adrs/adr_06_cloudflare_pages.md` and
  `docs/adrs/adr_07_netlify.md`.
- **`AGENTS.md` → Deploy section:** update to reflect Netlify primary +
  Cloudflare Pages fallback. Note that the build command
  (`pnpm install --frozen-lockfile && pnpm build`) and env-var names are the
  same on both platforms. Reference `netlify.toml` as the source of truth for
  Netlify. Preserve the existing `wrangler.jsonc` note — it still applies to
  the Cloudflare fallback.

### 7. ADR numbering

Approach A (append-only) is used. Existing `adr_05_*` and `adr_06_*` filename
collisions are left in place; historical plan/spec references to those
filenames remain valid. The new ADR is `adr_07_netlify.md`. No README note is
added about the historical collision.

## Rollout

1. Add `netlify.toml` to repo root.
2. Configure Netlify site: connect repo, confirm build command picks up
   `netlify.toml`, set env vars `CONTENTFUL_SPACE_ID` and
   `CONTENTFUL_DELIVERY_TOKEN` in the Netlify dashboard.
3. Trigger a Netlify build and verify `dist/` output (same parity checks
   apply: `pnpm compare:pages` works against any host's served HTML).
4. Add custom domains in Netlify, set DNS at registrar, wait for cert.
5. Verify production URLs over HTTPS.
6. Create Netlify build hook; configure Contentful webhook; verify a publish
   triggers a build.
7. Update ADR 06 status to Superseded; add `docs/adrs/adr_07_netlify.md`.
8. Update `README.md` and `AGENTS.md` Deploy sections.
9. Commit and push; confirm Netlify build succeeds on git push (Cloudflare
   build also succeeds as fallback).

## Verification

- `netlify.toml` present at repo root and parsed by Netlify (visible in
  deploy log).
- `pnpm install --frozen-lockfile && pnpm build` succeeds locally and on
  Netlify.
- `dist/404.html` served by Netlify for an unknown path.
- `https://rhode-medizin.de` and `https://www.rhode-medizin.de` serve the
  Astro build with a valid TLS cert issued by Netlify.
- A Contentful publish triggers a Netlify build (deploy log shows
  "Triggered by webhook").
- Cloudflare Pages build still succeeds on git push; `*.pages.dev` URL still
  serves the site.
- `docs/adrs/adr_07_netlify.md` exists; `docs/adrs/adr_06_cloudflare_pages.md`
  status reads `Superseded by adr_07_netlify.md`.
- `README.md` and `AGENTS.md` Deploy sections describe Netlify primary with
  Cloudflare fallback.

## Risks

- **DNS propagation delay** at cutover: low risk because ALIAS/ANAME and
  CNAME changes propagate within TTL; the previous records can be restored
  if needed.
- **Netlify build differs from Cloudflare build** in image optimization
  output: the Astro image service runs at build time and is host-agnostic;
  no runtime difference is expected. If parity is in doubt, run
  `pnpm compare:pages` against the Netlify URL.
- **Webhook delivery failure** goes unnoticed: Netlify shows webhook
  delivery history in the dashboard; no alerting is configured as part of
  this change.
- **Cloudflare fallback drift**: Cloudflare builds continue on git push but
  are not actively verified against the real domain. Risk is acceptable for
  a dormant safety net; if Cloudflare is ever needed, run a fresh build and
  parity check before repointing DNS.
