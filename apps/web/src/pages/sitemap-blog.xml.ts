import { getCollection } from "astro:content";
import { SITE_URL } from "@/lib/constants/config";

export async function GET() {
  const blog = await getCollection("blog", ({ data }) => !data.draft);

  const sitemap = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blog
  .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
  .map(
    (post) => `  <url>
    <loc>${SITE_URL}/blog/${post.slug}/</loc>
    <lastmod>${(post.data.updatedDate || post.data.publishDate).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${post.data.featured ? "0.9" : "0.7"}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`.trim();

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
