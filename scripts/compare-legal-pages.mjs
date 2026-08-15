import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import * as cheerioNS from 'cheerio'
import { diffWords } from 'diff'

const cheerio = cheerioNS.default ?? cheerioNS

const PAGES = [
  {
    name: 'imprint',
    fixture: 'tests/fixtures/cutover/pages/imprint.html',
    built: 'dist/imprint/index.html',
  },
  {
    name: 'data-policy',
    fixture: 'tests/fixtures/cutover/pages/data-policy.html',
    built: 'dist/data-policy/index.html',
  },
]

const STRIP_SELECTORS = [
  '[class*="cookieConsent" i]',
  '[id*="cookieConsent" i]',
  '[data-cookie]',
]

const stripNoise = ($) => {
  for (const selector of STRIP_SELECTORS) {
    $(selector).remove()
  }
}

const normalizeAssetUrl = (value) => {
  if (!value) return value
  return value
    .replace(/\?[^#\s]+/g, '')
    .replace(/^https?:/, '')
    .replace(/^\/\//, '/')
}

const isImageUrl = (value) => {
  if (!value) return false
  return (
    value.includes('images.ctfassets.net') ||
    value.includes('videos.ctfassets.net') ||
    value.startsWith('/_astro/') ||
    value.startsWith('/static/') ||
    /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(value)
  )
}

const canonicalizeImageSrc = (value) =>
  isImageUrl(value) ? '<img-src>' : normalizeAssetUrl(value)

const normalizeLinkHref = (value) => {
  if (!value) return value
  return value.replace(/^https?:/, '').replace(/^\/\//, '/')
}

const normalizeAttributes = ($) => {
  $('img[src], source[src], source[srcset], a[href]').each((_, el) => {
    const $el = $(el)
    const tagName = el.tagName.toLowerCase()
    const isImage = tagName === 'img' || tagName === 'source'
    const src = $el.attr('src')
    if (src) {
      $el.attr(
        'src',
        isImage ? canonicalizeImageSrc(src) : normalizeAssetUrl(src)
      )
    }
    const srcset = $el.attr('srcset')
    if (srcset) {
      $el.attr('srcset', isImage ? '<img-srcset>' : normalizeAssetUrl(srcset))
    }
    const href = $el.attr('href')
    if (href) $el.attr('href', normalizeLinkHref(href))
  })
}

const KEEP_ATTRIBUTES = new Set(['src', 'href', 'colspan', 'rowspan', 'lang'])

const stripPresentationalAttributes = ($) => {
  $('*').each((_, el) => {
    const attribs = el.attribs ?? {}
    for (const name of Object.keys(attribs)) {
      if (!KEEP_ATTRIBUTES.has(name)) {
        delete attribs[name]
      }
    }
  })
}

const collapsePictureElements = ($) => {
  $('picture').each((_, picture) => {
    const $picture = $(picture)
    const img = $picture.find('img').first()
    if (img.length) {
      $picture.replaceWith(img)
    } else {
      $picture.remove()
    }
  })
}

const normalizeWhitespace = (html) =>
  html.replace(/\s+/g, ' ').replace(/> </g, '><').trim()

const extractMainContent = (rawHtml) => {
  const $ = cheerio.load(rawHtml)
  stripNoise($)
  collapsePictureElements($)
  normalizeAttributes($)
  stripPresentationalAttributes($)
  const root = $('article').first()
  const target = root.length ? root : $('main').first()
  if (!target.length) {
    return { found: false, html: '' }
  }
  return { found: true, html: normalizeWhitespace(target.html() ?? '') }
}

const readPage = (filePath) => {
  const absolute = resolve(process.cwd(), filePath)
  if (!existsSync(absolute)) {
    return { missing: true, html: '' }
  }
  return { missing: false, html: readFileSync(absolute, 'utf8') }
}

const comparePage = (page) => {
  const fixtureRaw = readPage(page.fixture)
  const builtRaw = readPage(page.built)

  if (fixtureRaw.missing) {
    return {
      page: page.name,
      status: 'fail',
      reason: `missing fixture: ${page.fixture}`,
    }
  }
  if (builtRaw.missing) {
    return {
      page: page.name,
      status: 'fail',
      reason: `missing built page: ${page.built} (run "pnpm build" first)`,
    }
  }

  const fixture = extractMainContent(fixtureRaw.html)
  const built = extractMainContent(builtRaw.html)

  if (!fixture.found) {
    return {
      page: page.name,
      status: 'fail',
      reason: 'fixture has no <article>/<main> content',
    }
  }
  if (!built.found) {
    return {
      page: page.name,
      status: 'fail',
      reason: 'built page has no <article>/<main> content',
    }
  }

  if (fixture.html === built.html) {
    return { page: page.name, status: 'pass', length: fixture.html.length }
  }

  return {
    page: page.name,
    status: 'fail',
    reason: 'normalized main content differs',
    fixtureHtml: fixture.html,
    builtHtml: built.html,
  }
}

const printDiff = (result) => {
  if (result.status !== 'fail') return
  console.error(`\n[${result.page}] FAIL: ${result.reason}`)
  if (result.fixtureHtml !== undefined) {
    const parts = diffWords(result.fixtureHtml, result.builtHtml)
    for (const part of parts) {
      const marker = part.added ? '+' : part.removed ? '-' : ' '
      process.stderr.write(marker + part.value)
    }
    process.stderr.write('\n')
  }
}

const main = () => {
  const results = PAGES.map(comparePage)
  const failures = results.filter((r) => r.status === 'fail')

  for (const result of results) {
    const tag = result.status === 'pass' ? 'PASS' : 'FAIL'
    const detail = result.length != null ? ` (${result.length} chars)` : ''
    console.log(`[${result.page}] ${tag}${detail}`)
    printDiff(result)
  }

  if (failures.length > 0) {
    console.error(
      `\n${failures.length}/${PAGES.length} legal page(s) failed parity check.`
    )
    process.exit(1)
  }

  console.log(`\nAll ${PAGES.length} legal pages match their fixtures.`)
}

main()
