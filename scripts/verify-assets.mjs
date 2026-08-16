import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import sharp from 'sharp'
import {
  isDirectExecution,
  isNonEmptyString,
  listFiles,
  READ_YAML_ERROR,
  readYaml,
  resolveContentImage,
  runCli,
  sha256,
  toPosix,
} from './lib/verification.mjs'

const ASSET_DIR = 'src/assets/content'
const MANIFEST_PATH = 'src/content/assets.yaml'
const CONTENT_SOURCES = [
  ['src/content/employees', 'photo'],
  ['src/content/product-groups', 'photo'],
  ['src/content/homepage', 'image'],
]
const MIME_TYPES = {
  avif: 'image/avif',
  gif: 'image/gif',
  heif: 'image/heif',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  tiff: 'image/tiff',
  webp: 'image/webp',
}

export const sharpMimeType = (metadata) =>
  metadata.format === 'heif' && metadata.compression === 'av1'
    ? 'image/avif'
    : MIME_TYPES[metadata.format]

const isMapping = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const describe = (asset, index) =>
  isNonEmptyString(asset?.id) ? `asset ${asset.id}` : `assets[${index}]`

const inspectAsset = async (root, asset, index, errors) => {
  const label = describe(asset, index)

  if (!isNonEmptyString(asset.sha256))
    errors.push(`${label}: sha256 must be non-empty`)
  if (!Number.isInteger(asset.byteSize) || asset.byteSize < 0)
    errors.push(`${label}: byteSize must be a non-negative integer`)
  if (!Number.isInteger(asset.width) || asset.width <= 0)
    errors.push(`${label}: width must be a positive integer`)
  if (!Number.isInteger(asset.height) || asset.height <= 0)
    errors.push(`${label}: height must be a positive integer`)
  if (!isNonEmptyString(asset.mimeType))
    errors.push(`${label}: mimeType must be non-empty`)

  if (!isMapping(asset.alt)) {
    errors.push(`${label}: alt must be a mapping`)
  } else {
    if (!['decorative', 'semantic'].includes(asset.alt.policy)) {
      errors.push(`${label}: alt.policy must be decorative or semantic`)
    }
    if (typeof asset.alt.default !== 'string') {
      errors.push(`${label}: alt.default must be a string`)
    } else if (asset.alt.policy === 'decorative' && asset.alt.default !== '') {
      errors.push(`${label}: decorative asset requires empty alt`)
    } else if (
      asset.alt.policy === 'semantic' &&
      !isNonEmptyString(asset.alt.default)
    ) {
      errors.push(`${label}: semantic asset requires non-empty alt`)
    }
  }

  if (!isMapping(asset.rights)) {
    errors.push(`${label}: rights must be a mapping`)
  } else {
    if (!isNonEmptyString(asset.rights.status))
      errors.push(`${label}: rights.status must be non-empty`)
    if (!isNonEmptyString(asset.rights.provenance))
      errors.push(`${label}: rights.provenance must be non-empty`)
  }

  if (!isNonEmptyString(asset.path)) return
  const absolutePath = resolve(root, asset.path)
  const assetRoot = resolve(root, ASSET_DIR)
  if (!(
    absolutePath.startsWith(`${assetRoot}${sep}`) &&
    toPosix(relative(root, absolutePath)) === asset.path
  )) {
    return
  }
  if (!existsSync(absolutePath)) {
    errors.push(`${label}: asset file does not exist: ${asset.path}`)
    return
  }

  let buffer
  try {
    buffer = readFileSync(absolutePath)
  } catch (error) {
    errors.push(
      `${label}: cannot read asset file ${asset.path}: ${error.message}`
    )
    return
  }

  if (sha256(buffer) !== asset.sha256) errors.push(`${label}: sha256 mismatch`)
  if (buffer.length !== asset.byteSize)
    errors.push(`${label}: byteSize mismatch`)

  try {
    const metadata = await sharp(buffer).metadata()
    if (metadata.width !== asset.width || metadata.height !== asset.height) {
      errors.push(`${label}: dimensions mismatch`)
    }
    if (sharpMimeType(metadata) !== asset.mimeType) {
      errors.push(`${label}: MIME type mismatch`)
    }
  } catch (error) {
    errors.push(`${label}: cannot decode image: ${error.message}`)
  }
}

