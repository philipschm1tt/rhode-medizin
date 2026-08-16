# Editor-Facing Blocks

Use these components in `src/pages/*.mdx` to compose local page content. See the
[content authoring guide](../../../docs/content-authoring.md) for editing,
preview, image, and verification workflows.

## Hero

`Hero` renders the page hero. It has no slot.

```mdx
<Hero
  headline="Medizintechnik mit Tradition"
  subhead="Medizinische Geräte, Instrumente und Mobilar für Ärzte und Krankenhäuser."
  cta="Jetzt Kontakt aufnehmen"
  image={hero.image}
  alt={hero.alt}
/>
```

```ts
interface Props {
  headline: string
  subhead?: string
  cta?: string
  image: ImageMetadata
  alt: string
}
```

`image` must be a local `ImageMetadata` value, such as an image loaded through
an Astro content collection. The hero picture is loaded eagerly with high fetch
priority because it is the page's primary image.

## Section

`Section` renders its MDX children through the default slot. `fullWidth` and
`dark` both default to `false`.

```mdx
<Section>## Heading

Paragraph.</Section>
```

```ts
interface Props {
  fullWidth?: boolean
  dark?: boolean
}
```

Use `<Section fullWidth dark>` to enable both variants.

## Aside

`Aside` accepts no props and renders its MDX children through the default slot.

```mdx
<Aside>### Heading

Paragraph.</Aside>
```

## Quote

`Quote` renders a standalone quotation and has no slot.

```mdx
<Quote text="Wir nehmen uns Zeit für Sie – Service ist unsere Stärke." />
```

```ts
interface Props {
  text: string
}
```

## Tiles

`Tiles` renders an array as either a grid or a list. It has no slot; each item is
spread as props onto `itemComponent`. Invalid layouts, missing item components,
and non-array items fail the build.

```mdx
<Tiles layout="grid" items={employees} itemComponent={EmployeeTile} />
```

```ts
interface Props {
  layout: 'grid' | 'list'
  items: Record<string, unknown>[]
  itemComponent: unknown
}
```

Use `EmployeeTile` with `layout="grid"` and `ProductGroup` with
`layout="list"`. Every object in `items` must satisfy the selected component's
prop interface.

## EmployeeTile

`EmployeeTile` renders one employee card and has no slot.

```mdx
<EmployeeTile
  name="Jane Doe"
  department="Kundenservice"
  photo={employee.photo}
  alt={employee.alt}
/>
```

```ts
interface Props {
  name: string
  department?: string
  photo: ImageMetadata
  alt: string
}
```

`photo` and `alt` are required. The local image is rendered at a fixed layout
and loaded lazily.

## ProductGroup

`ProductGroup` renders one product group and has no slot.

```mdx
<ProductGroup
  name="Diagnostik"
  description="Geräte und Instrumente für die medizinische Diagnostik."
  examples={['Stethoskope', 'Otoskope']}
  photo={productGroup.photo}
  alt={productGroup.alt}
/>
```

```ts
interface Props {
  name: string
  description?: string
  examples: string[]
  photo: ImageMetadata
  alt: string
}
```

`examples`, `photo`, and `alt` are required. The local image uses a constrained,
responsive layout and is loaded lazily.

## Image Alt Policy

All image props are strict local `ImageMetadata` values; URL strings are not
accepted. Pass alt text from the same local content record as the image. Use an
empty string only for an asset whose `src/content/assets.yaml` policy is
`decorative`. Assets with a `semantic` policy require meaningful, non-empty alt
text matching their content and manifest records. The content authoring guide
describes how to keep the asset ID, image path, manifest entry, and alt policy
aligned.
