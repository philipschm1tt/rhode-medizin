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

## Remaining important findings

Status: DONE

### Finding mappings

1. Responsive candidate identity: `verify-dist` now checks every declared-source `srcset` candidate, including `<picture><source>` and fallback `<img>` sets. Each candidate must have a width descriptor matching its decoded width, the expected source or fallback media type, the expected oriented aspect-ratio height, and bytes matching the declared source transformed at that width, height, format, and quality. AVIF is reconstructed through Sharp's AVIF encoder when metadata reports HEIF with AV1 compression.
2. Honest delivery state: AGENTS and ADRs 07/08 preserve Netlify as the accepted production target and Cloudflare Pages as the accepted fallback, while describing committed workflow and Netlify gate configuration as requirements. Final remote GitHub Actions runs, host settings, deploy behavior, DNS, TLS, and fallback availability remain explicitly pending external verification.

### TDD evidence

- Red: `node --test --test-name-pattern="wrong-width same-stem" tests/verifiers/dist.test.mjs` failed 2/2 because existing wrong-width same-stem AVIF and WebP candidates were accepted.
- Green: `node --test --test-name-pattern="complete built-output baseline|wrong-width same-stem|missing local srcset" tests/verifiers/dist.test.mjs` passed 4/4 after responsive identity enforcement.

### Commits

- `c631627` Verify responsive image identities
- `4248dcd` Clarify pending delivery verification

### Verification

All commands used Node.js 22.23.2 through `PATH=/tmp/opencode/node-v22.23.2-linux-x64/bin:/home/philip/.local/share/pnpm:$PATH`.

- `CI=true pnpm install --frozen-lockfile`: PASS, already up to date.
- `node --test tests/verifiers/dist.test.mjs`: PASS, 81/81.
- `pnpm verify`: PASS, including build, 122/122 tests, and built-output verification.
- `pnpm lint`: PASS.
- `pnpm compare:pages`: PASS, all three pages match frozen cutover fixtures.
- `pnpm compare:legal`: PASS, both legal pages match frozen cutover fixtures.
- `git diff --check`: PASS.

### Concerns

- `astro check` continues to report 18 existing deprecation hints for `z` imported from `astro:content`; it reports zero errors and zero warnings.
- Remote GitHub Actions, Netlify, and Cloudflare verification remains pending by design and is now stated consistently.
- No new ADR was added. Responsive identity extends ADR 09's existing verification contract, while ADRs 07/08 were corrected in place without changing their accepted architecture decisions.

## Final documentation finding

Status: DONE

### Mapping

- ADR 09 now distinguishes locally executed verification, committed GitHub Actions and Netlify requirements, required Cloudflare dashboard settings, and remote/provider behavior still pending operator verification.
- The active Netlify operator runbook no longer assumes observed GitHub runs, push-triggered Netlify deploys, Cloudflare GitHub connectivity, fallback URL availability, or automatic 404 behavior. It retains exact build commands, Node version, publish directory, DNS targets, TLS steps, and fallback procedures as requirements to verify and record.
- README's TLS statement now describes intended DCV provisioning and requires operator confirmation.
- The audit covered README, AGENTS, accepted ADRs, and active operator runbooks. Historical specs, completed implementation plans, superseded ADR 06, the explicitly historical local-content cutover runbook, fixtures, and provenance were preserved as records.

### Commit

- `02f2218` Clarify operator verification state

### Verification

- `pnpm lint`: PASS.
- Active-doc targeted phrase audit via the workspace's ripgrep-backed search: no unresolved observed-state claims; remaining matches are historical records or explicit pending-verification wording.
- `pnpm verify`: PASS, including build, 122/122 tests, and built-output verification.
- `git diff --check`: PASS.

### Concerns

- The shell `rg` executable was unavailable, so the equivalent audit used the workspace Grep tool, which is powered by ripgrep.
- `astro check` continues to report 18 existing deprecation hints for `z` imported from `astro:content`; it reports zero errors and zero warnings.
- Remote GitHub Actions, Netlify, Cloudflare, DNS, TLS, and fallback behavior remains pending operator verification.
- No new ADR was added because this corrects the evidence language within ADR 09 and its operator guidance without changing an architecture decision.
