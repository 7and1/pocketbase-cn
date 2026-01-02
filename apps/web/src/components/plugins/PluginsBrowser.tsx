import type { Plugin } from "@/lib/types/plugin";
import { PLUGIN_CATEGORIES } from "@/lib/constants/categories";
import { pocketbaseFileUrl } from "@/lib/utils/fileUrl";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { usePaginatedListWithFilters } from "@/hooks/usePaginatedList";

type PluginListItem = Plugin & {
  downloads_total?: number;
  stars?: number;
  tags?: string[];
  featured?: boolean;
  icon?: string;
  screenshots?: string[];
  github_stars?: number;
  github_updated_at?: string | null;
};

const PLUGIN_SORT_OPTIONS = [
  { value: "-created", label: "最新" },
  { value: "-downloads_total", label: "最多下载" },
  { value: "-stars", label: "最多收藏" },
  { value: "name", label: "名称" },
];

function PluginsBrowserContent() {
  const {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    query,
    setQuery,
    category,
    setCategory,
    sort,
    setSort,
    loadPage,
    sentinelRef,
  } = usePaginatedListWithFilters<PluginListItem>({
    endpoint: "/api/plugins/list",
    defaultSort: "-created",
    sortOptions: PLUGIN_SORT_OPTIONS,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <label htmlFor="plugin-search" className="sr-only">
            搜索插件
          </label>
          <input
            id="plugin-search"
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 pl-9 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-800 dark:bg-neutral-950"
            placeholder="搜索插件（名称/描述）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <label htmlFor="plugin-category" className="sr-only">
          分类筛选
        </label>
        <select
          id="plugin-category"
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-800 dark:bg-neutral-950 md:w-44"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">全部分类</option>
          {PLUGIN_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label htmlFor="plugin-sort" className="sr-only">
          排序方式
        </label>
        <select
          id="plugin-sort"
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-800 dark:bg-neutral-950 md:w-36"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {PLUGIN_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30"
          role="alert"
        >
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          <button
            type="button"
            onClick={() => loadPage(true)}
            className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-900 dark:text-red-300"
          >
            重试
          </button>
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <GridSkeleton count={6} showAvatar={true} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <a
            key={p.id}
            href={`/plugins/${p.slug}`}
            className="group rounded-xl border border-neutral-200 bg-white p-5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {p.icon ? (
                  <img
                    src={pocketbaseFileUrl(
                      "plugins",
                      String(p.id),
                      String(p.icon),
                      { thumb: "100x100" },
                    )}
                    alt={`${p.name} icon`}
                    className="h-8 w-8 rounded bg-neutral-100 object-cover dark:bg-neutral-900"
                    loading="lazy"
                    width={32}
                    height={32}
                  />
                ) : (
                  <span
                    className="h-8 w-8 rounded bg-neutral-100 dark:bg-neutral-900"
                    aria-hidden="true"
                  />
                )}
                <h3 className="min-w-0 truncate font-semibold group-hover:text-brand-700 dark:group-hover:text-brand-300">
                  {p.name}
                </h3>
              </div>
              {p.featured ? (
                <span className="rounded bg-brand-600/10 px-2 py-1 text-xs font-medium text-brand-700 dark:text-brand-300">
                  精选
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {p.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
              {p.category ? (
                <span className="rounded bg-neutral-100 px-2 py-1 dark:bg-neutral-800">
                  {p.category}
                </span>
              ) : null}
              <span className="ml-auto inline-flex gap-3" aria-label="插件统计">
                <span>★ {p.stars ?? 0}</span>
                <span>⬇ {p.downloads_total ?? 0}</span>
              </span>
            </div>
          </a>
        ))}
      </div>

      {loadingMore ? <GridSkeleton count={3} showAvatar={true} /> : null}
      <div ref={sentinelRef} aria-hidden="true" />

      {!loading && !error && items.length === 0 ? (
        <p className="text-sm text-neutral-500" role="status">
          没有匹配的插件。
        </p>
      ) : null}

      {!loading && !error && hasMore ? (
        <button
          type="button"
          className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
          onClick={() => loadPage(false)}
          disabled={loadingMore}
          aria-label="加载更多插件"
        >
          加载更多
        </button>
      ) : null}
    </div>
  );
}

export default function PluginsBrowser() {
  return (
    <ErrorBoundary>
      <PluginsBrowserContent />
    </ErrorBoundary>
  );
}
