import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import * as cheerioNS from 'cheerio'
import sharp from 'sharp'
import { verifyDist } from '../../scripts/verify-dist.mjs'
import { copyPaths, removePath, replaceInFile } from './helpers.mjs'

const cheerio = cheerioNS.default ?? cheerioNS
const sourcePaths = ['dist', 'src/content', 'src/assets/content']

const verifyCopy = async (mutate) => {
  const root = copyPaths(sourcePaths)
  await mutate?.(root)
  return verifyDist(root)
}

const assertDiagnostic = async (mutate, diagnostic) => {
  const { errors } = await verifyCopy(mutate)
  assert.ok(
    errors.some((error) => error.includes(diagnostic)),
    errors.join('\n')
  )
}

const mutateAttribute = (root, path, selector, attribute, value) => {
  const absolute = join(root, path)
  const html = readFileSync(absolute, 'utf8')
  const $ = cheerio.load(html)
  const element = $(selector).first()
  assert.equal(element.length, 1, `${path}: missing ${selector}`)
  const current = element.attr(attribute)
  assert.notEqual(current, undefined, `${path}: missing ${attribute}`)
  element.attr(attribute, value)
  writeFileSync(absolute, $.html())
}

const appendElement = (root, path, selector, html) => {
  const absolute = join(root, path)
  const $ = cheerio.load(readFileSync(absolute, 'utf8'))
  $(selector).append(html)
  writeFileSync(absolute, $.html())
}

test('accepts the complete built-output baseline', async () => {
  const result = await verifyCopy()
  assert.deepEqual(result.errors, [])
  assert.equal(
    result.summary,
    '3 routes, 404, sitemap, metadata, links, 11 content images'
  )
})

test('passes the supplied homepage canonical to SEO exactly once', () => {
  const layout = readFileSync('src/layouts/Layout.astro', 'utf8')
  assert.match(layout, /<SEO[\s\S]*?canonical=\{canonical\}/)
  assert.equal(
    (layout.match(/canonical=\{canonical\}/g) ?? []).length,
    1,
    'Layout must pass the supplied canonical exactly once'
  )
})

const metadataCases = [
  [
    'homepage title',
    'dist/index.html',
    'title',
    null,
    'Wrong',
    'homepage title expected',
  ],
  [
    'homepage description',
    'dist/index.html',
    'meta[name="description"]',
    'content',
    'Wrong',
    'homepage description expected',
  ],
  [
    'homepage canonical',
    'dist/index.html',
    'link[rel="canonical"]',
    'href',
    'https://www.rhode-medizin.de/wrong/',
    'homepage canonical expected https://www.rhode-medizin.de/',
  ],
  [
    'imprint canonical',
    'dist/imprint/index.html',
    'link[rel="canonical"]',
    'href',
    'https://www.rhode-medizin.de/wrong/',
    'imprint canonical expected https://www.rhode-medizin.de/imprint/',
  ],
  [
    'data-policy canonical',
    'dist/data-policy/index.html',
    'link[rel="canonical"]',
    'href',
    'https://www.rhode-medizin.de/wrong/',
    'data-policy canonical expected https://www.rhode-medizin.de/data-policy/',
  ],
  [
    'Open Graph title',
    'dist/index.html',
    'meta[property="og:title"]',
    'content',
    'Wrong',
    'homepage og:title expected',
  ],
  [
    'Open Graph type',
    'dist/index.html',
    'meta[property="og:type"]',
    'content',
    'article',
    'homepage og:type expected website',
  ],
  [
    'Open Graph URL',
    'dist/index.html',
    'meta[property="og:url"]',
    'content',
    'https://www.rhode-medizin.de/wrong/',
    'homepage og:url expected https://www.rhode-medizin.de/',
  ],
  [
    'Open Graph locale',
    'dist/index.html',
    'meta[property="og:locale"]',
    'content',
    'en_US',
    'homepage og:locale expected de_DE',
  ],
  [
    'Open Graph site name',
    'dist/index.html',
    'meta[property="og:site_name"]',
    'content',
    'Wrong',
    'homepage og:site_name expected Heinrich Rhode GmbH',
  ],
  [
    'Twitter card',
    'dist/index.html',
    'meta[name="twitter:card"]',
    'content',
    'summary',
    'homepage twitter:card expected summary_large_image',
  ],
  [
    'Twitter title',
    'dist/index.html',
    'meta[name="twitter:title"]',
    'content',
    'Wrong',
    'homepage twitter:title expected',
  ],
  [
    'Twitter description',
    'dist/index.html',
    'meta[name="twitter:description"]',
    'content',
    'Wrong',
    'homepage twitter:description expected',
  ],
]

