import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import * as cheerioNS from 'cheerio'

const cheerio = cheerioNS.default ?? cheerioNS

const errors = []
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null)

const checkRoute = (file, label) => {
  const html = read(resolve('dist', file))
  if (!html) {
    errors.push(`missing built route: dist/${file}`)
    return null
  }
  return cheerio.load(html)
}

const homepage = checkRoute('index.html', 'homepage')
const imprint = checkRoute('imprint/index.html', 'imprint')
const dataPolicy = checkRoute('data-policy/index.html', 'data-policy')
if (!homepage || !imprint || !dataPolicy) {
  console.error(`verify:dist: ${errors.length} problem(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

const expectTitle = ($, expected) => {
  const t = $('title').text().trim()
  if (t !== expected)
    errors.push(`title mismatch: expected "${expected}", got "${t}"`)
}
expectTitle(homepage, 'Rhode Medizintechnik – Heinrich Rhode GmbH')
expectTitle(imprint, 'Impressum')
expectTitle(dataPolicy, 'Datenschutzhinweis')

const desc = homepage('meta[name="description"]').attr('content')
const expectedDesc =
  'Heinrich Rhode GmbH – Medizintechnik für Praxen und Kliniken. Beratung, Service und Produkte aus einer Hand.'
if (desc !== expectedDesc) errors.push(`homepage description mismatch: ${desc}`)

const ogImage = homepage('meta[property="og:image"]').attr('content')
const twitterImage = homepage('meta[name="twitter:image"]').attr('content')
const siteOrigin = 'https://www.rhode-medizin.de'
const isLocalAstro = (url) =>
  url &&
  url.startsWith(`${siteOrigin}/_astro/`) &&
  /\.(jpe?g|png|webp|avif)$/i.test(url)
if (!isLocalAstro(ogImage))
  errors.push(`og:image must be a local /_astro/ URL, got: ${ogImage}`)
if (!isLocalAstro(twitterImage))
  errors.push(
    `twitter:image must be a local /_astro/ URL, got: ${twitterImage}`
  )
for (const url of [ogImage, twitterImage].filter(Boolean)) {
  const path = url.replace(siteOrigin, '')
  if (!existsSync(resolve('dist', path.replace(/^\//, '')))) {
    errors.push(`social image file missing in dist: ${path}`)
  }
}

for (const [$, label] of [
  [imprint, 'imprint'],
  [dataPolicy, 'data-policy'],
]) {
  if ($('meta[name="description"]').length)
    errors.push(`${label} must not have a description meta tag`)
  if ($('meta[property="og:title"]').length)
    errors.push(`${label} must not have Open Graph metadata`)
  if ($('meta[name="twitter:card"]').length)
    errors.push(`${label} must not have Twitter card metadata`)
}

const sitemapIndex =
  read('dist/sitemap-index.xml') || read('dist/sitemap-0.xml')
const sitemap0 = read('dist/sitemap-0.xml')
if (!sitemapIndex) {
  errors.push('missing sitemap file')
} else {
  const allLocs = []
  const $idx = cheerio.load(sitemapIndex, { xmlMode: true })
  allLocs.push(
    ...$idx('loc')
      .map((_, el) => $idx(el).text())
      .get()
  )
  if (sitemap0) {
    const $0 = cheerio.load(sitemap0, { xmlMode: true })
    allLocs.push(
      ...$0('loc')
        .map((_, el) => $0(el).text())
        .get()
    )
  }
  for (const expected of [
    'https://www.rhode-medizin.de/',
    'https://www.rhode-medizin.de/imprint/',
    'https://www.rhode-medizin.de/data-policy/',
  ]) {
    if (!allLocs.includes(expected)) errors.push(`sitemap missing ${expected}`)
  }
}

const builtFiles = []
const walk = (dir) => {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, name.name)
    if (name.isDirectory()) walk(full)
    else if (/\.(html|xml|css|js|mjs|json)$/i.test(name.name))
      builtFiles.push(full)
  }
}
walk('dist')
const ctfPattern =
  /ctfassets\.net|ctfapps\.net|cdn\.contentful\.com|preview\.contentful\.com/i
for (const f of builtFiles) {
  const text = readFileSync(f, 'utf8')
  if (ctfPattern.test(text)) {
    errors.push(
      `Contentful URL found in active output: ${f.replace(resolve('dist'), '.')}`
    )
  }
}

if (errors.length) {
  console.error(`verify:dist: ${errors.length} problem(s):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('verify:dist: ok')
