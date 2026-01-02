# PocketBase.cn Frontend Architecture

> Version: 1.0.0
> Last Updated: 2025-12-30
> Tech Stack: Astro 5.x + Starlight, Tailwind CSS, PocketBase JS SDK, Pagefind

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Astro Configuration](#2-astro-configuration)
3. [Component Architecture](#3-component-architecture)
4. [Routing Design](#4-routing-design)
5. [State Management](#5-state-management)
6. [Styling System](#6-styling-system)
7. [Performance Optimization](#7-performance-optimization)
8. [Build & Deployment](#8-build--deployment)

---

## 1. Project Structure

```
pocketbase-cn/
├── public/
│   ├── favicon.svg
│   ├── og-image.png
│   └── assets/
│       ├── images/
│       └── fonts/
│
├── src/
│   ├── content/
│   │   ├── docs/                    # Starlight documentation
│   │   │   ├── guides/
│   │   │   │   ├── getting-started.mdx
│   │   │   │   ├── authentication.mdx
│   │   │   │   ├── collections.mdx
│   │   │   │   └── realtime.mdx
│   │   │   ├── api/
│   │   │   │   ├── overview.mdx
│   │   │   │   ├── records.mdx
│   │   │   │   └── files.mdx
│   │   │   ├── sdk/
│   │   │   │   ├── javascript.mdx
│   │   │   │   ├── dart.mdx
│   │   │   │   └── go.mdx
│   │   │   └── deployment/
│   │   │       ├── docker.mdx
│   │   │       └── cloudflare.mdx
│   │   └── config.ts                # Content collection schema
│   │
│   ├── components/
│   │   ├── common/                  # Shared components
│   │   │   ├── Button.astro
│   │   │   ├── Card.astro
│   │   │   ├── Badge.astro
│   │   │   ├── Icon.astro
│   │   │   └── LoadingSpinner.astro
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   ├── Sidebar.astro
│   │   │   └── Navigation.astro
│   │   │
│   │   ├── docs/                    # Documentation-specific
│   │   │   ├── CodeBlock.astro
│   │   │   ├── APIReference.astro
│   │   │   ├── VersionSelector.astro
│   │   │   └── TableOfContents.astro
│   │   │
│   │   ├── plugins/                 # Plugin marketplace
│   │   │   ├── PluginCard.astro
│   │   │   ├── PluginGrid.astro
│   │   │   ├── PluginFilters.tsx    # Interactive - React
│   │   │   └── PluginSearch.tsx     # Interactive - React
│   │   │
│   │   ├── showcase/                # Case studies
│   │   │   ├── CaseCard.astro
│   │   │   ├── CaseGrid.astro
│   │   │   └── CaseFilters.tsx      # Interactive - React
│   │   │
│   │   ├── auth/                    # Authentication
│   │   │   ├── LoginForm.tsx        # Interactive - React
│   │   │   ├── SignupForm.tsx       # Interactive - React
│   │   │   ├── UserMenu.tsx         # Interactive - React
│   │   │   └── AuthGuard.tsx        # Interactive - React
│   │   │
│   │   └── interactive/             # Other interactive components
│   │       ├── Search.tsx           # Pagefind search
│   │       ├── ThemeToggle.tsx
│   │       ├── CopyButton.tsx
│   │       └── Tabs.tsx
│   │
│   ├── pages/
│   │   ├── index.astro              # Landing page
│   │   ├── plugins/
│   │   │   ├── index.astro          # Plugin marketplace
│   │   │   └── [slug].astro         # Plugin detail (SSR)
│   │   ├── showcase/
│   │   │   ├── index.astro          # Case studies list
│   │   │   └── [slug].astro         # Case study detail (SSR)
│   │   ├── auth/
│   │   │   ├── login.astro
│   │   │   ├── signup.astro
│   │   │   └── callback.astro       # OAuth callback
│   │   ├── api/
│   │   │   ├── plugins/
│   │   │   │   └── [...slug].ts     # Plugin API proxy
│   │   │   └── auth/
│   │   │       └── [...action].ts   # Auth API endpoints
│   │   └── 404.astro
│   │
│   ├── lib/
│   │   ├── pocketbase/
│   │   │   ├── client.ts            # PocketBase client singleton
│   │   │   ├── auth.ts              # Auth utilities
│   │   │   ├── collections.ts       # Collection type definitions
│   │   │   └── hooks.ts             # React hooks for PocketBase
│   │   ├── utils/
│   │   │   ├── cn.ts                # Class name utility
│   │   │   ├── date.ts              # Date formatting
│   │   │   ├── slug.ts              # Slug utilities
│   │   │   └── validation.ts        # Form validation
│   │   ├── constants/
│   │   │   ├── routes.ts            # Route constants
│   │   │   ├── meta.ts              # SEO metadata
│   │   │   └── config.ts            # App configuration
│   │   └── types/
│   │       ├── plugin.ts            # Plugin types
│   │       ├── case.ts              # Case study types
│   │       ├── user.ts              # User types
│   │       └── api.ts               # API response types
│   │
│   ├── styles/
│   │   ├── global.css               # Global styles
│   │   ├── starlight.css            # Starlight overrides
│   │   └── components/              # Component-specific styles
│   │       └── code-block.css
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro         # Base HTML layout
│   │   ├── DocsLayout.astro         # Documentation layout
│   │   ├── MarketplaceLayout.astro  # Plugin marketplace layout
│   │   └── AuthLayout.astro         # Auth pages layout
│   │
│   └── env.d.ts                     # TypeScript env declarations
│
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 2. Astro Configuration

### 2.1 Main Configuration (`astro.config.mjs`)

```javascript
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";

export default defineConfig({
  site: "https://pocketbase.cn",

  // Hybrid rendering: Static by default, SSR where needed
  output: "hybrid",

  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    routes: {
      strategy: "include",
      include: ["/plugins/*", "/showcase/*", "/api/*", "/auth/*"],
    },
  }),

  integrations: [
    starlight({
      title: "PocketBase.cn",
      description: "PocketBase Chinese documentation and plugin marketplace",
      defaultLocale: "zh-CN",
      locales: {
        "zh-CN": {
          label: "Chinese",
          lang: "zh-CN",
        },
        en: {
          label: "English",
          lang: "en",
        },
      },
      logo: {
        src: "./src/assets/logo.svg",
        replacesTitle: false,
      },
      social: {
        github: "https://github.com/pocketbase/pocketbase",
        discord: "https://discord.gg/pocketbase",
      },
      customCss: ["./src/styles/global.css", "./src/styles/starlight.css"],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", link: "/docs/guides/getting-started" },
            { label: "Installation", link: "/docs/guides/installation" },
            { label: "Quick Start", link: "/docs/guides/quick-start" },
          ],
        },
        {
          label: "Core Concepts",
          items: [
            { label: "Collections", link: "/docs/guides/collections" },
            { label: "Authentication", link: "/docs/guides/authentication" },
            { label: "Files", link: "/docs/guides/files" },
            { label: "Realtime", link: "/docs/guides/realtime" },
          ],
        },
        {
          label: "API Reference",
          collapsed: true,
          autogenerate: { directory: "docs/api" },
        },
        {
          label: "SDK",
          collapsed: true,
          autogenerate: { directory: "docs/sdk" },
        },
        {
          label: "Deployment",
          collapsed: true,
          autogenerate: { directory: "docs/deployment" },
        },
      ],
      components: {
        Header: "./src/components/layout/Header.astro",
        Search: "./src/components/interactive/Search.tsx",
        ThemeSelect: "./src/components/interactive/ThemeToggle.tsx",
      },
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://pocketbase.cn/og-image.png",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "preconnect",
            href: "https://api.pocketbase.cn",
          },
        },
      ],
      editLink: {
        baseUrl: "https://github.com/pocketbase-cn/docs/edit/main/",
      },
      lastUpdated: true,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
    }),

    tailwind({
      applyBaseStyles: false,
    }),

    react(),

    sitemap({
      i18n: {
        defaultLocale: "zh-CN",
        locales: {
          "zh-CN": "zh-CN",
          en: "en",
        },
      },
    }),

    pagefind(),
  ],

  vite: {
    ssr: {
      noExternal: ["@radix-ui/*"],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            pocketbase: ["pocketbase"],
            "react-vendor": ["react", "react-dom"],
          },
        },
      },
    },
    optimizeDeps: {
      include: ["pocketbase"],
    },
    define: {
      "import.meta.env.PUBLIC_POCKETBASE_URL": JSON.stringify(
        process.env.PUBLIC_POCKETBASE_URL || "https://api.pocketbase.cn",
      ),
    },
  },

  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },

  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        limitInputPixels: false,
      },
    },
    domains: ["api.pocketbase.cn"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.pocketbase.cn",
      },
    ],
  },

  experimental: {
    clientPrerender: true,
  },
});
```

### 2.2 TypeScript Configuration (`tsconfig.json`)

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/lib/*": ["src/lib/*"],
      "@/styles/*": ["src/styles/*"],
      "@/types/*": ["src/lib/types/*"]
    },
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "strictNullChecks": true,
    "noImplicitAny": true,
    "moduleResolution": "bundler"
  },
  "include": ["src/**/*", "env.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 2.3 Environment Variables (`.env.example`)

```bash
# PocketBase Configuration
PUBLIC_POCKETBASE_URL=https://api.pocketbase.cn
PUBLIC_SITE_URL=https://pocketbase.cn