for (const [
  name,
  path,
  selector,
  attribute,
  value,
  diagnostic,
] of metadataCases) {
  test(`rejects a changed ${name}`, async () => {
    await assertDiagnostic((root) => {
      if (selector === 'title') {
        replaceInFile(root, path, '<title>', '<title>Wrong<!--')
      } else {
        mutateAttribute(root, path, selector, attribute, value)
      }
    }, diagnostic)
  })

  test(`rejects a duplicate ${name}`, async () => {
    await assertDiagnostic(
      (root) => {
        const absolute = join(root, path)
        const $ = cheerio.load(readFileSync(absolute, 'utf8'))
        const element = $(selector).first()
        element.after(element.clone())
        writeFileSync(absolute, $.html())
      },
      `${diagnostic.split(' expected')[0]} count expected 1`
    )
  })
}

for (const [route, path] of [
  ['imprint', 'dist/imprint/index.html'],
  ['data-policy', 'dist/data-policy/index.html'],
]) {
  for (const [kind, tag, diagnostic] of [
    [
      'description',
      '<meta name="description" content="Wrong">',
      `${route} description metadata must be absent`,
    ],
    [
      'Open Graph',
      '<meta property="og:title" content="Wrong">',
      `${route} Open Graph metadata must be absent`,
    ],
    [
      'Twitter',
      '<meta name="twitter:card" content="summary">',
      `${route} Twitter metadata must be absent`,
    ],
  ]) {
    test(`rejects ${kind} metadata on ${route}`, async () => {
      await assertDiagnostic(
        (root) => replaceInFile(root, path, '</head>', `${tag}</head>`),
        diagnostic
      )
    })
  }
}

const linkCases = [
  ['imprint eRecht24', 'dist/imprint/index.html', 'https://www.e-recht24.de'],
  [
    'data-policy DGD',
    'dist/data-policy/index.html',
    'https://dg-datenschutz.de/datenschutz-dienstleistungen/externer-datenschutzbeauftragter/',
  ],
  ['data-policy WBS', 'dist/data-policy/index.html', 'https://www.wbs-law.de/'],
]

for (const [label, path, url] of linkCases) {
  test(`rejects the wrong scheme for the ${label} link`, async () => {
    await assertDiagnostic(
      (root) => replaceInFile(root, path, url, url.replace('https:', 'http:')),
      `${label} link expected ${url}`
    )
  })
}

test('rejects a changed header home link', async () => {
  await assertDiagnostic(
    (root) =>
      replaceInFile(root, 'dist/index.html', 'href="/"', 'href="/wrong/"'),
    'homepage header link expected /'
  )
})

test('rejects a changed footer legal link', async () => {
  await assertDiagnostic(
    (root) =>
      mutateAttribute(
        root,
        'dist/index.html',
        'footer a[href="/imprint/"]',
        'href',
        '/wrong/'
      ),
    'homepage footer link expected /imprint/'
  )
})

for (const [form, href] of [
  ['root-relative', '/missing/'],
  ['path-relative', '../missing/'],
  ['same-origin absolute', 'https://www.rhode-medizin.de/missing/'],
]) {
  test(`rejects a broken ${form} internal link`, async () => {
    await assertDiagnostic(
      (root) =>
        appendElement(
          root,
          'dist/imprint/index.html',
          'body',
          `<a href="${href}">Missing</a>`
        ),
      `imprint link ${href} does not resolve to a built file`
    )
  })
}

test('rejects an encoded traversal link before resolving outside dist', async () => {
  const href = '/inside%2F..%2F..%2Fsrc/content/assets.yaml'
  await assertDiagnostic(
    (root) =>
      appendElement(
        root,
        'dist/imprint/index.html',
        'body',
        `<a href="${href}">Unsafe</a>`
      ),
    `imprint link has unsafe local URL: ${href}`
  )
})

test('rejects an encoded traversal image before resolving outside dist', async () => {
  const src = '/inside%2F..%2F..%2Fsrc/content/assets.yaml'
  await assertDiagnostic(
    (root) =>
      mutateAttribute(root, 'dist/index.html', '.hero-image', 'src', src),
    `homepage image 2 src has unsafe local URL: ${src}`
  )
})

