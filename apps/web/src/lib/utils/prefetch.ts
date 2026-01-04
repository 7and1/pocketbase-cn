// URL prefetch utilities for performance optimization

const prefetchedUrls = new Set<string>();

/**
 * Prefetch a URL using <link rel="prefetch">
 * Only prefetches each URL once to avoid redundant requests
 */
export function prefetchUrl(url: string): void {
  if (typeof window === "undefined") return;
  if (prefetchedUrls.has(url)) return;

  // Only prefetch same-origin URLs
  try {
    const targetUrl = new URL(url, window.location.origin);
    if (targetUrl.origin !== window.location.origin) return;
  } catch {
    return;
  }

  prefetchedUrls.add(url);

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;

  // Set low priority for prefetches
  link.setAttribute("importance", "low");

  document.head.appendChild(link);
}

/**
 * Prefetch multiple URLs
 */
export function prefetchUrls(urls: string[]): void {
  urls.forEach(prefetchUrl);
}

/**
 * Create a mouseover handler that prefetches a URL
 * Returns a function that can be used as an event handler
 */
export function createHoverPrefetchHandler(url: string): () => void {
  return () => prefetchUrl(url);
}

/**
 * Setup hover prefetch for a list of link selectors
 * Automatically prefetches URLs when user hovers over matching links
 */
export function setupHoverPrefetch(selectors: string[]): void {
  if (typeof window === "undefined") return;

  const observer = new MutationObserver(() => {
    attachHoverPrefetch(selectors);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  attachHoverPrefetch(selectors);
}

function attachHoverPrefetch(selectors: string[]): void {
  selectors.forEach((selector) => {
    document.querySelectorAll<HTMLAnchorElement>(selector).forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;

      // Skip empty, hash, or javascript links
      if (
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href === ""
      ) {
        return;
      }

      link.addEventListener("mouseenter", () => prefetchUrl(href), {
        once: true,
      });
    });
  });
}

/**
 * Prefetch next page based on current pagination
 */
export function prefetchNextPage(baseUrl: string, currentPage: number): void {
  const nextPageUrl = baseUrl + "?page=" + (currentPage + 1);
  prefetchUrl(nextPageUrl);
}
