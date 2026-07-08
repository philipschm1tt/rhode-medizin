# Stale Homepage Parity Fixture Design

The homepage parity check (`pnpm compare:pages`) fails because the captured
live fixture at `tests/fixtures/live/index.html` is stale relative to current
Contentful content. The legal page fixtures (`imprint`, `data-policy`) still
pass. This spec covers re-capturing the homepage fixture so parity checks are
green again.

## Problem

`pnpm compare:pages` compares the Astro build's normalized `<article>` content
against captured Gatsby live fixtures in `tests/fixtures/live/`. Two content
drifts were identified during M5 verification (systematic debugging, root cause
confirmed pre-existing at M4 commit `0ea8cfa`):

1. **Certificate expiry date.** The fixture records `Gültig bis → 09.Dezember
   2024`; Contentful now returns `09.Dezember 2027` (certificate was renewed).
2. **Services section restructure.** The fixture has a prose paragraph
   ("Als Vertragspartner der Fa. Aesculap stellen wir ein vielfältiges
   Leistungsspe…"); Contentful now returns a `<ul>` of instruments (Scheren,
   Pinzetten, Klemmen, Nadelhalter, Skalpelle, …).

Both are Contentful content changes, not code regressions. The Astro build
correctly renders current Contentful content.

## Constraint

The live Gatsby site is still hosted on Netlify and is the source for fixture
re-capture. It has a known TLS certificate issue, so the capture tool must
disable certificate verification (e.g. `curl -k`). The live site was not
reachable from the sandbox where M5 was executed (DNS only resolved IPv6
Netlify records; IPv4 attempts returned HTTP 429 from the Netlify edge), so the
capture must be performed from a machine with working access to the live site.

The fixture must reflect the **same Contentful content state** the Astro build
renders. Capture the fixture immediately after a successful `pnpm build` (which
fetches current Contentful content) so the fixture and build are aligned.

## Decision

Re-capture only the homepage fixture (`tests/fixtures/live/index.html`). The
legal page fixtures are current and must not be touched.

Capture process:

1. Run `pnpm build` to confirm the Astro build fetches current Contentful
   content successfully.
2. Fetch the live Gatsby homepage HTML, disabling TLS verification:

   ```sh
   curl -k -o tests/fixtures/live/index.html https://rhode-medizin.de/
   ```

   If the apex redirects to `www.`, follow it. The captured file is the raw
   Gatsby HTML — the parity script's `extractMainContent` normalizes Gatsby
   noise (scripts, gatsby-image wrappers, styled-components classes) at
   comparison time.
3. Run `pnpm compare:pages` and confirm all three pages pass.

If the live site is still returning 429 or is otherwise unreachable, the
capture must wait until access is available. Do not fabricate a fixture from
the Astro build — that would defeat the parity check's purpose.

## Scope

- `tests/fixtures/live/index.html` only.
- No source code changes.
- No changes to `scripts/compare-pages.mjs` — the normalization logic is
  correct; only the fixture data is stale.

## Verification

```sh
pnpm build
pnpm compare:pages
```

Expected: all three pages pass (`imprint`, `data-policy`, `homepage`).

## Out of Scope

- Adding a fixture capture script. The existing manual capture process is
  sufficient; this is a one-time refresh.
- Migrating fixtures to a different capture source (e.g. Contentful API
  snapshots). The live Gatsby site remains the parity reference until Netlify
  is decommissioned in M5 Task 3.
- Fixing the live site's TLS certificate. That is a Netlify/DNS concern handled
  in the M5 Cloudflare cutover.
