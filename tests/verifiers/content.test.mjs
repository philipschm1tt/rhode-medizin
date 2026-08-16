import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { verifyContent } from '../../scripts/verify-content.mjs'
import { copyPaths, removePath, replaceInFile } from './helpers.mjs'

const sourcePaths = [
  'src/content',
  'src/content.config.ts',
  'src/pages',
  'src/components',
  'src/layouts',
  'astro.config.mjs',
]

const verifyCopy = async (mutate) => {
  const root = copyPaths(sourcePaths)
  mutate?.(root)
  return verifyContent(root)
}

test('accepts the source content baseline', async () => {
  const result = await verifyCopy()
  assert.deepEqual(result.errors, [])
  assert.equal(result.summary, '5 employees, 5 product groups, 3 pages')
})

test('rejects a collection record without an asset ID', async () => {
  const path = 'src/content/employees/werner-schmitt.yaml'
  const { errors } = await verifyCopy((root) =>
    replaceInFile(root, path, 'assetId: employee-placeholder\n', '')
  )
  assert.ok(
    errors.includes(`${path}: assetId must be non-empty`),
    errors.join('\n')
  )
})

const cases = [
  [
    'duplicate order',
    'src/content/employees/werner-schmitt.yaml',
    'order: 2',
    'order: 1',
    'duplicate order 1',
  ],
  [
    'empty example',
    'src/content/product-groups/motorensysteme.yaml',
    '  - Elan 4 – elektrisches System für die Neuro- und Wirbelsäulenchirurgie',
    "  - ''",
    'examples[0] must be non-empty',
  ],
  [
    'set:html',
    'src/components/blocks/Section.astro',
    '<slot />',
    '<div set:html={"bad"} />',
    'set:html is forbidden',
  ],
  [
    'raw import',
    'src/pages/index.mdx',
    "from '../layouts/PageLayout.astro'",
    "from '../layouts/PageLayout.astro?raw'",
    'raw import is forbidden',
  ],
  [
    'Contentful API',
    'astro.config.mjs',
    "site: 'https://www.rhode-medizin.de'",
    "site: 'https://cdn.contentful.com'",
    'Contentful API is forbidden',
  ],
  [
    'Contentful asset host',
    'src/layouts/Layout.astro',
    '<head>',
    '<head><!-- images.ctfassets.net -->',
    'Contentful asset host is forbidden',
  ],
]

for (const [name, path, from, to, diagnostic] of cases) {
  test(`rejects ${name}`, async () => {
    const { errors } = await verifyCopy((root) =>
      replaceInFile(root, path, from, to)
    )
    assert.ok(
      errors.some((error) => error.includes(diagnostic)),
      errors.join('\n')
    )
  })
}

test('rejects a null collection record as a non-mapping', async () => {
  const path = 'src/content/employees/werner-schmitt.yaml'
  const { errors } = await verifyCopy((root) => {
    writeFileSync(join(root, path), 'null\n')
  })
  assert.ok(
    errors.some(
      (error) =>
        error.includes(path) && error.includes('record must be a mapping')
    ),
    errors.join('\n')
  )
})

test('passes verifyContent directly to runCli', () => {
  const source = readFileSync(
    join(import.meta.dirname, '../../scripts/verify-content.mjs'),
    'utf8'
  )
  assert.match(source, /runCli\('verify:content', verifyContent\)/)
})

test('reports a missing expected route', async () => {
  const { errors } = await verifyCopy((root) =>
    removePath(root, 'src/pages/imprint.mdx')
  )
  assert.ok(
    errors.some((error) => error.includes('imprint.mdx')),
    errors.join('\n')
  )
})

test('reports an unexpected route', async () => {
  const { errors } = await verifyCopy((root) => {
    writeFileSync(join(root, 'src/pages/extra.mdx'), '# Extra\n')
  })
  assert.ok(
    errors.some((error) => error.includes('extra.mdx')),
    errors.join('\n')
  )
})

test('rejects nested collection records', async () => {
  const path = 'src/content/employees/team/bad.yaml'
  const { errors } = await verifyCopy((root) => {
    const absolute = join(root, path)
    mkdirSync(dirname(absolute), { recursive: true })
    writeFileSync(absolute, 'order: 6\nname: Bad\nphoto: bad.jpg\nalt: Bad\n')
  })
  assert.ok(
    errors.some((error) => error.includes(path)),
    errors.join('\n')
  )
})

test('rejects invalid collection record filenames', async () => {
  const path = 'src/content/employees/Bad_Name.yaml'
  const { errors } = await verifyCopy((root) => {
    renameSync(
      join(root, 'src/content/employees/werner-schmitt.yaml'),
      join(root, path)
    )
  })
  assert.ok(
    errors.some((error) => error.includes(path)),
    errors.join('\n')
  )
})
