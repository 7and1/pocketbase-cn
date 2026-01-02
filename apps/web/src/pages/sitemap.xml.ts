import { getCollection } from "astro:content";
import { SITE_URL, POCKETBASE_URL } from "@/lib/constants/config";

interface PluginItem {
  slug: string;
  updated?: string;
  featured?: boolean;
}

interface ShowcaseItem {
  slug: string;
  updated?: string;
  featured?: boolean;
}

async function fetchPlugins(): Promise<PluginItem[]> {
  try {
    const res = await fetch(`${POCKETBASE_URL}/api/plugins/list?perPage=500`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

async function fetchShowcase(): Promise<ShowcaseItem[]> {
  try {
    const res = await fetch(`${POCKETBASE_URL}/api/showcase/list?perPage=500`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const docs = await getCollection("docs");
  const blog = await getCollection("blog", ({ data }) => !data.draft);
  const plugins = await fetchPlugins();
  const showcase = await fetchShowcase();

  const staticPages = [
    "",
    "/docs",
    "/blog",
    "/plugins",
    "/showcase",
    "/downloads",
    "/legal/terms",
    "/legal/privacy",
  ];

  const now = new Date().toISOString();

  const sitemap = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
${staticPages
  .map(
    (path) => `
  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${path === "" ? "1.0" : "0.8"}</priority>
  </url>`,
  )
  .join("")}

  <!-- Documentation Pages -->
${docs
  .map(
    (doc) => `
  <url>
    <loc>${SITE_URL}/docs${doc.id === "index" ? "" : "/" + doc.id}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`,
  )
  .join("")}

  <!-- Blog Posts -->
${blog
  .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
  .map(
    (post) => `
  <url>
    <loc>${SITE_URL}/blog/${post.slug}/</loc>
    <lastmod>${(post.data.updatedDate || post.data.publishDate).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${post.data.featured ? "0.9" : "0.7"}</priority>
  </url>`,
  )
  .join("")}

  <!-- Plugin Pages -->
${plugins
  .map(
    (plugin) => `
  <url>
    <loc>${SITE_URL}/plugins/${plugin.slug}</loc>
    <lastmod>${plugin.updated || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${plugin.featured ? "0.8" : "0.6"}</priority>
  </url>`,
  )
  .join("")}

  <!-- Showcase Pages -->
${showcase
  .map(
    (item) => `
  <url>
    <loc>${SITE_URL}/showcase/${item.slug}</loc>
    <lastmod>${item.updated || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${item.featured ? "0.8" : "0.6"}</priority>
  </url>`,
  )
  .join("")}
</urlset>`.trim();

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
