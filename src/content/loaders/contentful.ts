import 'dotenv/config'
import { createClient, type Entry, type EntrySkeletonType } from 'contentful'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

type ContentfulImage = {
  src: string
  width: number
  height: number
  title?: string
  description?: string
}

type ContentfulReference = {
  sys?: {
    id?: string
    type?: string
    linkType?: string
  }
}

type RawEntry = Entry<EntrySkeletonType, undefined, string>

type RawAsset = {
  sys: { id: string }
  fields?: {
    title?: string
    description?: string
    file?: {
      url?: string
      details?: {
        image?: {
          width?: number
          height?: number
        }
      }
    }
  }
}

type RawCallToAction = {
  fields?: {
    text?: string
  }
}

type NormalizedModule =
  | NormalizedHeroBlock
  | NormalizedQuote
  | NormalizedSection
  | NormalizedTextContent
  | NormalizedCardLayout
  | NormalizedEmployee
  | NormalizedProductGroup

type NormalizedPage = {
  id: string
  __typename: 'ContentfulSeite'
  slug: string
  module: NormalizedModule[]
}

type NormalizedHeroBlock = {
  id: string
  __typename: 'ContentfulHeroBlock'
  hauptueberschrift: string
  unterueberschrift?: string
  callToAction?: { text: string }
  bild?: ContentfulImage
}

type NormalizedQuote = {
  id: string
  __typename: 'ContentfulZitat'
  zitat: string
}

type NormalizedSection = {
  id: string
  __typename: 'ContentfulAbschnitt'
  volleBreite: boolean
  inhalte: NormalizedModule[]
  seitenabschnitt?: NormalizedModule
}

type NormalizedTextContent = {
  id: string
  __typename: 'ContentfulTextinhalt'
  textMarkdown: string
  textHtml: string
}

type NormalizedCardLayout = {
  id: string
  __typename: 'ContentfulKartenLayout'
  titel?: string
  layout?: string
  elemente: NormalizedModule[]
}

type NormalizedEmployee = {
  id: string
  __typename: 'ContentfulMitarbeiter'
  name: string
  dienstbereich?: string
  foto?: ContentfulImage
}

type NormalizedProductGroup = {
  id: string
  __typename: 'ContentfulProduktgruppe'
  name: string
  beschreibung?: string
  beispiele?: string[]
  foto?: ContentfulImage
}

const getContentfulConfig = () => {
  const space = process.env.CONTENTFUL_SPACE_ID
  const usePreview = process.env.CONTENTFUL_USE_PREVIEW === 'true'
  const accessToken = usePreview
    ? process.env.CONTENTFUL_PREVIEW_TOKEN
    : process.env.CONTENTFUL_DELIVERY_TOKEN
  const host = usePreview ? 'preview.contentful.com' : 'cdn.contentful.com'

  if (!space) {
    throw new Error('CONTENTFUL_SPACE_ID is required for the Astro Contentful loader')
  }

  if (!accessToken) {
    throw new Error(
      usePreview
        ? 'CONTENTFUL_PREVIEW_TOKEN is required when CONTENTFUL_USE_PREVIEW=true'
        : 'CONTENTFUL_DELIVERY_TOKEN is required for the Astro Contentful loader',
    )
  }

  return { space, accessToken, host }
}

const createContentfulClient = () => {
  const { space, accessToken, host } = getContentfulConfig()

  return createClient({
    space,
    accessToken,
    host,
  })
}

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : ''

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const asBoolean = (value: unknown): boolean => value === true

const getReferenceId = (value: unknown): string | undefined => {
  if (value == null) return undefined
  const reference = value as ContentfulReference
  return reference.sys?.id
}

const getReferenceIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(getReferenceId).filter((id): id is string => Boolean(id))
    : []

const normalizeCallToAction = (
  value: unknown,
  entries: Map<string, RawEntry>,
): { text: string } | undefined => {
  if (typeof value === 'string') {
    return value ? { text: value } : undefined
  }

  const referenceId = getReferenceId(value)
  const referencedEntry = referenceId ? entries.get(referenceId) : undefined
  const text = referencedEntry
    ? asString((referencedEntry as RawCallToAction).fields?.text)
    : asString((value as RawCallToAction).fields?.text)

  return text ? { text } : undefined
}

const renderMarkdown = async (markdown: string): Promise<string> => {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown)

  return String(file)
}

const normalizeAssetUrl = (url: string): string => {
  if (url.startsWith('//')) {
    return `https:${url}`
  }

  if (url.startsWith('https://')) {
    return url
  }

  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://')
  }

  return `https://${url}`
}

const normalizeImage = (asset: RawAsset | undefined): ContentfulImage | undefined => {
  const file = asset?.fields?.file
  const image = file?.details?.image

  if (!file?.url || !image?.width || !image?.height) {
    return undefined
  }

  return {
    src: normalizeAssetUrl(file.url),
    width: image.width,
    height: image.height,
    title: asset?.fields?.title,
    description: asset?.fields?.description,
  }
}

const createEntryIndex = (entries: RawEntry[]): Map<string, RawEntry> =>
  new Map(entries.map(entry => [entry.sys.id, entry]))

const createAssetIndex = (assets: RawAsset[]): Map<string, RawAsset> =>
  new Map(assets.map(asset => [asset.sys.id, asset]))

