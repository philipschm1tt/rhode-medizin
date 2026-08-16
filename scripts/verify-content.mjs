import { relative, resolve } from 'node:path'
import {
  isDirectExecution,
  isNonEmptyString,
  listFiles,
  READ_YAML_ERROR,
  readText,
  readYaml,
  runCli,
  scanActiveSources,
  toPosix,
} from './lib/verification.mjs'

const EXPECTED_MDX = ['data-policy.mdx', 'imprint.mdx', 'index.mdx']
const COLLECTIONS = [
  {
    dir: 'src/content/employees',
    label: 'employees',
    strings: ['name', 'photo', 'assetId'],
  },
  {
    dir: 'src/content/product-groups',
    label: 'product-groups',
    strings: ['name', 'photo', 'assetId'],
  },
]
const FORBIDDEN = [
  ['set:html', /\bset:html\s*=/],
  ['raw import', /\?raw(?:['"]|$)/],
  ['removed prose store', /content\/prose/],
  ['Contentful API', /(?:cdn|preview)\.contentful\.com/i],
  ['Contentful asset host', /(?:images|videos)\.ctfassets\.net/i],
]

const isMapping = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const verifyCollection = (root, collection, errors) => {
  const paths = listFiles(root, collection.dir, '.yaml')
  const orders = new Map()
  const stems = new Map()

  for (const path of paths) {
    const relativePath = toPosix(
      relative(resolve(root, collection.dir), resolve(root, path))
    )
    const filename = relativePath.split('/').at(-1)
    const stem = filename.replace(/\.yaml$/, '')

    if (relativePath.includes('/')) errors.push(`${path}: nested YAML record`)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(stem)) {
      errors.push(`${path}: invalid record filename`)
    }
    if (stems.has(stem)) {
      errors.push(
        `${collection.label}: duplicate stem ${stem} in ${path} and ${stems.get(stem)}`
      )
    } else {
      stems.set(stem, path)
    }

    const record = readYaml(root, path, errors)
    if (record === READ_YAML_ERROR) continue
    if (!isMapping(record)) {
      errors.push(`${path}: record must be a mapping`)
      continue
    }

    if (!Number.isInteger(record.order) || record.order <= 0) {
      errors.push(`${path}: order must be a positive integer`)
    } else if (orders.has(record.order)) {
      errors.push(
        `${collection.label}: duplicate order ${record.order} in ${path} and ${orders.get(record.order)}`
      )
    } else {
      orders.set(record.order, path)
    }

    for (const field of collection.strings) {
      if (!isNonEmptyString(record[field])) {
        errors.push(`${path}: ${field} must be non-empty`)
      }
    }
    if (typeof record.alt !== 'string')
      errors.push(`${path}: alt must be a string`)

    if (collection.label === 'product-groups') {
      if (!Array.isArray(record.examples) || record.examples.length === 0) {
        errors.push(`${path}: examples must be a non-empty array`)
      } else {
        record.examples.forEach((example, index) => {
          if (!isNonEmptyString(example)) {
            errors.push(`${path}: examples[${index}] must be non-empty`)
          }
        })
      }
    }
  }

  for (let order = 1; order <= paths.length; order += 1) {
    if (!orders.has(order))
      errors.push(`${collection.label}: missing order ${order}`)
  }

  return paths.length
}

export const verifyContent = async (root = process.cwd()) => {
  const errors = []
  const counts = COLLECTIONS.map((collection) =>
    verifyCollection(root, collection, errors)
  )

  const pages = listFiles(root, 'src/pages', '.mdx').map((path) =>
    toPosix(relative(resolve(root, 'src/pages'), resolve(root, path)))
  )
  for (const page of EXPECTED_MDX) {
    if (!pages.includes(page))
      errors.push(`src/pages/${page}: missing expected route`)
  }
  for (const page of pages) {
    if (!EXPECTED_MDX.includes(page))
      errors.push(`src/pages/${page}: unexpected route`)
  }

  for (const path of scanActiveSources(root)) {
    const source = readText(root, path)
    for (const [label, pattern] of FORBIDDEN) {
      if (pattern.test(source)) errors.push(`${path}: ${label} is forbidden`)
    }
  }

  return {
    errors,
    summary: `${counts[0]} employees, ${counts[1]} product groups, ${pages.length} pages`,
  }
}

if (isDirectExecution(import.meta.url)) {
  runCli('verify:content', verifyContent)
}
