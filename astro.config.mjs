import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'
import { satteri } from '@astrojs/markdown-satteri'

export default defineConfig({
  output: 'static',
  site: 'https://www.rhode-medizin.de',
  integrations: [sitemap(), mdx()],
  markdown: {
    processor: satteri({
      features: { gfm: false, smartPunctuation: false, frontmatter: false },
    }),
  },
})
