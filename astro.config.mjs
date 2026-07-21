import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  output: 'static',
  site: 'https://www.rhode-medizin.de',
  integrations: [sitemap()],
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