test('rejects lazy loading on the hero image', async () => {
  await assertDiagnostic(
    (root) =>
      mutateAttribute(
        root,
        'dist/index.html',
        '.hero-image',
        'loading',
        'lazy'
      ),
    'homepage hero loading expected eager'
  )
})

test('rejects normal fetch priority on the hero image', async () => {
  await assertDiagnostic(
    (root) =>
      mutateAttribute(
        root,
        'dist/index.html',
        '.hero-image',
        'fetchpriority',
        'auto'
      ),
    'homepage hero fetchpriority expected high'
  )
})

for (const [kind, selector] of [
  ['employee', '.employee-tile img'],
  ['product', '.product-group img'],
]) {
  test(`rejects eager loading on the first ${kind} image`, async () => {
    await assertDiagnostic(
      (root) =>
        mutateAttribute(root, 'dist/index.html', selector, 'loading', 'eager'),
      `homepage ${kind} image 1 loading expected lazy`
    )
  })
}

test('rejects the wrong rendered alt at its ordered position', async () => {
  await assertDiagnostic(
    (root) =>
      mutateAttribute(
        root,
        'dist/index.html',
        '.employee-tile img',
        'alt',
        'Wrong'
      ),
    'homepage employee image 1 alt expected ""'
  )
})

test('uses the source hero alt as the rendered contract', async () => {
  const result = await verifyCopy((root) => {
    replaceInFile(
      root,
      'src/content/homepage/hero.yaml',
      "alt: ''",
      'alt: Source hero alt'
    )
    mutateAttribute(
      root,
      'dist/index.html',
      '.hero-area img',
      'alt',
      'Source hero alt'
    )
  })
  assert.deepEqual(result.errors, [])
})

for (const [kind, sourceDir, selector, recordName] of [
  ['employee', 'employees', '.employee-tile', 'additional-employee'],
  ['product', 'product-groups', '.product-group', 'additional-product'],
]) {
  test(`accepts a legitimate ${kind} source and rendered count increase`, async () => {
    const result = await verifyCopy((root) => {
      const sourcePath = join(
        root,
        `src/content/${sourceDir}/${recordName}.yaml`
      )
      const originalPath = join(
        root,
        `src/content/${sourceDir}/${kind === 'employee' ? 'gerhard-gruber' : 'rehabereich'}.yaml`
      )
      writeFileSync(
        sourcePath,
        readFileSync(originalPath, 'utf8')
          .replace(/order: 5/, 'order: 6')
          .replace(/name: .*/, `name: Additional ${kind}`)
      )
      const htmlPath = join(root, 'dist/index.html')
      const $ = cheerio.load(readFileSync(htmlPath, 'utf8'))
      $(selector).last().parent().after($(selector).last().parent().clone())
      writeFileSync(htmlPath, $.html())
    })
    assert.deepEqual(result.errors, [])
    assert.match(result.summary, /12 content images/)
  })

  test(`rejects a ${kind} source count increase missing from output`, async () => {
    await assertDiagnostic((root) => {
      const sourcePath = join(
        root,
        `src/content/${sourceDir}/${recordName}.yaml`
      )
      const originalPath = join(
        root,
        `src/content/${sourceDir}/${kind === 'employee' ? 'gerhard-gruber' : 'rehabereich'}.yaml`
      )
      writeFileSync(
        sourcePath,
        readFileSync(originalPath, 'utf8')
          .replace(/order: 5/, 'order: 6')
          .replace(/name: .*/, `name: Additional ${kind}`)
      )
    }, `homepage ${kind} image count expected 6, got 5`)
  })
}

for (const [kind, selector, expected] of [
  ['hero', '.hero-area img', 1],
  ['employee', '.employee-tile img', 5],
  ['product', '.product-group img', 5],
]) {
  test(`rejects an extra rendered ${kind} image`, async () => {
    await assertDiagnostic((root) => {
      const path = join(root, 'dist/index.html')
      const $ = cheerio.load(readFileSync(path, 'utf8'))
      $(selector).first().after($(selector).first().clone())
      writeFileSync(path, $.html())
    }, `homepage ${kind} image count expected ${expected}`)
  })
}

test('rejects product images rendered out of source order', async () => {
  await assertDiagnostic((root) => {
    const path = join(root, 'dist/index.html')
    const html = readFileSync(path, 'utf8')
    const $ = cheerio.load(html)
    const images = $('.product-group img')
    const first = images.eq(0).attr('src')
    const second = images.eq(1).attr('src')
    writeFileSync(
      path,
      html
        .replace(first, '__FIRST__')
        .replace(second, first)
        .replace('__FIRST__', second)
    )
  }, 'homepage product image 1 bytes do not match its declared source')
})

