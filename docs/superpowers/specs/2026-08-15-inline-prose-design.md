# Inline Prose as Markdown in MDX Pages - Design

## Status

Proposed

## Context

The local-content migration (spec
`docs/superpowers/specs/2026-08-11-local-content-cms-removal-design.md`,
plan `docs/superpowers/plans/2026-08-13-local-content-cms-removal.md`)
shipped with a divergence from its own stated goal. The spec required
page-specific prose to be inlined as Markdown in each `.mdx` page, copied
from the raw Markdown in the frozen Contentful source export. The
implemented site instead stores pre-rendered HTML fragments in
`src/content/prose/` and injects them with `set:html`:

- `src/content/prose/{imprint,data-policy,index-service,index-aside-iso,index-aside-history}.html`
  hold single-line, pre-rendered HTML.
- `src/pages/imprint.mdx`, `data-policy.mdx`, and three homepage prose
  regions in `index.mdx` import each fragment via `?raw` and render it
  with `<Section set:html={prose} />` or `<Aside set:html={prose} />`.
- `AGENTS.md` was rewritten to bless the divergence: "pre-rendered HTML
  fragments for frozen legal and homepage prose, injected via `set:html`
  so Prettier cannot reflow the text."

This defeats the editing experience the spec was designed to enable. An
editor opening `imprint.mdx` sees a 7-line file that says
`set:html={prose}`; to change a phone number they must open a separate
`.html` file and edit minified HTML.

The divergence was also unnecessary:

- The frozen source confirms every prose blob is Markdown. The imprint
  uses Setext headings (`Impressum\n=========`), the data-policy uses
  ATX (`#### Datenschutzerklärung`), and the homepage sections use ATX
  (`## Beratung,<br/>Service,<br/>Reparatur`).
- The frozen cutover fixtures render to exactly what Satteri produces
  from that Markdown. The HTML detour buys nothing observable.
- The frozen Markdown source uses literal U+00A0 (non-breaking space)
  characters in the data-policy's `a)  personenbezogene Daten` lines
  (bytes `c2 a0 c2 a0 c2 a0 20`). The as-built HTML converted those to
  `&nbsp;&nbsp;&nbsp; ` entities. The bytes differ; the existing
  semantic comparators mask the difference because their `\s+` → ` `
  whitespace normalization treats U+00A0 and `&nbsp;` as equivalent.

The spec's goals and architecture are unchanged and correct. This design
repairs the implementation toward that intent. It does not reopen the
local-content design.

## Goals

- Inline the frozen prose as Markdown into the three `.mdx` pages,
  matching the editing experience the local-content spec required.
- Remove the `src/content/prose/` HTML store and the `set:html` prose
  injection.
- Reproduce the frozen cutover fixtures byte-for-byte in the prose
  regions, so the divergence and the masked nbsp-vs-`&nbsp;` regression
  are both eliminated.
- Add a byte-strict comparison mode so the nbsp-vs-`&nbsp;` class of
  regression cannot be masked again.
- Update `AGENTS.md` to reflect the actual editing model and stop
  blessing the divergence.
- No new ADR; ADR 08 already documents the local-content intent. This
  work brings the code back into alignment with ADR 08.

## Non-goals

- No redesign of the local-content architecture, block components,
  `PageLayout`, collections, schemas, or asset pipeline.
- No change to the frozen capture artifacts other than the new
  `proseNormalization` record in `provenance.json`.
- No rewrite of legal copy. The prose is copied verbatim from the frozen
  source, with the single documented Setext→ATX normalization.
- No replacement of the semantic fixture comparators. The byte-strict
  comparator runs alongside them, not instead of them.

## Prose Normalization

### Default: verbatim inline Markdown

Page-specific prose is copied verbatim from
`tests/fixtures/cutover/contentful-source.json` (`ContentfulTextinhalt.text`
fields, in the frozen `module` order of each page) into the three `.mdx`
pages as Markdown. This preserves:

- Literal U+00A0 (non-breaking space) characters in the data-policy's
  enumeration lines (`a)  personenbezogene Daten`). The as-built HTML
  converted these to `&nbsp;` entities; inlining the Markdown restores
  the literal nbsp bytes that match the frozen fixture.
- Backslash-escaped hyphens like `E\-Mail` and
  `Datenschutz\-Grundverordnung`. Satteri renders these as plain
  hyphens, matching the frozen fixture.
- Two-trailing-space hard line breaks in the imprint's address lines
  (`Heinrich Rhode GmbH  \nAm Brunnen 17  \n...`).