# OAuth Providers (server-side only)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Analytics (optional)
PUBLIC_PLAUSIBLE_DOMAIN=pocketbase.cn

# Build Configuration
NODE_ENV=production
```

---

## 3. Component Architecture

### 3.1 Component Classification

| Type        | Technology     | Hydration        | Use Case                      |
| ----------- | -------------- | ---------------- | ----------------------------- |
| Static      | Astro (.astro) | None             | Layout, cards, static content |
| Interactive | React (.tsx)   | `client:load`    | Forms, search, filters        |
| Deferred    | React (.tsx)   | `client:visible` | Below-fold interactivity      |
| Island      | React (.tsx)   | `client:idle`    | Non-critical interactions     |

### 3.2 Static Components (Astro)

```astro
---
// src/components/common/Card.astro
interface Props {
  title: string;
  description?: string;
  href?: string;
  variant?: 'default' | 'featured' | 'compact';
}

const { title, description, href, variant = 'default' } = Astro.props;

const variantClasses = {
  default: 'p-6 bg-white dark:bg-neutral-900',
  featured: 'p-8 bg-primary-50 dark:bg-primary-950 border-primary-200',
  compact: 'p-4 bg-neutral-50 dark:bg-neutral-800',
};
---

<article class={`rounded-lg border border-neutral-200 dark:border-neutral-700
  transition-shadow hover:shadow-md ${variantClasses[variant]}`}>
  {href ? (
    <a href={href} class="block">
      <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      {description && (
        <p class="mt-2 text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      )}
      <slot />
    </a>
  ) : (
    <>
      <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      {description && (
        <p class="mt-2 text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      )}
      <slot />
    </>
  )}
</article>
```

```astro
---
// src/components/plugins/PluginCard.astro
import { Image } from 'astro:assets';
import Badge from '@/components/common/Badge.astro';
import type { Plugin } from '@/lib/types/plugin';

interface Props {
  plugin: Plugin;
}

const { plugin } = Astro.props;
---

<article class="group relative rounded-xl border border-neutral-200
  dark:border-neutral-700 bg-white dark:bg-neutral-900
  overflow-hidden transition-all hover:shadow-lg hover:border-primary-300">

  <a href={`/plugins/${plugin.slug}`} class="block">
    {plugin.thumbnail && (
      <div class="aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <Image
          src={plugin.thumbnail}
          alt={plugin.name}
          width={400}
          height={225}
          class="object-cover w-full h-full transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </div>
    )}

    <div class="p-5">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-semibold text-neutral-900 dark:text-neutral-100
          line-clamp-1 group-hover:text-primary-600">
          {plugin.name}
        </h3>
        <Badge variant={plugin.verified ? 'success' : 'default'}>
          {plugin.verified ? 'Verified' : plugin.category}
        </Badge>
      </div>

      <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
        {plugin.description}
      </p>

      <div class="mt-4 flex items-center justify-between text-sm">
        <span class="text-neutral-500 dark:text-neutral-500">
          by {plugin.author}
        </span>
        <div class="flex items-center gap-3 text-neutral-500">
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            {plugin.stars}
          </span>
          <span>{plugin.downloads.toLocaleString()}</span>
        </div>
      </div>
    </div>
  </a>
</article>
```

### 3.3 Interactive Components (React with Hydration)

```tsx
// src/components/plugins/PluginFilters.tsx
import { useState, useCallback, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { pluginFilters, setPluginFilters } from "@/lib/stores/plugins";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface Props {
  categories: FilterOption[];
  tags: FilterOption[];
}

export default function PluginFilters({ categories, tags }: Props) {
  const filters = useStore(pluginFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCategoryChange = useCallback(
    (category: string) => {
      setPluginFilters({
        ...filters,
        category: filters.category === category ? "" : category,
      });
    },
    [filters],
  );

  const handleTagToggle = useCallback(
    (tag: string) => {
      const newTags = filters.tags.includes(tag)
        ? filters.tags.filter((t) => t !== tag)
        : [...filters.tags, tag];

      setPluginFilters({ ...filters, tags: newTags });
    },
    [filters],
  );

  const handleSortChange = useCallback(
    (sort: string) => {
      setPluginFilters({
        ...filters,
        sort: sort as "popular" | "recent" | "name",
      });
    },
    [filters],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    count += filters.tags.length;
    return count;
  }, [filters]);

  return (
    <div className="sticky top-20 space-y-6">
      {/* Sort */}
      <div>
        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
          Sort By
        </h3>
        <select
          value={filters.sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-neutral-200
            dark:border-neutral-700 bg-white dark:bg-neutral-800
            text-neutral-900 dark:text-neutral-100
            focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="popular">Most Popular</option>
          <option value="recent">Recently Updated</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
          Categories
        </h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`w-full flex items-center justify-between px-3 py-2
                rounded-lg text-sm transition-colors
                ${
                  filters.category === cat.value
                    ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
            >
              <span>{cat.label}</span>
              {cat.count !== undefined && (
                <span className="text-xs text-neutral-400">{cat.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-sm
            font-medium text-neutral-900 dark:text-neutral-100 mb-3"
        >
          <span>Tags</span>
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isExpanded && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.value}
                onClick={() => handleTagToggle(tag.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${
                    filters.tags.includes(tag.value)
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
                  }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <button
          onClick={() =>
            setPluginFilters({
              category: "",
              tags: [],
              sort: "popular",
              search: "",
            })
          }
          className="w-full px-4 py-2 text-sm text-primary-600 dark:text-primary-400
            hover:bg-primary-50 dark:hover:bg-primary-950 rounded-lg transition-colors"
        >
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  );
}
```

```tsx
// src/components/interactive/Search.tsx
import { useState, useCallback, useRef, useEffect } from "react";

interface SearchResult {
  url: string;
  title: string;
  excerpt: string;
}

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pagefind = useRef<any>(null);

  // Initialize Pagefind
  useEffect(() => {
    async function initPagefind() {
      if (typeof window !== "undefined" && !pagefind.current) {
        try {
          pagefind.current = await import(
            /* @vite-ignore */ "/pagefind/pagefind.js"
          );
          await pagefind.current.init();
        } catch (e) {
          console.warn("Pagefind not available:", e);
        }
      }
    }
    initPagefind();
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);

    if (!searchQuery.trim() || !pagefind.current) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const search = await pagefind.current.search(searchQuery);
      const resultData = await Promise.all(
        search.results.slice(0, 8).map((r: any) => r.data()),
      );
      setResults(
        resultData.map((r: any) => ({
          url: r.url,
          title: r.meta?.title || r.url,
          excerpt: r.excerpt,
        })),
      );
    } catch (e) {
      console.error("Search error:", e);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-neutral-100 dark:bg-neutral-800 text-neutral-500
          hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        aria-label="Search documentation"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="hidden sm:inline text-sm">Search...</span>
        <kbd
          className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5
          text-xs font-mono bg-neutral-200 dark:bg-neutral-700 rounded"
        >
          <span className="text-xs">Cmd</span>K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl mx-4">
        <div
          className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl
          border border-neutral-200 dark:border-neutral-700 overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-neutral-200 dark:border-neutral-700">
            <svg
              className="w-5 h-5 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search documentation..."
              className="flex-1 py-4 bg-transparent text-neutral-900 dark:text-neutral-100
                placeholder-neutral-400 focus:outline-none"
            />
            {isLoading && (
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <ul className="max-h-96 overflow-y-auto py-2">
              {results.map((result, i) => (
                <li key={result.url}>
                  <a
                    href={result.url}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {result.title}
                    </div>
                    <div
                      className="text-sm text-neutral-500 line-clamp-2 mt-1"
                      dangerouslySetInnerHTML={{ __html: result.excerpt }}
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* No Results */}
          {query && !isLoading && results.length === 0 && (
            <div className="py-12 text-center text-neutral-500">
              No results found for "{query}"
            </div>
          )}

          {/* Footer */}
          <div
            className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700
            flex items-center justify-between text-xs text-neutral-400"
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                  Enter
                </kbd>
                to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                  Esc
                </kbd>
                to close
              </span>
            </div>
            <span>Powered by Pagefind</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3.4 Hydration Strategies

```astro
---
// src/pages/plugins/index.astro
import MarketplaceLayout from '@/layouts/MarketplaceLayout.astro';
import PluginGrid from '@/components/plugins/PluginGrid.astro';
import PluginFilters from '@/components/plugins/PluginFilters';
import PluginSearch from '@/components/plugins/PluginSearch';
import { getPluginCategories, getPluginTags } from '@/lib/pocketbase/collections';

const categories = await getPluginCategories();
const tags = await getPluginTags();
---

<MarketplaceLayout title="Plugin Marketplace">
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
        Plugin Marketplace
      </h1>
      <p class="mt-2 text-neutral-600 dark:text-neutral-400">
        Discover and install plugins to extend PocketBase functionality
      </p>
    </header>

    <!-- Search - loads immediately for quick interaction -->
    <div class="mb-8">
      <PluginSearch client:load />
    </div>

    <div class="grid lg:grid-cols-[280px_1fr] gap-8">
      <!-- Filters - loads when visible (sidebar) -->
      <aside>
        <PluginFilters
          client:visible
          categories={categories}
          tags={tags}
        />
      </aside>

      <!-- Plugin Grid - static component, hydrated via filters -->
      <main>
        <PluginGrid />
      </main>
    </div>
  </div>
</MarketplaceLayout>
```

---

## 4. Routing Design

### 4.1 Route Overview

| Route Pattern      | Rendering | Description               |
| ------------------ | --------- | ------------------------- |
| `/`                | Static    | Landing page              |
| `/docs/**`         | Static    | Documentation (Starlight) |
| `/plugins`         | Static    | Plugin marketplace index  |
| `/plugins/[slug]`  | SSR       | Plugin detail page        |
| `/showcase`        | Static    | Case studies index        |
| `/showcase/[slug]` | SSR       | Case study detail         |
| `/auth/*`          | SSR       | Authentication pages      |
| `/api/**`          | SSR       | API endpoints             |

### 4.2 Static Routes (Documentation)

Handled automatically by Starlight via content collections:

```typescript
// src/content/config.ts
import { defineCollection, z } from "astro:content";
import { docsSchema } from "@astrojs/starlight/schema";

export const collections = {
  docs: defineCollection({
    schema: docsSchema({
      extend: z.object({
        // Custom frontmatter fields
        category: z.string().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        lastVerified: z.date().optional(),
      }),
    }),
  }),
};
```

### 4.3 Dynamic Routes (SSR)

```astro
---
// src/pages/plugins/[slug].astro
export const prerender = false; // SSR for this route

import MarketplaceLayout from '@/layouts/MarketplaceLayout.astro';
import { getPlugin, getRelatedPlugins } from '@/lib/pocketbase/collections';
import PluginHeader from '@/components/plugins/PluginHeader.astro';
import PluginReadme from '@/components/plugins/PluginReadme.astro';
import PluginSidebar from '@/components/plugins/PluginSidebar.astro';
import PluginCard from '@/components/plugins/PluginCard.astro';

const { slug } = Astro.params;

if (!slug) {
  return Astro.redirect('/plugins');
}

const plugin = await getPlugin(slug);

if (!plugin) {
  return Astro.redirect('/404');
}

const relatedPlugins = await getRelatedPlugins(plugin.id, plugin.category, 4);

// Generate structured data for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: plugin.name,
  description: plugin.description,
  applicationCategory: 'Plugin',
  author: {
    '@type': 'Person',
    name: plugin.author,
  },
  aggregateRating: plugin.rating ? {
    '@type': 'AggregateRating',
    ratingValue: plugin.rating,
    ratingCount: plugin.ratingCount,
  } : undefined,
};
---

<MarketplaceLayout
  title={`${plugin.name} - PocketBase Plugin`}
  description={plugin.description}
  image={plugin.thumbnail}
>
  <script type="application/ld+json" set:html={JSON.stringify(structuredData)} />

  <div class="container mx-auto px-4 py-8">
    <div class="grid lg:grid-cols-[1fr_320px] gap-8">
      <main>
        <PluginHeader plugin={plugin} />
        <PluginReadme content={plugin.readme} />
      </main>

      <aside class="space-y-6">
        <PluginSidebar plugin={plugin} />
      </aside>
    </div>

    {relatedPlugins.length > 0 && (
      <section class="mt-16">
        <h2 class="text-2xl font-bold mb-6">Related Plugins</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedPlugins.map((p) => (
            <PluginCard plugin={p} />
          ))}
        </div>
      </section>
    )}
  </div>
</MarketplaceLayout>
```

### 4.4 API Routes

```typescript
// src/pages/api/plugins/[...slug].ts
import type { APIRoute } from "astro";
import { pb } from "@/lib/pocketbase/client";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const slug = params.slug;

  try {
    // Parse the path segments
    const segments = slug?.split("/") || [];

    if (segments.length === 0) {
      // GET /api/plugins - List plugins
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const perPage = parseInt(url.searchParams.get("perPage") || "20");
      const category = url.searchParams.get("category") || "";
      const sort = url.searchParams.get("sort") || "-downloads";

      let filter = 'status = "published"';
      if (category) {
        filter += ` && category = "${category}"`;
      }

      const plugins = await pb.collection("plugins").getList(page, perPage, {
        filter,
        sort,
        fields:
          "id,slug,name,description,category,author,downloads,stars,thumbnail,verified",
      });

      return new Response(JSON.stringify(plugins), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      });
    }

    // GET /api/plugins/:slug - Get single plugin
    const pluginSlug = segments[0];
    const plugin = await pb
      .collection("plugins")
      .getFirstListItem(`slug = "${pluginSlug}" && status = "published"`);

    return new Response(JSON.stringify(plugin), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    if (error.status === 404) {
      return new Response(JSON.stringify({ error: "Plugin not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Plugin API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  // Plugin submission (requires auth)
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const token = authHeader.slice(7);
    pb.authStore.save(token, null);

    if (!pb.authStore.isValid) {
      throw new Error("Invalid token");
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.repository) {
      return new Response(
        JSON.stringify({ error: "Name and repository are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const plugin = await pb.collection("plugins").create({
      ...data,
      author: pb.authStore.model?.id,
      status: "pending",
    });

    return new Response(JSON.stringify(plugin), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Plugin creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

```typescript
// src/pages/api/auth/[...action].ts
import type { APIRoute } from "astro";
import { pb } from "@/lib/pocketbase/client";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const action = params.action;

  try {
    switch (action) {
      case "login": {
        const { email, password } = await request.json();
        const authData = await pb
          .collection("users")
          .authWithPassword(email, password);

        // Set HTTP-only cookie
        cookies.set("pb_auth", pb.authStore.exportToCookie(), {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return new Response(
          JSON.stringify({
            user: authData.record,
            token: authData.token,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      case "signup": {
        const data = await request.json();
        const user = await pb.collection("users").create({
          email: data.email,
          password: data.password,
          passwordConfirm: data.passwordConfirm,
          name: data.name,
        });

        // Auto-login after signup
        const authData = await pb
          .collection("users")
          .authWithPassword(data.email, data.password);

        cookies.set("pb_auth", pb.authStore.exportToCookie(), {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });

        return new Response(
          JSON.stringify({
            user: authData.record,
            token: authData.token,
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      case "logout": {
        pb.authStore.clear();
        cookies.delete("pb_auth", { path: "/" });

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "refresh": {
        const authCookie = cookies.get("pb_auth")?.value;
        if (authCookie) {
          pb.authStore.loadFromCookie(authCookie);
        }

        if (!pb.authStore.isValid) {
          return new Response(JSON.stringify({ error: "Invalid session" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const authData = await pb.collection("users").authRefresh();

        cookies.set("pb_auth", pb.authStore.exportToCookie(), {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });

        return new Response(
          JSON.stringify({
            user: authData.record,
            token: authData.token,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error(`Auth ${action} error:`, error);
    return new Response(
      JSON.stringify({
        error: error.message || "Authentication failed",
      }),
      {
        status: error.status || 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
```

---

## 5. State Management

### 5.1 PocketBase Client Setup

```typescript
// src/lib/pocketbase/client.ts
import PocketBase from "pocketbase";

const POCKETBASE_URL =
  import.meta.env.PUBLIC_POCKETBASE_URL || "https://api.pocketbase.cn";

// Create a singleton instance
let pbInstance: PocketBase | null = null;

export function getPocketBase(): PocketBase {
  if (!pbInstance) {
    pbInstance = new PocketBase(POCKETBASE_URL);

    // Auto-refresh auth in browser
    if (typeof window !== "undefined") {
      pbInstance.authStore.loadFromCookie(document.cookie);

      pbInstance.authStore.onChange(() => {
        document.cookie = pbInstance!.authStore.exportToCookie({
          httpOnly: false,
        });
      });
    }
  }

  return pbInstance;
}

// For convenience
export const pb = getPocketBase();

// Type-safe collection helpers
export function getCollection<T>(name: string) {
  return pb.collection(name) as ReturnType<typeof pb.collection>;
}
```

### 5.2 Auth State Management (Nanostores)

```typescript
// src/lib/stores/auth.ts
import { atom, computed } from "nanostores";
import { pb } from "@/lib/pocketbase/client";
import type { User } from "@/lib/types/user";

// Auth state atoms
export const authToken = atom<string | null>(null);
export const authUser = atom<User | null>(null);
export const authLoading = atom<boolean>(true);

// Computed values
export const isAuthenticated = computed(
  [authToken, authUser],
  (token, user) => !!token && !!user,
);

export const isAdmin = computed(authUser, (user) => user?.role === "admin");

// Actions
export async function initAuth(): Promise<void> {
  authLoading.set(true);

  try {
    if (pb.authStore.isValid) {
      // Try to refresh the token
      const authData = await pb.collection("users").authRefresh();
      authToken.set(authData.token);
      authUser.set(authData.record as User);
    }
  } catch (error) {
    // Token expired or invalid
    pb.authStore.clear();
    authToken.set(null);
    authUser.set(null);
  } finally {
    authLoading.set(false);
  }
}

export async function login(email: string, password: string): Promise<User> {
  authLoading.set(true);

  try {
    const authData = await pb
      .collection("users")
      .authWithPassword(email, password);
    authToken.set(authData.token);
    authUser.set(authData.record as User);
    return authData.record as User;
  } finally {
    authLoading.set(false);
  }
}

export async function logout(): Promise<void> {
  pb.authStore.clear();
  authToken.set(null);
  authUser.set(null);

  // Call server to clear HTTP-only cookie
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function signup(data: {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
}): Promise<User> {
  authLoading.set(true);

  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Signup failed");
    }

    const { user, token } = await response.json();
    authToken.set(token);
    authUser.set(user);
    return user;
  } finally {
    authLoading.set(false);
  }
}
```

### 5.3 Plugin Filters State

```typescript
// src/lib/stores/plugins.ts
import { atom, computed } from "nanostores";
import { pb } from "@/lib/pocketbase/client";
import type {
  Plugin,
  PluginFilters as IPluginFilters,
} from "@/lib/types/plugin";

// Filter state
export const pluginFilters = atom<IPluginFilters>({
  category: "",
  tags: [],
  sort: "popular",
  search: "",
});

// Plugins data
export const plugins = atom<Plugin[]>([]);
export const pluginsLoading = atom<boolean>(false);
export const pluginsError = atom<string | null>(null);
export const pluginsPagination = atom({
  page: 1,
  perPage: 20,
  totalItems: 0,
  totalPages: 0,
});

// Computed filtered plugins (client-side for instant feedback)
export const filteredPlugins = computed(
  [plugins, pluginFilters],
  (items, filters) => {
    let result = [...items];

    // Filter by search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search),
      );
    }

    // Filter by category
    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    // Filter by tags
    if (filters.tags.length > 0) {
      result = result.filter((p) =>
        filters.tags.some((tag) => p.tags.includes(tag)),
      );
    }

    // Sort
    switch (filters.sort) {
      case "popular":
        result.sort((a, b) => b.downloads - a.downloads);
        break;
      case "recent":
        result.sort(
          (a, b) =>
            new Date(b.updated).getTime() - new Date(a.updated).getTime(),
        );
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  },
);

// Actions
export function setPluginFilters(filters: Partial<IPluginFilters>): void {
  pluginFilters.set({ ...pluginFilters.get(), ...filters });
}

export async function fetchPlugins(page = 1): Promise<void> {
  pluginsLoading.set(true);
  pluginsError.set(null);

  try {
    const filters = pluginFilters.get();

    let filter = 'status = "published"';
    if (filters.category) {
      filter += ` && category = "${filters.category}"`;
    }

    const sortMap: Record<string, string> = {
      popular: "-downloads",
      recent: "-updated",
      name: "name",
    };

    const result = await pb.collection("plugins").getList(page, 20, {
      filter,
      sort: sortMap[filters.sort] || "-downloads",
    });

    plugins.set(result.items as Plugin[]);
    pluginsPagination.set({
      page: result.page,
      perPage: result.perPage,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    pluginsError.set(error.message || "Failed to fetch plugins");
  } finally {
    pluginsLoading.set(false);
  }
}
```

### 5.4 React Hooks for State

```typescript
// src/lib/pocketbase/hooks.ts
import { useStore } from "@nanostores/react";
import { useEffect, useCallback } from "react";
import { pb } from "./client";
import {
  authUser,
  authLoading,
  isAuthenticated,
  initAuth,
  login,
  logout,
} from "@/lib/stores/auth";

export function useAuth() {
  const user = useStore(authUser);
  const loading = useStore(authLoading);
  const authenticated = useStore(isAuthenticated);

  useEffect(() => {
    initAuth();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: authenticated,
    login,
    logout,
  };
}

export function useRealtime<T>(
  collection: string,
  filter?: string,
  onUpdate?: (data: T[]) => void,
) {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function subscribe() {
      unsubscribe = await pb.collection(collection).subscribe("*", (e) => {
        // Re-fetch data on any change
        fetchData();
      });
    }

    async function fetchData() {
      try {
        const records = await pb.collection(collection).getFullList({
          filter,
          sort: "-created",
        });
        onUpdate?.(records as T[]);
      } catch (error) {
        console.error(`Error fetching ${collection}:`, error);
      }
    }

    fetchData();
    subscribe();

    return () => {
      unsubscribe?.();
    };
  }, [collection, filter]);
}

export function usePagination<T>(
  collection: string,
  perPage = 20,
  filter?: string,
  sort = "-created",
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      setError(null);

      try {
        const result = await pb
          .collection(collection)
          .getList(pageNum, perPage, {
            filter,
            sort,
          });

        setData(result.items as T[]);
        setPage(result.page);
        setTotalPages(result.totalPages);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [collection, perPage, filter, sort],
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  return {
    data,
    page,
    totalPages,
    loading,
    error,
    goToPage: fetchPage,
    nextPage: () => page < totalPages && fetchPage(page + 1),
    prevPage: () => page > 1 && fetchPage(page - 1),
  };
}
```

---

## 6. Styling System

### 6.1 Tailwind Configuration (`tailwind.config.mjs`)

```javascript
import starlightPlugin from "@astrojs/starlight-tailwind";
import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        // Primary brand colors (matching design tokens)
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },

        // Neutral grays
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },

        // Accent colors for Starlight integration
        accent: {
          200: "#bfdbfe",
          600: "#2563eb",
          900: "#1e3a8a",
          950: "#172554",
        },

        // Semantic colors
        success: {
          50: "#f0fdf4",
          500: "#10b981",
          600: "#059669",
        },
        warning: {
          50: "#fffbeb",
          500: "#f59e0b",
          600: "#d97706",
        },
        error: {
          50: "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
        },
      },

      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },

      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
      },

      spacing: {
        18: "4.5rem",
        88: "22rem",
        112: "28rem",
        128: "32rem",
      },

      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },

      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        DEFAULT:
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      },

      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 300ms ease-out",
        "slide-down": "slideDown 300ms ease-out",
        "scale-in": "scaleIn 150ms ease-out",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },

      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: "65ch",
            color: theme("colors.neutral.700"),
            a: {
              color: theme("colors.primary.600"),
              "&:hover": {
                color: theme("colors.primary.700"),
              },
            },
            code: {
              color: theme("colors.primary.600"),
              backgroundColor: theme("colors.primary.50"),
              padding: "0.25rem 0.375rem",
              borderRadius: "0.25rem",
              fontWeight: "500",
            },
            "code::before": { content: "none" },
            "code::after": { content: "none" },
          },
        },
        dark: {
          css: {
            color: theme("colors.neutral.300"),
            a: {
              color: theme("colors.primary.400"),
              "&:hover": {
                color: theme("colors.primary.300"),
              },
            },
            code: {
              color: theme("colors.primary.300"),
              backgroundColor: theme("colors.primary.950"),
            },
          },
        },
      }),
    },
  },

  plugins: [
    starlightPlugin(),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),

    // Custom plugin for component variants
    function ({ addUtilities, addComponents, theme }) {
      // Focus ring utility
      addUtilities({
        ".focus-ring": {
          outline: "none",
          "&:focus-visible": {
            boxShadow: `0 0 0 2px ${theme("colors.white")}, 0 0 0 4px ${theme("colors.primary.500")}`,
          },
        },
        ".focus-ring-dark": {
          outline: "none",
          "&:focus-visible": {
            boxShadow: `0 0 0 2px ${theme("colors.neutral.900")}, 0 0 0 4px ${theme("colors.primary.400")}`,
          },
        },
      });

      // Button component
      addComponents({
        ".btn": {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: theme("spacing.2"),
          padding: `${theme("spacing.2")} ${theme("spacing.4")}`,
          fontSize: theme("fontSize.sm[0]"),
          fontWeight: theme("fontWeight.medium"),
          lineHeight: theme("lineHeight.tight"),
          borderRadius: theme("borderRadius.lg"),
          transition: "all 150ms ease",
          cursor: "pointer",
          "&:disabled": {
            opacity: "0.5",
            cursor: "not-allowed",
          },
        },
        ".btn-primary": {
          backgroundColor: theme("colors.primary.600"),
          color: theme("colors.white"),
          "&:hover:not(:disabled)": {
            backgroundColor: theme("colors.primary.700"),
          },
        },
        ".btn-secondary": {
          backgroundColor: theme("colors.neutral.100"),
          color: theme("colors.neutral.900"),
          "&:hover:not(:disabled)": {
            backgroundColor: theme("colors.neutral.200"),
          },
        },
        ".btn-outline": {
          backgroundColor: "transparent",
          border: `1px solid ${theme("colors.neutral.300")}`,
          color: theme("colors.neutral.700"),
          "&:hover:not(:disabled)": {
            backgroundColor: theme("colors.neutral.50"),
          },
        },
      });
    },
  ],
};
```

### 6.2 Global Styles (`src/styles/global.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Custom fonts */
  @font-face {
    font-family: "Inter";
    font-style: normal;
    font-weight: 100 900;
    font-display: swap;
    src: url("/fonts/inter-variable.woff2") format("woff2");
  }

  @font-face {
    font-family: "JetBrains Mono";
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: url("/fonts/jetbrains-mono-variable.woff2") format("woff2");
  }

  /* Base styles */
  html {
    @apply scroll-smooth;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }

  body {
    @apply bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100;
    @apply antialiased;
  }

  /* Selection */
  ::selection {
    @apply bg-primary-200 dark:bg-primary-800;
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    @apply w-2 h-2;
  }

  ::-webkit-scrollbar-track {
    @apply bg-neutral-100 dark:bg-neutral-900;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-neutral-300 dark:bg-neutral-700 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-neutral-400 dark:bg-neutral-600;
  }

  /* Focus visible */
  :focus-visible {
    @apply outline-none ring-2 ring-primary-500 ring-offset-2;
    @apply dark:ring-offset-neutral-900;
  }
}

@layer components {
  /* Card styles */
  .card {
    @apply rounded-xl border border-neutral-200 dark:border-neutral-800;
    @apply bg-white dark:bg-neutral-900;
    @apply shadow-sm hover:shadow-md transition-shadow;
  }

  /* Input styles */
  .input {
    @apply w-full px-4 py-2 rounded-lg;
    @apply border border-neutral-300 dark:border-neutral-700;
    @apply bg-white dark:bg-neutral-800;
    @apply text-neutral-900 dark:text-neutral-100;
    @apply placeholder-neutral-400 dark:placeholder-neutral-500;
    @apply focus:ring-2 focus:ring-primary-500 focus:border-transparent;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  /* Badge styles */
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full;
    @apply text-xs font-medium;
  }

  .badge-default {
    @apply bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300;
  }

  .badge-primary {
    @apply bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300;
  }

  .badge-success {
    @apply bg-success-50 dark:bg-green-900 text-green-700 dark:text-green-300;
  }

  /* Container */
  .container-narrow {
    @apply max-w-4xl mx-auto px-4 sm:px-6 lg:px-8;
  }

  .container-wide {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }
}

@layer utilities {
  /* Text balance for headings */
  .text-balance {
    text-wrap: balance;
  }

  /* Gradient text */
  .text-gradient {
    @apply bg-clip-text text-transparent;
    @apply bg-gradient-to-r from-primary-600 to-primary-400;
  }

  /* Backdrop blur with fallback */
  .backdrop-blur-safe {
    @apply backdrop-blur-md;
    @supports not (backdrop-filter: blur(12px)) {
      @apply bg-white/95 dark:bg-neutral-900/95;
    }
  }

  /* Hide scrollbar */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Truncate multiline */
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

### 6.3 Starlight Overrides (`src/styles/starlight.css`)

```css
/* Starlight theme overrides */
:root {
  --sl-color-accent-low: theme("colors.primary.900");
  --sl-color-accent: theme("colors.primary.600");
  --sl-color-accent-high: theme("colors.primary.200");

  --sl-color-white: theme("colors.white");
  --sl-color-gray-1: theme("colors.neutral.100");
  --sl-color-gray-2: theme("colors.neutral.200");
  --sl-color-gray-3: theme("colors.neutral.400");
  --sl-color-gray-4: theme("colors.neutral.600");
  --sl-color-gray-5: theme("colors.neutral.700");
  --sl-color-gray-6: theme("colors.neutral.800");
  --sl-color-black: theme("colors.neutral.950");

  --sl-font: theme("fontFamily.sans");
  --sl-font-mono: theme("fontFamily.mono");

  --sl-text-h1: theme("fontSize.4xl[0]");
  --sl-text-h2: theme("fontSize.2xl[0]");
  --sl-text-h3: theme("fontSize.xl[0]");
  --sl-text-h4: theme("fontSize.lg[0]");

  --sl-line-height-headings: 1.2;

  --sl-nav-height: 4rem;
  --sl-sidebar-width: 18rem;
  --sl-content-width: 50rem;
}

:root[data-theme="dark"] {
  --sl-color-accent-low: theme("colors.primary.900");
  --sl-color-accent: theme("colors.primary.500");
  --sl-color-accent-high: theme("colors.primary.200");
}

/* Sidebar customization */
.sidebar-content {
  @apply border-r border-neutral-200 dark:border-neutral-800;
}

.sidebar-content nav a {
  @apply rounded-lg transition-colors;
}

.sidebar-content nav a:hover {
  @apply bg-neutral-100 dark:bg-neutral-800;
}

.sidebar-content nav a[aria-current="page"] {
  @apply bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300;
  @apply font-medium;
}

/* Table of contents */
starlight-toc {
  @apply border-l border-neutral-200 dark:border-neutral-800;
}

starlight-toc a {
  @apply text-neutral-600 dark:text-neutral-400;
}

starlight-toc a[aria-current="true"] {
  @apply text-primary-600 dark:text-primary-400 font-medium;
  @apply border-l-2 border-primary-500 -ml-px pl-4;
}

/* Code blocks */
.expressive-code {
  @apply rounded-xl overflow-hidden;
  @apply border border-neutral-200 dark:border-neutral-800;
}

.expressive-code .frame {
  @apply bg-neutral-900;
}

.expressive-code pre {
  @apply text-sm leading-relaxed;
}

/* Callouts/Asides */
.starlight-aside {
  @apply rounded-xl border-l-4 p-4;
  @apply bg-neutral-50 dark:bg-neutral-900;
}

.starlight-aside--note {
  @apply border-primary-500 bg-primary-50 dark:bg-primary-950;
}

.starlight-aside--tip {
  @apply border-green-500 bg-green-50 dark:bg-green-950;
}

.starlight-aside--caution {
  @apply border-yellow-500 bg-yellow-50 dark:bg-yellow-950;
}

.starlight-aside--danger {
  @apply border-red-500 bg-red-50 dark:bg-red-950;
}

/* Search customization */
.pagefind-ui__search-input {
  @apply rounded-lg border-neutral-300 dark:border-neutral-700;
  @apply focus:ring-2 focus:ring-primary-500;
}

/* Header customization */
header.header {
  @apply backdrop-blur-safe border-b border-neutral-200 dark:border-neutral-800;
}
```

---

## 7. Performance Optimization

### 7.1 Image Optimization Strategy

```astro
---
// src/components/common/OptimizedImage.astro
import { Image, getImage } from 'astro:assets';

interface Props {
  src: string | ImageMetadata;
  alt: string;
  width: number;
  height: number;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  class?: string;
}

const {
  src,
  alt,
  width,
  height,
  loading = 'lazy',
  priority = false,
  class: className
} = Astro.props;

// Generate optimized formats
const optimizedImage = typeof src === 'string'
  ? src
  : await getImage({
      src,
      width,
      height,
      format: 'webp',
      quality: 80,
    });

const fallbackImage = typeof src === 'string'
  ? src
  : await getImage({
      src,
      width,
      height,
      format: 'jpeg',
      quality: 85,
    });
---

<picture>
  {typeof src !== 'string' && (
    <>
      <source
        srcset={optimizedImage.src}
        type="image/webp"
      />
      <source
        srcset={fallbackImage.src}
        type="image/jpeg"
      />
    </>
  )}
  <img
    src={typeof src === 'string' ? src : fallbackImage.src}
    alt={alt}
    width={width}
    height={height}
    loading={priority ? 'eager' : loading}
    decoding={priority ? 'sync' : 'async'}
    fetchpriority={priority ? 'high' : undefined}
    class:list={[
      'object-cover',
      className,
    ]}
  />
</picture>
```

### 7.2 Code Splitting Configuration

```javascript
// vite.config.js (within astro.config.mjs vite section)
{
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // PocketBase SDK
          if (id.includes('pocketbase')) {
            return 'pocketbase';
          }

          // React vendor bundle
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }

          // Nanostores
          if (id.includes('nanostores')) {
            return 'state';
          }

          // UI components library (if using one)
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }

          // Code syntax highlighting
          if (id.includes('shiki') || id.includes('expressive-code')) {
            return 'code-highlight';
          }
        },
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 500,

    // CSS code splitting
    cssCodeSplit: true,

    // Minification
    minify: 'esbuild',

    // Source maps in production (for error tracking)
    sourcemap: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['pocketbase', 'react', 'react-dom', 'nanostores', '@nanostores/react'],
    exclude: ['@astrojs/starlight'],
  },
}
```

### 7.3 Prefetch Strategy

```astro
---
// src/layouts/BaseLayout.astro
import { ViewTransitions } from 'astro:transitions';

interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}

    <!-- Preconnect to external resources -->
    <link rel="preconnect" href="https://api.pocketbase.cn" />
    <link rel="dns-prefetch" href="https://api.pocketbase.cn" />

    <!-- Preload critical fonts -->
    <link
      rel="preload"
      href="/fonts/inter-variable.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />

    <!-- View Transitions for smooth navigation -->
    <ViewTransitions />

    <slot name="head" />
  </head>

  <body>
    <slot />

    <!-- Prefetch on hover -->
    <script>
      // Custom prefetch logic for dynamic routes
      document.addEventListener('DOMContentLoaded', () => {
        const prefetchCache = new Set();

        document.body.addEventListener('mouseover', (e) => {
          const link = e.target.closest('a[href^="/plugins/"], a[href^="/showcase/"]');
          if (!link || prefetchCache.has(link.href)) return;

          prefetchCache.add(link.href);

          const prefetchLink = document.createElement('link');
          prefetchLink.rel = 'prefetch';
          prefetchLink.href = link.href;
          document.head.appendChild(prefetchLink);
        });
      });
    </script>
  </body>
</html>
```

### 7.4 Critical CSS Extraction

```javascript
// astro.config.mjs - experimental features
{
  experimental: {
    // Client-side prerendering for faster perceived performance
    clientPrerender: true,
  },

  vite: {
    css: {
      // Extract critical CSS
      devSourcemap: true,
    },

    plugins: [
      // Critical CSS plugin (if needed)
      {
        name: 'critical-css',
        transformIndexHtml: {
          enforce: 'post',
          transform(html) {
            // Add critical CSS inline
            return html;
          },
        },
      },
    ],
  },
}
```

### 7.5 Performance Monitoring

```typescript
// src/lib/utils/performance.ts

// Web Vitals tracking
export function trackWebVitals() {
  if (typeof window === "undefined") return;

  // Core Web Vitals
  import("web-vitals").then(({ onCLS, onFID, onLCP, onFCP, onTTFB }) => {
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onLCP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  });
}

function sendToAnalytics(metric: { name: string; value: number; id: string }) {
  // Send to your analytics service
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    url: window.location.href,
    timestamp: Date.now(),
  });

  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/vitals", body);
  } else {
    fetch("/api/analytics/vitals", {
      method: "POST",
      body,
      keepalive: true,
    });
  }
}

// Performance observer for custom metrics
export function observePerformance() {
  if (typeof window === "undefined" || !("PerformanceObserver" in window))
    return;

  // Long tasks
  const longTaskObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        console.warn("Long task detected:", entry.duration, "ms");
      }
    }
  });

  longTaskObserver.observe({ entryTypes: ["longtask"] });

  // Resource loading
  const resourceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 1000) {
        console.warn("Slow resource:", entry.name, entry.duration, "ms");
      }
    }
  });

  resourceObserver.observe({ entryTypes: ["resource"] });
}
```

---

## 8. Build & Deployment

### 8.1 Build Scripts (`package.json`)

```json
{
  "name": "pocketbase-cn",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check && tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx,.astro",
    "lint:fix": "eslint src --ext .ts,.tsx,.astro --fix",
    "format": "prettier --write src",
    "test": "vitest run",
    "test:watch": "vitest",
    "pagefind": "pagefind --site dist",
    "postbuild": "npm run pagefind"
  },
  "dependencies": {
    "@astrojs/cloudflare": "^11.0.0",
    "@astrojs/react": "^3.6.0",
    "@astrojs/sitemap": "^3.1.0",
    "@astrojs/starlight": "^0.28.0",
    "@astrojs/tailwind": "^5.1.0",
    "@nanostores/react": "^0.7.0",
    "astro": "^5.0.0",
    "nanostores": "^0.10.0",
    "pocketbase": "^0.21.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.7",
    "@tailwindcss/typography": "^0.5.13",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "astro-pagefind": "^1.6.0",
    "eslint": "^9.0.0",
    "eslint-plugin-astro": "^1.2.0",
    "pagefind": "^1.1.0",
    "prettier": "^3.3.0",
    "prettier-plugin-astro": "^0.14.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

### 8.2 Cloudflare Pages Configuration (`wrangler.toml`)

```toml
name = "pocketbase-cn"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[site]
bucket = "./dist"

[build]
command = "npm run build"

# Environment variables (set via Cloudflare dashboard for secrets)
[vars]
PUBLIC_POCKETBASE_URL = "https://api.pocketbase.cn"
PUBLIC_SITE_URL = "https://pocketbase.cn"

# Custom headers
[[headers]]
for = "/*"
[headers.values]
X-Content-Type-Options = "nosniff"
X-Frame-Options = "DENY"
X-XSS-Protection = "1; mode=block"
Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
for = "/fonts/*"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
for = "/_astro/*"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
for = "/pagefind/*"
[headers.values]
Cache-Control = "public, max-age=86400"

# Redirects
[[redirects]]
from = "/docs"
to = "/docs/guides/getting-started"
status = 301

[[redirects]]
from = "/github"
to = "https://github.com/pocketbase/pocketbase"
status = 302
```

### 8.3 CI/CD Pipeline (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          PUBLIC_POCKETBASE_URL: ${{ vars.PUBLIC_POCKETBASE_URL }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      deployments: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: pocketbase-cn
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

---

## Appendix

### A. Type Definitions

```typescript
// src/lib/types/plugin.ts
export interface Plugin {
  id: string;
  slug: string;
  name: string;
  description: string;
  readme: string;
  category: PluginCategory;
  tags: string[];
  author: string;
  authorId: string;
  repository: string;
  website?: string;
  documentation?: string;
  thumbnail?: string;
  screenshots?: string[];
  version: string;
  license: string;
  downloads: number;
  stars: number;
  rating?: number;
  ratingCount?: number;
  verified: boolean;
  featured: boolean;
  status: "pending" | "published" | "rejected";
  created: string;
  updated: string;
}

export type PluginCategory =
  | "auth"
  | "storage"
  | "api"
  | "realtime"
  | "integration"
  | "utility"
  | "ui"
  | "other";

export interface PluginFilters {
  category: string;
  tags: string[];
  sort: "popular" | "recent" | "name";
  search: string;
}
```

```typescript
// src/lib/types/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "admin";
  verified: boolean;
  created: string;
  updated: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

### B. Route Constants

```typescript
// src/lib/constants/routes.ts
export const ROUTES = {
  HOME: "/",

  // Documentation
  DOCS: "/docs",
  DOCS_GETTING_STARTED: "/docs/guides/getting-started",
  DOCS_COLLECTIONS: "/docs/guides/collections",
  DOCS_AUTH: "/docs/guides/authentication",
  DOCS_API: "/docs/api/overview",

  // Marketplace
  PLUGINS: "/plugins",
  PLUGIN_DETAIL: (slug: string) => `/plugins/${slug}`,
  PLUGIN_SUBMIT: "/plugins/submit",

  // Showcase
  SHOWCASE: "/showcase",
  CASE_DETAIL: (slug: string) => `/showcase/${slug}`,

  // Auth
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  OAUTH_CALLBACK: "/auth/callback",

  // API
  API_PLUGINS: "/api/plugins",
  API_AUTH: "/api/auth",
} as const;

export const EXTERNAL_LINKS = {
  GITHUB: "https://github.com/pocketbase/pocketbase",
  DISCORD: "https://discord.gg/pocketbase",
  OFFICIAL_DOCS: "https://pocketbase.io/docs",
} as const;
```

### C. Error Handling

```typescript
// src/lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "AUTH_ERROR", 401, context);
    this.name = "AuthError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource} not found${id ? `: ${id}` : ""}`, "NOT_FOUND", 404, {
      resource,
      id,
    });
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(field: string, message: string) {
    super(message, "VALIDATION_ERROR", 400, { field });
    this.name = "ValidationError";
  }
}

// Error boundary component for React islands
export function ErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  // Implementation using React Error Boundary
}
```

---

**Document Version:** 1.0.0
**Last Updated:** 2025-12-30
**Author:** Architecture Team
**Status:** Production Ready