test('rejects a same-stem rendered image generated from the wrong source', async () => {
  await assertDiagnostic(async (root) => {
    const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
    const $ = cheerio.load(html)
    const url = $('.product-group img').first().attr('src')
    const output = join(root, 'dist', url)
    const metadata = await sharp(output).metadata()
    const wrongSource = join(root, 'src/assets/content/motorensysteme.jpg')
    const replacement = await sharp(wrongSource, { failOn: 'none', pages: -1 })
      .rotate()
      .resize({
        width: metadata.width,
        height: metadata.height,
        withoutEnlargement: true,
        kernel: 'lanczos3',
      })
      .toFormat(metadata.format)
      .toBuffer()
    writeFileSync(output, replacement)
  }, 'homepage product image 1 bytes do not match its declared source')
})

test('rejects a missing local image selected from homepage src', async () => {
  await assertDiagnostic((root) => {
    const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
    const $ = cheerio.load(html)
    removePath(root, join('dist', $('.hero-image').attr('src')))
  }, 'homepage hero src file is missing')
})

test('rejects a missing local srcset candidate', async () => {
  await assertDiagnostic((root) => {
    const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
    const $ = cheerio.load(html)
    const candidate = $('.hero-area source')
      .first()
      .attr('srcset')
      .split(',')[0]
      .trim()
      .split(/\s+/)[0]
    removePath(root, join('dist', candidate))
  }, 'homepage source srcset candidate file is missing')
})

for (const type of ['image/avif', 'image/webp']) {
  test(`rejects an existing wrong-width same-stem ${type} candidate`, async () => {
    await assertDiagnostic((root) => {
      const path = join(root, 'dist/index.html')
      const $ = cheerio.load(readFileSync(path, 'utf8'))
      const source = $(`.hero-area source[type="${type}"]`)
      const candidates = source.attr('srcset').split(',')
      const wrongUrl = candidates[1].trim().split(/\s+/)[0]
      const descriptor = candidates[0].trim().split(/\s+/)[1]
      candidates[0] = `${wrongUrl} ${descriptor}`
      source.attr('srcset', candidates.join(','))
      writeFileSync(path, $.html())
    }, `homepage hero ${type} srcset candidate 1 width expected 480`)
  })
}

test('rejects a social image whose bytes differ from the manifest hero', async () => {
  await assertDiagnostic((root) => {
    const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
    const $ = cheerio.load(html)
    const url = $('meta[property="og:image"]').attr('content')
    writeFileSync(
      join(root, 'dist', new URL(url).pathname),
      'not the expected jpeg'
    )
  }, 'homepage social image bytes do not match the manifest-declared hero source')
})

test('rejects different Open Graph and Twitter image URLs', async () => {
  await assertDiagnostic(
    (root) =>
      mutateAttribute(
        root,
        'dist/index.html',
        'meta[name="twitter:image"]',
        'content',
        'https://www.rhode-medizin.de/favicon.png'
      ),
    'homepage twitter:image expected the same URL as og:image'
  )
})

for (const [label, selector] of [
  ['homepage og:image', 'meta[property="og:image"]'],
  ['homepage twitter:image', 'meta[name="twitter:image"]'],
]) {
  test(`rejects a duplicate ${label}`, async () => {
    await assertDiagnostic((root) => {
      const path = join(root, 'dist/index.html')
      const $ = cheerio.load(readFileSync(path, 'utf8'))
      $(selector).first().after($(selector).first().clone())
      writeFileSync(path, $.html())
    }, `${label} count expected 1`)
  })
}

test('rejects a missing 404 page', async () => {
  await assertDiagnostic(
    (root) => removePath(root, 'dist/404.html'),
    '404 route missing dist/404.html'
  )
})

test('rejects a sitemap missing imprint', async () => {
  await assertDiagnostic(
    (root) =>
      replaceInFile(
        root,
        'dist/sitemap-0.xml',
        '<url><loc>https://www.rhode-medizin.de/imprint/</loc></url>',
        ''
      ),
    'sitemap URLs expected exactly https://www.rhode-medizin.de/'
  )
})

