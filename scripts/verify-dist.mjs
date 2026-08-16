import { existsSync, readFileSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'
import * as cheerioNS from 'cheerio'
import sharp from 'sharp'
import {
  isDirectExecution,
  listFiles,
  readYaml,
  runCli,
  sha256,
  toPosix,
} from './lib/verification.mjs'

const cheerio = cheerioNS.default ?? cheerioNS
const origin = 'https://www.rhode-medizin.de'
const homepageTitle = 'Rhode Medizintechnik – Heinrich Rhode GmbH'
const homepageDescription =
  'Heinrich Rhode GmbH – Medizintechnik für Praxen und Kliniken. Beratung, Service und Produkte aus einer Hand.'
const routes = [
  {
    label: 'homepage',
    path: 'dist/index.html',
    title: homepageTitle,
    canonical: `${origin}/`,
  },
  {
    label: 'imprint',
    path: 'dist/imprint/index.html',
    title: 'Impressum',
    canonical: `${origin}/imprint/`,
    legal: true,
  },
  {
    label: 'data-policy',
    path: 'dist/data-policy/index.html',
    title: 'Datenschutzhinweis',
    canonical: `${origin}/data-policy/`,
    legal: true,
  },
]

const value = ($, selector, attribute) =>
  attribute ? $(selector).attr(attribute) : $(selector).text().trim()

const expectValue = (errors, $, label, selector, attribute, expected) => {
  const actual = value($, selector, attribute)
  if (actual !== expected)
    errors.push(`${label} expected ${expected}, got ${actual ?? '<missing>'}`)
}

const localPath = (url) => {
  try {
    const parsed = new URL(url, origin)
    return parsed.origin === origin ? decodeURIComponent(parsed.pathname) : null
  } catch {
    return null
  }
}

const builtPath = (root, url) => {
  const path = localPath(url)
  if (!path) return null
  if (path.endsWith('/'))
    return resolve(root, 'dist', path.slice(1), 'index.html')
  return resolve(root, 'dist', path.slice(1))
}

const sourceRecords = (root, dir, errors) =>
  listFiles(root, dir, '.yaml')
    .map((path) => ({ path, record: readYaml(root, path, errors) }))
    .filter(({ record }) => record && typeof record === 'object')
    .sort((a, b) => a.record.order - b.record.order)

const imageStem = (path) => basename(path, extname(path))

const checkImageFile = (root, errors, label, url) => {
  const path = builtPath(root, url)
  if (!path || !existsSync(path))
    errors.push(`${label} file is missing: ${url ?? '<missing>'}`)
}

const checkResponsiveFiles = (root, errors, $, pageLabel) => {
  $('img[src]').each((index, element) => {
    const image = $(element)
    checkImageFile(
      root,
      errors,
      `${pageLabel} image ${index + 1} src`,
      image.attr('src')
    )
  })

  $('[srcset]').each((_, element) => {
    const candidateSet = $(element).attr('srcset') ?? ''
    for (const candidate of candidateSet.split(',')) {
      const url = candidate.trim().split(/\s+/)[0]
      if (url)
        checkImageFile(
          root,
          errors,
          `${pageLabel} ${element.tagName} srcset candidate`,
          url
        )
    }
  })
}

const checkOrderedImages = (errors, $, selector, label, records) => {
  const images = $(selector).toArray()
  if (images.length !== records.length) {
    errors.push(
      `${label} image count expected ${records.length}, got ${images.length}`
    )
  }

  records.forEach(({ record }, index) => {
    const image = images[index] ? $(images[index]) : null
    if (!image) return
    const expectedAlt = record.alt
    if (image.attr('alt') !== expectedAlt)
      errors.push(
        `${label} image ${index + 1} alt expected "${expectedAlt}", got "${image.attr('alt') ?? '<missing>'}"`
      )
    const source = record.photo
    if (!image.attr('src')?.includes(imageStem(source)))
      errors.push(`${label} image ${index + 1} source does not match ${source}`)
    if (image.attr('loading') !== 'lazy')
      errors.push(
        `${label} image ${index + 1} loading expected lazy, got ${image.attr('loading') ?? '<missing>'}`
      )
  })
}

const checkLinks = (root, errors, $, pageLabel) => {
  expectValue(errors, $, `${pageLabel} header link`, 'header a', 'href', '/')
  expectValue(
    errors,
    $,
    `${pageLabel} footer link`,
    'footer a[href="/imprint/"]',
    'href',
    '/imprint/'
  )
  expectValue(
    errors,
    $,
    `${pageLabel} footer link`,
    'footer a[href="/data-policy/"]',
    'href',
    '/data-policy/'
  )

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')
    if (!href?.startsWith('/')) return
    const path = builtPath(root, href)
    if (!path || !existsSync(path))
      errors.push(`${pageLabel} link ${href} does not resolve to a built file`)
  })
}

