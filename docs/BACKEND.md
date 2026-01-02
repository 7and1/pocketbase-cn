# PocketBase.cn Backend API Documentation

> Production-grade backend architecture for PocketBase.cn plugin ecosystem platform.

## Table of Contents

1. [PocketBase Setup](#1-pocketbase-setup)
2. [Custom Hooks](#2-custom-hooks)
3. [API Endpoints](#3-api-endpoints)
4. [File Storage](#4-file-storage)
5. [Authentication](#5-authentication)
6. [Rate Limiting](#6-rate-limiting)
7. [Backup & Recovery](#7-backup--recovery)
8. [Monitoring](#8-monitoring)

---

## 1. PocketBase Setup

### 1.1 Installation

```bash
# Download PocketBase (v0.23+)
wget https://github.com/pocketbase/pocketbase/releases/download/v0.23.4/pocketbase_0.23.4_linux_amd64.zip
unzip pocketbase_0.23.4_linux_amd64.zip

# Or build from source with custom hooks
git clone https://github.com/pocketbase/pocketbase.git
cd pocketbase
go build -o pocketbase ./examples/base
```

### 1.2 Environment Variables

```bash
# .env (DO NOT COMMIT)
# ===================================

# PocketBase Core
PB_ADMIN_EMAIL=admin@pocketbase.cn
PB_ADMIN_PASSWORD=<secure-password>
PB_ENCRYPTION_KEY=<32-byte-hex-key>

# GitHub OAuth
GITHUB_CLIENT_ID=<github-oauth-app-id>
GITHUB_CLIENT_SECRET=<github-oauth-app-secret>
GITHUB_REDIRECT_URL=https://pocketbase.cn/api/oauth2-redirect

# Cloudflare R2
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_BUCKET_NAME=pocketbase-cn
R2_PUBLIC_URL=https://cdn.pocketbase.cn

# Litestream
LITESTREAM_ACCESS_KEY_ID=<r2-access-key>
LITESTREAM_SECRET_ACCESS_KEY=<r2-secret-key>
LITESTREAM_REPLICA_URL=s3://pocketbase-cn-backup/db

# Monitoring
ALERT_WEBHOOK_URL=<slack-or-discord-webhook>
LOG_LEVEL=info
```

### 1.3 Directory Structure

```
pocketbase.cn/
├── pb_data/                    # SQLite database & local storage
│   ├── data.db                 # Main database
│   ├── data.db-shm             # SQLite shared memory
│   ├── data.db-wal             # Write-ahead log
│   ├── logs.db                 # Request logs database
│   └── storage/                # File uploads (local fallback)
├── pb_hooks/                   # JavaScript hooks (JSVM)
│   ├── readme_fetcher.pb.js    # Auto-fetch plugin README
│   ├── download_tracker.pb.js  # Async download statistics
│   ├── review_notifier.pb.js   # Case review notifications
│   ├── rate_limiter.pb.js      # Custom rate limiting
│   └── webhooks.pb.js          # Webhook handlers
├── pb_migrations/              # Schema migrations
│   ├── 1704067200_init.js      # Initial schema
│   └── 1704153600_indexes.js   # Performance indexes
├── pb_public/                  # Static files (optional)
├── litestream.yml              # Backup configuration
├── Dockerfile                  # Container build
├── docker-compose.yml          # Local development
└── .env                        # Environment variables
```

### 1.4 Database Schema

```javascript
// pb_migrations/1704067200_init.js
migrate(
  (db) => {
    // Users (extends _pb_users_auth_)
    const users = new Collection({
      name: "users",
      type: "auth",
      schema: [
        { name: "github_id", type: "text", required: true, unique: true },
        { name: "github_username", type: "text", required: true },
        { name: "avatar_url", type: "url" },
        { name: "bio", type: "text", max: 500 },
        {
          name: "role",
          type: "select",
          options: { values: ["user", "developer", "admin"] },
          default: "user",
        },
        { name: "is_verified", type: "bool", default: false },
      ],
      indexes: ["CREATE INDEX idx_users_github ON users(github_id)"],
    });

    // Plugins
    const plugins = new Collection({
      name: "plugins",
      type: "base",
      schema: [
        { name: "name", type: "text", required: true, min: 2, max: 100 },
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
          pattern: "^[a-z0-9-]+$",
        },
        { name: "description", type: "text", required: true, max: 500 },
        { name: "readme", type: "text" }, // Markdown content
        { name: "github_url", type: "url", required: true },
        { name: "homepage_url", type: "url" },
        {
          name: "author",
          type: "relation",
          collection: "users",
          required: true,
        },
        {
          name: "category",
          type: "select",
          options: {
            values: ["auth", "storage", "ui", "api", "tool", "other"],
          },
        },
        { name: "tags", type: "json" }, // ["tag1", "tag2"]
        { name: "version", type: "text", pattern: "^\\d+\\.\\d+\\.\\d+$" },
        { name: "downloads", type: "number", default: 0 },
        { name: "stars", type: "number", default: 0 },
        {
          name: "status",
          type: "select",
          options: { values: ["pending", "approved", "rejected"] },
          default: "pending",
        },
        { name: "is_featured", type: "bool", default: false },
      ],
      indexes: [
        "CREATE INDEX idx_plugins_slug ON plugins(slug)",
        "CREATE INDEX idx_plugins_status ON plugins(status)",
        "CREATE INDEX idx_plugins_category ON plugins(category)",
        "CREATE INDEX idx_plugins_downloads ON plugins(downloads DESC)",
      ],
    });

    // Cases (Showcases)
    const cases = new Collection({
      name: "cases",
      type: "base",
      schema: [
        { name: "title", type: "text", required: true, max: 200 },
        { name: "slug", type: "text", required: true, unique: true },
        { name: "description", type: "text", required: true, max: 1000 },
        { name: "content", type: "text" }, // Full Markdown article
        { name: "url", type: "url", required: true },
        { name: "thumbnail", type: "file", max: 5242880 }, // 5MB
        { name: "screenshots", type: "file", max: 10485760, maxSelect: 5 },
        {
          name: "author",
          type: "relation",
          collection: "users",
          required: true,
        },
        {
          name: "plugins_used",
          type: "relation",
          collection: "plugins",
          maxSelect: 10,
        },
        { name: "tech_stack", type: "json" }, // ["Next.js", "Tailwind"]
        {
          name: "status",
          type: "select",
          options: { values: ["pending", "approved", "rejected"] },
          default: "pending",
        },
        { name: "is_featured", type: "bool", default: false },
        { name: "views", type: "number", default: 0 },
      ],
      indexes: [
        "CREATE INDEX idx_cases_slug ON cases(slug)",
        "CREATE INDEX idx_cases_status ON cases(status)",
      ],
    });

    // Download Logs (for async processing)
    const downloadLogs = new Collection({
      name: "download_logs",
      type: "base",
      schema: [
        {
          name: "plugin",
          type: "relation",
          collection: "plugins",
          required: true,
        },
        { name: "ip_hash", type: "text" }, // Hashed IP for uniqueness
        { name: "user_agent", type: "text" },
        { name: "referer", type: "text" },
        { name: "country", type: "text" },
      ],
    });

    // Rate Limit Records
    const rateLimits = new Collection({
      name: "rate_limits",
      type: "base",
      schema: [
        { name: "key", type: "text", required: true }, // IP or token
        { name: "endpoint", type: "text", required: true },
        { name: "count", type: "number", default: 0 },
        { name: "window_start", type: "date", required: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_rate_key_endpoint ON rate_limits(key, endpoint)",
      ],
    });

    return Dao(db).saveCollection(users);
  },
  (db) => {
    // Rollback
  },
);
```

---

## 2. Custom Hooks

### 2.1 Plugin README Auto-Fetcher

```javascript
// pb_hooks/readme_fetcher.pb.js

/**
 * Automatically fetches README.md from GitHub when a plugin is created or updated.
 * Runs asynchronously to avoid blocking the main request.
 */

onRecordAfterCreateRequest((e) => {
  const record = e.record;
  const githubUrl = record.get("github_url");

  if (!githubUrl) return;

  // Extract owner/repo from GitHub URL
  const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return;

  const [, owner, repo] = match;
  const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`;

  // Async fetch (non-blocking)
  $app.dao().runInTransaction((txDao) => {
    try {
      const response = $http.send({
        url: readmeUrl,
        method: "GET",
        timeout: 10, // 10 seconds
      });

      if (response.statusCode === 200) {
        record.set("readme", response.raw);
        txDao.saveRecord(record);

        console.log(`[README] Fetched for plugin: ${record.get("slug")}`);
      } else {
        // Try alternate paths
        const altUrls = [
          `https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`,
          `https://raw.githubusercontent.com/${owner}/${repo}/main/readme.md`,
        ];

        for (const altUrl of altUrls) {
          const altResponse = $http.send({
            url: altUrl,
            method: "GET",
            timeout: 10,
          });
          if (altResponse.statusCode === 200) {
            record.set("readme", altResponse.raw);
            txDao.saveRecord(record);
            console.log(
              `[README] Fetched from alternate path for: ${record.get("slug")}`,
            );
            break;
          }
        }
      }
    } catch (err) {
      console.error(
        `[README] Failed to fetch for ${record.get("slug")}: ${err}`,
      );
    }
  });
}, "plugins");

// Scheduled refresh (run daily via cron)
cronAdd("readme_refresh", "0 3 * * *", () => {
  const plugins = $app.dao().findRecordsByFilter(
    "plugins",
    "status = 'approved' && github_url != ''",
    "-updated",
    100, // Batch size
    0,
  );

  for (const plugin of plugins) {
    // Trigger update to refresh README
    const githubUrl = plugin.get("github_url");
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) continue;

    const [, owner, repo] = match;
    const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`;

    try {
      const response = $http.send({
        url: readmeUrl,
        method: "GET",
        timeout: 10,
      });
      if (
        response.statusCode === 200 &&
        response.raw !== plugin.get("readme")
      ) {
        plugin.set("readme", response.raw);
        $app.dao().saveRecord(plugin);
        console.log(`[README] Refreshed: ${plugin.get("slug")}`);
      }
    } catch (err) {
      // Silent fail for batch processing
    }
  }
});
```

### 2.2 Download Statistics Tracker

```javascript
// pb_hooks/download_tracker.pb.js

/**
 * Tracks plugin downloads asynchronously.
 * Uses IP hashing for privacy and deduplication.
 */

const crypto = require("crypto");

// Hash IP for privacy
function hashIP(ip, salt) {
  return crypto
    .createHash("sha256")
    .update(ip + salt)
    .digest("hex")
    .substring(0, 16);
}

// Custom route for download tracking
routerAdd("POST", "/api/plugins/:slug/download", (c) => {
  const slug = c.pathParam("slug");
  const ip = c.realIP();
  const userAgent = c.request().header.get("User-Agent") || "";
  const referer = c.request().header.get("Referer") || "";

  // Find plugin
  const plugin = $app.dao().findFirstRecordByData("plugins", "slug", slug);
  if (!plugin) {
    return c.json(404, {
      error: { code: "NOT_FOUND", message: "Plugin not found" },
    });
  }

  // Hash IP with daily salt for deduplication
  const today = new Date().toISOString().split("T")[0];
  const ipHash = hashIP(ip, today + slug);

  // Check for duplicate (same IP + plugin within 24h)
  const existing = $app
    .dao()
    .findFirstRecordByFilter(
      "download_logs",
      `plugin = '${plugin.id}' && ip_hash = '${ipHash}' && created > @todayStart`,
      { todayStart: today + "T00:00:00Z" },
    );

  if (existing) {
    return c.json(200, {
      data: { counted: false, message: "Already counted today" },
    });
  }

  // Async: Create download log and increment counter
  $app.dao().runInTransaction((txDao) => {
    // Create log entry
    const logCollection = $app.dao().findCollectionByNameOrId("download_logs");
    const logRecord = new Record(logCollection);
    logRecord.set("plugin", plugin.id);
    logRecord.set("ip_hash", ipHash);
    logRecord.set("user_agent", userAgent.substring(0, 500));
    logRecord.set("referer", referer.substring(0, 500));
    txDao.saveRecord(logRecord);

    // Increment download counter
    plugin.set("downloads", plugin.get("downloads") + 1);
    txDao.saveRecord(plugin);
  });

  return c.json(200, {
    data: { counted: true, total: plugin.get("downloads") + 1 },
  });
});

// Batch aggregation (run hourly to sync counts)
cronAdd("download_sync", "0 * * * *", () => {
  const query = `
    SELECT plugin, COUNT(*) as count
    FROM download_logs
    WHERE created > datetime('now', '-1 hour')
    GROUP BY plugin
  `;

  const results = $app.dao().db().newQuery(query).all();

  for (const row of results) {
    const plugin = $app.dao().findRecordById("plugins", row.plugin);
    if (plugin) {
      // Recalculate total from logs for accuracy
      const totalQuery = `SELECT COUNT(*) as total FROM download_logs WHERE plugin = '${plugin.id}'`;
      const total = $app.dao().db().newQuery(totalQuery).one();
      plugin.set("downloads", total.total);
      $app.dao().saveRecord(plugin);
    }
  }
});
```

### 2.3 Case Review Notification

```javascript
// pb_hooks/review_notifier.pb.js

/**
 * Sends notifications when case review status changes.
 * Integrates with Discord/Slack webhooks.
 */

onRecordAfterUpdateRequest((e) => {
  const record = e.record;
  const original = e.httpContext.get("original");

  // Check if status changed
  const oldStatus = original?.get("status");
  const newStatus = record.get("status");

  if (oldStatus === newStatus) return;

  const authorId = record.get("author");
  const author = $app.dao().findRecordById("users", authorId);
  const caseTitle = record.get("title");

  // Notify via webhook (async)
  const webhookUrl = $os.getenv("ALERT_WEBHOOK_URL");
  if (!webhookUrl) return;

  let message = "";
  let color = 0x808080; // Gray default

  switch (newStatus) {
    case "approved":
      message = `Case "${caseTitle}" has been approved and is now live!`;
      color = 0x00ff00; // Green
      break;
    case "rejected":
      message = `Case "${caseTitle}" was not approved. Please review the guidelines.`;
      color = 0xff0000; // Red
      break;
    case "pending":
      message = `Case "${caseTitle}" is under review.`;
      color = 0xffff00; // Yellow
      break;
  }

  // Discord webhook format
  const payload = {
    embeds: [
      {
        title: "Case Review Update",
        description: message,
        color: color,
        fields: [
          {
            name: "Author",
            value: author?.get("github_username") || "Unknown",
            inline: true,
          },
          { name: "Status", value: newStatus.toUpperCase(), inline: true },
          {
            name: "URL",
            value: `https://pocketbase.cn/cases/${record.get("slug")}`,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    $http.send({
      url: webhookUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      timeout: 5,
    });
    console.log(
      `[NOTIFY] Sent review notification for case: ${record.get("slug")}`,
    );
  } catch (err) {
    console.error(`[NOTIFY] Failed to send notification: ${err}`);
  }

  // Also send email to author (if implemented)
  // $app.newMailClient().send(...)
}, "cases");

// Admin notification for new submissions
onRecordAfterCreateRequest((e) => {
  const record = e.record;
  const webhookUrl = $os.getenv("ALERT_WEBHOOK_URL");

  if (!webhookUrl) return;

  const authorId = record.get("author");
  const author = $app.dao().findRecordById("users", authorId);

  const payload = {
    embeds: [
      {
        title: "New Case Submission",
        description: `A new case "${record.get("title")}" has been submitted for review.`,
        color: 0x0099ff, // Blue
        fields: [
          {
            name: "Author",
            value: author?.get("github_username") || "Unknown",
            inline: true,
          },
          { name: "URL", value: record.get("url"), inline: false },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    $http.send({
      url: webhookUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      timeout: 5,
    });
  } catch (err) {
    console.error(
      `[NOTIFY] Failed to send new submission notification: ${err}`,
    );
  }
}, "cases");
```

---

## 3. API Endpoints

### 3.1 Standard CRUD (Auto-generated by PocketBase)

PocketBase automatically generates RESTful endpoints for all collections:

| Method   | Endpoint                                     | Description                  |
| -------- | -------------------------------------------- | ---------------------------- |
| `GET`    | `/api/collections/{collection}/records`      | List records with pagination |
| `GET`    | `/api/collections/{collection}/records/{id}` | Get single record            |
| `POST`   | `/api/collections/{collection}/records`      | Create record                |
| `PATCH`  | `/api/collections/{collection}/records/{id}` | Update record                |
| `DELETE` | `/api/collections/{collection}/records/{id}` | Delete record                |

#### Query Parameters

```
# Pagination
?page=1&perPage=20

# Sorting
?sort=-created,name    # Descending by created, ascending by name

# Filtering
?filter=(status='approved' && category='auth')

# Field expansion (relations)
?expand=author,plugins_used

# Field selection
?fields=id,name,description
```

### 3.2 Custom Routes

```javascript
// pb_hooks/custom_routes.pb.js

/**
 * Custom API endpoints beyond standard CRUD.
 */

// GET /api/plugins/featured - Featured plugins
routerAdd("GET", "/api/plugins/featured", (c) => {
  const plugins = $app
    .dao()
    .findRecordsByFilter(
      "plugins",
      "status = 'approved' && is_featured = true",
      "-downloads",
      10,
      0,
    );

  const result = plugins.map((p) => ({
    id: p.id,
    name: p.get("name"),
    slug: p.get("slug"),
    description: p.get("description"),
    downloads: p.get("downloads"),
    category: p.get("category"),
  }));

  return c.json(200, { data: result, meta: { total: result.length } });
});

// GET /api/plugins/trending - Trending by recent downloads
routerAdd("GET", "/api/plugins/trending", (c) => {
  const days = parseInt(c.queryParam("days")) || 7;
  const limit = Math.min(parseInt(c.queryParam("limit")) || 10, 50);

  const query = `
    SELECT p.*, COUNT(d.id) as recent_downloads
    FROM plugins p
    LEFT JOIN download_logs d ON d.plugin = p.id
      AND d.created > datetime('now', '-${days} days')
    WHERE p.status = 'approved'
    GROUP BY p.id
    ORDER BY recent_downloads DESC
    LIMIT ${limit}
  `;

  const results = $app.dao().db().newQuery(query).all();

  return c.json(200, {
    data: results,
    meta: { days, limit },
  });
});

// GET /api/search - Global search
routerAdd("GET", "/api/search", (c) => {
  const q = c.queryParam("q");
  const type = c.queryParam("type") || "all"; // all, plugins, cases
  const limit = Math.min(parseInt(c.queryParam("limit")) || 20, 100);

  if (!q || q.length < 2) {
    return c.json(400, {
      error: {
        code: "INVALID_QUERY",
        message: "Query must be at least 2 characters",
      },
    });
  }

  const results = { plugins: [], cases: [] };
  const searchTerm = `%${q.toLowerCase()}%`;

  if (type === "all" || type === "plugins") {
    results.plugins = $app
      .dao()
      .findRecordsByFilter(
        "plugins",
        `status = 'approved' && (name ~ '${searchTerm}' || description ~ '${searchTerm}')`,
        "-downloads",
        limit,
        0,
      );
  }

  if (type === "all" || type === "cases") {
    results.cases = $app
      .dao()
      .findRecordsByFilter(
        "cases",
        `status = 'approved' && (title ~ '${searchTerm}' || description ~ '${searchTerm}')`,
        "-views",
        limit,
        0,
      );
  }

  return c.json(200, { data: results });
});

// POST /api/plugins/:slug/star - Star a plugin
routerAdd(
  "POST",
  "/api/plugins/:slug/star",
  (c) => {
    const authRecord = c.get("authRecord");
    if (!authRecord) {
      return c.json(401, {
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    const slug = c.pathParam("slug");
    const plugin = $app.dao().findFirstRecordByData("plugins", "slug", slug);

    if (!plugin) {
      return c.json(404, {
        error: { code: "NOT_FOUND", message: "Plugin not found" },
      });
    }

    // Check existing star (would need a stars collection)
    // Implementation depends on star tracking strategy

    plugin.set("stars", plugin.get("stars") + 1);
    $app.dao().saveRecord(plugin);

    return c.json(200, { data: { stars: plugin.get("stars") } });
  },
  $apis.requireRecordAuth(),
);

// GET /api/stats - Platform statistics
routerAdd("GET", "/api/stats", (c) => {
  const pluginCount = $app
    .dao()
    .findRecordsByFilter("plugins", "status = 'approved'", "", 0, 0).length;
  const caseCount = $app
    .dao()
    .findRecordsByFilter("cases", "status = 'approved'", "", 0, 0).length;
  const userCount = $app
    .dao()
    .findRecordsByFilter("users", "", "", 0, 0).length;

  const downloadQuery = "SELECT SUM(downloads) as total FROM plugins";
  const totalDownloads =
    $app.dao().db().newQuery(downloadQuery).one()?.total || 0;

  return c.json(200, {
    data: {
      plugins: pluginCount,
      cases: caseCount,
      users: userCount,
      downloads: totalDownloads,
    },
  });
});
```

### 3.3 Webhook Receivers

```javascript
// pb_hooks/webhooks.pb.js

/**
 * Webhook endpoints for external integrations.
 */

// GitHub webhook for release notifications
routerAdd("POST", "/api/webhooks/github", (c) => {
  const signature = c.request().header.get("X-Hub-Signature-256");
  const event = c.request().header.get("X-GitHub-Event");
  const body = readerToString(c.request().body);

  // Verify signature
  const secret = $os.getenv("GITHUB_WEBHOOK_SECRET");
  if (secret) {
    const expectedSig =
      "sha256=" +
      crypto.createHmac("sha256", secret).update(body).digest("hex");
    if (signature !== expectedSig) {
      return c.json(401, {
        error: {
          code: "INVALID_SIGNATURE",
          message: "Webhook signature mismatch",
        },
      });
    }
  }

  const payload = JSON.parse(body);

  switch (event) {
    case "release":
      handleGitHubRelease(payload);
      break;
    case "push":
      handleGitHubPush(payload);
      break;
    default:
      console.log(`[WEBHOOK] Unhandled GitHub event: ${event}`);
  }

  return c.json(200, { data: { received: true } });
});

function handleGitHubRelease(payload) {
  if (payload.action !== "published") return;

  const repoUrl = payload.repository.html_url;
  const version = payload.release.tag_name.replace(/^v/, "");

  // Find plugin by GitHub URL
  const plugin = $app
    .dao()
    .findFirstRecordByFilter("plugins", `github_url ~ '${repoUrl}'`);

  if (plugin) {
    plugin.set("version", version);
    $app.dao().saveRecord(plugin);
    console.log(
      `[WEBHOOK] Updated plugin ${plugin.get("slug")} to version ${version}`,
    );
  }
}

function handleGitHubPush(payload) {
  if (payload.ref !== "refs/heads/main" && payload.ref !== "refs/heads/master")
    return;

  const repoUrl = payload.repository.html_url;

  // Trigger README refresh for matching plugin
  const plugin = $app
    .dao()
    .findFirstRecordByFilter("plugins", `github_url ~ '${repoUrl}'`);

  if (plugin) {
    // Queue README refresh (implementation in readme_fetcher.pb.js)
    console.log(`[WEBHOOK] Queued README refresh for: ${plugin.get("slug")}`);
  }
}
```

---

## 4. File Storage

### 4.1 Cloudflare R2 Configuration

```javascript
// pb_hooks/storage.pb.js (or configure in Admin UI)

/**
 * Configure S3-compatible storage with Cloudflare R2.
 */

// In Admin UI > Settings > Files storage:
// - Provider: S3
// - Endpoint: https://<account-id>.r2.cloudflarestorage.com
// - Bucket: pocketbase-cn
// - Region: auto
// - Access Key: <R2_ACCESS_KEY_ID>
// - Secret: <R2_SECRET_ACCESS_KEY>
// - Force Path Style: true

// Programmatic configuration (alternative)
onBeforeServe((e) => {
  const s3Config = {
    enabled: true,
    endpoint: `https://${$os.getenv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    bucket: $os.getenv("R2_BUCKET_NAME"),
    region: "auto",
    accessKey: $os.getenv("R2_ACCESS_KEY_ID"),
    secret: $os.getenv("R2_SECRET_ACCESS_KEY"),
    forcePathStyle: true,
  };

  $app.settings().s3 = s3Config;
});
```

### 4.2 Upload Limits & Validation

```javascript
// pb_hooks/upload_validation.pb.js

/**
 * File upload validation and processing.
 */

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_SCREENSHOTS = 5;

onRecordBeforeCreateRequest((e) => {
  validateUploads(e);
}, "cases");

onRecordBeforeUpdateRequest((e) => {
  validateUploads(e);
}, "cases");

function validateUploads(e) {
  const record = e.record;

  // Validate thumbnail
  const thumbnail = record.get("thumbnail");
  if (thumbnail) {
    const file = e.uploadedFiles["thumbnail"]?.[0];
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.header["Content-Type"])) {
        throw new BadRequestError("Thumbnail must be JPEG, PNG, WebP, or GIF");
      }
      if (file.size > MAX_IMAGE_SIZE) {
        throw new BadRequestError("Thumbnail must be under 5MB");
      }
    }
  }

  // Validate screenshots
  const screenshots = e.uploadedFiles["screenshots"] || [];
  if (screenshots.length > MAX_SCREENSHOTS) {
    throw new BadRequestError(`Maximum ${MAX_SCREENSHOTS} screenshots allowed`);
  }

  for (const file of screenshots) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.header["Content-Type"])) {
      throw new BadRequestError("Screenshots must be JPEG, PNG, WebP, or GIF");
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestError("Each screenshot must be under 5MB");
    }
  }
}

// Image optimization hook (optional - requires external service)
onRecordAfterCreateRequest((e) => {
  // Could integrate with Cloudflare Images for optimization
  // or implement server-side resizing
}, "cases");
```

### 4.3 CDN Integration

```nginx
# Cloudflare Configuration (via Dashboard or API)

# Custom domain: cdn.pocketbase.cn
# SSL: Full (strict)
# Cache: Standard (respect origin headers)

# Page Rules:
# cdn.pocketbase.cn/* -> Cache Level: Cache Everything, Edge TTL: 1 month

# Transform Rules (optional - for image optimization):
# Match: ends_with(http.request.uri.path, ".jpg") or ends_with(http.request.uri.path, ".png")
# Polish: Lossy
# WebP: On
```

```javascript
// pb_hooks/cdn_urls.pb.js

/**
 * Transform file URLs to use CDN.
 */

const CDN_URL = $os.getenv("R2_PUBLIC_URL") || "https://cdn.pocketbase.cn";

// Add custom helper for CDN URLs
routerAdd("GET", "/api/cdn/url", (c) => {
  const collection = c.queryParam("collection");
  const recordId = c.queryParam("record");
  const filename = c.queryParam("filename");

  if (!collection || !recordId || !filename) {
    return c.json(400, {
      error: {
        code: "MISSING_PARAMS",
        message: "collection, record, and filename required",
      },
    });
  }

  const url = `${CDN_URL}/${collection}/${recordId}/${filename}`;

  return c.json(200, { data: { url } });
});
```

---

## 5. Authentication

### 5.1 GitHub OAuth Configuration

```javascript
// pb_hooks/auth.pb.js

/**
 * GitHub OAuth setup and user profile sync.
 */

// Configure in Admin UI > Settings > Auth providers > GitHub:
// - Client ID: <GITHUB_CLIENT_ID>
// - Client Secret: <GITHUB_CLIENT_SECRET>
// - Redirect URL: https://pocketbase.cn/api/oauth2-redirect

// Or programmatically:
onBeforeServe((e) => {
  const settings = $app.settings();

  settings.githubAuth = {
    enabled: true,
    clientId: $os.getenv("GITHUB_CLIENT_ID"),
    clientSecret: $os.getenv("GITHUB_CLIENT_SECRET"),
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userApiUrl: "https://api.github.com/user",
  };
});

// Sync GitHub profile data on OAuth
onRecordAuthRequest((e) => {
  if (e.providerName !== "github") return;

  const record = e.record;
  const meta = e.oAuth2User;

  // Sync GitHub data
  record.set("github_id", meta.id);
  record.set("github_username", meta.username);
  record.set("avatar_url", meta.avatarUrl);

  // Fetch additional data from GitHub API
  try {
    const response = $http.send({
      url: `https://api.github.com/users/${meta.username}`,
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "PocketBase.cn",
      },
    });

    if (response.statusCode === 200) {
      const ghUser = JSON.parse(response.raw);
      record.set("bio", ghUser.bio?.substring(0, 500) || "");
    }
  } catch (err) {
    console.error(`[AUTH] Failed to fetch GitHub profile: ${err}`);
  }

  $app.dao().saveRecord(record);
}, "users");
```

### 5.2 Token Management

```javascript
// pb_hooks/token_management.pb.js

/**
 * Custom token handling and API key support.
 */

// JWT Token settings (Admin UI > Settings > Auth):
// - Token Duration: 604800 (7 days)
// - Min Password Length: 8

// Custom API keys for automation
const apiKeys = new Collection({
  name: "api_keys",
  type: "base",
  schema: [
    { name: "user", type: "relation", collection: "users", required: true },
    { name: "name", type: "text", required: true },
    { name: "key_hash", type: "text", required: true }, // Hashed key
    { name: "permissions", type: "json" }, // ["read:plugins", "write:plugins"]
    { name: "last_used", type: "date" },
    { name: "expires_at", type: "date" },
    { name: "is_active", type: "bool", default: true },
  ],
});

// Generate API key
routerAdd(
  "POST",
  "/api/keys/generate",
  (c) => {
    const authRecord = c.get("authRecord");
    if (!authRecord) {
      return c.json(401, {
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    const body = $apis.requestInfo(c).data;
    const name = body.name;
    const permissions = body.permissions || ["read:plugins", "read:cases"];
    const expiresInDays = body.expires_in_days || 365;

    // Generate secure key
    const key = crypto.randomBytes(32).toString("hex");
    const keyHash = crypto.createHash("sha256").update(key).digest("hex");

    const collection = $app.dao().findCollectionByNameOrId("api_keys");
    const record = new Record(collection);
    record.set("user", authRecord.id);
    record.set("name", name);
    record.set("key_hash", keyHash);
    record.set("permissions", permissions);
    record.set(
      "expires_at",
      new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
    );

    $app.dao().saveRecord(record);

    // Return key only once (cannot be retrieved later)
    return c.json(201, {
      data: {
        id: record.id,
        key: `pb_${key}`, // Prefix for identification
        name: name,
        expires_at: record.get("expires_at"),
      },
    });
  },
  $apis.requireRecordAuth(),
);

// Middleware to validate API keys
routerUse((next) => {
  return (c) => {
    const authHeader = c.request().header.get("Authorization");

    if (authHeader && authHeader.startsWith("Bearer pb_")) {
      const key = authHeader.replace("Bearer pb_", "");
      const keyHash = crypto.createHash("sha256").update(key).digest("hex");

      const apiKey = $app
        .dao()
        .findFirstRecordByFilter(
          "api_keys",
          `key_hash = '${keyHash}' && is_active = true && (expires_at = '' || expires_at > @now)`,
        );

      if (apiKey) {
        const user = $app.dao().findRecordById("users", apiKey.get("user"));
        c.set("authRecord", user);
        c.set("apiKeyRecord", apiKey);

        // Update last used
        apiKey.set("last_used", new Date());
        $app.dao().saveRecord(apiKey);
      }
    }

    return next(c);
  };
});
```

### 5.3 Session Strategy

```javascript
// pb_hooks/session.pb.js

/**
 * Session management and security policies.
 */

// Session configuration
const SESSION_CONFIG = {
  tokenDuration: 7 * 24 * 60 * 60, // 7 days
  refreshThreshold: 24 * 60 * 60, // Refresh if < 1 day remaining
  maxActiveSessions: 5,
};

// Track active sessions
const sessions = new Collection({
  name: "sessions",
  type: "base",
  schema: [
    { name: "user", type: "relation", collection: "users", required: true },
    { name: "token_hash", type: "text", required: true },
    { name: "device_info", type: "text" },
    { name: "ip_address", type: "text" },
    { name: "last_active", type: "date" },
    { name: "expires_at", type: "date", required: true },
  ],
});

// Clean up expired sessions (daily)
cronAdd("session_cleanup", "0 4 * * *", () => {
  const query = "DELETE FROM sessions WHERE expires_at < datetime('now')";
  $app.dao().db().newQuery(query).execute();
  console.log("[SESSION] Cleaned up expired sessions");
});

// Limit concurrent sessions
onRecordAuthRequest((e) => {
  const userId = e.record.id;

  // Get active sessions
  const activeSessions = $app
    .dao()
    .findRecordsByFilter(
      "sessions",
      `user = '${userId}' && expires_at > @now`,
      "-last_active",
      100,
      0,
    );

  // Remove oldest sessions if over limit
  if (activeSessions.length >= SESSION_CONFIG.maxActiveSessions) {
    const toRemove = activeSessions.slice(SESSION_CONFIG.maxActiveSessions - 1);
    for (const session of toRemove) {
      $app.dao().deleteRecord(session);
    }
  }
}, "users");
```

---

## 6. Rate Limiting

### 6.1 IP-Based Rate Limiting

```javascript
// pb_hooks/rate_limiter.pb.js

/**
 * Multi-tier rate limiting system.
 */

const RATE_LIMITS = {
  // Anonymous users (by IP)
  anonymous: {
    "GET:/api/collections/plugins/records": { window: 60, max: 60 }, // 60/min
    "GET:/api/collections/cases/records": { window: 60, max: 60 }, // 60/min
    "GET:/api/search": { window: 60, max: 30 }, // 30/min
    "POST:/api/plugins/*/download": { window: 60, max: 10 }, // 10/min
    default: { window: 60, max: 30 }, // 30/min default
  },
  // Authenticated users (by token)
  authenticated: {
    "GET:/api/collections/plugins/records": { window: 60, max: 120 }, // 120/min
    "GET:/api/collections/cases/records": { window: 60, max: 120 }, // 120/min
    "POST:/api/collections/plugins/records": { window: 3600, max: 10 }, // 10/hour
    "POST:/api/collections/cases/records": { window: 3600, max: 5 }, // 5/hour
    default: { window: 60, max: 60 }, // 60/min default
  },
  // API key users (higher limits)
  apiKey: {
    default: { window: 60, max: 300 }, // 300/min
  },
};

// In-memory rate limit store (use Redis in production for multi-instance)
const rateLimitStore = new Map();

function getRateLimitKey(identifier, endpoint) {
  return `${identifier}:${endpoint}`;
}

function checkRateLimit(identifier, endpoint, limits) {
  const now = Date.now();
  const key = getRateLimitKey(identifier, endpoint);

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > limits.window * 1000) {
    entry = { count: 0, windowStart: now };
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, limits.max - entry.count);
  const resetTime = Math.ceil(
    (entry.windowStart + limits.window * 1000 - now) / 1000,
  );

  return {
    allowed: entry.count <= limits.max,
    limit: limits.max,
    remaining: remaining,
    reset: resetTime,
  };
}

// Rate limiting middleware
routerUse((next) => {
  return (c) => {
    const method = c.request().method;
    const path = c.request().url.path;
    const endpoint = `${method}:${path}`;

    // Determine user type and identifier
    const authRecord = c.get("authRecord");
    const apiKeyRecord = c.get("apiKeyRecord");

    let identifier, limitTier;

    if (apiKeyRecord) {
      identifier = `key:${apiKeyRecord.id}`;
      limitTier = "apiKey";
    } else if (authRecord) {
      identifier = `user:${authRecord.id}`;
      limitTier = "authenticated";
    } else {
      identifier = `ip:${c.realIP()}`;
      limitTier = "anonymous";
    }

    // Find matching rate limit rule
    const tierLimits = RATE_LIMITS[limitTier];
    let limits = tierLimits.default;

    for (const [pattern, config] of Object.entries(tierLimits)) {
      if (pattern === "default") continue;
      if (endpoint.match(new RegExp(pattern.replace("*", ".*")))) {
        limits = config;
        break;
      }
    }

    const result = checkRateLimit(identifier, endpoint, limits);

    // Set rate limit headers
    c.response().header.set("X-RateLimit-Limit", result.limit.toString());
    c.response().header.set(
      "X-RateLimit-Remaining",
      result.remaining.toString(),
    );
    c.response().header.set("X-RateLimit-Reset", result.reset.toString());

    if (!result.allowed) {
      c.response().header.set("Retry-After", result.reset.toString());
      return c.json(429, {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
          retry_after: result.reset,
        },
      });
    }

    return next(c);
  };
});

// Cleanup stale entries (every 5 minutes)
cronAdd("rate_limit_cleanup", "*/5 * * * *", () => {
  const now = Date.now();
  const maxAge = 3600 * 1000; // 1 hour

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > maxAge) {
      rateLimitStore.delete(key);
    }
  }
});
```

### 6.2 Anti-Abuse Strategies

```javascript
// pb_hooks/anti_abuse.pb.js

/**
 * Additional abuse prevention measures.
 */

// Suspicious activity detection
const ABUSE_THRESHOLDS = {
  failedAuth: { window: 300, max: 5 }, // 5 failed logins in 5 min
  rapidCreates: { window: 60, max: 3 }, // 3 creates in 1 min
  suspiciousUserAgent: ["curl", "wget", "python-requests"], // Block common bot UAs
};

const abuseStore = new Map();

// Track failed authentication attempts
onRecordAuthRequest((e) => {
  // This hook fires on successful auth, track failures separately
}, "users");

// Block suspicious user agents (optional, may affect legitimate API users)
routerUse((next) => {
  return (c) => {
    const userAgent = c.request().header.get("User-Agent") || "";
    const ip = c.realIP();

    // Skip for authenticated requests
    if (c.get("authRecord") || c.get("apiKeyRecord")) {
      return next(c);
    }

    // Check for missing or suspicious UA on write operations
    const method = c.request().method;
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      if (!userAgent || userAgent.length < 10) {
        return c.json(403, {
          error: {
            code: "FORBIDDEN",
            message: "Invalid request",
          },
        });
      }
    }

    return next(c);
  };
});

// Honeypot fields for forms
onRecordBeforeCreateRequest(
  (e) => {
    const body = $apis.requestInfo(e.httpContext).data;

    // If honeypot field is filled, it's likely a bot
    if (body._hp_email || body._hp_name) {
      throw new ForbiddenError("Invalid request");
    }
  },
  "plugins",
  "cases",
);

// IP blocklist check
const blockedIPs = new Set();

routerUse((next) => {
  return (c) => {
    const ip = c.realIP();

    if (blockedIPs.has(ip)) {
      return c.json(403, {
        error: {
          code: "BLOCKED",
          message: "Access denied",
        },
      });
    }

    return next(c);
  };
});

// Admin endpoint to manage blocklist
routerAdd("POST", "/api/admin/block-ip", (c) => {
  const authRecord = c.get("authRecord");
  if (!authRecord || authRecord.get("role") !== "admin") {
    return c.json(403, {
      error: { code: "FORBIDDEN", message: "Admin access required" },
    });
  }

  const body = $apis.requestInfo(c).data;
  const ip = body.ip;
  const action = body.action; // "block" or "unblock"

  if (action === "block") {
    blockedIPs.add(ip);
  } else {
    blockedIPs.delete(ip);
  }

  return c.json(200, { data: { ip, action, success: true } });
});
```

---

## 7. Backup & Recovery

### 7.1 Litestream Configuration

```yaml
# litestream.yml
dbs:
  - path: /pb_data/data.db
    replicas:
      # Primary: Cloudflare R2
      - type: s3
        endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
        bucket: pocketbase-cn-backup
        path: db/data
        region: auto
        access-key-id: ${LITESTREAM_ACCESS_KEY_ID}
        secret-access-key: ${LITESTREAM_SECRET_ACCESS_KEY}
        retention: 720h # 30 days
        retention-check-interval: 1h
        sync-interval: 1s
        snapshot-interval: 24h

      # Secondary: Local backup (optional)
      - type: file
        path: /backups/data
        retention: 168h # 7 days

  # Logs database (optional)
  - path: /pb_data/logs.db
    replicas:
      - type: s3
        endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
        bucket: pocketbase-cn-backup
        path: db/logs
        region: auto
        access-key-id: ${LITESTREAM_ACCESS_KEY_ID}
        secret-access-key: ${LITESTREAM_SECRET_ACCESS_KEY}
        retention: 168h # 7 days
        sync-interval: 60s
```

### 7.2 Docker Compose with Litestream

```yaml
# docker-compose.yml
version: "3.8"

services:
  pocketbase:
    build: .
    ports:
      - "8090:8090"
    volumes:
      - pb_data:/pb_data
      - ./pb_hooks:/pb_hooks:ro
      - ./pb_migrations:/pb_migrations:ro
    environment:
      - PB_ADMIN_EMAIL
      - PB_ADMIN_PASSWORD
      - GITHUB_CLIENT_ID
      - GITHUB_CLIENT_SECRET
      - R2_ACCOUNT_ID
      - R2_ACCESS_KEY_ID
      - R2_SECRET_ACCESS_KEY
      - R2_BUCKET_NAME
      - R2_PUBLIC_URL
      - ALERT_WEBHOOK_URL
    healthcheck:
      test:
        ["CMD", "wget", "-q", "--spider", "http://localhost:8090/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  litestream:
    image: litestream/litestream:0.3
    volumes:
      - pb_data:/pb_data
      - ./litestream.yml:/etc/litestream.yml:ro
    environment:
      - R2_ACCOUNT_ID
      - LITESTREAM_ACCESS_KEY_ID
      - LITESTREAM_SECRET_ACCESS_KEY
    command: replicate -config /etc/litestream.yml
    depends_on:
      pocketbase:
        condition: service_healthy
    restart: unless-stopped

volumes:
  pb_data:
```

### 7.3 Dockerfile with Integrated Litestream

```dockerfile
# Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY . .
RUN go build -o pocketbase ./main.go

FROM alpine:3.19

# Install dependencies
RUN apk add --no-cache ca-certificates wget

# Install Litestream
RUN wget -O /tmp/litestream.tar.gz \
    https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.tar.gz \
    && tar -xzf /tmp/litestream.tar.gz -C /usr/local/bin \
    && rm /tmp/litestream.tar.gz

WORKDIR /app

COPY --from=builder /app/pocketbase /app/pocketbase
COPY litestream.yml /etc/litestream.yml
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh /app/pocketbase

EXPOSE 8090

ENTRYPOINT ["/entrypoint.sh"]
```

```bash
#!/bin/sh
# entrypoint.sh

# Restore database from backup if it doesn't exist
if [ ! -f /pb_data/data.db ]; then
    echo "Restoring database from backup..."
    litestream restore -config /etc/litestream.yml /pb_data/data.db || true
fi

# Start Litestream replication in background
litestream replicate -config /etc/litestream.yml &

# Start PocketBase
exec /app/pocketbase serve --http=0.0.0.0:8090 --dir=/pb_data
```

### 7.4 Manual Backup Scripts

```bash
#!/bin/bash
# scripts/backup.sh

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="/pb_data/data.db"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Stop writes (optional - use PRAGMA for hot backup)
sqlite3 "$DB_PATH" "PRAGMA wal_checkpoint(TRUNCATE);"

# Create backup with compression
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/data_$DATE.db'"
gzip "$BACKUP_DIR/data_$DATE.db"

# Upload to R2
aws s3 cp "$BACKUP_DIR/data_$DATE.db.gz" \
    "s3://pocketbase-cn-backup/manual/$DATE/data.db.gz" \
    --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# Cleanup old local backups (keep 7 days)
find "$BACKUP_DIR" -name "data_*.db.gz" -mtime +7 -delete

echo "Backup completed: data_$DATE.db.gz"
```

### 7.5 Recovery Procedures

```bash
#!/bin/bash
# scripts/restore.sh

set -e

# Usage: ./restore.sh [timestamp]
# Example: ./restore.sh 2024-01-15T10:30:00Z

TIMESTAMP=${1:-""}
DB_PATH="/pb_data/data.db"

echo "=== PocketBase Recovery ==="

# Stop PocketBase
echo "Stopping PocketBase..."
pkill pocketbase || true
sleep 2

# Backup current database
if [ -f "$DB_PATH" ]; then
    mv "$DB_PATH" "$DB_PATH.$(date +%s).bak"
fi

# Restore from Litestream
echo "Restoring from Litestream backup..."
if [ -n "$TIMESTAMP" ]; then
    litestream restore -config /etc/litestream.yml -timestamp "$TIMESTAMP" "$DB_PATH"
else
    litestream restore -config /etc/litestream.yml "$DB_PATH"
fi

# Verify integrity
echo "Verifying database integrity..."
sqlite3 "$DB_PATH" "PRAGMA integrity_check;"

# Start PocketBase
echo "Starting PocketBase..."
/app/pocketbase serve --http=0.0.0.0:8090 --dir=/pb_data &

echo "Recovery completed!"
```

```bash
#!/bin/bash
# scripts/restore_from_manual.sh

# Restore from manual S3 backup
BACKUP_DATE=${1:?"Usage: $0 YYYYMMDD_HHMMSS"}

# Download backup
aws s3 cp \
    "s3://pocketbase-cn-backup/manual/$BACKUP_DATE/data.db.gz" \
    /tmp/restore.db.gz \
    --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# Stop PocketBase
pkill pocketbase || true
sleep 2

# Decompress and restore
gunzip -c /tmp/restore.db.gz > /pb_data/data.db

# Verify
sqlite3 /pb_data/data.db "PRAGMA integrity_check;"

# Start PocketBase
/app/pocketbase serve --http=0.0.0.0:8090 --dir=/pb_data &
```

---

## 8. Monitoring

### 8.1 Health Check Endpoint

```javascript
// pb_hooks/health.pb.js

/**
 * Health check and monitoring endpoints.
 */

routerAdd("GET", "/api/health", (c) => {
  const checks = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: $app.settings().version || "0.23.4",
    checks: {},
  };

  // Database check
  try {
    $app.dao().db().newQuery("SELECT 1").one();
    checks.checks.database = { status: "healthy" };
  } catch (err) {
    checks.checks.database = { status: "unhealthy", error: err.message };
    checks.status = "unhealthy";
  }

  // Storage check (S3)
  try {
    const s3 = $app.settings().s3;
    if (s3 && s3.enabled) {
      // Simple existence check
      checks.checks.storage = { status: "healthy", type: "s3" };
    } else {
      checks.checks.storage = { status: "healthy", type: "local" };
    }
  } catch (err) {
    checks.checks.storage = { status: "unhealthy", error: err.message };
    checks.status = "degraded";
  }

  // Memory usage
  const memUsage = process.memoryUsage ? process.memoryUsage() : {};
  checks.checks.memory = {
    status: "healthy",
    heapUsed: memUsage.heapUsed || 0,
    heapTotal: memUsage.heapTotal || 0,
  };

  const statusCode =
    checks.status === "healthy"
      ? 200
      : checks.status === "degraded"
        ? 200
        : 503;

  return c.json(statusCode, checks);
});

// Detailed metrics (protected)
routerAdd("GET", "/api/metrics", (c) => {
  const authRecord = c.get("authRecord");
  if (!authRecord || authRecord.get("role") !== "admin") {
    return c.json(403, {
      error: { code: "FORBIDDEN", message: "Admin access required" },
    });
  }

  const metrics = {
    timestamp: new Date().toISOString(),
    collections: {},
    requests: {},
  };

  // Collection counts
  const collections = ["users", "plugins", "cases", "download_logs"];
  for (const name of collections) {
    const records = $app.dao().findRecordsByFilter(name, "", "", 0, 0);
    metrics.collections[name] = { count: records.length };
  }

  // Recent request stats (from logs.db)
  try {
    const hourAgo = new Date(Date.now() - 3600000).toISOString();
    const requestStats = $app
      .dao()
      .db()
      .newQuery(
        `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status >= 400 THEN 1 END) as errors,
        AVG(CAST(execTime as REAL)) as avg_response_time
      FROM _requests
      WHERE created > '${hourAgo}'
    `,
      )
      .one();

    metrics.requests = {
      lastHour: requestStats.total,
      errors: requestStats.errors,
      avgResponseTime: Math.round(requestStats.avg_response_time || 0),
    };
  } catch (err) {
    metrics.requests = { error: "Unable to fetch request metrics" };
  }

  return c.json(200, metrics);
});

// Readiness probe (for Kubernetes)
routerAdd("GET", "/api/ready", (c) => {
  try {
    $app.dao().db().newQuery("SELECT 1").one();
    return c.json(200, { ready: true });
  } catch (err) {
    return c.json(503, { ready: false, error: err.message });
  }
});

// Liveness probe
routerAdd("GET", "/api/live", (c) => {
  return c.json(200, { alive: true, timestamp: new Date().toISOString() });
});
```

### 8.2 Logging Configuration

```javascript
// pb_hooks/logging.pb.js

/**
 * Enhanced logging and audit trail.
 */

// Request logging middleware
routerUse((next) => {
  return (c) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();

    c.response().header.set("X-Request-ID", requestId);

    // Call next handler
    const result = next(c);

    // Log after response
    const duration = Date.now() - start;
    const status = c.response().status;
    const method = c.request().method;
    const path = c.request().url.path;
    const ip = c.realIP();

    const logLevel = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

    console[logLevel](
      JSON.stringify({
        requestId,
        method,
        path,
        status,
        duration,
        ip: ip.substring(0, ip.indexOf(".") + 4) + "***", // Partial IP
        userAgent: c.request().header.get("User-Agent")?.substring(0, 100),
        userId: c.get("authRecord")?.id || null,
      }),
    );

    return result;
  };
});

// Audit log for sensitive operations
function auditLog(action, userId, details) {
  const collection = $app.dao().findCollectionByNameOrId("audit_logs");
  if (!collection) return;

  const record = new Record(collection);
  record.set("action", action);
  record.set("user", userId);
  record.set("details", details);
  record.set("ip", details.ip || "");

  $app.dao().saveRecord(record);
}

// Track admin actions
onRecordAfterUpdateRequest((e) => {
  const authRecord = e.httpContext.get("authRecord");
  if (authRecord?.get("role") === "admin") {
    auditLog("admin_update", authRecord.id, {
      collection: e.collection.name,
      recordId: e.record.id,
      changes: e.record.originalData ? "modified" : "created",
    });
  }
});

onRecordAfterDeleteRequest((e) => {
  const authRecord = e.httpContext.get("authRecord");
  if (authRecord?.get("role") === "admin") {
    auditLog("admin_delete", authRecord.id, {
      collection: e.collection.name,
      recordId: e.record.id,
    });
  }
});
```

### 8.3 Alerting Configuration

```javascript
// pb_hooks/alerts.pb.js

/**
 * Automated alerting for critical events.
 */

const ALERT_WEBHOOK_URL = $os.getenv("ALERT_WEBHOOK_URL");

function sendAlert(level, title, message, fields = []) {
  if (!ALERT_WEBHOOK_URL) return;

  const colors = {
    critical: 0xff0000,
    warning: 0xffa500,
    info: 0x0099ff,
  };

  const payload = {
    embeds: [
      {
        title: `[${level.toUpperCase()}] ${title}`,
        description: message,
        color: colors[level] || colors.info,
        fields: fields,
        timestamp: new Date().toISOString(),
        footer: { text: "PocketBase.cn Monitoring" },
      },
    ],
  };

  try {
    $http.send({
      url: ALERT_WEBHOOK_URL,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      timeout: 5,
    });
  } catch (err) {
    console.error(`[ALERT] Failed to send: ${err}`);
  }
}

// Alert on high error rate
let errorCount = 0;
let lastErrorCheck = Date.now();

routerUse((next) => {
  return (c) => {
    const result = next(c);

    if (c.response().status >= 500) {
      errorCount++;
    }

    // Check every minute
    const now = Date.now();
    if (now - lastErrorCheck > 60000) {
      if (errorCount > 10) {
        sendAlert(
          "warning",
          "High Error Rate",
          `${errorCount} server errors in the last minute`,
          [
            { name: "Threshold", value: "10/min", inline: true },
            { name: "Actual", value: `${errorCount}/min`, inline: true },
          ],
        );
      }
      errorCount = 0;
      lastErrorCheck = now;
    }

    return result;
  };
});

// Alert on database issues
cronAdd("db_health_check", "*/5 * * * *", () => {
  try {
    $app.dao().db().newQuery("PRAGMA integrity_check").one();
  } catch (err) {
    sendAlert(
      "critical",
      "Database Health Check Failed",
      `Database integrity check failed: ${err.message}`,
    );
  }
});

// Alert on disk space (if applicable)
cronAdd("disk_check", "0 * * * *", () => {
  // This would require shell access or external monitoring
  // Placeholder for disk space monitoring
});

// Alert on suspicious activity
function alertSuspiciousActivity(ip, reason) {
  sendAlert("warning", "Suspicious Activity Detected", reason, [
    { name: "IP", value: ip, inline: true },
    { name: "Time", value: new Date().toISOString(), inline: true },
  ]);
}
```

### 8.4 Prometheus Metrics (Optional)

```javascript
// pb_hooks/prometheus.pb.js

/**
 * Prometheus-compatible metrics endpoint.
 */

const metrics = {
  http_requests_total: {
    type: "counter",
    help: "Total HTTP requests",
    values: {},
  },
  http_request_duration_seconds: {
    type: "histogram",
    help: "HTTP request duration",
    values: [],
  },
  pocketbase_records_total: {
    type: "gauge",
    help: "Total records per collection",
    values: {},
  },
};

// Collect request metrics
routerUse((next) => {
  return (c) => {
    const start = Date.now();
    const result = next(c);
    const duration = (Date.now() - start) / 1000;

    const method = c.request().method;
    const status = c.response().status;
    const key = `${method}:${status}`;

    metrics.http_requests_total.values[key] =
      (metrics.http_requests_total.values[key] || 0) + 1;

    metrics.http_request_duration_seconds.values.push(duration);
    // Keep only last 1000 values
    if (metrics.http_request_duration_seconds.values.length > 1000) {
      metrics.http_request_duration_seconds.values.shift();
    }

    return result;
  };
});

// Prometheus metrics endpoint
routerAdd("GET", "/metrics", (c) => {
  let output = "";

  // HTTP requests counter
  output += `# HELP http_requests_total ${metrics.http_requests_total.help}\n`;
  output += `# TYPE http_requests_total counter\n`;
  for (const [key, value] of Object.entries(
    metrics.http_requests_total.values,
  )) {
    const [method, status] = key.split(":");
    output += `http_requests_total{method="${method}",status="${status}"} ${value}\n`;
  }

  // Request duration histogram
  const durations = metrics.http_request_duration_seconds.values;
  if (durations.length > 0) {
    const sorted = [...durations].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;

    output += `# HELP http_request_duration_seconds ${metrics.http_request_duration_seconds.help}\n`;
    output += `# TYPE http_request_duration_seconds summary\n`;
    output += `http_request_duration_seconds{quantile="0.5"} ${p50.toFixed(4)}\n`;
    output += `http_request_duration_seconds{quantile="0.9"} ${p90.toFixed(4)}\n`;
    output += `http_request_duration_seconds{quantile="0.99"} ${p99.toFixed(4)}\n`;
  }

  // Collection record counts
  const collections = ["users", "plugins", "cases"];
  output += `# HELP pocketbase_records_total ${metrics.pocketbase_records_total.help}\n`;
  output += `# TYPE pocketbase_records_total gauge\n`;
  for (const name of collections) {
    const count = $app.dao().findRecordsByFilter(name, "", "", 0, 0).length;
    output += `pocketbase_records_total{collection="${name}"} ${count}\n`;
  }

  c.response().header.set("Content-Type", "text/plain; version=0.0.4");
  return c.string(200, output);
});
```

---

## Appendix A: API Response Standards

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "perPage": 20,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {
      "field": "name",
      "constraint": "required"
    }
  }
}
```

### Error Codes

| Code               | HTTP Status | Description                   |
| ------------------ | ----------- | ----------------------------- |
| `VALIDATION_ERROR` | 400         | Invalid input data            |
| `UNAUTHORIZED`     | 401         | Authentication required       |
| `FORBIDDEN`        | 403         | Permission denied             |
| `NOT_FOUND`        | 404         | Resource not found            |
| `CONFLICT`         | 409         | Resource conflict (duplicate) |
| `RATE_LIMITED`     | 429         | Too many requests             |
| `INTERNAL_ERROR`   | 500         | Server error                  |

---

## Appendix B: Security Checklist

- [ ] All secrets in environment variables (never committed)
- [ ] HTTPS enforced (Cloudflare SSL)
- [ ] CORS configured for specific origins
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] CSRF protection (PocketBase built-in)
- [ ] Authentication on sensitive endpoints
- [ ] Admin routes protected
- [ ] File upload validation (type, size)
- [ ] Database backups encrypted at rest
- [ ] Audit logging enabled
- [ ] Dependency updates scheduled

---

## Appendix C: Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Admin account created
- [ ] GitHub OAuth app configured
- [ ] R2 bucket created and configured
- [ ] Litestream replication verified
- [ ] Health check endpoint responding
- [ ] Monitoring alerts configured
- [ ] SSL certificate valid
- [ ] DNS configured
- [ ] Firewall rules set (port 8090)
- [ ] Backup restoration tested
- [ ] Load testing completed

---

_Document Version: 1.0.0_
_Last Updated: 2024-01-15_
_PocketBase Version: 0.23.x_