- The literal `>` in the homepage service list item
  `breites Warensortiment > 50.000 Artikel aus über 1.500 Lieferanten`.
  Markdown renders `>` as text inside a list item; the fixture confirms
  this. No escaping to `&gt;` is needed.
- Headings, links, lists, emphasis, and paragraph boundaries exactly as
  frozen.

### One-time Setext → ATX normalization

The frozen imprint prose uses Setext headings:

- `Impressum\n=========` (h1)
- `Angaben gemäß § 5 TMG\n---` (h2)
- `Kontakt\n---` (h2)
- `Umsatzsteuer\n---` (h2)
- `Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV\n---` (h2)

These are rewritten once, level-preserving, to ATX:

- `# Impressum`
- `## Angaben gemäß § 5 TMG`
- `## Kontakt`
- `## Umsatzsteuer`
- `## Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV`

The frozen imprint also uses ATX `###` for `Haftung für Inhalte` and
`Haftung für Links`; those are left alone. The frozen data-policy uses
ATX throughout (`####`, `#####`); no normalization is needed there. The
homepage prose uses ATX (`###`); no normalization is needed there.

The rendered DOM is unchanged by this normalization. Setext and ATX
headings at the same level produce the same `<hN>` element in the
fixture.

This normalization is a one-time, recorded event. It is not a precedent
for future prose edits. Future edits keep whatever heading style the
surrounding prose uses.

### One explicit HTML exception

The homepage service heading is authored as raw HTML inline:

```mdx
<h2>Beratung,<br />Service,<br />Reparatur</h2>
```

This is the single case the local-content spec explicitly allows: "the
services heading remains one `<h2>` with three lines separated by
`<br />`, rather than a single Markdown heading without line breaks."
The `<br />` form (with the space) matches Astro's HTML serialization
of `<br/>` in the frozen fixture after the comparator's whitespace
normalization.

The rest of that section (the bullet list of services) is Markdown
copied verbatim from the frozen `textabschnitt.text`, with the heading
line removed (it is replaced by the inline `<h2>` above).

### Provenance record

`tests/fixtures/cutover/provenance.json` gains a `proseNormalization`
field:

```json
{
  "proseNormalization": {
    "appliedAt": "<ISO 8601 UTC>",
    "appliedInCommit": "<git rev-parse HEAD output>",
    "files": ["src/pages/imprint.mdx"],
    "transformation": "Setext headings rewritten level-preserving to ATX",
    "justification": "ATX is friendlier to edit; rendered DOM is identical to the frozen fixture.",
    "notNormalized": ["src/pages/data-policy.mdx", "src/pages/index.mdx"]
  }
}
```

No new ADR is added. ADR 08 already documents the local-content intent;
this work brings the code back into alignment with it. The
`proseNormalization` record is migration provenance and is not consumed
by any verification script.

### Prettier interaction

After inlining, `pnpm format` runs on the `.mdx` files. Prettier may
reflow long paragraphs in the legal pages. Block-level structure
(`PageLayout`, `Section`, `Aside`, headings, lists) is preserved because
Prettier treats JSX and block Markdown as untouchable boundaries. The
semantic fixture comparators normalize whitespace (`\s+` → ` `), so
reflowed prose still matches the frozen fixtures. The byte-strict
comparator (below) operates per prose region after entity unescape and
inter-element whitespace normalization, so Prettier's reflowing of
spaces inside paragraphs is equivalent there too.

## Page Structure

### `src/pages/imprint.mdx`

Frontmatter imports `PageLayout` and `Section` only. No `?raw` import,
no `set:html`. The body is `<PageLayout title="Impressum">` containing
one `<Section>` whose children are the inlined Markdown: `# Impressum`,
`## Angaben gemäß § 5 TMG`, the address paragraphs with two-trailing-space
hard breaks, `## Kontakt`, `## Umsatzsteuer`, `## Verantwortlich für den
Inhalt nach § 55 Abs. 2 RStV`, `### Haftung für Inhalte`, `### Haftung
für Links`, and the rest of the frozen prose verbatim.

### `src/pages/data-policy.mdx`

`<PageLayout title="Datenschutzhinweis">` → `<Section>` → the inlined
Markdown starting with `#### Datenschutzerklärung`. All ATX headings
(no Setext in the frozen source). Literal U+00A0 characters preserved
in the `a)  personenbezogene Daten` enumeration lines. Long; that is
expected and accepted.

### `src/pages/index.mdx`

Structure stays as built, with the three prose regions inlined where
they belong in frozen module order:

