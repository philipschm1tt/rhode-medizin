import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const readJson = (path) => JSON.parse(readFileSync(resolve(path), 'utf8'))

const source = readJson('tests/fixtures/cutover/contentful-source.json')
const map = readJson('tests/fixtures/cutover/content-map.json')

const errors = []

const typename = (e) => {
  const ctToTn = {
    seite: 'ContentfulSeite',
    heroBlock: 'ContentfulHeroBlock',
    zitat: 'ContentfulZitat',
    abschnitt: 'ContentfulAbschnitt',
    textabschnitt: 'ContentfulTextinhalt',
    kartenLayout: 'ContentfulKartenLayout',
    mitarbeiter: 'ContentfulMitarbeiter',
    produktgruppe: 'ContentfulProduktgruppe',
  }
  return ctToTn[e.contentType] ?? null
}

const entryById = new Map(source.entries.map((e) => [e.id, e]))

const expectedRoutes = new Map(map.pages.map((p) => [p.sourceId, p.route]))
const expectedEmployees = new Map(
  map.employees.map((e) => [e.sourceId, e.localId])
)
const expectedProductGroups = new Map(
  map.productGroups.map((p) => [p.sourceId, p.localId])
)

for (const [sourceId, route] of expectedRoutes) {
  if (!existsSync(resolve(route))) {
    errors.push(`missing route file for page ${sourceId}: ${route}`)
  }
}
for (const entry of source.entries) {
  if (typename(entry) === 'ContentfulSeite' && !expectedRoutes.has(entry.id)) {
    errors.push(`frozen page ${entry.id} has no content-map route`)
  }
  if (
    typename(entry) === 'ContentfulMitarbeiter' &&
    !expectedEmployees.has(entry.id)
  ) {
    errors.push(`frozen employee ${entry.id} has no content-map local id`)
  }
  if (
    typename(entry) === 'ContentfulProduktgruppe' &&
    !expectedProductGroups.has(entry.id)
  ) {
    errors.push(`frozen product group ${entry.id} has no content-map local id`)
  }
}

const employeeFiles = new Set(
  readdirSync('src/content/employees')
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => f.replace(/\.yaml$/, ''))
)
const productGroupFiles = new Set(
  readdirSync('src/content/product-groups')
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => f.replace(/\.yaml$/, ''))
)

const localEmployeeIds = new Set(expectedEmployees.values())
const localProductGroupIds = new Set(expectedProductGroups.values())

for (const id of localEmployeeIds) {
  if (!employeeFiles.has(id))
    errors.push(`missing employee yaml: src/content/employees/${id}.yaml`)
}
for (const id of localProductGroupIds) {
  if (!productGroupFiles.has(id))
    errors.push(
      `missing product-group yaml: src/content/product-groups/${id}.yaml`
    )
}
for (const id of employeeFiles) {
  if (!localEmployeeIds.has(id))
    errors.push(`employee yaml has no frozen mapping: ${id}`)
}
for (const id of productGroupFiles) {
  if (!localProductGroupIds.has(id))
    errors.push(`product-group yaml has no frozen mapping: ${id}`)
}

const checkUniqueOrder = (dir, label) => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.yaml'))
  const orders = new Map()
  for (const f of files) {
    const text = readFileSync(resolve(dir, f), 'utf8')
    const m = text.match(/^order:\s*(\d+)\s*$/m)
    if (!m) {
      errors.push(`${label}/${f}: missing or invalid order`)
      return
    }
    const n = Number(m[1])
    if (orders.has(n))
      errors.push(`${label}: duplicate order ${n} in ${f} and ${orders.get(n)}`)
    orders.set(n, f)
  }
}
checkUniqueOrder('src/content/employees', 'employees')
checkUniqueOrder('src/content/product-groups', 'product-groups')

const homepageOrder = (typeName) => {
  const page = source.entries.find(
    (e) =>
      typename(e) === 'ContentfulSeite' &&
      (e.fields.slug ?? '').replace(/^\/+|\/+$/g, '') === ''
  )
  if (!page) return []
  const order = []
  const visited = new Set()
  const walk = (entry) => {
    if (!entry || visited.has(entry.id)) return
    visited.add(entry.id)
    const tn = typename(entry)
    if (tn === typeName) {
      order.push(entry.id)
      return
    }
    for (const value of Object.values(entry.fields)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const id = item?.sys?.id
          if (id && entryById.has(id)) walk(entryById.get(id))
        }
      } else if (value?.sys?.id && entryById.has(value.sys.id)) {
        walk(entryById.get(value.sys.id))
      }
    }
  }
  for (const m of page.fields.module ?? []) {
    const id = m?.sys?.id
    if (id && entryById.has(id)) walk(entryById.get(id))
  }
  return order
}

const employeeOrder = homepageOrder('ContentfulMitarbeiter')
const productGroupOrder = homepageOrder('ContentfulProduktgruppe')

const checkSequence = (dir, frozenOrder, localMap, label) => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.yaml'))
  const byOrder = new Map()
  for (const f of files) {
    const text = readFileSync(resolve(dir, f), 'utf8')
    const m = text.match(/^order:\s*(\d+)\s*$/m)
    byOrder.set(Number(m[1]), f.replace(/\.yaml$/, ''))
  }
  const sorted = [...byOrder.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, id]) => id)
  for (let i = 0; i < frozenOrder.length; i++) {
    const expectedLocal = localMap.get(frozenOrder[i])
    if (sorted[i] !== expectedLocal) {
      errors.push(
        `${label} order mismatch at position ${i}: expected ${expectedLocal}, got ${sorted[i]}`
      )
    }
  }
  if (sorted.length !== frozenOrder.length) {
    errors.push(
      `${label} count mismatch: ${sorted.length} local vs ${frozenOrder.length} frozen`
    )
  }
}
checkSequence(
  'src/content/employees',
  employeeOrder,
  expectedEmployees,
  'employees'
)
checkSequence(
  'src/content/product-groups',
  productGroupOrder,
  expectedProductGroups,
  'product-groups'
)

if (errors.length) {
  console.error(`verify:content: ${errors.length} problem(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(
  `verify:content: ok (${map.employees.length} employees, ${map.productGroups.length} product groups, ${map.pages.length} pages)`
)