const checkLegalMetadataAbsence = (errors, $, label) => {
  if ($('meta[name="description"]').length)
    errors.push(`${label} description metadata must be absent`)
  if ($('meta[property^="og:"]').length)
    errors.push(`${label} Open Graph metadata must be absent`)
  if ($('meta[name^="twitter:"]').length)
    errors.push(`${label} Twitter metadata must be absent`)
}

const checkExactLink = (errors, $, label, expected) => {
  if ($(`a[href="${expected}"]`).length !== 1)
    errors.push(`${label} link expected ${expected}`)
}

const checkSocialImage = async (root, errors, $) => {
  const ogImage = value($, 'meta[property="og:image"]', 'content')
  const twitterImage = value($, 'meta[name="twitter:image"]', 'content')
  if (twitterImage !== ogImage)
    errors.push('homepage twitter:image expected the same URL as og:image')

  const socialPath = builtPath(root, ogImage)
  if (!socialPath || !existsSync(socialPath)) {
    errors.push(`homepage og:image file is missing: ${ogImage ?? '<missing>'}`)
    return
  }

  const manifest = readYaml(root, 'src/content/assets.yaml', errors)
  const hero = readYaml(root, 'src/content/homepage/hero.yaml', errors)
  const asset = manifest?.assets?.find((entry) => entry.id === hero?.assetId)
  if (!asset?.path) {
    errors.push('homepage manifest-declared hero source is missing')
    return
  }

  const expected = await sharp(resolve(root, asset.path))
    .jpeg({ quality: 80 })
    .toBuffer()
  const actual = readFileSync(socialPath)
  if (sha256(actual) !== sha256(expected))
    errors.push(
      'homepage social image bytes do not match the manifest-declared hero source'
    )
}

const checkSitemap = (root, errors) => {
  const path = resolve(root, 'dist/sitemap-0.xml')
  if (!existsSync(path)) {
    errors.push('sitemap missing dist/sitemap-0.xml')
    return
  }
  const $ = cheerio.load(readFileSync(path, 'utf8'), { xmlMode: true })
  const actual = $('loc')
    .map((_, element) => new URL($(element).text()).pathname)
    .get()
    .sort()
  const expected = ['/', '/data-policy/', '/imprint/']
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    errors.push(
      `sitemap routes expected exactly ${expected.join(', ')}, got ${actual.join(', ')}`
    )
}

const scanContentful = (root, errors) => {
  const pattern =
    /ctfassets\.net|ctfapps\.net|cdn\.contentful\.com|preview\.contentful\.com/i
  for (const path of listFiles(root, 'dist')) {
    if (!/\.(?:html|xml|css|js|mjs|json|txt)$/i.test(path)) continue
    if (pattern.test(readFileSync(resolve(root, path), 'utf8')))
      errors.push(`${toPosix(path)}: Contentful host found in built output`)
  }
}