1. After `<Hero>`: the service section as `<Section>` containing
   `<h2>Beratung,<br />Service,<br />Reparatur</h2>` followed by the
   Markdown bullet list (from the frozen `textabschnitt.text`, with the
   heading line removed and replaced by the inline `<h2>`).
2. `<Aside>` containing the ISO prose (from the frozen `textabschnitt`
   with `### DIN ISO 9001:2015` and following) as inlined Markdown.
3. `<Quote text="Wir nehmen uns Zeit für Sie – Service ist unsere Stärke." />`
   (unchanged).
4. `<Section>` with `## Wer wir sind` and the employees `<Tiles>`
   (unchanged).
5. `<Aside>` containing the history prose (from the frozen
   `textabschnitt` with `### Qualität und Service seit 1927` and
   following) as inlined Markdown.
6. `<Quote text="Über 90 Jahre Kompetenz im Gesundheitswesen." />`
   (unchanged).
7. `<Section fullWidth dark>` with `## Unser Warensortiment` and the
   product-groups `<Tiles>` (unchanged).

The three `?raw` imports (`serviceProse`, `isoProse`, `historyProse`)
are removed. No `set:html` on any prose region. The `<Hero>`, `<Quote>`,
`<Tiles>`, and data-loading code remain exactly as built.

This matches the spec's example `index.mdx`, which shows prose directly
inside `<Section>` between the hero and the tiles. The as-built
replaced that with `<Section set:html={serviceProse} />` — a Section
whose slot was empty in the MDX. After this fix, the service prose is
literally inside the `<Section>` slot as Markdown, which is what the spec
drew.

## Verification

### Existing semantic comparators (unchanged)

`scripts/compare-pages.mjs` and `scripts/compare-legal-pages.mjs` keep
their current `\s+` → ` ` whitespace normalization. They continue to
catch structural regressions (missing elements, attribute changes, link
`href` drift) and pass when Prettier reflows prose.

### New byte-strict comparator — `scripts/compare-prose-bytes.mjs`

A new script that verifies the built output's prose regions match the
frozen fixtures byte-for-byte after unescaping HTML entities and
trimming per-element whitespace. It runs alongside the semantic
comparators; it does not replace them.

Behavior:

1. Load the three built pages from `dist/`.
2. For each prose-bearing region — the imprint `<section>`, the
   data-policy `<section>`, and the three homepage prose regions inside
   their `<Section>`/`<Aside>` wrappers — extract the rendered HTML.
   The region selectors are derived from the existing `Section`/`Aside`
   component markup so they remain stable.
3. Unescape HTML entities in both the built region and the corresponding
   frozen fixture region: `&nbsp;` → U+00A0, `&gt;` → `>`, `&amp;` →
   `&`, `&quot;` → `"`, `&#39;` → `'`. Use a standard entity decode.
4. Normalize only insignificant inter-element whitespace: collapse runs
   of whitespace *between* tags to a single space; leave text-node
   content alone except for trimming leading/trailing space per text
   node. This is narrower than the semantic comparators' `\s+` → ` `:
   it does not collapse whitespace inside text content, so nbsp-vs-space
   differences inside a heading remain visible.
5. Compare the resulting strings byte-for-byte. Any difference fails
   with a unified diff showing the exact byte change.

Why this works: the frozen fixture contains literal U+00A0 in
`a)  personenbezogene Daten`. The current as-built HTML contains
`&nbsp;&nbsp;&nbsp; ` there. After unescaping, the as-built becomes
three U+00A0 + space, while the frozen fixture is two U+00A0 + space
— a real byte difference the byte-strict comparator catches and the
semantic comparators mask. With the inline-Markdown approach, the built
output contains the literal nbsp directly (no entities), so it matches
the fixture by construction.

What the byte-strict comparator does NOT do: it does not replace the
semantic comparators, does not check metadata or sitemap (that is
`verify:dist`), and does not validate images (that is `verify:assets`).
It is narrowly scoped to the prose-regions byte regression.

### `package.json`

- New script: `"verify:prose": "node scripts/compare-prose-bytes.mjs"`.
- The `verify` aggregate becomes:
  `pnpm lint && pnpm verify:content && pnpm verify:assets && pnpm build && pnpm compare:legal && pnpm compare:pages && pnpm verify:prose && pnpm verify:dist`.
- PR CI (`.github/workflows/verify.yml`) runs `pnpm verify`, so the new
  step is picked up without a workflow edit.

### Expected outcome

