# Editor-facing blocks

Blocks consumed by `src/pages/*.mdx` to compose pages without the
`ModuleRenderer` dispatcher. Each block maps to a frozen Contentful
module type and composes the existing technical layout components.

## Hero

Renders the hero area. Wraps `HeroBlock.astro`.

Props:

- `headline: string` — `ContentfulHeroBlock.hauptueberschrift`
- `subhead?: string` — `ContentfulHeroBlock.unterueberschrift`
- `cta?: string` — `ContentfulHeroBlock.callToAction.text`
- `image: ImageMetadata` — local hero asset
- `alt: string` — explicit alt

## Section

Renders a `ContentfulAbschnitt`. Composes `MainSection.astro`,
`MainGrid.astro` (full-width only), and `ContentBox.astro`.

Props:

- `fullWidth?: boolean` — maps to `volleBreite`
- `dark?: boolean` — maps to the dark background variant

Slot receives the section's main content.

## Aside

Renders a `ContentfulAbschnitt.seitenabschnitt`. Composes
`AsideSection.astro` and `ContentBox.astro`.

Slot receives the aside content.

## Quote

Renders a `ContentfulZitat`. Wraps `Quote.astro`.

Props:

- `text: string` — `ContentfulZitat.zitat`

## Tiles

Renders a `ContentfulKartenLayout` `<ul>`. Absorbs the scoped CSS from
the deleted `TileGrid.astro` and `TileList.astro`. Throws at build time
on misuse.

Props:

- `layout: 'grid' | 'list'` — maps to `ContentfulKartenLayout.layout`
  (`Gitter` → `grid`, `Liste` → `list`)
- `items: unknown[]` — the tile data
- `itemComponent: Component` — `EmployeeTile` or `ProductGroup`

## EmployeeTile

Renders a `ContentfulMitarbeiter` tile. Updated to accept
`ImageMetadata` + explicit `alt` instead of the old normalized image
shape. Absorbs the scoped CSS from the deleted
`src/components/EmployeeTile.astro`.

Props:

- `name: string`
- `department?: string`
- `photo?: ImageMetadata`
- `alt?: string`

## ProductGroup

Renders a `ContentfulProduktgruppe` tile. Updated to accept
`ImageMetadata` + explicit `alt`. Absorbs the scoped CSS from the
deleted `src/components/ProductGroup.astro`.

Props:

- `name: string`
- `description?: string`
- `examples?: string[]`
- `photo?: ImageMetadata`
- `alt?: string`
