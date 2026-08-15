# Inline Prose as Markdown in MDX Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the editing experience the local-content spec required by inlining the frozen prose as Markdown into the three `.mdx` pages and removing the `src/content/prose/` HTML store and `set:html` prose injection.

**Architecture:** The frozen prose lives as Markdown in `tests/fixtures/cutover/contentful-source.json` (`ContentfulTextinhalt.text` fields). It is copied verbatim into `src/pages/{index,imprint,data-policy}.mdx`, with one-time Setext→ATX normalization for the imprint page recorded in `provenance.json`. The five `src/content/prose/*.html` files are deleted. No new verification script is added; the existing semantic comparators (`compare:pages`, `compare:legal`) continue to gate output parity under their whitespace normalization, which passes for both the as-built HTML detour and the inline-Markdown approach. The editing-experience goal is verified by reading the `.mdx` source.

**Tech Stack:** Astro 7, `@astrojs/mdx`, `@astrojs/markdown-satteri` (Satteri processor with `gfm: false`, `smartPunctuation: false`), pnpm/Prettier, GitHub Actions CI.

## Global Constraints

- Source of truth for content is `docs/superpowers/specs/2026-08-15-inline-prose-design.md`.
- The migration is one pull request; no operational cutover, no Contentful changes, no deploy changes.
- Prose is copied verbatim from `tests/fixtures/cutover/contentful-source.json` (`ContentfulTextinhalt.text` fields), in the frozen `module` order of each page. Do not paraphrase, reformat, or modernize. The only transformation is Setext→ATX for the imprint page (Task 3).
- Satteri processor config (`astro.config.mjs`) is unchanged: `features: { gfm: false, smartPunctuation: false, frontmatter: false }`. The frozen prose already renders correctly under this config; do not toggle GFM or smart punctuation.
- Prettier config is unchanged: no semicolons, single quotes, ES5 trailing commas, 2-space indent, LF. `pnpm format` runs on `.mdx` files and may reflow long paragraphs. That is expected and accepted; the semantic comparators handle it.
- Do not modify the block components, `PageLayout`, `content.config.ts`, the asset pipeline, `package.json` scripts, or any verification script. The `verify` aggregate is unchanged.
- Do not regenerate the frozen capture artifacts under `tests/fixtures/cutover/`. The only capture-artifact change is updating the existing `reconciliation` entry in `provenance.json` and adding a new `proseNormalization` field.
- No new ADR. ADR 08 already documents the local-content intent; this work brings the code back into alignment. The completion summary states that no new ADR was needed.
- Run `pnpm lint` before considering any task done; record the shell error if `pnpm` is unavailable.
- The build runs `astro check` before `astro build`. `astro check` does not type-check MDX prop usage; MDX composition is gated by build, fixture comparison, content integrity, and `verify:dist`.
- No comments in code unless explicitly requested.
- Use the local `commit-workflow` skill before creating any commit in this repository.

---

## File Structure

- Modify: `src/pages/index.mdx` — inline three prose regions (service section, ISO aside, history aside) as Markdown; remove the three `?raw` imports and `set:html` usage; keep `<Hero>`, `<Quote>`, `<Tiles>`, and data-loading code unchanged.
- Modify: `src/pages/imprint.mdx` — inline the imprint prose as Markdown (Setext→ATX normalized); remove the `?raw` import and `set:html` usage.
- Modify: `src/pages/data-policy.mdx` — inline the data-policy prose as Markdown (verbatim, including literal U+00A0); remove the `?raw` import and `set:html` usage.
- Delete: `src/content/prose/` and its five files (`imprint.html`, `data-policy.html`, `index-service.html`, `index-aside-iso.html`, `index-aside-history.html`).
- Modify: `tests/fixtures/cutover/provenance.json` — update the existing `reconciliation` entry that blessed the HTML detour; add the new `proseNormalization` field.
- Modify: `AGENTS.md` — replace the `src/content/prose/` bullet with the inline-Markdown description; clarify the `Section`/`Aside` slot contract.

---

### Task 1: Update `provenance.json` to retire the HTML-detour blessing

This task corrects the migration provenance first so it no longer documents the HTML detour as an intentional decision. The existing `reconciliation` entry that blessed `set:html` is updated, and a new `proseNormalization` field records the one-time Setext→ATX normalization the imprint page will use (Task 3 fills in the commit SHA).

**Files:**
- Modify: `tests/fixtures/cutover/provenance.json`

**Interfaces:**
- Consumes: none.
- Produces: a `provenance.json` whose `reconciliation` no longer blesses the HTML detour and whose `proseNormalization` records the upcoming Setext→ATX normalization. `verify:content` and other gates do not read these fields; they are records.

- [ ] **Step 1: Replace the `reconciliation` entry that blessed the HTML detour**

In `tests/fixtures/cutover/provenance.json`, find the existing `reconciliation` array entry with `check: "markdown processor"`. Its current `notes` field is:

