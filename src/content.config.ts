import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const employees = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/employees' }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      name: z.string(),
      department: z.string().optional(),
      photo: image(),
      alt: z.string(),
    }),
})

const productGroups = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/product-groups' }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      name: z.string(),
      description: z.string().optional(),
      examples: z.array(z.string()),
      photo: image(),
      alt: z.string(),
    }),
})

export const collections = { employees, productGroups }
