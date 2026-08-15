import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import 'dotenv/config'
import { createClient } from 'contentful'

const OUT_DIR = 'tests/fixtures/cutover'
const PAGE_TYPENAME = 'ContentfulSeite'

const contentTypeToTypename = {
  seite: 'ContentfulSeite',
  heroBlock: 'ContentfulHeroBlock',
  zitat: 'ContentfulZitat',
  abschnitt: 'ContentfulAbschnitt',
  textabschnitt: 'ContentfulTextinhalt',
  kartenLayout: 'ContentfulKartenLayout',
  mitarbeiter: 'ContentfulMitarbeiter',
  produktgruppe: 'ContentfulProduktgruppe',
}

const refId = (value) => value?.sys?.id ?? null

const isEntry = (v) => v?.sys?.type === 'Entry' || v?.sys?.linkType === 'Entry'
const isAsset = (v) => v?.sys?.type === 'Asset' || v?.sys?.linkType === 'Asset'

const collectReachable = (entries, assets) => {
  const entryIndex = new Map(entries.map((e) => [e.sys.id, e]))
  const assetIndex = new Map(assets.map((a) => [a.sys.id, a]))
  const reachableEntries = new Map()
  const reachableAssets = new Map()
  const queue = []

  const typename = (entry) =>
    contentTypeToTypename[entry.sys.contentType.sys.id] ?? null

  const visitEntry = (id) => {
    if (!id || reachableEntries.has(id)) return
    const entry = entryIndex.get(id)
    if (!entry) throw new Error(`Missing referenced entry: ${id}`)
    if (!typename(entry)) return
    reachableEntries.set(id, entry)
    queue.push(entry)
  }

  const visitAsset = (id) => {
    if (!id) return
    const asset = assetIndex.get(id)
    if (asset) reachableAssets.set(id, asset)
  }

  const visitValue = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) visitValue(item)
      return
    }
    if (isEntry(value)) visitEntry(refId(value))
    else if (isAsset(value)) visitAsset(refId(value))
  }

  for (const entry of entries) {
    if (typename(entry) === PAGE_TYPENAME) visitEntry(entry.sys.id)
  }
  while (queue.length) {
    const entry = queue.shift()
    const fields = entry.fields
    for (const value of Object.values(fields)) visitValue(value)
  }
  return {
    entries: [...reachableEntries.values()],
    assets: [...reachableAssets.values()],
  }
}

const normalizeAssetUrl = (url) => {
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('http://')) return url.replace('http://', 'https://')
  if (url.startsWith('https://')) return url
  return `https://${url}`
}

const sanitizeEntry = (entry) => ({
  id: entry.sys.id,
  contentType: entry.sys.contentType.sys.id,
  updatedAt: entry.sys.updatedAt,
  fields: entry.fields,
})

const sanitizeAsset = (asset) => {
  const file = asset.fields?.file
  return {
    id: asset.sys.id,
    updatedAt: asset.sys.updatedAt,
    title: asset.fields?.title ?? null,
    description: asset.fields?.description ?? null,
    url: file?.url ? normalizeAssetUrl(file.url) : null,
    mimeType: file?.contentType ?? null,
    byteSize: file?.details?.size ?? null,
    width: file?.details?.image?.width ?? null,
    height: file?.details?.image?.height ?? null,
  }
}

const buildAssetInventory = (entries, assets) => {
  const usage = new Map()
  for (const asset of assets) usage.set(asset.id, { asset, usedBy: [] })
  const typename = (e) =>
    contentTypeToTypename[e.sys.contentType.sys.id] ?? null
  for (const entry of entries) {
    const tn = typename(entry)
    if (!tn) continue
    for (const [fieldName, value] of Object.entries(entry.fields)) {
      const collect = (v) => {
        const id = isAsset(v) ? refId(v) : null
        if (id && usage.has(id)) {
          usage.get(id).usedBy.push({
            entryId: entry.sys.id,
            typename: tn,
            field: fieldName,
          })
        }
      }
      if (Array.isArray(value)) value.forEach(collect)
      else collect(value)
    }
  }
  return [...usage.values()].map(({ asset, usedBy }) => ({
    ...asset,
    usedBy,
  }))
}

const guessLocalId = (entry) => {
  const tn = contentTypeToTypename[entry.sys.contentType.sys.id]
  const fields = entry.fields
  if (tn === 'ContentfulSeite') {
    const slug = (fields.slug ?? '').replace(/^\/+/, '').replace(/\/+$/, '')
    return slug === '' ? 'index' : slug
  }
  if (tn === 'ContentfulMitarbeiter') {
    return (fields.name ?? 'mitarbeiter')
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  if (tn === 'ContentfulProduktgruppe') {
    return (fields.name ?? 'produktgruppe')
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  return null
}

const buildContentMap = (entries) => {
  const pages = []
  const employees = []
  const productGroups = []
  for (const entry of entries) {
    const tn = contentTypeToTypename[entry.sys.contentType.sys.id]
    const localId = guessLocalId(entry)
    if (tn === 'ContentfulSeite') {
      const slug = (entry.fields.slug ?? '')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '')
      const route =
        slug === '' ? 'src/pages/index.mdx' : `src/pages/${slug}.mdx`
      pages.push({ sourceId: entry.sys.id, route })
    } else if (tn === 'ContentfulMitarbeiter') {
      employees.push({ sourceId: entry.sys.id, localId })
    } else if (tn === 'ContentfulProduktgruppe') {
      productGroups.push({ sourceId: entry.sys.id, localId })
    }
  }
  return { pages, employees, productGroups }
}

const main = async () => {
  const space = process.env.CONTENTFUL_SPACE_ID
  const token = process.env.CONTENTFUL_DELIVERY_TOKEN
  if (!space || !token) {
    throw new Error(
      'CONTENTFUL_SPACE_ID and CONTENTFUL_DELIVERY_TOKEN are required'
    )
  }
  const client = createClient({
    space,
    accessToken: token,
    host: 'cdn.contentful.com',
  })
  const response = await client.getEntries({ include: 10, limit: 1000 })
  const allEntries = [...response.items, ...(response.includes?.Entry ?? [])]
  const allAssets = response.includes?.Asset ?? []
  const { entries, assets } = collectReachable(allEntries, allAssets)

  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(resolve(OUT_DIR, 'pages'), { recursive: true })

  const source = {
    entries: entries.map(sanitizeEntry),
    assets: assets.map(sanitizeAsset),
  }
  writeFileSync(
    resolve(OUT_DIR, 'contentful-source.json'),
    JSON.stringify(source, null, 2) + '\n'
  )

  const inventory = buildAssetInventory(entries, assets)
  writeFileSync(
    resolve(OUT_DIR, 'asset-inventory.json'),
    JSON.stringify(inventory, null, 2) + '\n'
  )

  const contentMap = buildContentMap(entries)
  writeFileSync(
    resolve(OUT_DIR, 'content-map.json'),
    JSON.stringify(contentMap, null, 2) + '\n'
  )

  console.log(`capture: ${entries.length} entries, ${assets.length} assets`)
  console.log(
    `wrote tests/fixtures/cutover/{contentful-source,asset-inventory,content-map}.json`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