`pnpm verify` passes end-to-end. The inline Markdown reproduces the
frozen fixtures (semantic comparators pass), and the byte-strict
comparator confirms the prose regions match byte-for-byte after entity
unescape.

## Documentation

### `AGENTS.md`

- Architecture section: replace the bullet that says
  `src/content/prose/` holds pre-rendered HTML fragments injected via
  `set:html` with: "Page-specific prose (legal copy, homepage
  sections, asides) is inlined as Markdown in each `.mdx` page. Explicit
  HTML is used only where Markdown would change the frozen DOM (e.g.
  the service heading's `<br />`-separated lines). No separate prose
  store, no `set:html` for frozen prose."
- Architecture section, block bullet: clarify that `Section` and
  `Aside` render MDX in their default slot; pages compose prose
  Markdown and block components as children.
- Commands section: add `pnpm verify:prose` to the list of `verify:*`
  commands and update the `verify` aggregate description to mention
  the prose byte-strict check.

No other `AGENTS.md` changes. The rest of the file (commands,
environment, deploy, ADR policy) is already correct after the original
migration.

### `README.md`

No change. It describes `pnpm verify` at the aggregate level and does
not mention `prose/` or `set:html`.

### ADRs

No new ADR. ADR 08 already documents the local-content intent
correctly. The as-built diverged from ADR 08; this work brings the code
back into alignment. The implementation plan's completion summary
notes that no new ADR was needed, per the AGENTS.md "Spec-driven work
and ADRs" rule.

### Operator runbooks

No change. The cutover/retirement runbooks describe deployment, not
editing.

## Files Touched

- Modify: `src/pages/index.mdx` — inline three prose regions as
  Markdown; remove the three `?raw` imports and `set:html` usage.
- Modify: `src/pages/imprint.mdx` — inline the imprint prose as
  Markdown; remove the `?raw` import and `set:html` usage.
- Modify: `src/pages/data-policy.mdx` — inline the data-policy prose as
  Markdown; remove the `?raw` import and `set:html` usage.
- Delete: `src/content/prose/` and its five files (`imprint.html`,
  `data-policy.html`, `index-service.html`, `index-aside-iso.html`,
  `index-aside-history.html`).
- Create: `scripts/compare-prose-bytes.mjs`.
- Modify: `package.json` — add `verify:prose` script and extend the
  `verify` aggregate.
- Modify: `tests/fixtures/cutover/provenance.json` — add
  `proseNormalization` field.
- Modify: `AGENTS.md` — replace the `prose/` bullet and clarify the
  `Section`/`Aside` slot contract; add `verify:prose` to the commands
  list.

## Acceptance Criteria

The work is complete only when all of the following are true:

- `src/content/prose/` and its five files are deleted.
- The three `.mdx` pages contain the frozen prose inlined as Markdown.
  No `?raw` prose import and no `set:html` on prose remain in any
  `.mdx` page.
- The single explicit HTML exception (the homepage service heading
  `<h2>Beratung,<br />Service,<br />Reparatur</h2>`) is present in
  `src/pages/index.mdx` and is the only raw-HTML-for-prose case in the
  page.
- `tests/fixtures/cutover/provenance.json` records the one-time
  Setext→ATX normalization in the `proseNormalization` field.
- `AGENTS.md` no longer mentions `src/content/prose/` or `set:html` for
  frozen prose; it describes the inline-Markdown editing model and
  lists `pnpm verify:prose` among the `verify:*` commands.
- `scripts/compare-prose-bytes.mjs` exists and verifies the prose
  regions of the three built pages against the frozen cutover fixtures
  byte-for-byte after entity unescape and inter-element whitespace
  normalization.
- `pnpm verify` passes, including the new `verify:prose` step in the
  aggregate sequence.
- The build's prose regions use literal U+00A0 (not `&nbsp;` entities)
  where the frozen source used literal nbsp.
- No new ADR is added; ADR 08 is unchanged.

## Out of Scope (explicit)

- The block components, `PageLayout`, collections, schemas, asset
  pipeline, and verification scripts other than the comparators are not
  modified.
- The frozen capture artifacts under `tests/fixtures/cutover/` are not
  regenerated; only the new `proseNormalization` record is added to
  `provenance.json`.
- Legal copy is not rewritten. The Setext→ATX normalization is the only
  transformation applied to prose.
- The semantic fixture comparators are not replaced or weakened.
- No Prettier configuration change (`.prettierignore`, inline
  `prettier-ignore`) is introduced. Prettier reflows the inlined prose,
  and the comparators handle it.
