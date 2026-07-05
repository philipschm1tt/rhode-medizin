import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import * as cheerioNS from 'cheerio'

const cheerio = cheerioNS.default ?? cheerioNS

const PAGES = [
  {
    name: 'imprint',
    fixture: 'tests/fixtures/live/imprint.html',
    built: 'dist/imprint/index.html',
  },
  {
    name: 'data-policy',
    fixture: 'tests/fixtures/live/data-policy.html',
    built: 'dist/data-policy/index.html',
  },
  {
    name: 'homepage',
    fixture: 'tests/fixtures/live/index.html',
    built: 'dist/index.html',
  },
]

const STRIP_SELECTORS = [
  // Gatsby runtime / chunk loader scripts
  'script#gatsby-script-loader',
  'script#gatsby-chunk-mapping',
  'script[src]',
  'link[as="script"]',
  'noscript#gatsby-noscript',
  // Old cookie consent banner (rendered client-side, but defensive)
  '[class*="cookieConsent" i]',
  '[id*="cookieConsent" i]',
  '[data-cookie]',
  // Old Contentful footer badge is removed from the new site, but the
  // comparison only looks at the main <article>, so this is belt-and-braces.
]

const stripNoise = ($) => {
  for (const selector of STRIP_SELECTORS) {
    $(selector).remove()
  }
}

// Reduce a Contentful CDN URL (or any asset URL) to a canonical path so
// that Gatsby's transformed variants (?w=300&h=182&q=50&fit=fill) and
// the Astro loader's raw URLs compare equal. Strips protocol and query.
const normalizeAssetUrl = (value) => {
  if (!value) return value
  return value
    .replace(/\/static\/[a-f0-9]+\//g, '/static/')
    .replace(/\?[^#\s]+/g, '')
    .replace(/^https?:/, '')
    .replace(/^\/\//, '/')
}

const normalizeAttributes = ($) => {
  $('img[src], source[src], source[srcset], a[href]').each((_, el) => {
    const $el = $(el)
    const src = $el.attr('src')
    if (src) $el.attr('src', normalizeAssetUrl(src))
    const srcset = $el.attr('srcset')
    if (srcset) {
      $el.attr(
        'srcset',
        srcset
          .split(',')
          .map((part) => normalizeAssetUrl(part.trim()))
          .join(', '),
      )
    }
    const href = $el.attr('href')
    if (href) $el.attr('href', normalizeAssetUrl(href))
  })
}

// Attributes that carry content semantics and must survive normalization.
// `alt` is intentionally excluded: the old Gatsby site used empty alt
// everywhere (gatsby-image default), while the new Astro site adds
// meaningful alt from Contentful image descriptions per the M3 plan.
// Alt text is a deliberate accessibility improvement, not content parity.
const KEEP_ATTRIBUTES = new Set([
  'src',
  'srcset',
  'href',
  'colspan',
  'rowspan',
  'lang',
])

// Strip presentational noise (class names, data-astro-cid, styled-components
// hashes, inline styles) so the comparison focuses on content structure.
// Element tags themselves are kept — wrapper element differences would
// indicate a structural change worth flagging.
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

// Gatsby's gatsby-image wrapper produces markup that has no plain-<img>
// equivalent in the Astro build: a position:relative wrapper div, a
// padding-bottom spacer div, a base64 placeholder <img>, and a
// <noscript><picture> fallback with the real Contentful URL. The Astro
// port emits a single plain <img> with the raw Contentful URL.
//
// To compare content parity we collapse every gatsby-image structure to a
// canonical <img src="PATH" alt="ALT">: extract the real asset URL from the
// noscript fallback, drop the placeholder/spacer, and unwrap the wrapper.
const collapseGatsbyImages = ($) => {
  // 1. Pull the real image out of each <noscript> and use it to replace
  //    the entire gatsby-image-wrapper container.
  $('.gatsby-image-wrapper').each((_, wrapper) => {
    const $wrapper = $(wrapper)
    const noscript = $wrapper.find('noscript').first()
    let realSrc = ''
    let realAlt = ''
    if (noscript.length) {
      const noscriptHtml = noscript.html() ?? ''
      const inner = cheerio.load(noscriptHtml)
      const innerImg = inner('img').first()
      realSrc = innerImg.attr('src') ?? ''
      realAlt = innerImg.attr('alt') ?? ''
    }
    const altAttr = realAlt ? ` alt="${realAlt}"` : ''
    $wrapper.replaceWith(`<img src="${normalizeAssetUrl(realSrc)}"${altAttr}/>`)
  })

  // 2. Drop any remaining <noscript> elements (belt-and-braces).
  $('noscript').remove()

  // 3. Drop base64/data: URL placeholder images that gatsby-image leaves
  //    behind outside the wrapper.
  $('img[src^="data:"]').remove()

  // 4. Drop the padding-bottom spacer divs gatsby-image uses for aspect ratio.
  $('div[style*="padding-bottom"]').remove()
}

// Whitespace-only differences: collapse runs of whitespace and trim each line.
const normalizeWhitespace = (html) =>
  html
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    .trim()

const extractMainContent = (rawHtml) => {
  const $ = cheerio.load(rawHtml)
  stripNoise($)
  collapseGatsbyImages($)
  normalizeAttributes($)
  stripPresentationalAttributes($)
  // Both the live Gatsby fixture and the Astro build wrap the page
  // content in <article>. Fall back to <main> if <article> is absent.
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
    return { page: page.name, status: 'fail', reason: `missing fixture: ${page.fixture}` }
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
    return { page: page.name, status: 'fail', reason: 'fixture has no <article>/<main> content' }
  }
  if (!built.found) {
    return { page: page.name, status: 'fail', reason: 'built page has no <article>/<main> content' }
  }

  if (fixture.html === built.html) {
    return { page: page.name, status: 'pass', length: fixture.html.length }
  }

  return {
    page: page.name,
    status: 'fail',
    reason: 'normalized main content differs',
    fixtureLength: fixture.html.length,
    builtLength: built.html.length,
    fixturePreview: fixture.html.slice(0, 600),
    builtPreview: built.html.slice(0, 600),
  }
}

const printDiff = (result) => {
  if (result.status !== 'fail') return
  console.error(`\n[${result.page}] FAIL: ${result.reason}`)
  if (result.fixturePreview !== undefined) {
    console.error('--- fixture (first 600 chars) ---')
    console.error(result.fixturePreview)
    console.error('--- built (first 600 chars) ---')
    console.error(result.builtPreview)
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
    console.error(`\n${failures.length}/${PAGES.length} page(s) failed parity check.`)
    process.exit(1)
  }

  console.log(`\nAll ${PAGES.length} pages match their fixtures.`)
}

main()
