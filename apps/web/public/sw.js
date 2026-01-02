// PocketBase.cn Service Worker
// Cache strategy: Stale-While-Revalidate for dynamic content, Cache-First for static assets

const CACHE_NAME = "pocketbase-cn-v1";
const STATIC_CACHE = "pocketbase-static-v1";

// Assets to cache immediately on install
const PRECACHE_ASSETS = ["/", "/favicon.svg", "/og-image.png"];

// API endpoints that can be cached (with short TTL)
const CACHEABLE_PATTERNS = [
  /^\/api\/plugins\/list/,
  /^\/api\/showcase\/list/,
  /^\/api\/downloads\/versions/,
];

// Static asset patterns
const STATIC_ASSET_PATTERNS = [
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.webp$/,
  /\.svg$/,
  /\.ico$/,
  /\.css$/,
  /\.js$/,
];

// Install event - precache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests (except for our API)
  if (url.origin !== self.location.origin) {
    // Don't cache third-party resources
    return;
  }

  // Static assets - Cache First strategy
  if (STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // API responses - Network First with cache fallback for specific endpoints
  if (url.pathname.startsWith("/api/")) {
    const isCacheable = CACHEABLE_PATTERNS.some((pattern) =>
      pattern.test(url.pathname),
    );
    if (isCacheable) {
      event.respondWith(staleWhileRevalidate(request));
      return;
    }
    // For other API calls, use Network First
    event.respondWith(networkFirst(request));
    return;
  }

  // HTML pages - Network First for fresh content
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: Network First
  event.respondWith(networkFirst(request));
});

// Cache First: Use cache, fall back to network
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    });
    return cached;
  }

  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

// Network First: Try network, fall back to cache
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok && request.method === "GET") {
      // Don't cache private/authenticated requests
      if (!request.headers.get("authorization")) {
        cache.put(request, networkResponse.clone()).catch(() => {
          // Cache put might fail if quota exceeded, ignore
        });
      }
    }

    return networkResponse;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stale While Revalidate: Serve from cache, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  // Return cached version immediately, or wait for network if no cache
  return cached || fetchPromise;
}
