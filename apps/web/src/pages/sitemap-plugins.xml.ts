export const prerender = false;

import { SITE_URL, POCKETBASE_URL } from "../lib/constants/config";

interface PluginItem {
  slug: string;
  github_updated_at?: string | null;
  featured?: boolean;
}

interface PluginResponse {
  data: PluginItem[];
  meta?: {
    hasMore?: boolean;
    nextOffset?: number;
    totalItems?: number;
  };
}

async function fetchPlugins(): Promise<PluginItem[]> {
  try {
    const out: PluginItem[] = [];
    const limit = 200;
    const maxConcurrent = 5;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const requests: Promise<Response>[] = [];
      const batchOffsets: number[] = [];

      for (let i = 0; i < maxConcurrent && hasMore; i++) {
        const url = new URL("/api/plugins/list", POCKETBASE_URL);
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("offset", String(offset));
        requests.push(
          fetch(url.toString(), { headers: { Accept: "application/json" } }),
        );
        batchOffsets.push(offset);
        offset += limit;
      }

      if (requests.length === 0) break;

      const responses = await Promise.allSettled(requests);

      for (let i = 0; i < responses.length; i++) {
        const result = responses[i];
        if (result.status === "fulfilled" && result.value.ok) {
          const json: PluginResponse | null = await result.value
            .json()
            .catch(() => null);
          const rows = Array.isArray(json?.data)
            ? (json.data as PluginItem[])
            : [];
          const meta = json?.meta || {};

          out.push(...rows);

          hasMore = Boolean(meta?.hasMore) && rows.length === limit;

          if (!hasMore) break;
        }
      }

      if (out.length === 0) break;
    }

    return out;
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
    <loc>${SITE_URL}/plugins/${plugin.slug}/</loc>
    <lastmod>${plugin.github_updated_at || now}</lastmod>
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