const contentfulTypename = (entry: RawEntry): NormalizedModule['__typename'] | 'ContentfulSeite' | undefined => {
  const contentType = entry.sys.contentType.sys.id

  switch (contentType) {
    case 'seite':
      return 'ContentfulSeite'
    case 'heroBlock':
      return 'ContentfulHeroBlock'
    case 'zitat':
      return 'ContentfulZitat'
    case 'abschnitt':
      return 'ContentfulAbschnitt'
    case 'textabschnitt':
      return 'ContentfulTextinhalt'
    case 'kartenLayout':
      return 'ContentfulKartenLayout'
    case 'mitarbeiter':
      return 'ContentfulMitarbeiter'
    case 'produktgruppe':
      return 'ContentfulProduktgruppe'
    default:
      return undefined
  }
}

const normalizeModule = async (
  entry: RawEntry,
  entries: Map<string, RawEntry>,
  assets: Map<string, RawAsset>,
): Promise<NormalizedModule> => {
  const fields = entry.fields as Record<string, unknown>
  const id = entry.sys.id
  const typename = contentfulTypename(entry)

  if (!typename) {
    throw new Error(
      `Cannot normalize unsupported Contentful content type: ${entry.sys.contentType.sys.id}`,
    )
  }

  switch (typename) {
    case 'ContentfulHeroBlock':
      return {
        id,
        __typename: typename,
        hauptueberschrift: asString(fields.hauptueberschrift),
        unterueberschrift: asString(fields.unterueberschrift) || undefined,
        callToAction: normalizeCallToAction(fields.callToAction, entries),
        bild: normalizeImage(assets.get(getReferenceId(fields.bild) || '')),
      }
    case 'ContentfulZitat':
      return {
        id,
        __typename: typename,
        zitat: asString(fields.zitat),
      }
    case 'ContentfulAbschnitt': {
      const inhalte = (
        await Promise.all(
          getReferenceIds(fields.inhalte).map(referenceId => normalizeModuleById(referenceId, entries, assets)),
        )
      ).filter((module): module is NormalizedModule => Boolean(module))
      const seitenabschnittId = getReferenceId(fields.seitenabschnitt)

      return {
        id,
        __typename: typename,
        volleBreite: asBoolean(fields.volleBreite),
        inhalte,
        seitenabschnitt: seitenabschnittId
          ? await normalizeModuleById(seitenabschnittId, entries, assets)
          : undefined,
      }
    }
    case 'ContentfulTextinhalt': {
      const textMarkdown = asString(fields.text)

      return {
        id,
        __typename: typename,
        textMarkdown,
        textHtml: await renderMarkdown(textMarkdown),
      }
    }
    case 'ContentfulKartenLayout':
      return {
        id,
        __typename: typename,
        titel: asString(fields.titel) || undefined,
        layout: asString(fields.layout) || undefined,
        elemente: (
          await Promise.all(
            getReferenceIds(fields.elemente).map(referenceId => normalizeModuleById(referenceId, entries, assets)),
          )
        ).filter((module): module is NormalizedModule => Boolean(module)),
      }
    case 'ContentfulMitarbeiter':
      return {
        id,
        __typename: typename,
        name: asString(fields.name),
        dienstbereich: asString(fields.dienstbereich) || undefined,
        foto: normalizeImage(assets.get(getReferenceId(fields.foto) || '')),
      }
    case 'ContentfulProduktgruppe':
      return {
        id,
        __typename: typename,
        name: asString(fields.name),
        beschreibung: asString((fields.beschreibung as { beschreibung?: unknown } | undefined)?.beschreibung),
        beispiele: asStringArray(fields.beispiele),
        foto: normalizeImage(assets.get(getReferenceId(fields.foto) || '')),
      }
    default:
      throw new Error(`Unsupported module typename: ${typename}`)
  }
}

const normalizeModuleById = async (
  id: string,
  entries: Map<string, RawEntry>,
  assets: Map<string, RawAsset>,
): Promise<NormalizedModule | undefined> => {
  const entry = entries.get(id)

  if (!entry) {
    throw new Error(`Missing Contentful entry referenced by id: ${id}`)
  }

  if (!contentfulTypename(entry)) {
    return undefined
  }

  return normalizeModule(entry, entries, assets)
}

const normalizePage = async (
  entry: RawEntry,
  entries: Map<string, RawEntry>,
  assets: Map<string, RawAsset>,
): Promise<NormalizedPage> => {
  const fields = entry.fields as Record<string, unknown>
  const moduleIds = getReferenceIds(fields.module)

  return {
    id: entry.sys.id,
    __typename: 'ContentfulSeite',
    slug: asString(fields.slug),
    module: (
      await Promise.all(
        moduleIds.map(referenceId => normalizeModuleById(referenceId, entries, assets)),
      )
    ).filter((module): module is NormalizedModule => Boolean(module)),
  }
}

const fetchContentfulEntries = async () => {
  const client = createContentfulClient()
  const response = await client.getEntries({
    include: 10,
    limit: 1000,
  })

  const entries = response.items as RawEntry[]
  const assets = response.includes?.Asset ? (response.includes.Asset as RawAsset[]) : []

  return { entries, assets }
}

export const contentfulLoader = () => ({
  name: 'contentful-loader',
  load: async ({ store }: { store: { clear: () => void; set: (entry: { id: string; data: NormalizedPage }) => void } }) => {
    const { entries, assets } = await fetchContentfulEntries()
    const entryIndex = createEntryIndex(entries)
    const assetIndex = createAssetIndex(assets)
    const pages = entries.filter(entry => contentfulTypename(entry) === 'ContentfulSeite')

    store.clear()

    for (const page of pages) {
      const normalizedPage = await normalizePage(page, entryIndex, assetIndex)
      store.set({
        id: normalizedPage.id,
        data: normalizedPage,
      })
    }
  },
})
