import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'
import { satteri } from '@astrojs/markdown-satteri'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  output: 'static',
  site: 'https://www.rhode-medizin.de',
  integrations: [sitemap(), mdx()],
  markdown: {
    processor: satteri({
      features: { gfm: true, smartPunctuation: false, frontmatter: false },
    }),
  },
  image: {
    domains: ['images.ctfassets.net', 'videos.ctfassets.net'],
  },
  vite: {
    resolve: {
      alias: {
        '@content-loaders': fileURLToPath(
          new URL('./src/content/loaders', import.meta.url),
        ),
      },
    },
  },
})