export const verifyDist = async (root = process.cwd()) => {
  const errors = []
  const pages = new Map()

  for (const route of routes) {
    const absolute = resolve(root, route.path)
    if (!existsSync(absolute)) {
      errors.push(`${route.label} route missing ${route.path}`)
      continue
    }
    const $ = cheerio.load(readFileSync(absolute, 'utf8'))
    pages.set(route.label, $)
    expectValue(errors, $, `${route.label} title`, 'title', null, route.title)
    expectValue(
      errors,
      $,
      `${route.label} canonical`,
      'link[rel="canonical"]',
      'href',
      route.canonical
    )
    if (route.legal) checkLegalMetadataAbsence(errors, $, route.label)
    checkLinks(root, errors, $, route.label)
    checkResponsiveFiles(root, errors, $, route.label)
  }

  const homepage = pages.get('homepage')
  if (homepage) {
    const metadata = [
      [
        'homepage description',
        'meta[name="description"]',
        'content',
        homepageDescription,
      ],
      [
        'homepage og:title',
        'meta[property="og:title"]',
        'content',
        homepageTitle,
      ],
      ['homepage og:type', 'meta[property="og:type"]', 'content', 'website'],
      ['homepage og:url', 'meta[property="og:url"]', 'content', `${origin}/`],
      ['homepage og:locale', 'meta[property="og:locale"]', 'content', 'de_DE'],
      [
        'homepage og:site_name',
        'meta[property="og:site_name"]',
        'content',
        'Heinrich Rhode GmbH',
      ],
      [
        'homepage twitter:card',
        'meta[name="twitter:card"]',
        'content',
        'summary_large_image',
      ],
      [
        'homepage twitter:title',
        'meta[name="twitter:title"]',
        'content',
        homepageTitle,
      ],
      [
        'homepage twitter:description',
        'meta[name="twitter:description"]',
        'content',
        homepageDescription,
      ],
    ]
    for (const contract of metadata) expectValue(errors, homepage, ...contract)

    const hero = homepage('.hero-area img').first()
    if (hero.attr('alt') !== '')
      errors.push(
        `homepage hero alt expected "", got "${hero.attr('alt') ?? '<missing>'}"`
      )
    if (hero.attr('loading') !== 'eager')
      errors.push(
        `homepage hero loading expected eager, got ${hero.attr('loading') ?? '<missing>'}`
      )
    if (hero.attr('fetchpriority') !== 'high')
      errors.push(
        `homepage hero fetchpriority expected high, got ${hero.attr('fetchpriority') ?? '<missing>'}`
      )

    const heroRecord = readYaml(root, 'src/content/homepage/hero.yaml', errors)
    if (!hero.attr('src')?.includes(imageStem(heroRecord?.image ?? 'missing')))
      errors.push('homepage hero source does not match source record')
    checkImageFile(root, errors, 'homepage hero src', hero.attr('src'))

    checkOrderedImages(
      errors,
      homepage,
      '.employee-tile img',
      'homepage employee',
      sourceRecords(root, 'src/content/employees', errors)
    )
    checkOrderedImages(
      errors,
      homepage,
      '.product-group img',
      'homepage product',
      sourceRecords(root, 'src/content/product-groups', errors)
    )
    await checkSocialImage(root, errors, homepage)
  }

  const imprint = pages.get('imprint')
  if (imprint)
    checkExactLink(
      errors,
      imprint,
      'imprint eRecht24',
      'https://www.e-recht24.de'
    )
  const dataPolicy = pages.get('data-policy')
  if (dataPolicy) {
    checkExactLink(
      errors,
      dataPolicy,
      'data-policy DGD',
      'https://dg-datenschutz.de/datenschutz-dienstleistungen/externer-datenschutzbeauftragter/'
    )
    checkExactLink(
      errors,
      dataPolicy,
      'data-policy WBS',
      'https://www.wbs-law.de/'
    )
  }

  const notFoundPath = resolve(root, 'dist/404.html')
  if (!existsSync(notFoundPath)) {
    errors.push('404 route missing dist/404.html')
  } else {
    const notFound = cheerio.load(readFileSync(notFoundPath, 'utf8'))
    if (notFound('link[rel="canonical"]').length)
      errors.push('404 canonical metadata must be absent')
    checkLinks(root, errors, notFound, '404')
    checkResponsiveFiles(root, errors, notFound, '404')
  }

  checkSitemap(root, errors)
  scanContentful(root, errors)

  return {
    errors,
    summary: '3 routes, 404, sitemap, metadata, links, 11 content images',
  }
}

if (isDirectExecution(import.meta.url)) runCli('verify:dist', verifyDist)
