import { defineCollection, z } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  publishDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  category: z.string().default("技术"),
  tags: z.array(z.string()).default([]),
  author: z.string().default("PocketBase.cn"),
  image: z.string().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  blog: defineCollection({ schema: blogSchema }),
};
