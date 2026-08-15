import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { resolve } from 'node:path'

const readJson = (path) => JSON.parse(readFileSync(resolve(path), 'utf8'))

const manifest = readJson('tests/fixtures/cutover/assets.json')
const inventory = readJson('tests/fixtures/cutover/asset-inventory.json')
const source = readJson('tests/fixtures/cutover/contentful-source.json')

const errors = []
const invById = new Map(inventory.map((a) => [a.id, a]))
const entryById = new Map(source.entries.map((e) => [e.id, e]))

for (const asset of manifest) {
  if (!asset.contentfulAssetId) {
    errors.push('asset manifest entry missing contentfulAssetId')
    continue
  }
  if (!invById.has(asset.contentfulAssetId)) {
    errors.push(`manifest asset ${asset.contentfulAssetId} not in inventory`)
  }
  if (!asset.localPath || !existsSync(resolve(asset.localPath))) {
    errors.push(
      `asset ${asset.contentfulAssetId}: missing localPath file ${asset.localPath}`
    )
    continue
  }
  const buf = readFileSync(resolve(asset.localPath))
  const sha = createHash('sha256').update(buf).digest('hex')
  if (sha !== asset.sha256) {
    errors.push(
      `asset ${asset.contentfulAssetId}: sha256 mismatch (expected ${asset.sha256}, got ${sha})`
    )
  }
  if (buf.length !== asset.byteSize) {
    errors.push(
      `asset ${asset.contentfulAssetId}: byteSize mismatch (expected ${asset.byteSize}, got ${buf.length})`
    )
  }
  let meta
  try {
    meta = await sharp(buf).metadata()
  } catch (e) {
    errors.push(
      `asset ${asset.contentfulAssetId}: cannot decode image: ${e.message}`
    )
    continue
  }
  if (meta.width !== asset.width || meta.height !== asset.height) {
    errors.push(
      `asset ${asset.contentfulAssetId}: dimensions mismatch (expected ${asset.width}x${asset.height}, got ${meta.width}x${meta.height})`
    )
  }
  if (meta.mime && meta.mime !== asset.mimeType) {
    errors.push(
      `asset ${asset.contentfulAssetId}: mime mismatch (expected ${asset.mimeType}, got ${meta.mime})`
    )
  }
  if (typeof asset.alt !== 'string') {
    errors.push(`asset ${asset.contentfulAssetId}: alt must be a string`)
  } else if (asset.alt === '' && !asset.decorativeEmptyAlt) {
    errors.push(
      `asset ${asset.contentfulAssetId}: empty alt requires decorativeEmptyAlt=true with justification`
    )
  }
  if (!Array.isArray(asset.usedBy) || asset.usedBy.length === 0) {
    errors.push(
      `asset ${asset.contentfulAssetId}: usedBy must be a non-empty array`
    )
  } else {
    for (const use of asset.usedBy) {
      const entry = entryById.get(use.entryId)
      if (!entry) {
        errors.push(
          `asset ${asset.contentfulAssetId}: usedBy entry ${use.entryId} not in frozen source`
        )
        continue
      }
      if (!entry.fields || !(use.field in entry.fields)) {
        errors.push(
          `asset ${asset.contentfulAssetId}: usedBy field ${use.field} not present on entry ${use.entryId}`
        )
      }
    }
  }
  if (
    !asset.rights ||
    !['approved-original', 'approved-derivative'].includes(asset.rights.status)
  ) {
    errors.push(
      `asset ${asset.contentfulAssetId}: rights.status must be approved-original or approved-derivative`
    )
  }
  if (
    asset.rights?.status === 'approved-derivative' &&
    !asset.rights.derivation
  ) {
    errors.push(
      `asset ${asset.contentfulAssetId}: approved-derivative requires rights.derivation`
    )
  }
}

if (errors.length) {
  console.error(`verify:assets: ${errors.length} problem(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`verify:assets: ok (${manifest.length} assets)`)
