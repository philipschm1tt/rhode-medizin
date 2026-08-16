# Task 3 Report: Operational Asset Identity

## Status

Implemented and verified.

## Changes

- Added a seven-record asset manifest using values generated from the frozen cutover fixture and current binaries.
- Preserved the cutover `approved-original` rights notes as manifest provenance.
- Added stable asset IDs to all employee and product-group usage records.
- Added the singleton homepage hero collection record and required content schemas.
- Wired the homepage hero record to both the visible hero and social image.
- Required non-empty `assetId` values in `verifyContent` and added a deletion mutation test.

## TDD Evidence

- Red: `PATH=/tmp/opencode/node-v22.23.2-linux-x64/bin:$PATH node --test --test-name-pattern="rejects a collection record without an asset ID" tests/verifiers/content.test.mjs` failed with `ERR_ASSERTION` because deleting `assetId` produced no verifier error.
- Green: the same focused command passed `1` test with `0` failures after adding `assetId` to both verifier required-string arrays.
- Focused suite: `PATH=/tmp/opencode/node-v22.23.2-linux-x64/bin:$PATH node --test tests/verifiers/content.test.mjs` passed `14` tests with `0` failures.

## Verification Evidence

- `PATH=/tmp/opencode/node-v22.23.2-linux-x64/bin:$PATH pnpm verify:content`: passed, `verify:content: ok (5 employees, 5 product groups, 3 pages)`.
- `PATH=/tmp/opencode/node-v22.23.2-linux-x64/bin:$PATH pnpm build`: passed, Astro check reported `0 errors`, build produced `4 page(s)`.
- `PATH=/tmp/opencode/node-v22.23.2-linux-x64/bin:$PATH pnpm lint`: passed, `All matched files use Prettier code style!`.

## Notes

- The initial build exposed MDX module scoping: non-exported setup statements were rendered as prose and left `hero` undefined. Exporting the loaded/validated hero binding retained the required missing-entry failure and fixed the build.
- Astro check retains existing hints for deprecated `z` usage and the unused `label` parameter; it reports no errors or warnings in its summary.
- No ADR was added because this task implements the prescribed content identity model without an additional architecture decision.
