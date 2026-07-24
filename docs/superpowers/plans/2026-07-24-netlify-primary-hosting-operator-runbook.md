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