```text
Satteri with gfm: false, smartPunctuation: false replaces the old remark-parse/remark-rehype pipeline. Legal prose is pre-rendered to HTML fragments under src/content/prose/ and injected via set:html to avoid Prettier reflowing frozen text.
```

Replace that entry's `notes` with:

```text
Satteri with gfm: false, smartPunctuation: false replaces the old remark-parse/remark-rehype pipeline. Page-specific prose is inlined as Markdown in each .mdx page; explicit HTML is used only where Markdown would change the frozen DOM (the homepage service heading). The earlier implementation pre-rendered prose to HTML fragments under src/content/prose/ and injected via set:html to avoid Prettier reflowing frozen text; that detour was reverted because it violated the editing-experience intent of the local-content spec. Prettier reflows the inline Markdown; the fixture comparators confirm parity.
```

Leave the other two `reconciliation` entries (`frozen-source vs production`, `image alt text`) unchanged.

- [ ] **Step 2: Add the `proseNormalization` field**

Add a new top-level field to `tests/fixtures/cutover/provenance.json` (after `reconciliation`):

```json
"proseNormalization": {
  "appliedAt": "<ISO 8601 UTC of Task 3 commit>",
  "appliedInCommit": "<full SHA of Task 3 commit>",
  "files": ["src/pages/imprint.mdx"],
  "transformation": "Setext headings rewritten level-preserving to ATX",
  "justification": "ATX is friendlier to edit; rendered DOM is identical to the frozen fixture.",
  "notNormalized": ["src/pages/data-policy.mdx", "src/pages/index.mdx"]
}
```

The `appliedAt` and `appliedInCommit` values are filled in during Task 3's commit step. For now, leave them as the placeholder strings above; Task 3 Step 5 updates them with the real values.

- [ ] **Step 3: Validate the JSON**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('tests/fixtures/cutover/provenance.json','utf8')); console.log('valid')"
```

Expected: prints `valid`. If it errors, fix the JSON syntax (most likely a trailing comma or missing comma between `reconciliation` and `proseNormalization`).

- [ ] **Step 4: Lint and commit**

Run:

```bash
pnpm lint
git add tests/fixtures/cutover/provenance.json
git commit -m "Update provenance to retire HTML-detour blessing and record prose normalization"
```

Expected: one commit updates `provenance.json` only. `appliedInCommit` is still a placeholder; Task 3 updates it.

---

### Task 2: Inline the homepage prose into `index.mdx`

This task inlines the three homepage prose regions (service section, ISO aside, history aside) as Markdown into `src/pages/index.mdx` and removes the three `?raw` imports and `set:html` usage. The service heading becomes the one explicit raw-HTML inline `<h2>`. The `<Hero>`, `<Quote>`, `<Tiles>`, and data-loading code stay unchanged.

**Files:**
- Modify: `src/pages/index.mdx`

**Interfaces:**
- Consumes: `tests/fixtures/cutover/contentful-source.json` for the verbatim prose text (the implementer reads the exact `text` fields at execution time and copies them verbatim). The three textabschnitt IDs are: `1bpttYZWYiOkGouGGCumU6` (service prose), `4RbNSyFGO4U0w866u8qSuM` (ISO aside prose), `HV4s4DGD020UKCSA42E4w` (history aside prose).
- Produces: a `src/pages/index.mdx` whose three prose regions are inline Markdown, no `?raw` imports, no `set:html` on prose.

- [ ] **Step 1: Extract the three prose texts from the frozen source**

Run this to print the exact prose for each region:

```bash
node -e "
const s=require('./tests/fixtures/cutover/contentful-source.json');
for (const id of ['1bpttYZWYiOkGouGGCumU6','4RbNSyFGO4U0w866u8qSuM','HV4s4DGD020UKCSA42E4w']) {
  const e = s.entries.find(x=>x.id===id);
  console.log('=== '+id+' ===');
  console.log(e.fields.text);
  console.log('--- end ---');
}
"
```

Copy each block verbatim into the next step. Do not paraphrase, reflow, or convert entities. The service prose's `## Beratung,<br/>Service,<br/>Reparatur` heading line is replaced by the inline `<h2>` per the spec; the rest of the service prose (the bullet list) is inlined as Markdown.

- [ ] **Step 2: Replace `src/pages/index.mdx` with the inlined version**

Replace the entire file with:

````mdx
import { getCollection } from 'astro:content'
import PageLayout from '../layouts/PageLayout.astro'
import heroImage from '../assets/content/hero-image.jpg'
import Hero from '../components/blocks/Hero.astro'
import Section from '../components/blocks/Section.astro'
import Aside from '../components/blocks/Aside.astro'
import Quote from '../components/blocks/Quote.astro'
import Tiles from '../components/blocks/Tiles.astro'
import EmployeeTile from '../components/blocks/EmployeeTile.astro'
import ProductGroup from '../components/blocks/ProductGroup.astro'

export const employees = (await getCollection('employees'))
  .sort((a, b) => a.data.order - b.data.order)
  .map(({ data }) => ({
    name: data.name,
    department: data.department,
    photo: data.photo,
    alt: data.alt,
  }))

