import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    category: z.string(),
    thumbnail: z.string(),
    description: z.string(),
    images: z.array(z.string()).optional(),
    links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  }),
});

export const collections = { work };
