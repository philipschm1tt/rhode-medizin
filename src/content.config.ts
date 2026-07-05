import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { contentfulLoader } from '@content-loaders/contentful'

const imageSchema = z.object({
  src: z.url(),
  width: z.number(),
  height: z.number(),
  title: z.string().optional(),
  description: z.string().optional(),
})

const moduleSchema: z.ZodTypeAny = z.lazy(() =>
  z.discriminatedUnion('__typename', [
    z.object({
      id: z.string(),
      __typename: z.literal('ContentfulHeroBlock'),
      hauptueberschrift: z.string(),
      unterueberschrift: z.string().optional(),
      callToAction: z.object({ text: z.string() }).optional(),
      bild: imageSchema.optional(),
    }),
    z.object({
      id: z.string(),
      __typename: z.literal('ContentfulZitat'),
      zitat: z.string(),
    }),
    z.object({
      id: z.string(),
      __typename: z.literal('ContentfulAbschnitt'),
      volleBreite: z.boolean(),
      inhalte: z.array(moduleSchema),
      seitenabschnitt: moduleSchema.optional(),
    }),
    z.object({
      id: z.string(),
      __typename: z.literal('ContentfulTextinhalt'),
      textMarkdown: z.string(),
      textHtml: z.string(),
    }),
    z.object({
      id: z.string(),
      __typename: z.literal('ContentfulKartenLayout'),
      titel: z.string().optional(),
      layout: z.string().optional(),
      elemente: z.array(moduleSchema),
    }),
    z.object({
      id: z.string(),
      __typename: z.literal('ContentfulMitarbeiter'),
      name: z.string(),
      dienstbereich: z.string().optional(),
      foto: imageSchema.optional(),
    }),
    z.object({
      id: z.string(),
      __typename: z.literal('ContentfulProduktgruppe'),
      name: z.string(),
      beschreibung: z.string().optional(),
      beispiele: z.array(z.string()).optional(),
      foto: imageSchema.optional(),
    }),
  ])
)

const pages = defineCollection({
  loader: contentfulLoader(),
  schema: z.object({
    id: z.string(),
    __typename: z.literal('ContentfulSeite'),
    slug: z.string(),
    module: z.array(moduleSchema),
  }),
})

export const collections = { pages }
