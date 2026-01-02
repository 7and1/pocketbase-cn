import { SITE_URL, POCKETBASE_URL } from "@/lib/constants/config";

interface ShowcaseItem {
  slug: string;
  updated?: string;
  featured?: boolean;
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
  const showcase = await fetchShowcase();
  const now = new Date().toISOString();

  const sitemap = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${showcase
  .map(
    (item) => `  <url>
    <loc>${SITE_URL}/showcase/${item.slug}</loc>
    <lastmod>${item.updated || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${item.featured ? "0.8" : "0.6"}</priority>
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
