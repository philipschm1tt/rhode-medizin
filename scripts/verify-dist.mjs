import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import * as cheerioNS from 'cheerio'
import sharp from 'sharp'
import {
  isDirectExecution,
  listFiles,
  readYaml,
  resolveContentImage,
  runCli,
  sha256,
  toPosix,
} from './lib/verification.mjs'

const cheerio = cheerioNS.default ?? cheerioNS
const expectedImageDigests = new Map()
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
  const elements = $(selector)
  if (elements.length !== 1)
    errors.push(`${label} count expected 1, got ${elements.length}`)
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

const hasUnsafeEncoding = (url) => /%(?:2e|2f|5c)/i.test(url)

const builtPath = (root, url) => {
  const path = localPath(url)
  if (!path) return null
  const dist = resolve(root, 'dist')
  const candidate = path.endsWith('/')
    ? resolve(dist, path.slice(1), 'index.html')
    : resolve(dist, path.slice(1))
  const fromDist = relative(dist, candidate)
  if (
    fromDist === '..' ||
    fromDist.startsWith(`..${sep}`) ||
    isAbsolute(fromDist)
  )
    return null
  return candidate
}

const sourceRecords = (root, dir, errors) =>
  listFiles(root, dir, '.yaml')
    .map((path) => ({ path, record: readYaml(root, path, errors) }))
    .filter(({ record }) => record && typeof record === 'object')
    .sort((a, b) => a.record.order - b.record.order)

