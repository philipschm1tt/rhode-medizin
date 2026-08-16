import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { verifyAssets } from '../../scripts/verify-assets.mjs'
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
      replaceInFile(root, manifestPath, '  - id: employee-placeholder', '  - id: homepage-hero'),
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
    const finalRecord = manifest.slice(manifest.indexOf('  - id: product-rehabereich'))
    replaceInFile(
      root,
      manifestPath,
      finalRecord,
      ''
    )
  }, 'unmanifested content image')
})

test('rejects an asset file absent from the manifest', async () => {
  await assertDiagnostic((root) => {
    const image = readFileSync(join(root, 'src/assets/content/hero-image.jpg'))
    writeFileSync(join(root, 'src/assets/content/unlisted.jpg'), image)
  }, 'unmanifested asset file')
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
