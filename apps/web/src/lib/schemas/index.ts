import { z } from "zod";

// Import types from individual files
import type { PluginStatus } from "../types/plugin";
import type { ShowcaseStatus } from "../types/showcase";
import type { UserRole } from "../types/user";

// Re-export types for convenience
export type { PluginStatus } from "../types/plugin";
export type { ShowcaseStatus } from "../types/showcase";
export type { UserRole } from "../types/user";

// Primitive schemas
export const nonEmptyStringSchema = z.string().trim().min(1);
export const urlSchema = z.string().url();
export const optionalUrlSchema = urlSchema.optional().or(z.literal(""));
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

// User schemas
export const userRoleSchema = z.enum([
  "user",
  "contributor",
  "moderator",
  "admin",
]) satisfies z.ZodType<UserRole>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  username: z.string().min(2).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().optional(),
  bio: z.string().max(500).optional(),
  website: urlSchema.optional(),
  role: userRoleSchema.optional(),
});

// Plugin schemas
export const pluginStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "hidden",
]) satisfies z.ZodType<PluginStatus>;

export const pluginStatsSchema = z.object({
  downloads_total: z.number().int().min(0).optional(),
  downloads_weekly: z.number().int().min(0).optional(),
  views_total: z.number().int().min(0).optional(),
  views_weekly: z.number().int().min(0).optional(),
  stars: z.number().int().min(0).optional(),
});

export const pluginVersionSchema = z.object({
  id: z.string(),
  version: z.string().min(1),
  download_url: urlSchema.optional(),
  changelog: z.string().optional(),
  downloads: z.number().int().min(0).optional(),
  created: z.string().datetime().nullable().optional(),
  pocketbase_version: z.string().optional(),
});

export const pluginSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.string().optional(),
  repository: urlSchema.optional(),
  homepage: urlSchema.optional(),
  readme: z.string().optional(),
  tags: z.array(z.string()).optional(),
  license: z.string().max(50).optional(),
  icon: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
  github_stars: z.number().int().min(0).optional(),
  github_updated_at: z.string().datetime().nullable().optional(),
  stats: pluginStatsSchema.optional(),
  versions: z.array(pluginVersionSchema).optional(),
  status: pluginStatusSchema.optional(),
});

// Showcase schemas
export const showcaseStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "hidden",
]) satisfies z.ZodType<ShowcaseStatus>;

export const showcaseSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  url: urlSchema,
  repository: urlSchema.optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  views: z.number().int().min(0).optional(),
  votes: z.number().int().min(0).optional(),
  content: z.string().optional(),
  thumbnail: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  status: showcaseStatusSchema.optional(),
});

// Form input schemas (for validation)
export const pluginSubmitSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500),
  repository: urlSchema,
  homepage: optionalUrlSchema,
  category: z.string(),
  tags: z.string().optional(),
  license: z.string().max(50).optional(),
  version: z.string().optional(),
  download_url: optionalUrlSchema,
  pocketbase_version: z.string().optional(),
  changelog: z.string().optional(),
});

export const showcaseSubmitSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  url: urlSchema,
  repository: optionalUrlSchema,
  category: z.string(),
  tags: z.string().optional(),
  content: z.string().optional(),
});

// API response schemas
export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z
      .object({
        hasMore: z.boolean().optional(),
        nextOffset: z.number().int().min(0).optional(),
        total: z.number().int().min(0).optional(),
      })
      .optional(),
  });

export const apiErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  code: z.number().int().optional(),
});

// Type exports
export type PluginStats = z.infer<typeof pluginStatsSchema>;
export type PluginVersion = z.infer<typeof pluginVersionSchema>;
export type PluginInput = z.infer<typeof pluginSubmitSchema>;
export type ShowcaseInput = z.infer<typeof showcaseSubmitSchema>;
export type PaginatedResponse<T> = {
  data: T[];
  meta?: {
    hasMore?: boolean;
    nextOffset?: number;
    total?: number;
  };
};