export const verifyAssets = async (root = process.cwd()) => {
  const errors = []
  const manifest = readYaml(root, MANIFEST_PATH, errors)
  const records = []
  const byId = new Map()
  const byPath = new Map()
  const assetRoot = resolve(root, ASSET_DIR)

  if (manifest !== READ_YAML_ERROR) {
    if (!isMapping(manifest) || !Array.isArray(manifest.assets)) {
      errors.push(`${MANIFEST_PATH}: assets must be an array`)
    } else {
      for (const [index, asset] of manifest.assets.entries()) {
        if (!isMapping(asset)) {
          errors.push(`${MANIFEST_PATH}: assets[${index}] must be a mapping`)
          continue
        }
        records.push(asset)

        if (!isNonEmptyString(asset.id)) {
          errors.push(`assets[${index}]: id must be non-empty`)
        } else if (byId.has(asset.id)) {
          errors.push(`duplicate asset id ${asset.id}`)
        } else {
          byId.set(asset.id, asset)
        }

        if (!isNonEmptyString(asset.path)) {
          errors.push(`${describe(asset, index)}: path must be non-empty`)
        } else {
          const absolutePath = resolve(root, asset.path)
          const confined =
            absolutePath.startsWith(`${assetRoot}${sep}`) &&
            toPosix(relative(root, absolutePath)) === asset.path
          if (!confined) {
            errors.push(
              `${describe(asset, index)}: path must be confined to ${ASSET_DIR}`
            )
          } else if (existsSync(absolutePath)) {
            const realAssetRoot = realpathSync(assetRoot)
            const realAssetPath = realpathSync(absolutePath)
            if (!realAssetPath.startsWith(`${realAssetRoot}${sep}`)) {
              errors.push(
                `${describe(asset, index)}: path must resolve within ${ASSET_DIR}`
              )
            }
          }
          if (byPath.has(asset.path)) {
            errors.push(`duplicate asset path ${asset.path}`)
          } else {
            byPath.set(asset.path, asset)
          }
        }
      }
    }
  }

  await Promise.all(
    records.map((asset, index) => inspectAsset(root, asset, index, errors))
  )

  const referenced = new Set()
  let usageCount = 0
  for (const [dir, imageField] of CONTENT_SOURCES) {
    for (const path of listFiles(root, dir, '.yaml')) {
      usageCount += 1
      const usage = readYaml(root, path, errors)
      if (usage === READ_YAML_ERROR) continue
      if (!isMapping(usage)) {
        errors.push(`${path}: image usage must be a mapping`)
        continue
      }

      const validImage = isNonEmptyString(usage[imageField])
      if (!validImage) {
        errors.push(`${path}: ${imageField} must be a non-empty string`)
      }
      const imagePath = validImage
        ? resolveContentImage(path, usage[imageField])
        : null
      const idAsset = byId.get(usage.assetId)
      const pathAsset = imagePath ? byPath.get(imagePath) : undefined

      if (!pathAsset && imagePath)
        errors.push(`${path}: unmanifested content image ${imagePath}`)
      if (!idAsset)
        errors.push(`${path}: unmanifested asset id ${String(usage.assetId)}`)
      if (idAsset && pathAsset && idAsset !== pathAsset) {
        errors.push(
          `${path}: assetId and ${imageField} identify different assets`
        )
      }
      if (idAsset && pathAsset && idAsset === pathAsset) {
        referenced.add(idAsset)
      }
      if (idAsset) {
        if (idAsset.alt?.policy === 'decorative' && usage.alt !== '') {
          errors.push(`${path}: decorative asset requires empty alt`)
        }
        if (
          idAsset.alt?.policy === 'semantic' &&
          !isNonEmptyString(usage.alt)
        ) {
          errors.push(`${path}: semantic asset requires non-empty alt`)
        }
      }
    }
  }

  for (const asset of records) {
    if (!referenced.has(asset))
      errors.push(
        `${describe(asset, records.indexOf(asset))} is not referenced`
      )
  }

  for (const path of listFiles(root, ASSET_DIR)) {
    if (!byPath.has(path)) errors.push(`unmanifested asset file ${path}`)
  }

  return {
    errors,
    summary: `${records.length} assets, ${usageCount} content usages`,
  }
}

if (isDirectExecution(import.meta.url)) {
  runCli('verify:assets', verifyAssets)
}