export const productGroups = (await getCollection('productGroups'))
  .sort((a, b) => a.data.order - b.data.order)
  .map(({ data }) => ({
    name: data.name,
    description: data.description,
    examples: data.examples,
    photo: data.photo,
    alt: data.alt,
  }))

<PageLayout
  title="Rhode Medizintechnik – Heinrich Rhode GmbH"
  description="Heinrich Rhode GmbH – Medizintechnik für Praxen und Kliniken. Beratung, Service und Produkte aus einer Hand."
  socialImage={heroImage}
>
  <Hero
    headline="Medizintechnik mit Tradition"
    subhead="Medizinische Geräte, Instrumente und Mobilar für Ärzte und Krankenhäuser mit Liefer- und Aufstellservice in Oberbayern."
    cta="Jetzt Kontakt aufnehmen"
    image={heroImage}
    alt=""
  />

  <Section>
    <h2>Beratung,<br />Service,<br />Reparatur</h2>

    - kostenlose Beratung
    - kostenlose Erstellung von Angeboten
    - Vor-Ort-Service
    - Abholung und Verwaltung von Reparaturen
    - schnelle Reaktionszeit durch kurze Bearbeitungswege
    - breites Warensortiment > 50.000 Artikel aus über 1.500
      Lieferanten
  </Section>

  <Aside>
    ### DIN ISO 9001:2015

    Die Heinrich Rhode GmbH ist nach DIN ISO 9001:2015 zertifiziert.

    #### Zertifizierungsstelle

    TÜV SÜD Management Service GmbH

    #### Geltungsbereich

    Vertrieb von chirurgischem Instrumentarium, medizinischen Geräten und Mobilar.

    #### Zertifikat-Registrier-Nummer

    12 100 11122 TMS

    #### Gültig bis

    09\. Dezember 2027
  </Aside>

  <Quote text="Wir nehmen uns Zeit für Sie – Service ist unsere Stärke." />

  <Section>
    <h2>Wer wir sind</h2>

    <Tiles
      layout="grid"
      items={employees}
      itemComponent={EmployeeTile}
    />
  </Section>

  <Aside>
    ### Qualität und Service seit 1927

    #### vor 1927

    Der Firmengründer Heinrich Rhode arbeitete mit dem damals führenden deutschen Chirurgen Ernst Ferdinand Sauerbruch an der Münchner Universität.

    #### 1927

    Nach dem Umzug von Ernst Ferdinand Sauerbruch nach Berlin gründete Heinrich Rhode den Gewerbebetrieb Rhode in München an der Pettenkoferstrasse.

    #### 1957

    Die Herren Fritz Schlumberger und Johann Schmitt führten den Betrieb als eingetragenes Unternehmen fort.

    #### 1977

    Umwandlung der Firma in eine GmbH. Bis 2002 lenkten die Brüder Gerd und Werner Schmitt die Geschicke der Heinrich Rhode GmbH, Medizintechnik.

    #### 1993

    Umzug des Unternehmens von der Münchner Innenstadt nach Kirchheim b. München

    #### 1998

    Zertifizierung des Unternehmens durch den TÜV Süddeutschland nach ISO 9002

    #### 2002

    Am zweiten Januar 2002 trat Herr Gerd Schmitt in den Ruhestand. Seither leiten Herr Robert Renz und Herr Werner Schmitt die Firma.

    #### 2009

    Zertifizierung des Unternehmens durch den TÜV Süddeutschland nach ISO 9001
  </Aside>

  <Quote text="Über 90 Jahre Kompetenz im Gesundheitswesen." />

  <Section fullWidth dark>
    <h2>Unser Warensortiment</h2>

    <Tiles
      layout="list"
      items={productGroups}
      itemComponent={ProductGroup}
    />
  </Section>
</PageLayout>
````

Notes on this content:

- The three `?raw` imports (`serviceProse`, `isoProse`, `historyProse`) are gone. No `set:html` anywhere.
- The service section uses the explicit raw-HTML inline `<h2>Beratung,<br />Service,<br />Reparatur</h2>` (the one allowed HTML exception). The bullet list below it is Markdown copied verbatim from the frozen `textabschnitt.text`, with the `## Beratung,<br/>Service,<br/>Reparatur` heading line removed and replaced by the inline `<h2>`.
- The ISO aside and history aside prose are Markdown copied verbatim from the frozen `textabschnitt.text` fields, including the ATX headings (`###`, `####`) exactly as frozen. No Setext normalization is needed for the homepage.
- The `09. Dezember 2027` date in the ISO aside is authored as `09\. Dezember 2027` (backslash-escaped `.`) so Satteri does not interpret `09.` as an ordered-list marker. The frozen source has `09. Dezember 2027` without the escape (the old remark processor did not treat it as a list marker), but Satteri does; the escape is the documented transformation the spec's Page MDX shape section calls out ("a standalone date such as `09. Dezember 2027` is authored as `09\\. Dezember 2027` so Markdown does not interpret it as an ordered-list marker"). The rendered `<p>09. Dezember 2027</p>` matches the frozen fixture.
- The `<Hero>`, `<Quote>`, `<Tiles>`, and data-loading code are unchanged from the as-built.
- The `<Section>` and `<Aside>` blocks now contain Markdown in their default slot, which is what the spec required.

