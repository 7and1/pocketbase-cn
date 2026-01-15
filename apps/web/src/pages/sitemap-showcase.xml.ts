export const prerender = false;

import { SITE_URL, POCKETBASE_URL } from "../lib/constants/config";

interface ShowcaseItem {
  slug: string;
  featured?: boolean;
  updated?: string | null;
}

interface ShowcaseResponse {
  data: ShowcaseItem[];
  meta?: {
    hasMore?: boolean;
    nextOffset?: number;
    totalItems?: number;
  };
}

async function fetchShowcase(): Promise<ShowcaseItem[]> {
  try {
    const out: ShowcaseItem[] = [];
    const limit = 200;
    const maxConcurrent = 5;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const requests: Promise<Response>[] = [];

      for (let i = 0; i < maxConcurrent && hasMore; i++) {
        const url = new URL("/api/showcase/list", POCKETBASE_URL);
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("offset", String(offset));
        requests.push(
          fetch(url.toString(), { headers: { Accept: "application/json" } }),
        );
        offset += limit;
      }

      if (requests.length === 0) break;

      const responses = await Promise.allSettled(requests);

      for (const result of responses) {
        if (result.status === "fulfilled" && result.value.ok) {
          const json: ShowcaseResponse | null = await result.value
            .json()
            .catch(() => null);
          const rows = Array.isArray(json?.data)
            ? (json.data as ShowcaseItem[])
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
  const showcase = await fetchShowcase();
  const now = new Date().toISOString();

  const sitemap = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${showcase
  .map(
    (item) => `  <url>
    <loc>${SITE_URL}/showcase/${item.slug}/</loc>
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