const checkImageFile = (root, errors, label, url) => {
  if (url && localPath(url) && hasUnsafeEncoding(url)) {
    errors.push(`${label} has unsafe local URL: ${url}`)
    return
  }
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

const transformedImageDigest = async (source, output, quality) => {
  const metadata = await sharp(output).metadata()
  const sourceBuffer = readFileSync(source)
  const key = [
    sha256(sourceBuffer),
    metadata.format,
    metadata.width,
    metadata.height,
    quality ?? '',
  ].join(':')
  if (expectedImageDigests.has(key)) return expectedImageDigests.get(key)
  let transform = sharp(source, { failOn: 'none', pages: -1 }).rotate().resize({
    width: metadata.width,
    height: metadata.height,
    withoutEnlargement: true,
    kernel: 'lanczos3',
  })
  transform = quality
    ? transform.toFormat(metadata.format, { quality })
    : transform.toFormat(metadata.format)
  const digest = sha256(await transform.toBuffer())
  expectedImageDigests.set(key, digest)
  return digest
}

const checkDeclaredImage = async (
  root,
  errors,
  label,
  url,
  source,
  quality
) => {
  const output = builtPath(root, url)
  if (!output || !existsSync(output)) return
  try {
    const expected = await transformedImageDigest(
      resolve(root, source),
      output,
      quality
    )
    if (sha256(readFileSync(output)) !== expected)
      errors.push(`${label} bytes do not match its declared source`)
  } catch (error) {
    errors.push(`${label} source identity cannot be checked: ${error.message}`)
  }
}

const checkOrderedImages = async (
  root,
  errors,
  $,
  selector,
  label,
  records
) => {
  const images = $(selector).toArray()
  if (images.length !== records.length) {
    errors.push(
      `${label} image count expected ${records.length}, got ${images.length}`
    )
  }

  await Promise.all(
    records.map(async ({ path, record }, index) => {
      const image = images[index] ? $(images[index]) : null
      if (!image) return
      const expectedAlt = record.alt
      if (image.attr('alt') !== expectedAlt)
        errors.push(
          `${label} image ${index + 1} alt expected "${expectedAlt}", got "${image.attr('alt') ?? '<missing>'}"`
        )
      const source = resolveContentImage(path, record.photo)
      await checkDeclaredImage(
        root,
        errors,
        `${label} image ${index + 1}`,
        image.attr('src'),
        source
      )
      if (image.attr('loading') !== 'lazy')
        errors.push(
          `${label} image ${index + 1} loading expected lazy, got ${image.attr('loading') ?? '<missing>'}`
        )
    })
  )
}

const checkLinks = (root, errors, $, pageLabel, pageUrl) => {
  expectValue(
    errors,
    $,
    `${pageLabel} header link`,
    'header.header a',
    'href',
    '/'
  )
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
    if (!href || href.startsWith('#')) return
    let resolved
    try {
      resolved = new URL(href, pageUrl)
    } catch {
      return
    }
    if (resolved.origin !== origin) return
    if (hasUnsafeEncoding(href)) {
      errors.push(`${pageLabel} link has unsafe local URL: ${href}`)
      return
    }
    const path = builtPath(root, resolved.href)
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
  for (const [label, selector] of [
    ['homepage og:image', 'meta[property="og:image"]'],
    ['homepage twitter:image', 'meta[name="twitter:image"]'],
  ]) {
    const count = $(selector).length
    if (count !== 1) errors.push(`${label} count expected 1, got ${count}`)
  }
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

  let expected
  try {
    expected = await sharp(resolve(root, asset.path))
      .jpeg({ quality: 80 })
      .toBuffer()
  } catch (error) {
    errors.push(`homepage hero source cannot be read: ${error.message}`)
    return
  }
  const actual = readFileSync(socialPath)
  if (sha256(actual) !== sha256(expected))
    errors.push(
      'homepage social image bytes do not match the manifest-declared hero source'
    )
}

const checkSitemap = (root, errors) => {
  const paths = listFiles(root, 'dist').filter((path) =>
    /^dist\/sitemap-\d+\.xml$/.test(path)
  )
  if (paths.length === 0) {
    errors.push('sitemap missing dist/sitemap-N.xml')
    return
  }
  const actual = []
  for (const path of paths) {
    const $ = cheerio.load(readFileSync(resolve(root, path), 'utf8'), {
      xmlMode: true,
    })
    $('loc').each((_, element) => {
      const text = $(element).text()
      try {
        actual.push(new URL(text).toString())
      } catch {
        errors.push(`${path}: invalid sitemap URL ${text}`)
      }
    })
  }
  actual.sort()
  const expected = [
    `${origin}/`,
    `${origin}/data-policy/`,
    `${origin}/imprint/`,
  ]
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    errors.push(
      `sitemap URLs expected exactly ${expected.join(', ')}, got ${actual.join(', ')}`
    )
}

const scanContentful = (root, errors) => {
  const pattern =
    /ctfassets\.net|ctfapps\.net|(?:[a-z0-9-]+\.)*contentful\.com/i
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
    checkLinks(root, errors, $, route.label, route.canonical)
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

    const heroImages = homepage('.hero-area img')
    if (heroImages.length !== 1)
      errors.push(
        `homepage hero image count expected 1, got ${heroImages.length}`
      )
    const hero = heroImages.first()
    const heroRecord = readYaml(root, 'src/content/homepage/hero.yaml', errors)
    if (hero.attr('alt') !== heroRecord?.alt)
      errors.push(
        `homepage hero alt expected "${heroRecord?.alt ?? '<missing>'}", got "${hero.attr('alt') ?? '<missing>'}"`
      )
    if (hero.attr('loading') !== 'eager')
      errors.push(
        `homepage hero loading expected eager, got ${hero.attr('loading') ?? '<missing>'}`
      )
    if (hero.attr('fetchpriority') !== 'high')
      errors.push(
        `homepage hero fetchpriority expected high, got ${hero.attr('fetchpriority') ?? '<missing>'}`
      )

    checkImageFile(root, errors, 'homepage hero src', hero.attr('src'))
    if (heroRecord?.image)
      await checkDeclaredImage(
        root,
        errors,
        'homepage hero image',
        hero.attr('src'),
        resolveContentImage('src/content/homepage/hero.yaml', heroRecord.image),
        70
      )

    const employees = sourceRecords(root, 'src/content/employees', errors)
    const products = sourceRecords(root, 'src/content/product-groups', errors)
    await checkOrderedImages(
      root,
      errors,
      homepage,
      '.employee-tile img',
      'homepage employee',
      employees
    )
    await checkOrderedImages(
      root,
      errors,
      homepage,
      '.product-group img',
      'homepage product',
      products
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
    checkLinks(root, errors, notFound, '404', `${origin}/404.html`)
    checkResponsiveFiles(root, errors, notFound, '404')
  }

  checkSitemap(root, errors)
  scanContentful(root, errors)

  return {
    errors,
    summary: `3 routes, 404, sitemap, metadata, links, ${
      sourceRecords(root, 'src/content/employees', []).length +
      sourceRecords(root, 'src/content/product-groups', []).length +
      1
    } content images`,
  }
}

if (isDirectExecution(import.meta.url)) runCli('verify:dist', verifyDist)