- [ ] **Step 3: Format the file with Prettier**

Run:

```bash
pnpm format
```

Expected: Prettier rewrites `src/pages/index.mdx` (and possibly other files; only commit `index.mdx` in this task). Prettier may reflow the long bullet list line (`breites Warensortiment > 50.000 Artikel aus über 1.500 Lieferanten`) onto one line and adjust whitespace around JSX attributes. That is expected; do not revert Prettier's changes to `index.mdx`.

If Prettier reports a parse error on the `.mdx`, the most likely cause is the inline `<h2>...<br />...</h2>` not being recognized as a JSX block. Verify the file saved with the exact content above; the blank lines around the `<h2>` are required so MDX parses it as a JSX block.

- [ ] **Step 4: Build and run the semantic comparator**

Run:

```bash
pnpm build
pnpm compare:pages
```

Expected: `pnpm build` succeeds. `pnpm compare:pages` PASSES for the homepage — the semantic comparator's whitespace normalization (`\s+` → ` `) and cheerio's entity normalization cover any Prettier reflow and Satteri's `>` → `&gt;` escaping.

If `compare:pages` FAILs, the diff shows the structural difference. The most likely cause is a missing or extra element in the inlined Markdown; re-read the frozen source and fix the Markdown. Do not proceed to the next task until `compare:pages` passes for the homepage.

- [ ] **Step 5: Lint and commit**

Run:

```bash
pnpm lint
git add src/pages/index.mdx
git commit -m "Inline homepage prose as Markdown and drop set:html"
```

Expected: one commit modifies `src/pages/index.mdx` only. `compare:pages` passes for the homepage.

---

### Task 3: Inline the imprint prose into `imprint.mdx` with Setext→ATX normalization

This task inlines the imprint prose as Markdown into `src/pages/imprint.mdx`, applies the one-time Setext→ATX normalization to the five Setext headings, removes the `?raw` import and `set:html` usage, and updates `provenance.json` with the actual Task 3 commit SHA and timestamp.

**Files:**
- Modify: `src/pages/imprint.mdx`
- Modify: `tests/fixtures/cutover/provenance.json` (fill in `appliedAt` and `appliedInCommit`)

**Interfaces:**
- Consumes: `tests/fixtures/cutover/contentful-source.json` for the verbatim imprint prose (textabschnitt ID `4BFxbdzDDGAGe2q0y6qkQS`).
- Produces: a `src/pages/imprint.mdx` whose single `<Section>` contains the inlined imprint Markdown with ATX headings. `compare:legal` passes for the imprint.

- [ ] **Step 1: Extract the imprint prose from the frozen source**

Run:

```bash
node -e "
const s=require('./tests/fixtures/cutover/contentful-source.json');
const e = s.entries.find(x=>x.id==='4BFxbdzDDGAGe2q0y6qkQS');
console.log(e.fields.text);
"
```

Copy the output verbatim. The frozen prose uses Setext headings: `Impressum\n=========` (h1), `Angaben gemäß § 5 TMG\n---` (h2), `Kontakt\n---` (h2), `Umsatzsteuer\n---` (h2), `Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV\n---` (h2). It also uses ATX `###` for `Haftung für Inhalte`, `Haftung für Links`, and `Urheberrecht`.

- [ ] **Step 2: Replace `src/pages/imprint.mdx` with the inlined, Setext→ATX-normalized version**

Apply the level-preserving Setext→ATX normalization:

- `Impressum\n=========` → `# Impressum`
- `Angaben gemäß § 5 TMG\n---` → `## Angaben gemäß § 5 TMG`
- `Kontakt\n---` → `## Kontakt`
- `Umsatzsteuer\n---` → `## Umsatzsteuer`
- `Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV\n---` → `## Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV`

Leave all ATX `###` headings and all other text (paragraphs, backslash-escaped hyphens like `E\-Mail`, the `Quelle: [eRecht24](https://www.e-recht24.de)` link) verbatim from the frozen source. The frozen source's two-trailing-space hard line breaks are authored as explicit `<br />` tags instead (see the Notes below the code block for why).

Replace the entire file with:

````mdx
import PageLayout from '../layouts/PageLayout.astro'
import Section from '../components/blocks/Section.astro'

