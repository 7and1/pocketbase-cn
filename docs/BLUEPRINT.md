# PocketBase.cn - System Architecture Blueprint

> China's Premier PocketBase Ecosystem Hub: Documentation, Plugin Marketplace, Case Studies, and Mirror Downloads

**Version:** 1.0.0
**Last Updated:** 2025-12-30
**Status:** Production-Ready Design
**Maintainer:** Architecture Team

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Layers](#3-architecture-layers)
4. [Data Flow](#4-data-flow)
5. [Module Breakdown](#5-module-breakdown)
6. [Integration Points](#6-integration-points)
7. [Security Architecture](#7-security-architecture)
8. [Scalability Considerations](#8-scalability-considerations)
9. [Failure Modes & Recovery](#9-failure-modes--recovery)

---

## 1. System Overview

### 1.1 High-Level Architecture Diagram

```
                                    POCKETBASE.CN SYSTEM ARCHITECTURE

    +-------------------------------------------------------------------------------------------+
    |                                      CLOUDFLARE EDGE                                       |
    |  +------------------+  +------------------+  +------------------+  +------------------+   |
    |  |   WAF + DDoS     |  |   CDN Cache      |  |   DNS + Proxy    |  |   Rate Limiting  |   |
    |  +------------------+  +------------------+  +------------------+  +------------------+   |
    +-------------------------------------------------------------------------------------------+
                |                       |                       |                    |
                v                       v                       v                    v
    +------------------------+  +------------------------+  +------------------------+
    |   CLOUDFLARE PAGES     |  |   CLOUDFLARE R2        |  |   VPS (BACKEND)        |
    |  (Static Frontend)     |  |  (Binary Storage)      |  |  (PocketBase API)      |
    +------------------------+  +------------------------+  +------------------------+
    |                        |  |                        |  |                        |
    |  +------------------+  |  |  - PocketBase binaries |  |  +------------------+  |
    |  |  Astro + Starlight|  |  |  - Plugin packages    |  |  |   PocketBase     |  |
    |  |  Static Site      |  |  |  - User uploads       |  |  |   + SQLite DB    |  |
    |  +------------------+  |  |  - Backup archives     |  |  +------------------+  |
    |                        |  |                        |  |         |              |
    |  +------------------+  |  +------------------------+  |         v              |
    |  |  Pagefind        |  |             ^                |  +------------------+  |
    |  |  (Static Search) |  |             |                |  |   Collections    |  |
    |  +------------------+  |             |                |  |  - users         |  |
    |                        |             |                |  |  - plugins       |  |
    +------------------------+             |                |  |  - cases         |  |
              |                            |                |  |  - downloads     |  |
              |                            |                |  |  - comments      |  |
              v                            |                |  +------------------+  |
    +------------------------+             |                |                        |
    |   GITHUB               |             |                +------------------------+
    |  - OAuth Provider      |<------------+                           |
    |  - Plugin Source       |                                         |
    |  - Issue Tracking      |                                         v
    +------------------------+                              +------------------------+
                                                            |   EXTERNAL SERVICES    |
                                                            |  - GitHub OAuth        |
                                                            |  - Email (Resend)      |
                                                            |  - Analytics           |
                                                            +------------------------+
```

### 1.2 System Boundaries

| Boundary             | Internal                                    | External     |
| -------------------- | ------------------------------------------- | ------------ |
| **Data Storage**     | SQLite (PocketBase), R2                     | GitHub repos |
| **Authentication**   | PocketBase Auth                             | GitHub OAuth |
| **Content Delivery** | Cloudflare Pages/R2                         | Origin VPS   |
| **Search**           | Pagefind (static), PocketBase API (dynamic) | -            |

### 1.3 Core Objectives

1. **Zero-downtime documentation** - Static site survives backend outages
2. **Fast China access** - Cloudflare China network + R2 regional caching
3. **Simple operations** - Single PocketBase binary, no complex infrastructure
4. **Community-driven** - Plugin submissions, case studies, user contributions

---

## 2. Tech Stack

### 2.1 Complete Technology Matrix

| Layer                   | Technology           | Version | Rationale                                              |
| ----------------------- | -------------------- | ------- | ------------------------------------------------------ |
| **Frontend Framework**  | Astro                | 4.x     | Static-first, partial hydration, excellent performance |
| **Documentation Theme** | Starlight            | 0.x     | Purpose-built for docs, i18n support, accessibility    |
| **UI Components**       | Tailwind CSS         | 3.x     | Utility-first, small bundle, rapid styling             |
| **Static Search**       | Pagefind             | 1.x     | Zero-runtime search, works offline, sub-10ms queries   |
| **Backend**             | PocketBase           | 0.22+   | Single binary, built-in auth/realtime/admin, SQLite    |
| **Database**            | SQLite               | 3.x     | Embedded with PocketBase, ACID, simple backups         |
| **Object Storage**      | Cloudflare R2        | -       | S3-compatible, zero egress fees, global edge           |
| **CDN**                 | Cloudflare           | -       | China presence, DDoS protection, edge caching          |
| **Hosting (Static)**    | Cloudflare Pages     | -       | Global edge, instant deploys, preview URLs             |
| **Hosting (Backend)**   | VPS (Hetzner/Vultr)  | -       | Cost-effective, full control, Asian locations          |
| **CI/CD**               | GitHub Actions       | -       | Native integration, generous free tier                 |
| **Monitoring**          | Uptime Kuma + Sentry | -       | Self-hosted uptime, error tracking                     |
| **Email**               | Resend               | -       | Developer-friendly, reliable delivery                  |

### 2.2 Technology Decision Records

#### TDR-001: Why Astro over Next.js/Nuxt

**Decision:** Use Astro + Starlight for the frontend

**Context:** Need a documentation-heavy site with some dynamic components

**Rationale:**

- Astro ships zero JS by default (critical for China's variable network)
- Starlight provides docs primitives out-of-box (sidebar, search, i18n)
- Island architecture allows React/Vue components where needed
- 90+ Lighthouse scores achievable without optimization effort

**Trade-offs:**

- Smaller ecosystem than Next.js
- Less suitable for highly interactive SPAs
- Team familiarity may require ramp-up

#### TDR-002: Why PocketBase over Supabase/Firebase

**Decision:** Self-hosted PocketBase on VPS

**Context:** Need backend for user auth, plugin registry, case submissions

**Rationale:**

- Single Go binary = trivial deployment and maintenance
- SQLite embedded = no separate database to manage
- Built-in admin UI reduces custom development
- Full data sovereignty (important for China compliance)
- Real-time subscriptions included
- Extensible via Go hooks if needed

**Trade-offs:**

- Single-node limitation (acceptable for expected traffic)
- Less mature than established BaaS platforms
- Manual scaling requires migration planning

#### TDR-003: Why Cloudflare R2 over S3/OSS

**Decision:** Cloudflare R2 for binary and asset storage

**Context:** Need reliable, fast downloads for PocketBase binaries in China

**Rationale:**

- Zero egress fees (significant for binary downloads)
- S3-compatible API (easy migration path)
- Integrated with Cloudflare CDN
- Workers integration for custom logic

**Trade-offs:**

- Newer service, less battle-tested than S3
- Some S3 features not yet available
- Vendor lock-in to Cloudflare ecosystem

---

## 3. Architecture Layers

### 3.1 Layer Diagram

```
+-----------------------------------------------------------------------------------+
|                              PRESENTATION LAYER                                    |
|  +-------------+  +-------------+  +-------------+  +-------------+               |
|  |    Docs     |  |   Plugins   |  |    Cases    |  |  Downloads  |               |
|  |   (Static)  |  |  (Hybrid)   |  |  (Hybrid)   |  |  (Static)   |               |
|  +-------------+  +-------------+  +-------------+  +-------------+               |
|                         |                 |                                        |
|  Astro Components + Islands (React for interactive)                               |
+-----------------------------------------------------------------------------------+
                                      |
+-----------------------------------------------------------------------------------+
|                              APPLICATION LAYER                                     |
|  +------------------+  +------------------+  +------------------+                  |
|  |  Search Service  |  |  Auth Service    |  |  Content Service |                  |
|  |  (Pagefind +     |  |  (PB Auth +      |  |  (PB Collections |                  |
|  |   PB API)        |  |   GitHub OAuth)  |  |   + Markdown)    |                  |
|  +------------------+  +------------------+  +------------------+                  |
|                                                                                    |
|  +------------------+  +------------------+  +------------------+                  |
|  |  Plugin Service  |  |  Download Svc    |  |  Analytics Svc   |                  |
|  |  (Registry +     |  |  (R2 + Version   |  |  (Privacy-first  |                  |
|  |   Validation)    |  |   Management)    |  |   Metrics)       |                  |
|  +------------------+  +------------------+  +------------------+                  |
+-----------------------------------------------------------------------------------+
                                      |
+-----------------------------------------------------------------------------------+
|                              DATA ACCESS LAYER                                     |
|  +------------------+  +------------------+  +------------------+                  |
|  |  PocketBase SDK  |  |  R2 Client       |  |  GitHub API      |                  |
|  |  (JS SDK)        |  |  (S3 SDK)        |  |  (Octokit)       |                  |
|  +------------------+  +------------------+  +------------------+                  |
+-----------------------------------------------------------------------------------+
                                      |
+-----------------------------------------------------------------------------------+
|                              PERSISTENCE LAYER                                     |
|  +------------------+  +------------------+  +------------------+                  |
|  |  SQLite          |  |  Cloudflare R2   |  |  File System     |                  |
|  |  (PocketBase DB) |  |  (Binaries/      |  |  (Markdown Docs) |                  |
|  |                  |  |   Assets)        |  |                  |                  |
|  +------------------+  +------------------+  +------------------+                  |
+-----------------------------------------------------------------------------------+
```

### 3.2 Layer Responsibilities

#### Presentation Layer

- **Responsibility:** Render UI, handle user interactions, route requests
- **Technology:** Astro pages, Starlight components, Tailwind CSS
- **Caching:** Aggressive edge caching, stale-while-revalidate
- **State:** Minimal client state, prefer server rendering

#### Application Layer

- **Responsibility:** Business logic, service orchestration, validation
- **Technology:** Astro API routes, PocketBase hooks
- **Patterns:** Service-oriented, stateless handlers
- **Error Handling:** Graceful degradation, user-friendly messages

#### Data Access Layer

- **Responsibility:** Abstract data sources, handle connections
- **Technology:** PocketBase JS SDK, AWS S3 SDK (for R2)
- **Patterns:** Repository pattern, connection pooling
- **Resilience:** Retry logic, circuit breakers

#### Persistence Layer

- **Responsibility:** Durable storage, data integrity
- **Technology:** SQLite, R2, file system
- **Backup:** Automated daily backups to R2
- **Recovery:** Point-in-time recovery capability

---

## 4. Data Flow

### 4.1 Static Content Flow (Documentation)

```
+----------+     +-------------+     +----------------+     +----------+
|  Author  | --> |   GitHub    | --> | GitHub Actions | --> | CF Pages |
| (Markdown|     | Repository  |     | (Build Astro)  |     | (Edge)   |
|  Files)  |     |             |     |                |     |          |
+----------+     +-------------+     +----------------+     +----------+
                                            |                     |
                                            v                     v
                                     +-------------+        +-----------+
                                     |  Pagefind   |        |   User    |
                                     |  Index      |        | (Browser) |
                                     +-------------+        +-----------+
```

**Flow Description:**

1. Authors write documentation in Markdown
2. Push triggers GitHub Actions workflow
3. Astro builds static HTML + Pagefind index
4. Deploy to Cloudflare Pages (global edge)
5. Users receive cached static content
6. Client-side Pagefind handles search

### 4.2 Dynamic Content Flow (Plugins/Cases)

```
+----------+     +-------------+     +----------------+     +----------+
|   User   | --> |   Astro     | --> |   PocketBase   | --> |  SQLite  |
| (Browser)|     |   Island    |     |   API          |     |    DB    |
+----------+     +-------------+     +----------------+     +----------+
     ^                 |                    |                     |
     |                 v                    v                     |
     |          +-------------+     +----------------+            |
     |          |  CF Cache   |     |   R2 Storage   |            |
     |          | (API resp)  |     | (Plugin files) |            |
     |          +-------------+     +----------------+            |
     |                 |                    |                     |
     +-----------------+--------------------+---------------------+
```

**Flow Description:**

1. User requests plugin list or case study
2. Astro island component makes API call
3. Cloudflare caches API responses (short TTL)
4. PocketBase queries SQLite for metadata
5. R2 serves plugin packages directly
6. Response assembled and returned to user

### 4.3 Binary Download Flow

```
+----------+     +-------------+     +----------------+     +----------+
|  GitHub  | --> | GH Actions  | --> |   R2 Upload    | --> | R2 Store |
| Releases |     | (Sync Job)  |     |   (versioned)  |     |          |
+----------+     +-------------+     +----------------+     +----------+
                                                                  |
                                                                  v
+----------+     +-------------+     +----------------+     +----------+
|   User   | --> |   Astro     | --> |   CF CDN       | --> | R2 Edge  |
| (China)  |     |   Page      |     |   (cached)     |     |          |
+----------+     +-------------+     +----------------+     +----------+
```

**Flow Description:**

1. GitHub Action monitors PocketBase releases
2. New releases trigger sync to R2
3. Files stored with version prefixes
4. User visits download page
5. Request routed through Cloudflare CDN
6. R2 serves with edge caching (fast China access)

### 4.4 Authentication Flow

```
+----------+     +-------------+     +----------------+     +----------+
|   User   | --> |   Login     | --> |   GitHub       | --> | OAuth    |
|          |     |   Button    |     |   OAuth        |     | Callback |
+----------+     +-------------+     +----------------+     +----------+
                                                                  |
                                                                  v
+----------+     +-------------+     +----------------+     +----------+
|  Session | <-- | PocketBase  | <-- |   Validate     | <-- | Exchange |
|  Cookie  |     |   Auth      |     |   Token        |     |   Code   |
+----------+     +-------------+     +----------------+     +----------+
```

**Flow Description:**

1. User clicks "Login with GitHub"
2. Redirect to GitHub OAuth authorization
3. User approves, GitHub redirects with code
4. PocketBase exchanges code for token
5. PocketBase creates/updates user record
6. Session cookie set, user authenticated

---

## 5. Module Breakdown

### 5.1 Static Documentation Module

```
docs/
+-- src/
|   +-- content/
|   |   +-- docs/
|   |   |   +-- zh/           # Chinese documentation
|   |   |   |   +-- getting-started/
|   |   |   |   +-- api/
|   |   |   |   +-- guides/
|   |   |   |   +-- deployment/
|   |   |   +-- en/           # English documentation
|   |   +-- blog/             # Blog posts
|   +-- components/
|   |   +-- CodeBlock.astro
|   |   +-- ApiReference.astro
|   |   +-- VersionBadge.astro
|   +-- layouts/
|   +-- pages/
+-- astro.config.mjs
+-- pagefind.config.js
```

**Module Responsibilities:**

- Serve translated documentation (zh-CN primary, en-US secondary)
- API reference with interactive examples
- Version-specific documentation paths
- Offline-capable search via Pagefind

**Key Interfaces:**

```typescript
// Content collection schema
interface DocPage {
  title: string;
  description: string;
  sidebar: {
    order: number;
    badge?: string;
  };
  i18nReady: boolean;
  editUrl: string;
}

// Pagefind configuration
interface SearchConfig {
  site: string;
  outputSubdir: string;
  excludeSelectors: string[];
}
```

### 5.2 Dynamic Content Module (Plugins/Cases)

```
+------------------+     +------------------+     +------------------+
|   Plugin List    |     |  Plugin Detail   |     |  Plugin Submit   |
|   Component      |     |  Component       |     |  Form            |
+------------------+     +------------------+     +------------------+
         |                       |                       |
         v                       v                       v
+------------------------------------------------------------------+
|                        Plugin Service                             |
|  - listPlugins(filters)                                          |
|  - getPlugin(id)                                                 |
|  - submitPlugin(data)                                            |
|  - validatePlugin(url)                                           |
+------------------------------------------------------------------+
         |                       |                       |
         v                       v                       v
+------------------+     +------------------+     +------------------+
|   PocketBase     |     |   GitHub API     |     |   R2 Storage     |
|   plugins        |     |   (validation)   |     |   (packages)     |
+------------------+     +------------------+     +------------------+
```

**PocketBase Collections:**

```javascript
// plugins collection
{
  name: "plugins",
  type: "base",
  schema: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "description", type: "text", required: true },
    { name: "description_zh", type: "text" },
    { name: "github_url", type: "url", required: true },
    { name: "npm_package", type: "text" },
    { name: "category", type: "select", options: ["auth", "storage", "api", "ui", "utils"] },
    { name: "tags", type: "json" },
    { name: "author", type: "relation", collectionId: "users" },
    { name: "downloads", type: "number", default: 0 },
    { name: "stars", type: "number", default: 0 },
    { name: "version", type: "text" },
    { name: "logo", type: "file" },
    { name: "screenshots", type: "file", maxSelect: 5 },
    { name: "readme", type: "text" },
    { name: "status", type: "select", options: ["pending", "approved", "rejected"] },
    { name: "featured", type: "bool", default: false }
  ],
  indexes: ["CREATE INDEX idx_plugins_category ON plugins(category)"]
}

// cases collection
{
  name: "cases",
  type: "base",
  schema: [
    { name: "title", type: "text", required: true },
    { name: "title_zh", type: "text" },
    { name: "description", type: "text", required: true },
    { name: "description_zh", type: "text" },
    { name: "url", type: "url" },
    { name: "github_url", type: "url" },
    { name: "category", type: "select", options: ["saas", "mobile", "iot", "internal", "other"] },
    { name: "tech_stack", type: "json" },
    { name: "author", type: "relation", collectionId: "users" },
    { name: "thumbnail", type: "file" },
    { name: "screenshots", type: "file", maxSelect: 10 },
    { name: "content", type: "editor" },
    { name: "status", type: "select", options: ["pending", "approved", "rejected"] },
    { name: "featured", type: "bool", default: false }
  ]
}
```

**Plugin Validation Service:**

```typescript
interface PluginValidation {
  validateGitHubRepo(url: string): Promise<{
    valid: boolean;
    name: string;
    description: string;
    stars: number;
    topics: string[];
    readme: string;
    license: string | null;
  }>;

  checkNpmPackage(name: string): Promise<{
    exists: boolean;
    version: string;
    downloads: number;
  }>;

  scanSecurityIssues(url: string): Promise<{
    passed: boolean;
    issues: string[];
  }>;
}
```

### 5.3 Download Mirror Module

```
+------------------+     +------------------+     +------------------+
|   Version List   |     |  Platform Select |     |  Download        |
|   Component      |     |  Component       |     |  Button          |
+------------------+     +------------------+     +------------------+
         |                       |                       |
         v                       v                       v
+------------------------------------------------------------------+
|                       Download Service                            |
|  - listVersions()                                                |
|  - getDownloadUrl(version, platform, arch)                       |
|  - trackDownload(version, platform)                              |
|  - syncFromGitHub()                                              |
+------------------------------------------------------------------+
         |                       |                       |
         v                       v                       v
+------------------+     +------------------+     +------------------+
|   PocketBase     |     |   R2 Storage     |     |   GitHub API     |
|   downloads      |     |   (binaries)     |     |   (releases)     |
+------------------+     +------------------+     +------------------+
```

**R2 Storage Structure:**

```
pocketbase-mirror/
+-- releases/
|   +-- v0.22.0/
|   |   +-- pocketbase_0.22.0_darwin_amd64.zip
|   |   +-- pocketbase_0.22.0_darwin_arm64.zip
|   |   +-- pocketbase_0.22.0_linux_amd64.zip
|   |   +-- pocketbase_0.22.0_linux_arm64.zip
|   |   +-- pocketbase_0.22.0_windows_amd64.zip
|   |   +-- checksums.txt
|   +-- v0.21.3/
|   +-- ...
+-- plugins/
|   +-- {plugin-id}/
|   |   +-- v1.0.0/
|   |   |   +-- package.zip
|   |   +-- v1.1.0/
+-- assets/
    +-- logos/
    +-- screenshots/
```

**Download Statistics Collection:**

```javascript
{
  name: "download_stats",
  type: "base",
  schema: [
    { name: "version", type: "text", required: true },
    { name: "platform", type: "select", options: ["darwin", "linux", "windows"] },
    { name: "arch", type: "select", options: ["amd64", "arm64", "386"] },
    { name: "count", type: "number", default: 0 },
    { name: "date", type: "date" }
  ],
  indexes: ["CREATE UNIQUE INDEX idx_stats ON download_stats(version, platform, arch, date)"]
}
```

### 5.4 User Authentication Module

```
+------------------+     +------------------+     +------------------+
|   Login Page     |     |  Profile Page    |     |  Dashboard       |
+------------------+     +------------------+     +------------------+
         |                       |                       |
         v                       v                       v
+------------------------------------------------------------------+
|                         Auth Service                              |
|  - loginWithGitHub()                                             |
|  - loginWithEmail()                                              |
|  - logout()                                                      |
|  - getCurrentUser()                                              |
|  - updateProfile(data)                                           |
+------------------------------------------------------------------+
         |                       |                       |
         v                       v                       v
+------------------+     +------------------+     +------------------+
|   PocketBase     |     |   GitHub OAuth   |     |   Email Service  |
|   users          |     |   Provider       |     |   (Resend)       |
+------------------+     +------------------+     +------------------+
```

**User Collection Schema:**

```javascript
{
  name: "users",
  type: "auth",
  schema: [
    { name: "name", type: "text" },
    { name: "avatar", type: "file" },
    { name: "github_id", type: "text" },
    { name: "github_username", type: "text" },
    { name: "bio", type: "text" },
    { name: "website", type: "url" },
    { name: "role", type: "select", options: ["user", "contributor", "moderator", "admin"] },
    { name: "verified", type: "bool", default: false }
  ],
  oauth2: {
    enabled: true,
    providers: [
      {
        name: "github",
        clientId: "{{GITHUB_CLIENT_ID}}",
        clientSecret: "{{GITHUB_CLIENT_SECRET}}"
      }
    ]
  }
}
```

**Auth State Management:**

```typescript
// Client-side auth store
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;

  login(): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
}

// Server-side middleware
async function requireAuth(request: Request): Promise<User> {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) throw new UnauthorizedError();

  const user = (await pb.authStore.isValid) ? pb.authStore.model : null;
  if (!user) throw new UnauthorizedError();

  return user;
}
```

---

## 6. Integration Points

### 6.1 PocketBase SDK Integration

```typescript
// lib/pocketbase.ts
import PocketBase from "pocketbase";

const pb = new PocketBase(import.meta.env.POCKETBASE_URL);

// Type-safe collection interfaces
interface Plugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  github_url: string;
  category: string;
  author: string;
  expand?: {
    author: User;
  };
}

// Repository pattern implementation
export const pluginRepository = {
  async list(options?: {
    category?: string;
    search?: string;
    page?: number;
    perPage?: number;
  }): Promise<ListResult<Plugin>> {
    const filter: string[] = ['status = "approved"'];

    if (options?.category) {
      filter.push(`category = "${options.category}"`);
    }
    if (options?.search) {
      filter.push(
        `(name ~ "${options.search}" || description ~ "${options.search}")`,
      );
    }

    return pb
      .collection("plugins")
      .getList<Plugin>(options?.page ?? 1, options?.perPage ?? 20, {
        filter: filter.join(" && "),
        sort: "-featured,-downloads",
        expand: "author",
      });
  },

  async getBySlug(slug: string): Promise<Plugin> {
    return pb
      .collection("plugins")
      .getFirstListItem<Plugin>(`slug = "${slug}"`, { expand: "author" });
  },

  async submit(data: Partial<Plugin>): Promise<Plugin> {
    return pb.collection("plugins").create<Plugin>({
      ...data,
      status: "pending",
      author: pb.authStore.model?.id,
    });
  },
};

// Real-time subscriptions
export function subscribeToPlugins(
  callback: (event: RecordSubscription<Plugin>) => void,
) {
  return pb.collection("plugins").subscribe("*", callback);
}
```

### 6.2 GitHub OAuth Integration

```typescript
// lib/github-oauth.ts
import { Octokit } from "@octokit/rest";

export const githubOAuthConfig = {
  clientId: import.meta.env.GITHUB_CLIENT_ID,
  clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
  scope: "read:user user:email",
  callbackUrl: `${import.meta.env.PUBLIC_URL}/auth/github/callback`,
};

// OAuth flow handler
export async function handleGitHubCallback(code: string): Promise<AuthResult> {
  // Exchange code for token via PocketBase
  const authData = await pb
    .collection("users")
    .authWithOAuth2Code(
      "github",
      code,
      codeVerifier,
      githubOAuthConfig.callbackUrl,
    );

  // Fetch additional GitHub data
  const octokit = new Octokit({ auth: authData.meta?.accessToken });
  const { data: profile } = await octokit.users.getAuthenticated();

  // Update user profile with GitHub data
  await pb.collection("users").update(authData.record.id, {
    github_id: profile.id.toString(),
    github_username: profile.login,
    avatar: profile.avatar_url,
    bio: profile.bio,
  });

  return {
    user: authData.record,
    token: authData.token,
  };
}

// GitHub repo validation
export async function validateGitHubRepo(url: string): Promise<RepoValidation> {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error("Invalid GitHub URL");

  const [, owner, repo] = match;
  const octokit = new Octokit();

  const { data } = await octokit.repos.get({ owner, repo });
  const readme = await octokit.repos
    .getReadme({ owner, repo })
    .then((r) => Buffer.from(r.data.content, "base64").toString())
    .catch(() => null);

  return {
    valid: true,
    name: data.name,
    description: data.description || "",
    stars: data.stargazers_count,
    topics: data.topics || [],
    readme,
    license: data.license?.spdx_id || null,
  };
}
```

### 6.3 Cloudflare R2 Integration

```typescript
// lib/r2.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
  region: "auto",
  endpoint: import.meta.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = import.meta.env.R2_BUCKET;

export const r2Storage = {
  // Upload file to R2
  async upload(
    key: string,
    body: Buffer | Blob,
    contentType: string,
  ): Promise<string> {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    return `${import.meta.env.R2_PUBLIC_URL}/${key}`;
  },

  // Get signed download URL (for private files)
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    return getSignedUrl(r2Client, command, { expiresIn });
  },

  // Sync PocketBase release from GitHub
  async syncRelease(version: string): Promise<void> {
    const assets = await fetchGitHubReleaseAssets(version);

    for (const asset of assets) {
      const response = await fetch(asset.browser_download_url);
      const buffer = await response.arrayBuffer();

      await this.upload(
        `releases/${version}/${asset.name}`,
        Buffer.from(buffer),
        "application/zip",
      );
    }
  },

  // Generate public download URL
  getPublicUrl(key: string): string {
    return `${import.meta.env.R2_PUBLIC_URL}/${key}`;
  },
};

// Cloudflare Worker for download tracking (deployed separately)
export const downloadTrackerWorker = `
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Track download
    if (path.startsWith('/releases/')) {
      const [, , version, filename] = path.split('/');
      const platform = filename.includes('darwin') ? 'darwin'
        : filename.includes('linux') ? 'linux' : 'windows';
      const arch = filename.includes('arm64') ? 'arm64' : 'amd64';

      // Async tracking - don't block download
      env.ANALYTICS.writeDataPoint({
        blobs: [version, platform, arch],
        doubles: [1],
        indexes: [new Date().toISOString().split('T')[0]]
      });
    }

    // Serve from R2
    const object = await env.R2_BUCKET.get(path.slice(1));
    if (!object) return new Response('Not Found', { status: 404 });

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000',
        'ETag': object.httpEtag
      }
    });
  }
};
`;
```

---

## 7. Security Architecture

### 7.1 Security Overview Diagram

```
                           SECURITY LAYERS
+-------------------------------------------------------------------------+
|                         EDGE SECURITY (Cloudflare)                       |
|  +-------------+  +-------------+  +-------------+  +-------------+     |
|  |   WAF       |  |   DDoS      |  |  Bot Mgmt   |  |  SSL/TLS    |     |
|  |   Rules     |  |  Protection |  |             |  |  (Auto)     |     |
|  +-------------+  +-------------+  +-------------+  +-------------+     |
+-------------------------------------------------------------------------+
                                    |
+-------------------------------------------------------------------------+
|                        APPLICATION SECURITY                              |
|  +-------------+  +-------------+  +-------------+  +-------------+     |
|  |   CORS      |  |   CSP       |  |  Rate       |  |  Input      |     |
|  |   Policy    |  |   Headers   |  |  Limiting   |  |  Validation |     |
|  +-------------+  +-------------+  +-------------+  +-------------+     |
+-------------------------------------------------------------------------+
                                    |
+-------------------------------------------------------------------------+
|                      AUTHENTICATION & AUTHORIZATION                      |
|  +-------------+  +-------------+  +-------------+  +-------------+     |
|  |  PocketBase |  |   GitHub    |  |   RBAC      |  |  Session    |     |
|  |   Auth      |  |   OAuth     |  |   Rules     |  |   Mgmt      |     |
|  +-------------+  +-------------+  +-------------+  +-------------+     |
+-------------------------------------------------------------------------+
                                    |
+-------------------------------------------------------------------------+
|                           DATA SECURITY                                  |
|  +-------------+  +-------------+  +-------------+  +-------------+     |
|  |  SQLite     |  |   R2        |  |   Backup    |  |  Secrets    |     |
|  |  Encryption |  |  Encryption |  |  Encryption |  |   Mgmt      |     |
|  +-------------+  +-------------+  +-------------+  +-------------+     |
+-------------------------------------------------------------------------+
```

### 7.2 Authentication Security

```typescript
// PocketBase collection rules
const securityRules = {
  users: {
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: "", // Handled by OAuth
    updateRule: "@request.auth.id = id",
    deleteRule: null, // Admin only
  },

  plugins: {
    listRule: 'status = "approved" || @request.auth.id = author',
    viewRule: 'status = "approved" || @request.auth.id = author',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id = author || @request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  },

  cases: {
    listRule: 'status = "approved" || @request.auth.id = author',
    viewRule: 'status = "approved" || @request.auth.id = author',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id = author || @request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  },

  download_stats: {
    listRule: '@request.auth.role = "admin"',
    viewRule: null,
    createRule: null, // System only
    updateRule: null,
    deleteRule: null,
  },
};
```

### 7.3 Security Headers Configuration

```typescript
// astro.config.mjs security headers
export default defineConfig({
  output: 'static',
  adapter: cloudflare(),

  vite: {
    plugins: [
      {
        name: 'security-headers',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
            next();
          });
        }
      }
    ]
  }
});

// _headers file for Cloudflare Pages
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.pocketbase.cn;
```

### 7.4 Rate Limiting Strategy

```typescript
// PocketBase rate limiting configuration
const rateLimits = {
  // Global API limits
  global: {
    requests: 100,
    window: "1m",
  },

  // Per-endpoint limits
  endpoints: {
    "POST /api/collections/plugins/records": {
      authenticated: { requests: 10, window: "1h" },
      anonymous: null, // Blocked
    },
    "POST /api/collections/cases/records": {
      authenticated: { requests: 5, window: "1h" },
      anonymous: null,
    },
    "GET /api/collections/*/records": {
      authenticated: { requests: 200, window: "1m" },
      anonymous: { requests: 50, window: "1m" },
    },
  },

  // Auth-specific limits
  auth: {
    login: { requests: 5, window: "15m" },
    register: { requests: 3, window: "1h" },
    passwordReset: { requests: 3, window: "1h" },
  },
};

// Cloudflare rate limiting rules (wrangler.toml)
// [[rules]]
// action = "block"
// expression = "(http.request.uri.path contains \"/api/\" and rate(http.request.uri.path, 60) > 100)"
```

### 7.5 Data Protection

```typescript
// Sensitive data handling
const dataProtection = {
  // Fields to never expose in API
  sensitiveFields: ["email", "github_id"],

  // PII handling
  pii: {
    retention: "2 years",
    deletion: "on user request",
    export: "GDPR compliant",
  },

  // Backup encryption
  backup: {
    algorithm: "AES-256-GCM",
    keyRotation: "90 days",
    storage: "R2 with versioning",
  },
};

// Backup script (runs daily via cron)
async function backupDatabase() {
  const timestamp = new Date().toISOString().split("T")[0];
  const dbPath = "/pb_data/data.db";

  // Create encrypted backup
  const backup = await encryptFile(dbPath, process.env.BACKUP_KEY);

  // Upload to R2 with versioning
  await r2Storage.upload(
    `backups/${timestamp}/data.db.enc`,
    backup,
    "application/octet-stream",
  );

  // Cleanup old backups (keep 30 days)
  await cleanupOldBackups(30);
}
```

---

## 8. Scalability Considerations

### 8.1 Current Capacity Estimates

| Resource      | Estimated Capacity          | Growth Trigger    |
| ------------- | --------------------------- | ----------------- |
| **SQLite**    | 100K records, 1GB DB        | 80% threshold     |
| **VPS**       | 1000 concurrent users       | 70% CPU sustained |
| **R2**        | Unlimited storage           | Cost monitoring   |
| **CF Pages**  | Unlimited requests          | N/A               |
| **Bandwidth** | 10TB/month (R2 free egress) | Cost spike        |

### 8.2 Horizontal Scaling Strategy

```
                    PHASE 1 (Current)                    PHASE 2 (Growth)

    +-------------+                         +-------------+  +-------------+
    |   CF Pages  |                         |   CF Pages  |  |   CF Pages  |
    |  (Global)   |                         |  (Global)   |  |  (Global)   |
    +-------------+                         +-------------+  +-------------+
          |                                       |                |
          v                                       v                v
    +-------------+                         +----------------------------+
    |   Single    |                         |      Load Balancer         |
    | PocketBase  |                         |      (Cloudflare)          |
    |    VPS      |                         +----------------------------+
    +-------------+                               |                |
          |                                       v                v
          v                               +-------------+  +-------------+
    +-------------+                       | PocketBase  |  | PocketBase  |
    |   SQLite    |                       |   Node 1    |  |   Node 2    |
    +-------------+                       +-------------+  +-------------+
                                                |                |
                                                v                v
                                          +----------------------------+
                                          |   PostgreSQL (Replicated)  |
                                          +----------------------------+
```

### 8.3 Scaling Triggers & Actions

```typescript
const scalingPlaybook = {
  // Trigger: SQLite approaching limits
  databaseGrowth: {
    threshold: "500MB or 50K records",
    action: "Migrate to PostgreSQL",
    effort: "1-2 days",
    downtime: "30 minutes",
    steps: [
      "Set up PostgreSQL on managed service",
      "Export SQLite data",
      "Import to PostgreSQL",
      "Update PocketBase config",
      "Verify and switch",
    ],
  },

  // Trigger: High API load
  apiLoad: {
    threshold: "70% CPU sustained",
    action: "Add read replicas",
    effort: "2-3 days",
    downtime: "Zero (rolling)",
    steps: [
      "Set up second VPS",
      "Configure PocketBase replication",
      "Add load balancer",
      "Route read traffic",
    ],
  },

  // Trigger: Global latency issues
  latency: {
    threshold: ">500ms P95 from China",
    action: "Add regional nodes",
    effort: "1 week",
    downtime: "Zero",
    steps: [
      "Deploy PocketBase to China-adjacent region",
      "Configure geo-routing in Cloudflare",
      "Set up database replication",
      "Test failover",
    ],
  },
};
```

### 8.4 Caching Strategy

```
+-----------------------------------------------------------------------------------+
|                            CACHING LAYERS                                          |
|                                                                                    |
|  +-------------+     +-------------+     +-------------+     +-------------+      |
|  |  Browser    |     |  Cloudflare |     |  PocketBase |     |   SQLite    |      |
|  |  Cache      |     |  CDN Cache  |     |  In-Memory  |     |   (Source)  |      |
|  +-------------+     +-------------+     +-------------+     +-------------+      |
|       |                    |                   |                   |              |
|       v                    v                   v                   v              |
|  Static: 1 year      API: 1-5 min        Query: 100ms         N/A               |
|  HTML: 1 hour        HTML: 1 day         Results                                 |
|  API: no-cache       Binaries: 1 year                                            |
|                                                                                    |
+-----------------------------------------------------------------------------------+
```

**Cache Configuration:**

```typescript
// Cloudflare cache rules
const cacheRules = {
  // Static assets - aggressive caching
  "/assets/*": {
    edge: "1 year",
    browser: "1 year",
    staleWhileRevalidate: true,
  },

  // HTML pages - short cache with revalidation
  "/*.html": {
    edge: "1 day",
    browser: "1 hour",
    staleWhileRevalidate: true,
  },

  // API responses - minimal caching
  "/api/collections/plugins/records": {
    edge: "5 minutes",
    browser: "no-store",
    varyHeaders: ["Authorization"],
  },

  // Download binaries - long cache
  "/releases/*": {
    edge: "1 year",
    browser: "1 year",
    immutable: true,
  },
};
```

---

## 9. Failure Modes & Recovery

### 9.1 Failure Scenario Matrix

| Component          | Failure Mode   | Impact                              | Detection        | Recovery                          | RTO      |
| ------------------ | -------------- | ----------------------------------- | ---------------- | --------------------------------- | -------- |
| **CF Pages**       | Region outage  | Docs unavailable in region          | CF status page   | Automatic failover                | <1 min   |
| **PocketBase VPS** | Server crash   | API unavailable, no new submissions | Uptime Kuma      | Auto-restart, manual intervention | 5-15 min |
| **SQLite DB**      | Corruption     | Data loss risk                      | Integrity checks | Restore from backup               | 30 min   |
| **R2 Storage**     | Region outage  | Downloads unavailable               | CF status        | Automatic failover                | <1 min   |
| **GitHub OAuth**   | Service outage | Login unavailable                   | Auth failures    | Email fallback login              | N/A      |
| **DNS**            | CF outage      | Complete site down                  | External monitor | Manual DNS switch                 | 5-60 min |

### 9.2 Recovery Procedures

#### Procedure 1: PocketBase VPS Recovery

```bash
#!/bin/bash
# recovery-pocketbase.sh

# 1. Check service status
systemctl status pocketbase

# 2. If crashed, attempt restart
systemctl restart pocketbase

# 3. If restart fails, check logs
journalctl -u pocketbase -n 100

# 4. If DB corruption suspected
cd /pb_data
sqlite3 data.db "PRAGMA integrity_check;"

# 5. If corruption confirmed, restore from backup
# Download latest backup from R2
aws s3 cp s3://pocketbase-mirror/backups/latest/data.db.enc ./data.db.enc \
  --endpoint-url $R2_ENDPOINT

# Decrypt
openssl enc -aes-256-gcm -d -in data.db.enc -out data.db -pass env:BACKUP_KEY

# 6. Restart service
systemctl restart pocketbase

# 7. Verify
curl -I https://api.pocketbase.cn/api/health
```

#### Procedure 2: Full Site Recovery (Disaster)

```typescript
const disasterRecoveryPlan = {
  severity: "P0 - Complete Outage",

  steps: [
    {
      order: 1,
      action: "Activate status page",
      responsible: "On-call",
      time: "5 minutes",
      command: "Update status.pocketbase.cn",
    },
    {
      order: 2,
      action: "Assess damage scope",
      responsible: "On-call",
      time: "10 minutes",
      checklist: [
        "CF Pages status",
        "VPS accessibility",
        "R2 availability",
        "DNS resolution",
      ],
    },
    {
      order: 3,
      action: "Restore static site",
      responsible: "DevOps",
      time: "15 minutes",
      command: "Redeploy from GitHub main branch",
    },
    {
      order: 4,
      action: "Provision new VPS if needed",
      responsible: "DevOps",
      time: "30 minutes",
      steps: [
        "Create new VPS instance",
        "Run Ansible playbook",
        "Restore DB from R2 backup",
        "Update DNS",
      ],
    },
    {
      order: 5,
      action: "Verify all services",
      responsible: "QA",
      time: "15 minutes",
      checklist: [
        "Documentation loads",
        "API responds",
        "Login works",
        "Downloads work",
      ],
    },
    {
      order: 6,
      action: "Post-incident review",
      responsible: "Team",
      time: "24-48 hours",
      deliverables: ["RCA document", "Prevention measures"],
    },
  ],

  totalRTO: "1-2 hours",
  RPO: "24 hours (daily backups)",
};
```

### 9.3 Monitoring & Alerting

```typescript
// Uptime Kuma configuration
const monitors = [
  {
    name: "PocketBase.cn - Homepage",
    type: "http",
    url: "https://pocketbase.cn",
    interval: 60,
    retries: 3,
    alertChannels: ["telegram", "email"],
  },
  {
    name: "PocketBase API - Health",
    type: "http",
    url: "https://api.pocketbase.cn/api/health",
    interval: 30,
    retries: 2,
    alertChannels: ["telegram", "email", "pagerduty"],
  },
  {
    name: "R2 Downloads",
    type: "http",
    url: "https://dl.pocketbase.cn/releases/latest/checksums.txt",
    interval: 300,
    alertChannels: ["telegram"],
  },
  {
    name: "GitHub OAuth",
    type: "http",
    url: "https://github.com/login/oauth/authorize",
    interval: 300,
    alertChannels: ["email"],
  },
];

// Alert thresholds
const alerting = {
  responseTime: {
    warning: 500, // ms
    critical: 2000,
  },
  errorRate: {
    warning: 1, // %
    critical: 5,
  },
  availability: {
    warning: 99.5, // %
    critical: 99,
  },
};
```

### 9.4 Backup Strategy

```
+-----------------------------------------------------------------------------------+
|                            BACKUP ARCHITECTURE                                     |
|                                                                                    |
|  +-------------+     +-------------+     +-------------+     +-------------+      |
|  |   SQLite    | --> |   Daily     | --> |   R2        | --> |   Glacier   |      |
|  |   (Live)    |     |   Snapshot  |     |   (30 days) |     |   (1 year)  |      |
|  +-------------+     +-------------+     +-------------+     +-------------+      |
|                                                                                    |
|  Schedule:                                                                         |
|  - Full backup: Daily at 03:00 UTC                                                |
|  - Incremental: Every 6 hours                                                     |
|  - Retention: 30 days hot, 1 year cold                                            |
|  - Encryption: AES-256-GCM with rotated keys                                      |
|                                                                                    |
+-----------------------------------------------------------------------------------+
```

**Backup Verification:**

```typescript
// Weekly backup verification job
async function verifyBackup() {
  const latestBackup = await r2Storage.getLatestBackup();

  // Download to temp location
  const tempPath = `/tmp/backup-verify-${Date.now()}`;
  await downloadAndDecrypt(latestBackup, tempPath);

  // Verify integrity
  const integrity = await exec(
    `sqlite3 ${tempPath}/data.db "PRAGMA integrity_check;"`,
  );
  if (integrity.stdout.trim() !== "ok") {
    await alerting.send("critical", "Backup integrity check failed");
    return false;
  }

  // Verify record counts
  const counts = await exec(
    `sqlite3 ${tempPath}/data.db "SELECT COUNT(*) FROM users;"`,
  );
  const liveCount = await pb
    .collection("users")
    .getList(1, 1)
    .then((r) => r.totalItems);

  if (Math.abs(counts - liveCount) > 10) {
    await alerting.send(
      "warning",
      `Backup record count mismatch: ${counts} vs ${liveCount}`,
    );
  }

  // Cleanup
  await fs.rm(tempPath, { recursive: true });

  return true;
}
```

---

## Appendix A: Environment Variables

```bash
# .env.example (DO NOT commit actual values)

# PocketBase
POCKETBASE_URL=https://api.pocketbase.cn
POCKETBASE_ADMIN_EMAIL=
POCKETBASE_ADMIN_PASSWORD=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Cloudflare R2
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=pocketbase-mirror
R2_PUBLIC_URL=https://dl.pocketbase.cn

# Email (Resend)
RESEND_API_KEY=

# Backup
BACKUP_KEY=  # 32-byte hex for AES-256

# Monitoring
UPTIME_KUMA_URL=
SENTRY_DSN=
```

---

## Appendix B: API Endpoints Reference

| Endpoint                                  | Method | Auth     | Rate Limit | Description   |
| ----------------------------------------- | ------ | -------- | ---------- | ------------- |
| `/api/collections/plugins/records`        | GET    | Optional | 50/min     | List plugins  |
| `/api/collections/plugins/records/:id`    | GET    | Optional | 100/min    | Get plugin    |
| `/api/collections/plugins/records`        | POST   | Required | 10/hour    | Submit plugin |
| `/api/collections/cases/records`          | GET    | Optional | 50/min     | List cases    |
| `/api/collections/cases/records/:id`      | GET    | Optional | 100/min    | Get case      |
| `/api/collections/cases/records`          | POST   | Required | 5/hour     | Submit case   |
| `/api/collections/users/auth-with-oauth2` | POST   | -        | 5/15min    | OAuth login   |
| `/api/health`                             | GET    | -        | 1000/min   | Health check  |

---

## Appendix C: Deployment Checklist

- [ ] Domain DNS configured in Cloudflare
- [ ] SSL certificates provisioned (automatic)
- [ ] PocketBase VPS provisioned and configured
- [ ] R2 bucket created with public access
- [ ] GitHub OAuth app registered
- [ ] Environment variables set in all environments
- [ ] Backup job scheduled and verified
- [ ] Monitoring configured and alerting tested
- [ ] Rate limiting rules deployed
- [ ] Security headers verified
- [ ] Load testing completed
- [ ] Rollback procedure documented and tested

---

_Document generated: 2025-12-30_
_Architecture version: 1.0.0_
_Review cycle: Quarterly_
