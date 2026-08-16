# Final review fix report

Status: DONE

## Finding mappings

1. Dynamic employee/product counts: `verify-dist` derives rendered image counts and its summary from current YAML collection records. Tests cover accepted synchronized additions and rejected source/output count mismatches.
2. Generated-image identity: rendered hero, employee, and product bytes are reconstructed with Sharp from each declared source and compared by SHA-256. The mutation suite rejects wrong-source bytes even when written to the original same-stem output URL.
3. Broad Contentful scan: active source and textual built-output checks reject every `*.contentful.com` host, including API, GraphQL, and arbitrary subdomains, while frozen historical fixtures remain excluded.
4. Symlink confinement: manifest asset paths are checked with `realpathSync` so a lexical path inside `src/assets/content` cannot resolve outside it. A regression test creates and rejects an escaping symlink.
5. Honest remote delivery wording: README and ADR 09 now distinguish committed CI/host configuration from remote behavior, whose verification remains pending.
6. Common Sharp formats: asset MIME detection recognizes AVIF, HEIF/HEVC, TIFF, GIF, SVG, JPEG, PNG, and WebP, including Sharp's HEIF-with-AV1 representation of AVIF.
7. AGENTS collection wording: architecture documentation distinguishes the repeated employee/product collections from the singleton `homepageHero` collection.

## Commits

- `2d9017e` Harden steady-state verifiers
- `c1f9c66` Clarify content and delivery documentation

## Verification

All commands used Node.js 22.23.2 through `PATH=/tmp/opencode/node-v22.23.2-linux-x64/bin:/home/philip/.local/share/pnpm:$PATH`.

- `CI=true pnpm install --frozen-lockfile`: PASS, lockfile policy check passed and 421 packages installed.
- `node --test tests/verifiers/assets.test.mjs tests/verifiers/content.test.mjs tests/verifiers/dist.test.mjs`: PASS, 116/116.
- `pnpm verify`: PASS, including lint, source verification, asset verification, build, 120/120 tests, and built-output verification.
- `pnpm lint`: PASS.
- `pnpm compare:pages`: PASS, homepage and both legal pages match frozen cutover fixtures.
- `pnpm compare:legal`: PASS, both legal pages match frozen cutover fixtures.
- `git diff --check`: PASS.

## Concerns

- `astro check` reports 18 existing deprecation hints for `z` imported from `astro:content`; it reports zero errors and zero warnings.
- Remote GitHub Actions, Netlify, and Cloudflare behavior was not externally verified; documentation now states that limitation.
- No ADR was added. The fixes tighten the verifier contract already recorded by ADR 09 and correct its delivery wording without introducing a new architecture decision.
