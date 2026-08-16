import assert from 'node:assert/strict'
import { readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { sharpMimeType, verifyAssets } from '../../scripts/verify-assets.mjs'
import { copyPaths, removePath, replaceInFile } from './helpers.mjs'

const manifestPath = 'src/content/assets.yaml'
const sourcePaths = ['src/assets/content', 'src/content']

const verifyCopy = async (mutate) => {
  const root = copyPaths(sourcePaths)
  mutate?.(root)
  return verifyAssets(root)
}

const assertDiagnostic = async (mutate, diagnostic) => {
  const { errors } = await verifyCopy(mutate)
  assert.ok(
    errors.some((error) => error.includes(diagnostic)),
    errors.join('\n')
  )
}

test('accepts the operational asset baseline', async () => {
  const result = await verifyCopy()
  assert.deepEqual(result.errors, [])
  assert.equal(result.summary, '7 assets, 11 content usages')
})

test('rejects a duplicate manifest ID', async () => {
  await assertDiagnostic(
    (root) =>
      replaceInFile(
        root,
        manifestPath,
        '  - id: employee-placeholder',
        '  - id: homepage-hero'
      ),
    'duplicate asset id homepage-hero'
  )
})

test('rejects a duplicate manifest path', async () => {
  await assertDiagnostic(
    (root) =>
      replaceInFile(
        root,
        manifestPath,
        'path: src/assets/content/mitarbeiter-icon.webp',
        'path: src/assets/content/hero-image.jpg'
      ),
    'duplicate asset path src/assets/content/hero-image.jpg'
  )
})

test('rejects a content image whose manifest record was deleted', async () => {
  await assertDiagnostic((root) => {
    const manifest = readFileSync(join(root, manifestPath), 'utf8')
    const finalRecord = manifest.slice(
      manifest.indexOf('  - id: product-rehabereich')
    )
    replaceInFile(root, manifestPath, finalRecord, '')
  }, 'unmanifested content image')
})

test('rejects an asset file absent from the manifest', async () => {
  await assertDiagnostic((root) => {
    const image = readFileSync(join(root, 'src/assets/content/hero-image.jpg'))
    writeFileSync(join(root, 'src/assets/content/unlisted.jpg'), image)
  }, 'unmanifested asset file')
})

test('rejects a manifest path symlink that escapes the asset directory', async () => {
  await assertDiagnostic((root) => {
    const target = join(root, 'outside.jpg')
    writeFileSync(
      target,
      readFileSync(join(root, 'src/assets/content/hero-image.jpg'))
    )
    const link = join(root, 'src/assets/content/escaped.jpg')
    symlinkSync(target, link)
    replaceInFile(
      root,
      manifestPath,
      'path: src/assets/content/hero-image.jpg',
      'path: src/assets/content/escaped.jpg'
    )
  }, 'path must resolve within src/assets/content')
})

test('maps common Sharp source formats to MIME types', () => {
  assert.equal(sharpMimeType({ format: 'avif' }), 'image/avif')
  assert.equal(
    sharpMimeType({ format: 'heif', compression: 'av1' }),
    'image/avif'
  )
  assert.equal(
    sharpMimeType({ format: 'heif', compression: 'hevc' }),
    'image/heif'
  )
  assert.equal(sharpMimeType({ format: 'tiff' }), 'image/tiff')
  assert.equal(sharpMimeType({ format: 'gif' }), 'image/gif')
  assert.equal(sharpMimeType({ format: 'svg' }), 'image/svg+xml')
})

test('rejects an unreferenced manifest asset', async () => {
  await assertDiagnostic(
    (root) => removePath(root, 'src/content/product-groups/rehabereich.yaml'),
    'asset product-rehabereich is not referenced'
  )
})

const manifestMutationCases = [
  ['a changed SHA-256', '12af20a44', '02af20a44', 'sha256 mismatch'],
  ['incorrect dimensions', 'width: 4820', 'width: 1', 'dimensions mismatch'],
  [
    'an incorrect MIME type',
    'mimeType: image/jpeg',
    'mimeType: image/png',
    'MIME type mismatch',
  ],
  [
    'empty rights provenance',
    "provenance: 'Committed binary is byte-identical",
    "provenance: '' # Committed binary is byte-identical",
    'rights.provenance must be non-empty',
  ],
]

for (const [name, from, to, diagnostic] of manifestMutationCases) {
  test(`rejects ${name}`, async () => {
    await assertDiagnostic(
      (root) => replaceInFile(root, manifestPath, from, to),
      diagnostic
    )
  })
}

test('rejects an asset ID changed independently of its photo', async () => {
  await assertDiagnostic(
    (root) =>
      replaceInFile(
        root,
        'src/content/product-groups/rehabereich.yaml',
        'assetId: product-rehabereich',
        'assetId: product-motorensysteme'
      ),
    'assetId and photo identify different assets'
  )
})

test('accumulates identity mismatch and alt-policy diagnostics', async () => {
  const { errors } = await verifyCopy((root) => {
    const path = 'src/content/product-groups/rehabereich.yaml'
    replaceInFile(
      root,
      path,
      'assetId: product-rehabereich',
      'assetId: product-motorensysteme'
    )
    replaceInFile(root, path, "alt: ''", 'alt: Rehabilitation equipment')
  })

  assert.ok(
    errors.some((error) =>
      error.includes('assetId and photo identify different assets')
    ),
    errors.join('\n')
  )
  assert.ok(
    errors.some((error) =>
      error.includes('decorative asset requires empty alt')
    ),
    errors.join('\n')
  )
})

test('rejects a photo changed independently of its asset ID', async () => {
  await assertDiagnostic(
    (root) =>
      replaceInFile(
        root,
        'src/content/product-groups/rehabereich.yaml',
        'photo: ../../assets/content/rehabereich.jpg',
        'photo: ../../assets/content/motorensysteme.jpg'
      ),
    'assetId and photo identify different assets'
  )
})

test('rejects a usage with a missing photo field', async () => {
  const path = 'src/content/employees/gerhard-gruber.yaml'
  await assertDiagnostic(
    (root) =>
      replaceInFile(
        root,
        path,
        'photo: ../../assets/content/mitarbeiter-icon.webp\n',
        ''
      ),
    `${path}: photo must be a non-empty string`
  )
})

test('rejects a usage with a non-string image field', async () => {
  const path = 'src/content/homepage/hero.yaml'
  await assertDiagnostic(
    (root) =>
      replaceInFile(
        root,
        path,
        'image: ../../assets/content/hero-image.jpg',
        'image: [../../assets/content/hero-image.jpg]'
      ),
    `${path}: image must be a non-empty string`
  )
})

test('rejects non-empty alt text for decorative usage', async () => {
  await assertDiagnostic(
    (root) =>
      replaceInFile(
        root,
        'src/content/homepage/hero.yaml',
        "alt: ''",
        'alt: Decorative hero'
      ),
    'decorative asset requires empty alt'
  )
})

test('rejects empty alt text for semantic usage', async () => {
  await assertDiagnostic(
    (root) =>
      replaceInFile(
        root,
        manifestPath,
        'policy: decorative',
        'policy: semantic'
      ),
    'semantic asset requires non-empty alt'
  )
})
