# Netlify Primary Hosting Operator Runbook

> **For the human operator:** This is a manual runbook for the Netlify
> dashboard, DNS/TLS cutover, and emergency Cloudflare reversion steps
> that cannot be performed from the repository shell. Execute it
> task-by-task, recording results as you go, then report back so the
> completion summary can be finalized. Steps use checkbox (`- [ ]`)
> syntax for tracking.

**Goal:** Make Netlify the primary host for `rhode-medizin.de` and
`www.rhode-medizin.de`, with Cloudflare Pages retained as a dormant fallback.

**Prerequisite:** `netlify.toml` and `docs/adrs/adr_07_netlify.md` are
committed. The Astro static build is verified locally (`pnpm verify` succeeds
and produces `dist/`). Repository configuration is ready for operator
verification; this runbook does not assume remote workflow, provider, DNS, or
TLS state has already been confirmed.

**Architecture:** The Astro static build (`astro build` → `dist/`) is
host-agnostic. Only hosting and DNS configuration change; no code or build
changes. DNS stays at the existing registrar.

**Tech Stack:** Astro static build, Netlify (primary), Cloudflare Pages
(fallback), DNS at the registrar.

## Global Constraints

- No changes to `astro.config.mjs`, `package.json`, or any `.astro`/`.ts`
  source.
- Build command is identical on both platforms:
  `pnpm install --frozen-lockfile && pnpm verify`; publish directory `dist`.
  The aggregate performs the production build and produces `dist/`; do not
  configure a second build step.
- No application or content environment variables are required. Content is
  version-controlled in the repository.
- The required build-runtime setting is Node version `22` on both hosts.
- The committed GitHub Actions workflow requires `pnpm verify` for pull
  requests targeting `master` and pushes to `master`; confirm an actual remote
  run before recording this setup as verified.
- DNS stays at the registrar; do not transfer to Netlify DNS or Cloudflare
  DNS.
- Cloudflare's build command is a Pages dashboard setting. Do not add it to
  `wrangler.jsonc`; Wrangler retains only the deployment output setting
  `assets.directory: ./dist`.

See `docs/adrs/adr_07_netlify.md` for the decision and `netlify.toml` for the
build configuration. See
`docs/superpowers/plans/2026-08-13-local-content-cutover-operator-runbook.md`
for the local-content cutover and Contentful retirement runbook.

## Prerequisites

- Netlify account with access to the `rhode-medizin` site.
- Registrar access for `rhode-medizin.de` (DNS stays here — do not transfer).
- Cloudflare account access sufficient to verify or restore the Pages project's
  GitHub connection and fallback settings.
- Local checkout for parity checks (`pnpm verify`).

## 1. Netlify site setup

1. Netlify → Sites → Add site → Import an existing project → connect the
   GitHub repo.
2. Confirm the build picks up `netlify.toml` (deploy log shows build command
   `pnpm install --frozen-lockfile && pnpm verify`, publish directory `dist`,
   `NODE_VERSION` `22`).
3. Confirm `NODE_VERSION` is `22` and no application or content environment
   variables are configured.
4. Trigger a build (Netlify → Deploys → Trigger deploy). Confirm it succeeds
   and the `dist/` produced by `pnpm verify` is published without a second
   build.

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
5. Verify `dist/404.html` is served for an unknown path. No redirects/headers
   block is committed in `netlify.toml`; record the observed Netlify behavior.

## 3. Content rebuilds

Content edits are Git changes. The intended remote behavior is that pushes to
`master` trigger a Netlify deploy through its GitHub integration and the
committed GitHub Actions workflow runs the aggregate for pull requests
targeting `master` and pushes to `master`. Verify both behaviors from remote
logs before marking them operational. No Contentful webhook is required. If a
manual rebuild is needed, trigger it from the Netlify dashboard.

## 4. Emergency revert to Cloudflare Pages

Do not assume the Cloudflare Pages GitHub connection or `*.pages.dev` URL is
functional. Verify both before relying on the fallback.

1. Confirm the Cloudflare Pages dashboard uses the required Node 22 build
   runtime, no application or content environment variables, publish directory
   `dist`, and build command
   `pnpm install --frozen-lockfile && pnpm verify`. Trigger a fresh build and
   confirm it publishes the generated `dist/` without a second build. Run
   `pnpm compare:pages` against the Cloudflare URL if parity is in doubt.
2. At the registrar, repoint:
   - Apex `rhode-medizin.de`: ALIAS/ANAME → Cloudflare Pages apex target.
   - `www.rhode-medizin.de`: CNAME → Cloudflare Pages `www` target.
3. Cloudflare provisions the apex cert once DNS points at it; no DNS transfer
   is required for the fallback. Netlify's cert remains valid; only DNS
   changes.
4. Verify `https://rhode-medizin.de` serves the Cloudflare build.

This fallback path is documented but not load-tested. It is a dormant safety
net, not an active mirror.