<PageLayout title="Impressum">
  <Section>
    # Impressum

    ## Angaben gemäß § 5 TMG

    Heinrich Rhode GmbH<br />
    Am Brunnen 17<br />
    85551 Kirchheim b. München

    Handelsregister: HRB München B 55558
    Registergericht: Registergericht München

    **Vertreten durch die Geschäftsführer:**<br />
    Robert Renz<br />
    Werner Schmitt

    ## Kontakt

    Telefon: 089/9 03 66 49<br />
    Telefax: 089/9 03 04 37<br />
    E\-Mail: info@rhode\-medizin.de

    ## Umsatzsteuer

    Umsatzsteuer\-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br />
    DE 252005966

    Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.

    ## Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV

    Robert Renz<br />
    Am Brunnen 17<br />
    85551 Kirchheim b. München

    ### Haftung für Inhalte

    Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.

    Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.

    ### Haftung für Links

    Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.

    Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.

    ### Urheberrecht

    Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.

    Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.

    Quelle: [eRecht24](https://www.e-recht24.de)
  </Section>
</PageLayout>
````

Notes:

- Every Setext heading is replaced by its level-preserving ATX equivalent. Every other line (paragraphs, escaped hyphens, the `Quelle:` link) is verbatim from the frozen source.
- The frozen source uses two-trailing-space hard line breaks for the address lines (`Heinrich Rhode GmbH  \nAm Brunnen 17  \n...`). This plan authors those breaks as explicit `<br />` tags instead, because Prettier strips trailing whitespace from indented Markdown content inside MDX JSX blocks (verified: `pnpm format` removes trailing two-space hard breaks from 4-space-indented prose, but preserves them at column 0; the prose here is indented to nest inside `<Section>`). The `<br />` form is Prettier-stable and renders to the same `<br>` element Satteri produces from a two-space hard break. This is the explicit-HTML-where-necessary case the spec allows ("syntax-only escapes or explicit HTML are used where necessary to preserve the old rendered DOM"). The rendered `<p>Heinrich Rhode GmbH<br> Am Brunnen 17<br> 85551 Kirchheim b. München</p>` matches the frozen fixture.

- [ ] **Step 3: Format the file with Prettier**

Run:

```bash
pnpm format
```

Expected: Prettier rewrites `src/pages/imprint.mdx`. It may reflow long paragraphs (the `Haftung für Inhalte` etc. paragraphs) onto single long lines. That is expected; the semantic comparator normalizes whitespace.

- [ ] **Step 4: Build and run the semantic comparator**

Run:

```bash
pnpm build
pnpm compare:legal
```

Expected: `pnpm build` succeeds. `pnpm compare:legal` PASSES (the semantic comparator normalizes whitespace, and Setext→ATX produces the same `<h1>`/`<h2>` elements as the frozen fixture).

If `compare:legal` FAILs with a heading-level difference, the Setext→ATX mapping is wrong. The frozen fixture's top heading is `<h1>Impressum</h1>` (from `Impressum\n=========`), so the ATX form must be `# Impressum` (one `#`), not `## Impressum`. Re-check the mapping in Step 2.

- [ ] **Step 5: Update `provenance.json` with the actual Task 3 commit SHA and timestamp**

In `tests/fixtures/cutover/provenance.json`, find the `proseNormalization` field added in Task 1. Replace the placeholder values with the real ones. Because the SHA does not exist until the commit is made, use this two-step approach:

1. First, commit `src/pages/imprint.mdx` with the placeholder still in `provenance.json` (Step 6 below).
2. Then immediately get the SHA with `git rev-parse HEAD` and the timestamp with `date -u +%Y-%m-%dT%H:%M:%SZ`.
3. Edit `tests/fixtures/cutover/provenance.json` to replace both placeholder strings with the real values.
4. Create a second commit: `git add tests/fixtures/cutover/provenance.json && git commit -m "Record imprint prose normalization commit SHA in provenance"`.

Alternatively, if your workflow allows amending, commit with the placeholder, get the SHA with `git rev-parse HEAD`, edit the file, and `git commit --amend --no-edit`. Either approach is acceptable; the end state is a `provenance.json` whose `proseNormalization.appliedInCommit` matches the SHA of the commit that inlined the imprint prose (or, in the two-commit approach, the SHA of the first commit).

- [ ] **Step 6: Validate JSON, lint, and commit**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('tests/fixtures/cutover/provenance.json','utf8')); console.log('valid')"
pnpm lint
git add src/pages/imprint.mdx tests/fixtures/cutover/provenance.json
git commit -m "Inline imprint prose as Markdown with Setext to ATX normalization"
```

Expected: one commit modifies `src/pages/imprint.mdx` and `tests/fixtures/cutover/provenance.json`. `compare:legal` passes for the imprint. If you used the two-commit approach, follow with the second commit per Step 5.

---

### Task 4: Inline the data-policy prose into `data-policy.mdx`

This task inlines the data-policy prose as Markdown into `src/pages/data-policy.mdx`, preserving the literal U+00A0 (non-breaking space) bytes in the enumeration lines, and removes the `?raw` import and `set:html` usage. The data-policy uses ATX throughout, so no Setext normalization is needed.

**Files:**
- Modify: `src/pages/data-policy.mdx`

**Interfaces:**
- Consumes: `tests/fixtures/cutover/contentful-source.json` for the verbatim data-policy prose (textabschnitt ID `2UNE5JSQ3Y8KOCOqSKcYcM`).
- Produces: a `src/pages/data-policy.mdx` whose single `<Section>` contains the inlined data-policy Markdown with literal U+00A0 in the enumeration lines. `compare:legal` passes for the data-policy.

- [ ] **Step 1: Build the new `src/pages/data-policy.mdx` programmatically**

The data-policy prose is long (~210 lines). To inline it safely without a transcription error (especially the literal U+00A0 bytes, which are easy to lose to regular spaces when hand-editing), generate the new file programmatically from the frozen source rather than hand-copying. Run:

```bash
node -e "
const fs=require('fs');
const s=require('./tests/fixtures/cutover/contentful-source.json');
const e = s.entries.find(x=>x.id==='2UNE5JSQ3Y8KOCOqSKcYcM');
const text = e.fields.text;
const out = [
  \"import PageLayout from '../layouts/PageLayout.astro'\",
  \"import Section from '../components/blocks/Section.astro'\",
  '',
  '<PageLayout title=\"Datenschutzhinweis\">',
  '  <Section>',
  text.split('\n').map(l => l.length ? '    ' + l : '').join('\n'),
  '  </Section>',
  '</PageLayout>',
  '',
].join('\n');
fs.writeFileSync('src/pages/data-policy.mdx', out);
console.log('wrote src/pages/data-policy.mdx');
"
```

This reads the verbatim `text` field from the frozen source (preserving literal U+00A0, backslash-escaped hyphens, and all whitespace exactly), indents each non-empty line by 4 spaces so it nests inside `<Section>`, and wraps it in the `PageLayout` shell. Empty lines are left empty (no 4-space indent) so Prettier and MDX parse them as paragraph breaks.

- [ ] **Step 2: Verify the file was written correctly**

Run:

```bash
head -5 src/pages/data-policy.mdx
echo '---'
grep -c 'Datenschutzerklärung' src/pages/data-policy.mdx
echo '---'
node -e "
const t=require('fs').readFileSync('src/pages/data-policy.mdx','utf8');
const nbspCount = (t.match(/\u00A0/g)||[]).length;
const entityCount = (t.match(/&nbsp;/g)||[]).length;
console.log('literal U+00A0 count:', nbspCount);
console.log('&nbsp; entity count:', entityCount);
"
```

Expected: the file starts with the two import lines; `Datenschutzerklärung` appears at least once; the literal U+00A0 count is greater than zero (there are 11 enumeration lines `a)` through `k)` plus several in the data-subject-rights section, so expect ~20+ literal nbsp), and the `&nbsp;` entity count is zero. The data-policy prose has no two-trailing-space hard line breaks (verified during plan writing), so the programmatic indentation does not lose any hard breaks.

If the `&nbsp;` entity count is non-zero, the file was written from a source that had already been entity-encoded; re-run Step 1 with the exact command above, which reads `contentful-source.json` directly (where the bytes are literal nbsp, not entities).

- [ ] **Step 3: Format the file with Prettier**

Run:

```bash
pnpm format
```

Expected: Prettier rewrites `src/pages/data-policy.mdx`. It may reflow long paragraphs onto single lines. It must not convert literal U+00A0 to `&nbsp;` entities — Prettier's Markdown formatter does not do that. After formatting, re-run the nbsp check from Step 2:

```bash
node -e "
const t=require('fs').readFileSync('src/pages/data-policy.mdx','utf8');
console.log('literal U+00A0 count:', (t.match(/\u00A0/g)||[]).length);
console.log('&nbsp; entity count:', (t.match(/&nbsp;/g)||[]).length);
"
```

Expected: the literal U+00A0 count is still greater than zero; the `&nbsp;` entity count is still zero. If Prettier converted nbsp to entities (it should not), revert the format on this file with `git checkout src/pages/data-policy.mdx` and re-run Step 1, then skip `pnpm format` for this file and note the exception in the commit message. (This is a fallback; Prettier does not convert nbsp in Markdown text.)

- [ ] **Step 4: Build and run the semantic comparator**

Run:

```bash
pnpm build
pnpm compare:legal
```

Expected: `pnpm build` succeeds. `pnpm compare:legal` PASSES for the data-policy. The semantic comparator's cheerio normalization treats literal nbsp and `&nbsp;` entities as equivalent (both serialize to `&nbsp;` via cheerio `.html()`), so the reflowed Markdown with literal nbsp matches the frozen fixture's literal nbsp after both sides go through cheerio.

If `compare:legal` FAILs for the data-policy, the diff shows the structural difference. The most likely cause is a heading or list that did not survive the programmatic indentation. Re-read the frozen source and the generated file side by side; fix the generation script and re-run Step 1.

- [ ] **Step 5: Lint and commit**

Run:

```bash
pnpm lint
git add src/pages/data-policy.mdx
git commit -m "Inline data-policy prose as Markdown with literal nbsp preserved"
```

Expected: one commit modifies `src/pages/data-policy.mdx` only. `compare:legal` passes for the data-policy.

---

### Task 5: Delete `src/content/prose/` and update `AGENTS.md`

This task removes the now-unused `src/content/prose/` directory and its five HTML files, and updates `AGENTS.md` to reflect the inline-Markdown editing model. After this task, no `set:html` prose injection remains anywhere in the codebase.

**Files:**
- Delete: `src/content/prose/imprint.html`
- Delete: `src/content/prose/data-policy.html`
- Delete: `src/content/prose/index-service.html`
- Delete: `src/content/prose/index-aside-iso.html`
- Delete: `src/content/prose/index-aside-history.html`
- Delete: `src/content/prose/` (directory, once empty)
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: the inlined prose from Tasks 2–4 (which made the `prose/` files unused).
- Produces: a clean source tree with no `src/content/prose/` and an `AGENTS.md` that documents the inline-Markdown editing model.

- [ ] **Step 1: Confirm no remaining references to `src/content/prose/`**

Run:

```bash
rg -n "content/prose|\\?raw" src scripts astro.config.mjs package.json || echo "no remaining references"
```

Expected: `no remaining references`. If any match appears (e.g. a stale import in a `.mdx` page), stop and fix it before deleting the directory. Tasks 2–4 should have removed all `?raw` imports, but verify.

- [ ] **Step 2: Delete the five HTML files and the directory**

Run:

```bash
git rm src/content/prose/imprint.html src/content/prose/data-policy.html src/content/prose/index-service.html src/content/prose/index-aside-iso.html src/content/prose/index-aside-history.html
rmdir src/content/prose 2>/dev/null || true
```

Expected: `git rm` reports the five files as deleted; `rmdir` removes the now-empty directory (or silently fails if it is already empty after `git rm`, which is fine — the `|| true` swallows the error).

- [ ] **Step 3: Update `AGENTS.md` — replace the `prose/` bullet**

In `AGENTS.md`, find the Architecture bullet (line 34) that currently reads:

```text
- `src/content/prose/` holds pre-rendered HTML fragments for frozen legal and homepage prose, injected via `set:html` so Prettier cannot reflow the text.
```

Replace that single bullet with:

```text
- Page-specific prose (legal copy, homepage sections, asides) is inlined as Markdown in each `.mdx` page. Explicit HTML is used only where Markdown would change the frozen DOM (e.g. the homepage service heading's `<br />`-separated lines). No separate prose store, no `set:html` for frozen prose. Prettier reflows the inline Markdown; the fixture comparators confirm parity.
```

- [ ] **Step 4: Update `AGENTS.md` — clarify the `Section`/`Aside` slot contract**

In `AGENTS.md`, find the Architecture bullet (line 33) about `src/components/blocks/`. It currently reads:

```text
- `src/components/blocks/` holds editor-facing blocks: `Hero`, `Section`, `Aside`, `Quote`, `Tiles`, `EmployeeTile`, `ProductGroup`. `Tiles` validates `layout`/`items`/`itemComponent` and throws on misuse at build time.
```

Replace that bullet with:

```text
- `src/components/blocks/` holds editor-facing blocks: `Hero`, `Section`, `Aside`, `Quote`, `Tiles`, `EmployeeTile`, `ProductGroup`. `Section` and `Aside` render MDX in their default slot; pages compose prose Markdown and block components as children. `Tiles` validates `layout`/`items`/`itemComponent` and throws on misuse at build time.
```

- [ ] **Step 5: Build and run the full verification**

Run:

```bash
pnpm verify
```

Expected: the full aggregate passes — lint, `verify:content`, `verify:assets`, build, `compare:legal`, `compare:pages`, and `verify:dist`. The `verify` aggregate is unchanged from the as-built (no new `verify:prose` step). This is the first end-to-end green `pnpm verify` with the inlined prose.

If any step fails, the failure message names the specific check. Do not commit until `pnpm verify` is fully green.

- [ ] **Step 6: Lint and commit**

Run:

```bash
pnpm lint
git add -A
git commit -m "Delete src/content/prose and document inline-Markdown editing model"
```

Expected: one commit deletes the five HTML files and the `prose/` directory, and updates `AGENTS.md` (two edits: the `prose/` bullet replacement and the `Section`/`Aside` slot clarification). `pnpm verify` passes end to end.

---

### Task 6: Final verification and self-review

This task is the final gate. It runs the full `pnpm verify`, confirms no `set:html` or `?raw` prose injection remains anywhere, and reviews for ADR need.

**Files:**
- None modified; verification only.

**Interfaces:**
- Consumes: the completed work from Tasks 1–5.
- Produces: evidence (in the PR body) that `pnpm verify` passes and no prose detour remains.

- [ ] **Step 1: Confirm no `set:html` or `?raw` prose injection remains**

Run:

```bash
rg -n "set:html|\\?raw" src/pages || echo "no set:html or ?raw in pages"
```

Expected: `no set:html or ?raw in pages`. If any match appears, a prose region was missed; fix it before continuing.

- [ ] **Step 2: Confirm `src/content/prose/` is gone**

Run:

```bash
ls src/content/prose 2>/dev/null && echo "ERROR: prose/ still exists" || echo "prose/ removed"
```

Expected: `prose/ removed`. If `prose/ still exists`, Task 5 Step 2 was incomplete; re-run it.

- [ ] **Step 3: Run the full verification**

Run:

```bash
pnpm verify
```

Expected: passes end to end. Record the output summary in the PR body.

- [ ] **Step 4: Review for ADR need**

Per `AGENTS.md` "Spec-driven work and ADRs", review whether this work introduced a significant architecture decision not already covered by an existing ADR.

The decision here — inline prose as Markdown in `.mdx` pages, no `set:html` prose injection — is already documented in ADR 08 (`docs/adrs/adr_08_local_content.md`), which records the local-content intent including "page-specific prose and composition in each page." The as-built diverged from ADR 08; this work brings the code back into alignment. No new architecture decision is introduced.

Conclusion: no new ADR is needed. The implementation plan's completion summary (in the PR body) states: "No new ADR was added. ADR 08 already documents the local-content intent; this work brings the code back into alignment with it."

- [ ] **Step 5: Confirm clean working tree**

Run:

```bash
git status --short
```

Expected: empty output (clean working tree). If any files appear as modified, they were left uncommitted; either commit them (if they belong to this work) or stash them (if they are unrelated).

---

## Notes on the frozen-content source of truth

Because the spec defers exact content values to the committed capture artifacts, the prose-inlining steps in Tasks 2–4 read `tests/fixtures/cutover/contentful-source.json` at execution time and copy the exact `text` field verbatim. The prose text is not hardcoded in this plan (except for the homepage's three short regions, which are short enough to inline directly and were verified against the frozen source during plan writing). The data-policy prose is ~210 lines long and is inlined programmatically (Task 4 Step 1) to avoid transcription error and to preserve literal U+00A0 bytes. The structural edits (`provenance.json` fields, `AGENTS.md` edits) are written in full above.

## Self-Review summary

**Spec coverage:** Every section of the design spec maps to a task — provenance update (Task 1), homepage prose inlining (Task 2), imprint prose inlining with Setext→ATX (Task 3), data-policy prose inlining with literal nbsp preserved (Task 4), `prose/` deletion + `AGENTS.md` update (Task 5), final verification + ADR review (Task 6). The acceptance criteria in the spec — `prose/` deleted, prose inlined as Markdown, single HTML exception for the service heading, `provenance.json` records normalization and no longer blesses the detour, `AGENTS.md` updated, `pnpm verify` passes (unchanged aggregate), no new verification script, no new ADR — are all covered.

**Placeholder scan:** No "TBD", "TODO", "fill in details", or "similar to Task N" placeholders. Every step contains the actual content or the exact command to produce it. The `provenance.json` `appliedInCommit` field is the one exception: it is a chicken-and-egg with its own commit SHA, and Task 3 Step 5 documents the two acceptable approaches (amend or follow-up commit).

**Type consistency:** The `provenance.json` field names (`proseNormalization`, `appliedAt`, `appliedInCommit`, `files`, `transformation`, `justification`, `notNormalized`) match the spec's Section 2 rule 4 and the Task 1 Step 2 definition. The textabschnitt IDs (`1bpttYZWYiOkGouGGCumU6`, `4RbNSyFGO4U0w866u8qSuM`, `HV4s4DGD020UKCSA42E4w`, `4BFxbdzDDGAGe2q0y6qkQS`, `2UNE5JSQ3Y8KOCOqSKcYcM`) were verified against `contentful-source.json` during plan writing. The Setext→ATX heading mapping in Task 3 matches the frozen fixture's heading levels (verified: `Impressum\n=========` renders to `<h1>Impressum</h1>`, so `# Impressum` is the correct ATX form). The `verify` aggregate is unchanged from the as-built `package.json` (no new `verify:prose` step), matching the spec's "No new `verify:prose` script" decision.

**Empirical verification:** During plan writing, the implementer dry-ran Tasks 2, 3, and 4 against the actual frozen source and `pnpm compare:pages` / `pnpm compare:legal` / `pnpm verify`:
- Task 2 (homepage): PASSES with the `09\. Dezember 2027` backslash escape (without it, Satteri renders `09.` as an ordered-list `<ol><li>`, failing parity). The `<h2>...<br />...</h2>` inline renders to `<h2>...<br>...</h2>` matching the frozen fixture.
- Task 3 (imprint): PASSES with explicit `<br />` tags for hard line breaks. The frozen source's two-trailing-space hard breaks cannot be used because Prettier strips trailing whitespace from 4-space-indented Markdown inside MDX JSX blocks (verified: `pnpm format` reduces the trailing-two-space count to 0 for indented prose, but preserves it at column 0). The `<br />` form is Prettier-stable and renders to the same `<br>` element.
- Task 4 (data-policy): PASSES with the programmatic inlining approach (Task 4 Step 1). The 68 literal U+00A0 bytes are preserved through the `contentful-source.json` → `.mdx` write → `pnpm format` → `pnpm build` pipeline. The data-policy has no two-trailing-space hard breaks, so no `<br />` substitution is needed.
- `pnpm verify` passes end-to-end with all three pages inlined.
