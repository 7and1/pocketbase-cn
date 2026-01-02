import { useEffect, useMemo, useRef, useState } from "react";
import { POCKETBASE_URL } from "@/lib/constants/config";

interface UsePaginatedListOptions {
  endpoint: string;
  limit?: number;
  rootMargin?: string;
}

interface PaginatedListResult<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadPage: (replace: boolean) => void;
  sentinelRef: React.RefObject<HTMLDivElement>;
}

export function usePaginatedList<T>({
  endpoint,
  limit = 24,
  rootMargin = "400px",
}: UsePaginatedListOptions): PaginatedListResult<T> {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [trigger, setTrigger] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const endpointBase = useMemo(() => {
    const url = new URL(endpoint, POCKETBASE_URL);
    url.searchParams.set("limit", String(limit));
    return url;
  }, [endpoint, limit]);

  async function loadPage(replace: boolean) {
    const nextOffset = replace ? 0 : offset;
    setError(null);
    if (replace) setLoading(true);
    else setLoadingMore(true);

    try {
      const url = new URL(endpointBase.toString());
      url.searchParams.set("offset", String(nextOffset));
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? (json.data as T[]) : [];
      const meta = json?.meta || {};

      setItems((prev) => (replace ? rows : prev.concat(rows)));
      setHasMore(Boolean(meta?.hasMore));
      setOffset(Number(meta?.nextOffset || nextOffset + rows.length));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Load failed";
      setError(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    setItems([]);
    setOffset(0);
    setHasMore(false);
    loadPage(true);
  }, [endpointBase.toString(), trigger]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!hasMore) return;
    if (loading || loadingMore) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) loadPage(false);
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [
    hasMore,
    offset,
    loading,
    loadingMore,
    endpointBase.toString(),
    rootMargin,
  ]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    loadPage: (replace: boolean) => loadPage(replace),
    sentinelRef,
  };
}

interface UsePaginatedListWithFiltersOptions extends UsePaginatedListOptions {
  defaultSort?: string;
  sortOptions?: { value: string; label: string }[];
}

export function usePaginatedListWithFilters<T>({
  endpoint,
  limit = 24,
  rootMargin = "400px",
  defaultSort = "-created",
  sortOptions = [],
}: UsePaginatedListWithFiltersOptions) {
  // Initialize from URL params
  const getInitialParams = () => {
    if (typeof window === "undefined")
      return { query: "", category: "", sort: defaultSort };
    const params = new URLSearchParams(window.location.search);
    return {
      query: params.get("q") || "",
      category: params.get("category") || "",
      sort: params.get("sort") || defaultSort,
    };
  };

  const initial = getInitialParams();
  const [query, setQuery] = useState(initial.query);
  const [category, setCategory] = useState(initial.category);
  const [sort, setSort] = useState(initial.sort);

  // Persist to URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category.trim()) params.set("category", category.trim());
    if (sort && sort !== defaultSort) params.set("sort", sort);
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [query, category, sort, defaultSort]);

  const endpointWithFilters = useMemo(() => {
    const url = new URL(endpoint, POCKETBASE_URL);
    if (query.trim()) url.searchParams.set("q", query.trim());
    if (category.trim()) url.searchParams.set("category", category.trim());
    if (sort) url.searchParams.set("sort", sort);
    url.searchParams.set("limit", String(limit));
    return url.toString();
  }, [endpoint, query, category, sort, limit]);

  const listState = usePaginatedList<T>({
    endpoint: endpointWithFilters,
    limit,
    rootMargin,
  });

  return {
    ...listState,
    query,
    setQuery,
    category,
    setCategory,
    sort,
    setSort,
    sortOptions,
  };
}
