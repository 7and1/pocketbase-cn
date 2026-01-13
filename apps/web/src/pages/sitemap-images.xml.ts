import { SITE_URL, POCKETBASE_URL } from "../lib/constants/config";

interface PluginItem {
  slug: string;
  screenshot?: string | null;
  github_updated_at?: string | null;
}

interface ShowcaseItem {
  slug: string;
  images?: string[] | null;
  updated?: string | null;
}

interface PluginResponse {
  data: PluginItem[];
  meta?: {
    hasMore?: boolean;
    nextOffset?: number;
    totalItems?: number;
  };
}

interface ShowcaseResponse {
  data: ShowcaseItem[];
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
  const [plugins, showcase] = await Promise.all([
    fetchPlugins(),
    fetchShowcase(),
  ]);

  const imageUrls: string[] = [];

  // Collect plugin screenshots
  for (const plugin of plugins) {
    if (plugin.screenshot) {
      imageUrls.push(plugin.screenshot);
    }
  }

  // Collect showcase images
  for (const item of showcase) {
    if (Array.isArray(item.images)) {
      imageUrls.push(...item.images);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${plugins
  .filter((p) => p.screenshot)
  .map(
    (plugin) => `  <url>
    <loc>${SITE_URL}/plugins/${plugin.slug}/</loc>
    <image:image>
      <image:loc>${plugin.screenshot}</image:loc>
      <image:title>${plugin.slug} - PocketBase 插件截图</image:title>
    </image:image>
  </url>`,
  )
  .join("\n")}
${showcase
  .filter((item) => Array.isArray(item.images) && item.images.length > 0)
  .map(
    (item) =>
      item.images
        ?.map(
          (img) => `    <image:image>
      <image:loc>${img}</image:loc>
      <image:title>${item.slug} - PocketBase 案例展示</image:title>
    </image:image>`,
        )
        .join("\n") || "",
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