test('rejects an extra sitemap route', async () => {
  await assertDiagnostic(
    (root) =>
      replaceInFile(
        root,
        'dist/sitemap-0.xml',
        '</urlset>',
        '<url><loc>https://www.rhode-medizin.de/extra/</loc></url></urlset>'
      ),
    'sitemap URLs expected exactly https://www.rhode-medizin.de/'
  )
})

test('rejects sitemap routes with the wrong origin', async () => {
  await assertDiagnostic(
    (root) =>
      replaceInFile(
        root,
        'dist/sitemap-0.xml',
        'https://www.rhode-medizin.de/imprint/',
        'https://example.com/imprint/'
      ),
    'sitemap URLs expected exactly https://www.rhode-medizin.de/'
  )
})

test('checks routes across every sitemap URL file', async () => {
  await assertDiagnostic((root) => {
    replaceInFile(
      root,
      'dist/sitemap-0.xml',
      '<url><loc>https://www.rhode-medizin.de/imprint/</loc></url>',
      ''
    )
    writeFileSync(
      join(root, 'dist/sitemap-1.xml'),
      '<?xml version="1.0"?><urlset><url><loc>https://www.rhode-medizin.de/imprint/</loc></url><url><loc>https://www.rhode-medizin.de/404.html</loc></url></urlset>'
    )
  }, 'sitemap URLs expected exactly')
})

test('rejects 404 and extra routes in secondary sitemap files', async () => {
  await assertDiagnostic((root) => {
    writeFileSync(
      join(root, 'dist/sitemap-1.xml'),
      '<?xml version="1.0"?><urlset><url><loc>https://www.rhode-medizin.de/404.html</loc></url><url><loc>https://www.rhode-medizin.de/extra/</loc></url></urlset>'
    )
  }, 'sitemap URLs expected exactly')
})

test('accumulates malformed sitemap URLs instead of throwing', async () => {
  const { errors } = await verifyCopy((root) => {
    replaceInFile(
      root,
      'dist/sitemap-0.xml',
      'https://www.rhode-medizin.de/imprint/',
      'not a URL'
    )
    removePath(root, 'dist/404.html')
  })
  assert.ok(
    errors.some((error) =>
      error.includes('dist/sitemap-0.xml: invalid sitemap URL not a URL')
    ),
    errors.join('\n')
  )
  assert.ok(
    errors.some((error) => error.includes('404 route missing')),
    errors.join('\n')
  )
})

for (const [state, mutateSource] of [
  ['missing', (root) => removePath(root, 'src/assets/content/hero-image.jpg')],
  [
    'unreadable',
    (root) =>
      writeFileSync(
        join(root, 'src/assets/content/hero-image.jpg'),
        'invalid image'
      ),
  ],
]) {
  test(`accumulates an ${state} hero source diagnostic instead of throwing`, async () => {
    const { errors } = await verifyCopy((root) => {
      mutateSource(root)
      removePath(root, 'dist/404.html')
    })
    assert.ok(
      errors.some((error) =>
        error.includes('homepage hero source cannot be read')
      ),
      errors.join('\n')
    )
    assert.ok(
      errors.some((error) => error.includes('404 route missing')),
      errors.join('\n')
    )
  })
}

test('rejects Contentful hosts in textual built output', async () => {
  await assertDiagnostic(
    (root) =>
      replaceInFile(
        root,
        'dist/index.html',
        '</body>',
        '<!-- images.ctfassets.net --></body>'
      ),
    'dist/index.html: Contentful host found in built output'
  )
})

for (const host of [
  'api.contentful.com',
  'graphql.contentful.com',
  'custom.contentful.com',
]) {
  test(`rejects ${host} in textual built output`, async () => {
    await assertDiagnostic(
      (root) =>
        replaceInFile(
          root,
          'dist/index.html',
          '</body>',
          `<!-- ${host} --></body>`
        ),
      'dist/index.html: Contentful host found in built output'
    )
  })
}

test('accumulates independent built-output diagnostics', async () => {
  const { errors } = await verifyCopy((root) => {
    removePath(root, 'dist/404.html')
    replaceInFile(
      root,
      'dist/sitemap-0.xml',
      '<url><loc>https://www.rhode-medizin.de/imprint/</loc></url>',
      ''
    )
  })
  assert.ok(
    errors.some((error) => error.includes('404 route missing')),
    errors.join('\n')
  )
  assert.ok(
    errors.some((error) => error.includes('sitemap URLs expected')),
    errors.join('\n')
  )
})
