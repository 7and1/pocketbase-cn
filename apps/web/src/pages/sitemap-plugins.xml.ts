import { SITE_URL, POCKETBASE_URL } from "@/lib/constants/config";

interface PluginItem {
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

export async function GET() {
  const plugins = await fetchPlugins();
  const now = new Date().toISOString();

  const sitemap = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${plugins
  .map(
    (plugin) => `  <url>
    <loc>${SITE_URL}/plugins/${plugin.slug}</loc>
    <lastmod>${plugin.updated || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${plugin.featured ? "0.8" : "0.6"}</priority>
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
