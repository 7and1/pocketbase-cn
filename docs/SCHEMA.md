# PocketBase.cn Database Schema

> Production-ready database schema for PocketBase.cn plugin marketplace and community platform.

**Version:** 1.0.0
**Last Updated:** 2025-12-30
**PocketBase Version:** 0.23+

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Collections Definition](#2-collections-definition)
3. [API Rules](#3-api-rules)
4. [Migration Scripts](#4-migration-scripts)
5. [Seed Data](#5-seed-data)
6. [Query Patterns](#6-query-patterns)
7. [Performance Optimization](#7-performance-optimization)

---

## 1. Schema Overview

### 1.1 Entity Relationship Diagram

```
+------------------+       +--------------------+       +-------------------+
|      users       |       |      plugins       |       |  plugin_versions  |
+------------------+       +--------------------+       +-------------------+
| id (PK)          |<------| author (FK)        |<------| plugin (FK)       |
| github_id        |       | id (PK)            |       | id (PK)           |
| username         |       | name               |       | version           |
| email            |       | slug               |       | changelog         |
| avatar           |       | description        |       | download_url      |
| bio              |       | repository         |       | pocketbase_version|
| website          |       | category           |       | checksum          |
| role             |       | tags               |       | file_size         |
| verified         |       | license            |       | downloads         |
| created          |       | status             |       | created           |
| updated          |       | featured           |       +-------------------+
+------------------+       | created            |
        |                  | updated            |
        |                  +--------------------+
        |                          |
        |                          v
        |                  +-------------------+
        |                  |   plugin_stats    |
        |                  +-------------------+
        |                  | id (PK)           |
        |                  | plugin (FK)       |
        |                  | downloads_total   |
        |                  | downloads_weekly  |
        |                  | views_total       |
        |                  | views_weekly      |
        |                  | stars             |
        |                  | updated           |
        |                  +-------------------+
        |
        |                  +-------------------+
        +----------------->|     showcase      |
                           +-------------------+
                           | id (PK)           |
                           | author (FK)       |
                           | title             |
                           | description       |
                           | url               |
                           | thumbnail         |
                           | category          |
                           | tags              |
                           | status            |
                           | featured          |
                           | created           |
                           | updated           |
                           +-------------------+

+-------------------+       +-------------------+
|     mirrors       |       |    newsletter     |
+-------------------+       +-------------------+
| id (PK)           |       | id (PK)           |
| name              |       | email             |
| base_url          |       | status            |
| region            |       | token             |
| provider          |       | subscribed_at     |
| priority          |       | confirmed_at      |
| status            |       | unsubscribed_at   |
| health_check_url  |       | source            |
| last_check        |       | created           |
| latency_ms        |       +-------------------+
| created           |
| updated           |
+-------------------+
```

### 1.2 Collection Summary

| Collection      | Type | Description                          | Relations         |
| --------------- | ---- | ------------------------------------ | ----------------- |
| users           | auth | User accounts via GitHub OAuth       | -                 |
| plugins         | base | Plugin marketplace listings          | author -> users   |
| plugin_versions | base | Version history for plugins          | plugin -> plugins |
| plugin_stats    | base | Separated stats to avoid write locks | plugin -> plugins |
| showcase        | base | Community project showcase           | author -> users   |
| mirrors         | base | Download mirror configuration        | -                 |
| newsletter      | base | Email subscription management        | -                 |

---

## 2. Collections Definition

### 2.1 users (Auth Collection)

User authentication via GitHub OAuth with extended profile fields.

| Field     | Type     | Required | Unique | Default | Description                    |
| --------- | -------- | -------- | ------ | ------- | ------------------------------ |
| id        | string   | auto     | yes    | auto    | 15-char unique identifier      |
| email     | email    | yes      | yes    | -       | User email from GitHub         |
| username  | string   | yes      | yes    | -       | GitHub username                |
| github_id | number   | yes      | yes    | -       | GitHub user ID                 |
| avatar    | url      | no       | no     | ""      | GitHub avatar URL              |
| bio       | text     | no       | no     | ""      | User biography (max 500 chars) |
| website   | url      | no       | no     | ""      | Personal website URL           |
| role      | select   | yes      | no     | "user"  | user, moderator, admin         |
| verified  | bool     | yes      | no     | false   | Verified plugin author         |
| created   | datetime | auto     | no     | auto    | Account creation timestamp     |
| updated   | datetime | auto     | no     | auto    | Last update timestamp          |

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_users_github_id ON users(github_id);
CREATE UNIQUE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verified ON users(verified);
```

---

### 2.2 plugins (Base Collection)

Core plugin marketplace data.

| Field       | Type     | Required | Unique | Default   | Description                         |
| ----------- | -------- | -------- | ------ | --------- | ----------------------------------- |
| id          | string   | auto     | yes    | auto      | 15-char unique identifier           |
| author      | relation | yes      | no     | -         | FK to users (single)                |
| name        | string   | yes      | no     | -         | Plugin display name (3-100 chars)   |
| slug        | string   | yes      | yes    | -         | URL-friendly identifier (lowercase) |
| description | text     | yes      | no     | -         | Short description (max 500 chars)   |
| readme      | text     | no       | no     | ""        | Full README content (markdown)      |
| repository  | url      | yes      | no     | -         | GitHub repository URL               |
| homepage    | url      | no       | no     | ""        | Plugin homepage/docs URL            |
| category    | select   | yes      | no     | -         | Plugin category                     |
| tags        | json     | no       | no     | []        | Array of tag strings (max 10)       |
| license     | string   | no       | no     | "MIT"     | SPDX license identifier             |
| icon        | file     | no       | no     | -         | Plugin icon (max 512KB, png/svg)    |
| screenshots | file     | no       | no     | -         | Screenshots (max 5, 2MB each)       |
| status      | select   | yes      | no     | "pending" | pending, approved, rejected, hidden |
| featured    | bool     | yes      | no     | false     | Featured on homepage                |
| created     | datetime | auto     | no     | auto      | Submission timestamp                |
| updated     | datetime | auto     | no     | auto      | Last update timestamp               |

**Category Options:**

- `hooks` - Lifecycle hooks and events
- `auth` - Authentication providers
- `storage` - Storage backends
- `api` - API extensions
- `admin` - Admin UI extensions
- `integration` - Third-party integrations
- `utility` - Utility functions
- `template` - Project templates
- `other` - Other plugins

**Status Flow:**

```
pending -> approved (by moderator/admin)
pending -> rejected (by moderator/admin)
approved -> hidden (by author or admin)
hidden -> approved (by author or admin)
```

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_plugins_slug ON plugins(slug);
CREATE INDEX idx_plugins_author ON plugins(author);
CREATE INDEX idx_plugins_category ON plugins(category);
CREATE INDEX idx_plugins_status ON plugins(status);
CREATE INDEX idx_plugins_featured ON plugins(featured);
CREATE INDEX idx_plugins_created ON plugins(created DESC);
CREATE INDEX idx_plugins_status_featured ON plugins(status, featured);
```

---

### 2.3 plugin_versions (Base Collection)

Version history and release management.

| Field              | Type     | Required | Unique | Default | Description                     |
| ------------------ | -------- | -------- | ------ | ------- | ------------------------------- |
| id                 | string   | auto     | yes    | auto    | 15-char unique identifier       |
| plugin             | relation | yes      | no     | -       | FK to plugins (single)          |
| version            | string   | yes      | no     | -       | Semantic version (e.g., 1.0.0)  |
| changelog          | text     | no       | no     | ""      | Release notes (markdown)        |
| download_url       | url      | yes      | no     | -       | Direct download URL             |
| pocketbase_version | string   | yes      | no     | -       | Min PocketBase version required |
| checksum           | string   | no       | no     | ""      | SHA256 checksum of package      |
| file_size          | number   | no       | no     | 0       | File size in bytes              |
| downloads          | number   | yes      | no     | 0       | Download count for this version |
| prerelease         | bool     | yes      | no     | false   | Pre-release flag                |
| created            | datetime | auto     | no     | auto    | Release timestamp               |

**Indexes:**

```sql
CREATE INDEX idx_plugin_versions_plugin ON plugin_versions(plugin);
CREATE INDEX idx_plugin_versions_created ON plugin_versions(created DESC);
CREATE UNIQUE INDEX idx_plugin_versions_plugin_version ON plugin_versions(plugin, version);
```

---

### 2.4 plugin_stats (Base Collection)

Separated statistics to avoid write contention on the main plugins table.

| Field            | Type     | Required | Unique | Default | Description                    |
| ---------------- | -------- | -------- | ------ | ------- | ------------------------------ |
| id               | string   | auto     | yes    | auto    | 15-char unique identifier      |
| plugin           | relation | yes      | yes    | -       | FK to plugins (single, unique) |
| downloads_total  | number   | yes      | no     | 0       | Total download count           |
| downloads_weekly | number   | yes      | no     | 0       | Downloads in last 7 days       |
| views_total      | number   | yes      | no     | 0       | Total view count               |
| views_weekly     | number   | yes      | no     | 0       | Views in last 7 days           |
| stars            | number   | yes      | no     | 0       | Star/favorite count            |
| updated          | datetime | auto     | no     | auto    | Last stats update              |

**Design Rationale:**

- Separated from plugins to prevent row-level locking during high-frequency stat updates
- Weekly counters reset via scheduled job (cron)
- Enables atomic increments without blocking plugin reads

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_plugin_stats_plugin ON plugin_stats(plugin);
CREATE INDEX idx_plugin_stats_downloads ON plugin_stats(downloads_total DESC);
CREATE INDEX idx_plugin_stats_stars ON plugin_stats(stars DESC);
CREATE INDEX idx_plugin_stats_weekly ON plugin_stats(downloads_weekly DESC);
```

---

### 2.5 showcase (Base Collection)

Community project showcase gallery.

| Field       | Type     | Required | Unique | Default   | Description                    |
| ----------- | -------- | -------- | ------ | --------- | ------------------------------ |
| id          | string   | auto     | yes    | auto      | 15-char unique identifier      |
| author      | relation | no       | no     | -         | FK to users (optional)         |
| title       | string   | yes      | no     | -         | Project title (3-100 chars)    |
| description | text     | yes      | no     | -         | Project description (max 1000) |
| url         | url      | yes      | no     | -         | Live project URL               |
| repository  | url      | no       | no     | ""        | Source code repository         |
| thumbnail   | file     | no       | no     | -         | Project screenshot (max 2MB)   |
| category    | select   | yes      | no     | -         | Project category               |
| tags        | json     | no       | no     | []        | Array of tag strings (max 10)  |
| status      | select   | yes      | no     | "pending" | pending, approved, rejected    |
| featured    | bool     | yes      | no     | false     | Featured on homepage           |
| created     | datetime | auto     | no     | auto      | Submission timestamp           |
| updated     | datetime | auto     | no     | auto      | Last update timestamp          |

**Category Options:**

- `saas` - SaaS applications
- `ecommerce` - E-commerce platforms
- `cms` - Content management systems
- `mobile` - Mobile applications
- `desktop` - Desktop applications
- `api` - API services
- `tool` - Developer tools
- `game` - Games
- `other` - Other projects

**Indexes:**

```sql
CREATE INDEX idx_showcase_author ON showcase(author);
CREATE INDEX idx_showcase_category ON showcase(category);
CREATE INDEX idx_showcase_status ON showcase(status);
CREATE INDEX idx_showcase_featured ON showcase(featured);
CREATE INDEX idx_showcase_created ON showcase(created DESC);
```

---

### 2.6 mirrors (Base Collection)

Download mirror configuration for geographic distribution.

| Field            | Type     | Required | Unique | Default  | Description                     |
| ---------------- | -------- | -------- | ------ | -------- | ------------------------------- |
| id               | string   | auto     | yes    | auto     | 15-char unique identifier       |
| name             | string   | yes      | yes    | -        | Mirror display name             |
| base_url         | url      | yes      | yes    | -        | Base URL for downloads          |
| region           | select   | yes      | no     | -        | Geographic region               |
| provider         | string   | yes      | no     | -        | CDN/hosting provider name       |
| priority         | number   | yes      | no     | 100      | Lower = higher priority         |
| status           | select   | yes      | no     | "active" | active, maintenance, disabled   |
| health_check_url | url      | no       | no     | ""       | Health check endpoint           |
| last_check       | datetime | no       | no     | -        | Last health check timestamp     |
| latency_ms       | number   | no       | no     | 0        | Average latency in milliseconds |
| created          | datetime | auto     | no     | auto     | Creation timestamp              |
| updated          | datetime | auto     | no     | auto     | Last update timestamp           |

**Region Options:**

- `cn-north` - China North (Beijing)
- `cn-south` - China South (Guangzhou)
- `cn-east` - China East (Shanghai)
- `hk` - Hong Kong
- `sg` - Singapore
- `us-west` - US West
- `us-east` - US East
- `eu` - Europe

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_mirrors_name ON mirrors(name);
CREATE INDEX idx_mirrors_region ON mirrors(region);
CREATE INDEX idx_mirrors_status ON mirrors(status);
CREATE INDEX idx_mirrors_priority ON mirrors(priority);
```

---

### 2.7 newsletter (Base Collection)

Email subscription management with double opt-in support.

| Field           | Type     | Required | Unique | Default   | Description                      |
| --------------- | -------- | -------- | ------ | --------- | -------------------------------- |
| id              | string   | auto     | yes    | auto      | 15-char unique identifier        |
| email           | email    | yes      | yes    | -         | Subscriber email address         |
| status          | select   | yes      | no     | "pending" | pending, confirmed, unsubscribed |
| token           | string   | yes      | yes    | -         | Confirmation/unsubscribe token   |
| subscribed_at   | datetime | auto     | no     | auto      | Initial subscription timestamp   |
| confirmed_at    | datetime | no       | no     | -         | Email confirmation timestamp     |
| unsubscribed_at | datetime | no       | no     | -         | Unsubscription timestamp         |
| source          | string   | no       | no     | "website" | Subscription source              |
| created         | datetime | auto     | no     | auto      | Record creation timestamp        |

**Status Flow:**

```
pending -> confirmed (via email link)
confirmed -> unsubscribed (via email link)
```

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_newsletter_email ON newsletter(email);
CREATE UNIQUE INDEX idx_newsletter_token ON newsletter(token);
CREATE INDEX idx_newsletter_status ON newsletter(status);
```

---

## 3. API Rules

### 3.1 users

```javascript
{
  listRule: "@request.auth.role = 'admin'",
  viewRule: "@request.auth.id != '' || id = @request.auth.id",
  createRule: null,  // Only via OAuth
  updateRule: "id = @request.auth.id || @request.auth.role = 'admin'",
  deleteRule: "@request.auth.role = 'admin'"
}
```

**Security Considerations:**

- `listRule`: Only admins can list all users (prevents user enumeration)
- `viewRule`: Public profiles visible to authenticated users, users can always view themselves
- `createRule`: `null` prevents direct creation; users created only via GitHub OAuth flow
- `updateRule`: Users can update own profile, admins can update any
- `deleteRule`: Only admins can delete accounts (for GDPR compliance)

**Field-Level Access:**

```javascript
{
  // Only admin can modify these fields
  role: { updateRule: "@request.auth.role = 'admin'" },
  verified: { updateRule: "@request.auth.role = 'admin'" }
}
```

---

### 3.2 plugins

```javascript
{
  listRule: "status = 'approved' || author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
  viewRule: "status = 'approved' || author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
  createRule: "@request.auth.id != ''",
  updateRule: "author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
  deleteRule: "@request.auth.role = 'admin'"
}
```

**Security Considerations:**

- `listRule/viewRule`: Public sees only approved plugins; authors see their own; staff sees all
- `createRule`: Any authenticated user can submit plugins
- `updateRule`: Authors manage own plugins; moderators can update status
- `deleteRule`: Only admins delete to prevent data loss

**Field-Level Access:**

```javascript
{
  // Only staff can modify these fields
  status: { updateRule: "@request.auth.role ~ 'admin|moderator'" },
  featured: { updateRule: "@request.auth.role = 'admin'" },
  // Author cannot be changed
  author: { updateRule: "@request.auth.role = 'admin'" }
}
```

---

### 3.3 plugin_versions

```javascript
{
  listRule: "plugin.status = 'approved' || plugin.author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
  viewRule: "plugin.status = 'approved' || plugin.author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
  createRule: "plugin.author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
  updateRule: "plugin.author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
  deleteRule: "@request.auth.role = 'admin'"
}
```

**Security Considerations:**

- Rules inherit visibility from parent plugin
- Only plugin author or staff can create new versions
- Version deletion restricted to admin (audit trail)

---

### 3.4 plugin_stats

```javascript
{
  listRule: "",  // Public read for sorting/filtering
  viewRule: "",  // Public read
  createRule: "@request.auth.role = 'admin'",  // System-only
  updateRule: null,  // API-only via hooks
  deleteRule: "@request.auth.role = 'admin'"
}
```

**Security Considerations:**

- Public read enables marketplace sorting by popularity
- No direct updates; increments handled by PocketBase hooks
- This prevents stat manipulation attacks

**Increment via Hook (pb_hooks):**

```javascript
// On plugin view
onRecordViewRequest((e) => {
  if (e.collection.name === "plugins") {
    $app.dao().runInTransaction((txDao) => {
      const stats = txDao.findFirstRecordByData(
        "plugin_stats",
        "plugin",
        e.record.id,
      );
      if (stats) {
        stats.set("views_total", stats.getInt("views_total") + 1);
        stats.set("views_weekly", stats.getInt("views_weekly") + 1);
        txDao.saveRecord(stats);
      }
    });
  }
});
```

---

### 3.5 showcase

```javascript
{
  listRule: "status = 'approved' || author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
  viewRule: "status = 'approved' || author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
  createRule: "@request.auth.id != '' || @request.auth.id = ''",  // Allow anonymous submissions
  updateRule: "author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
  deleteRule: "author = @request.auth.id || @request.auth.role = 'admin'"
}
```

**Security Considerations:**

- Anonymous submissions allowed (author optional) to lower barrier
- Authors can delete their own showcase entries
- Staff moderation for quality control

---

### 3.6 mirrors

```javascript
{
  listRule: "status = 'active' || @request.auth.role = 'admin'",
  viewRule: "status = 'active' || @request.auth.role = 'admin'",
  createRule: "@request.auth.role = 'admin'",
  updateRule: "@request.auth.role = 'admin'",
  deleteRule: "@request.auth.role = 'admin'"
}
```

**Security Considerations:**

- Public sees only active mirrors
- Full CRUD restricted to admin
- Prevents unauthorized mirror registration (security risk)

---

### 3.7 newsletter

```javascript
{
  listRule: "@request.auth.role = 'admin'",
  viewRule: "@request.auth.role = 'admin'",
  createRule: "",  // Public subscription
  updateRule: null,  // Only via token-based endpoints
  deleteRule: "@request.auth.role = 'admin'"
}
```

**Security Considerations:**

- Email list not publicly readable (GDPR)
- Anyone can subscribe (public createRule)
- Updates only via custom endpoints with token validation
- Implements double opt-in pattern

**Custom Endpoints (pb_hooks):**

```javascript
// Confirmation endpoint
routerAdd("GET", "/api/newsletter/confirm/:token", (c) => {
  const token = c.pathParam("token");
  const record = $app.dao().findFirstRecordByData("newsletter", "token", token);
  if (record && record.getString("status") === "pending") {
    record.set("status", "confirmed");
    record.set("confirmed_at", new Date().toISOString());
    $app.dao().saveRecord(record);
    return c.redirect(302, "/newsletter/confirmed");
  }
  return c.redirect(302, "/newsletter/error");
});
```

---

## 4. Migration Scripts

### 4.1 PocketBase Schema JSON (pb_schema.json)

```json
[
  {
    "id": "users",
    "name": "users",
    "type": "auth",
    "system": false,
    "schema": [
      {
        "id": "github_id",
        "name": "github_id",
        "type": "number",
        "system": false,
        "required": true,
        "options": {
          "min": 1,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "id": "avatar",
        "name": "avatar",
        "type": "url",
        "system": false,
        "required": false,
        "options": {
          "exceptDomains": [],
          "onlyDomains": []
        }
      },
      {
        "id": "bio",
        "name": "bio",
        "type": "text",
        "system": false,
        "required": false,
        "options": {
          "min": null,
          "max": 500,
          "pattern": ""
        }
      },
      {
        "id": "website",
        "name": "website",
        "type": "url",
        "system": false,
        "required": false,
        "options": {
          "exceptDomains": [],
          "onlyDomains": []
        }
      },
      {
        "id": "role",
        "name": "role",
        "type": "select",
        "system": false,
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": ["user", "moderator", "admin"]
        }
      },
      {
        "id": "verified",
        "name": "verified",
        "type": "bool",
        "system": false,
        "required": false,
        "options": {}
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_users_github_id` ON `users` (`github_id`)",
      "CREATE INDEX `idx_users_role` ON `users` (`role`)",
      "CREATE INDEX `idx_users_verified` ON `users` (`verified`)"
    ],
    "listRule": "@request.auth.role = 'admin'",
    "viewRule": "@request.auth.id != ''",
    "createRule": null,
    "updateRule": "id = @request.auth.id || @request.auth.role = 'admin'",
    "deleteRule": "@request.auth.role = 'admin'",
    "options": {
      "allowEmailAuth": false,
      "allowOAuth2Auth": true,
      "allowUsernameAuth": false,
      "exceptEmailDomains": [],
      "manageRule": "@request.auth.role = 'admin'",
      "minPasswordLength": 8,
      "onlyEmailDomains": [],
      "onlyVerified": false,
      "requireEmail": true
    }
  },
  {
    "id": "plugins",
    "name": "plugins",
    "type": "base",
    "system": false,
    "schema": [
      {
        "id": "author",
        "name": "author",
        "type": "relation",
        "system": false,
        "required": true,
        "options": {
          "collectionId": "users",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": ["username"]
        }
      },
      {
        "id": "name",
        "name": "name",
        "type": "text",
        "system": false,
        "required": true,
        "options": {
          "min": 3,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "id": "slug",
        "name": "slug",
        "type": "text",
        "system": false,
        "required": true,
        "options": {
          "min": 3,
          "max": 100,
          "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
        }
      },
      {
        "id": "description",
        "name": "description",
        "type": "text",
        "system": false,
        "required": true,
        "options": {
          "min": 10,
          "max": 500,
          "pattern": ""
        }
      },
      {
        "id": "readme",
        "name": "readme",
        "type": "text",
        "system": false,
        "required": false,
        "options": {
          "min": null,
          "max": 50000,
          "pattern": ""
        }
      },
      {
        "id": "repository",
        "name": "repository",
        "type": "url",
        "system": false,
        "required": true,
        "options": {
          "exceptDomains": [],
          "onlyDomains": ["github.com", "gitlab.com", "gitee.com"]
        }
      },
      {
        "id": "homepage",
        "name": "homepage",
        "type": "url",
        "system": false,
        "required": false,
        "options": {
          "exceptDomains": [],
          "onlyDomains": []
        }
      },
      {
        "id": "category",
        "name": "category",
        "type": "select",
        "system": false,
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": [
            "hooks",
            "auth",
            "storage",
            "api",
            "admin",
            "integration",
            "utility",
            "template",
            "other"
          ]
        }
      },
      {
        "id": "tags",
        "name": "tags",
        "type": "json",
        "system": false,
        "required": false,
        "options": {
          "maxSize": 2000
        }
      },
      {
        "id": "license",
        "name": "license",
        "type": "text",
        "system": false,
        "required": false,
        "options": {
          "min": null,
          "max": 50,
          "pattern": ""
        }
      },
      {
        "id": "icon",
        "name": "icon",
        "type": "file",
        "system": false,
        "required": false,
        "options": {
          "mimeTypes": ["image/png", "image/svg+xml"],
          "thumbs": ["100x100"],
          "maxSelect": 1,
          "maxSize": 524288,
          "protected": false
        }
      },
      {
        "id": "screenshots",
        "name": "screenshots",
        "type": "file",
        "system": false,
        "required": false,
        "options": {
          "mimeTypes": ["image/png", "image/jpeg", "image/webp"],
          "thumbs": ["320x240", "640x480"],
          "maxSelect": 5,
          "maxSize": 2097152,
          "protected": false
        }
      },
      {
        "id": "status",
        "name": "status",
        "type": "select",
        "system": false,
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": ["pending", "approved", "rejected", "hidden"]
        }
      },
      {
        "id": "featured",
        "name": "featured",
        "type": "bool",
        "system": false,
        "required": false,
        "options": {}
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_plugins_slug` ON `plugins` (`slug`)",
      "CREATE INDEX `idx_plugins_author` ON `plugins` (`author`)",
      "CREATE INDEX `idx_plugins_category` ON `plugins` (`category`)",
      "CREATE INDEX `idx_plugins_status` ON `plugins` (`status`)",
      "CREATE INDEX `idx_plugins_featured` ON `plugins` (`featured`)",
      "CREATE INDEX `idx_plugins_created` ON `plugins` (`created` DESC)",
      "CREATE INDEX `idx_plugins_status_featured` ON `plugins` (`status`, `featured`)"
    ],
    "listRule": "status = 'approved' || author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
    "viewRule": "status = 'approved' || author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
    "createRule": "@request.auth.id != ''",
    "updateRule": "author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
    "deleteRule": "@request.auth.role = 'admin'"
  },
  {
    "id": "plugin_versions",
    "name": "plugin_versions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "id": "plugin",
        "name": "plugin",
        "type": "relation",
        "system": false,
        "required": true,
        "options": {
          "collectionId": "plugins",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": ["name"]
        }
      },
      {
        "id": "version",
        "name": "version",
        "type": "text",
        "system": false,
        "required": true,
        "options": {
          "min": 1,
          "max": 20,
          "pattern": "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$"
        }
      },
      {
        "id": "changelog",
        "name": "changelog",
        "type": "text",
        "system": false,
        "required": false,
        "options": {
          "min": null,
          "max": 10000,
          "pattern": ""
        }
      },
      {
        "id": "download_url",
        "name": "download_url",
        "type": "url",
        "system": false,
        "required": true,
        "options": {
          "exceptDomains": [],
          "onlyDomains": []
        }
      },
      {
        "id": "pocketbase_version",
        "name": "pocketbase_version",
        "type": "text",
        "system": false,
        "required": true,
        "options": {
          "min": 1,
          "max": 20,
          "pattern": "^>=?\\s*(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$"
        }
      },
      {
        "id": "checksum",
        "name": "checksum",
        "type": "text",
        "system": false,
        "required": false,
        "options": {
          "min": null,
          "max": 64,
          "pattern": "^[a-f0-9]{64}$"
        }
      },
      {
        "id": "file_size",
        "name": "file_size",
        "type": "number",
        "system": false,
        "required": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "id": "downloads",
        "name": "downloads",
        "type": "number",
        "system": false,
        "required": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "id": "prerelease",
        "name": "prerelease",
        "type": "bool",
        "system": false,
        "required": false,
        "options": {}
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_plugin_versions_plugin` ON `plugin_versions` (`plugin`)",
      "CREATE INDEX `idx_plugin_versions_created` ON `plugin_versions` (`created` DESC)",
      "CREATE UNIQUE INDEX `idx_plugin_versions_plugin_version` ON `plugin_versions` (`plugin`, `version`)"
    ],
    "listRule": "plugin.status = 'approved' || plugin.author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
    "viewRule": "plugin.status = 'approved' || plugin.author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
    "createRule": "plugin.author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
    "updateRule": "plugin.author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
    "deleteRule": "@request.auth.role = 'admin'"
  },
  {
    "id": "plugin_stats",
    "name": "plugin_stats",
    "type": "base",
    "system": false,
    "schema": [
      {
        "id": "plugin",
        "name": "plugin",
        "type": "relation",
        "system": false,
        "required": true,
        "options": {
          "collectionId": "plugins",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": ["name"]
        }
      },
      {
        "id": "downloads_total",
        "name": "downloads_total",
        "type": "number",
        "system": false,
        "required": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "id": "downloads_weekly",
        "name": "downloads_weekly",
        "type": "number",
        "system": false,
        "required": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "id": "views_total",
        "name": "views_total",
        "type": "number",
        "system": false,
        "required": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "id": "views_weekly",
        "name": "views_weekly",
        "type": "number",
        "system": false,
        "required": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "id": "stars",
        "name": "stars",
        "type": "number",
        "system": false,
        "required": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_plugin_stats_plugin` ON `plugin_stats` (`plugin`)",
      "CREATE INDEX `idx_plugin_stats_downloads` ON `plugin_stats` (`downloads_total` DESC)",
      "CREATE INDEX `idx_plugin_stats_stars` ON `plugin_stats` (`stars` DESC)",
      "CREATE INDEX `idx_plugin_stats_weekly` ON `plugin_stats` (`downloads_weekly` DESC)"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.role = 'admin'",
    "updateRule": null,
    "deleteRule": "@request.auth.role = 'admin'"
  },
  {
    "id": "showcase",
    "name": "showcase",
    "type": "base",
    "system": false,
    "schema": [
      {
        "id": "author",
        "name": "author",
        "type": "relation",
        "system": false,
        "required": false,
        "options": {
          "collectionId": "users",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": ["username"]
        }
      },
      {
        "id": "title",
        "name": "title",
        "type": "text",
        "system": false,
        "required": true,
        "options": {
          "min": 3,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "id": "description",
        "name": "description",
        "type": "text",
        "system": false,
        "required": true,
        "options": {
          "min": 10,
          "max": 1000,
          "pattern": ""
        }
      },
      {
        "id": "url",
        "name": "url",
        "type": "url",
        "system": false,
        "required": true,
        "options": {
          "exceptDomains": [],
          "onlyDomains": []
        }
      },
      {
        "id": "repository",
        "name": "repository",
        "type": "url",
        "system": false,
        "required": false,
        "options": {
          "exceptDomains": [],
          "onlyDomains": []
        }
      },
      {
        "id": "thumbnail",
        "name": "thumbnail",
        "type": "file",
        "system": false,
        "required": false,
        "options": {
          "mimeTypes": ["image/png", "image/jpeg", "image/webp"],
          "thumbs": ["320x240", "640x480"],
          "maxSelect": 1,
          "maxSize": 2097152,
          "protected": false
        }
      },
      {
        "id": "category",
        "name": "category",
        "type": "select",
        "system": false,
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": [
            "saas",
            "ecommerce",
            "cms",
            "mobile",
            "desktop",
            "api",
            "tool",
            "game",
            "other"
          ]
        }
      },
      {
        "id": "tags",
        "name": "tags",
        "type": "json",
        "system": false,
        "required": false,
        "options": {
          "maxSize": 2000
        }
      },
      {
        "id": "status",
        "name": "status",
        "type": "select",
        "system": false,
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": ["pending", "approved", "rejected"]
        }
      },
      {
        "id": "featured",
        "name": "featured",
        "type": "bool",
        "system": false,
        "required": false,
        "options": {}
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_showcase_author` ON `showcase` (`author`)",
      "CREATE INDEX `idx_showcase_category` ON `showcase` (`category`)",
      "CREATE INDEX `idx_showcase_status` ON `showcase` (`status`)",
      "CREATE INDEX `idx_showcase_featured` ON `showcase` (`featured`)",
      "CREATE INDEX `idx_showcase_created` ON `showcase` (`created` DESC)"
    ],
    "listRule": "status = 'approved' || author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
    "viewRule": "status = 'approved' || author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
    "createRule": "",
    "updateRule": "author = @request.auth.id || @request.auth.role ~ 'admin|moderator'",
    "deleteRule": "author = @request.auth.id || @request.auth.role = 'admin'"
  },
  {
    "id": "mirrors",
    "name": "mirrors",
    "type": "base",
    "system": false,
    "schema": [
      {
        "id": "name",
        "name": "name",
        "type": "text",
        "system": false,
        "required": true,
        "options": {
          "min": 2,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "id": "base_url",
        "name": "base_url",
        "type": "url",
        "system": false,
        "required": true,
        "options": {
          "exceptDomains": [],
          "onlyDomains": []
        }
      },
      {
        "id": "region",
        "name": "region",
        "type": "select",
        "system": false,
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": [
            "cn-north",
            "cn-south",
            "cn-east",
            "hk",
            "sg",
            "us-west",
            "us-east",
            "eu"
          ]
        }
      },
      {
        "id": "provider",
        "name": "provider",
        "type": "text",
        "system": false,
        "required": true,
        "options": {
          "min": 2,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "id": "priority",
        "name": "priority",
        "type": "number",
        "system": false,
        "required": false,
        "options": {
          "min": 1,
          "max": 1000,
          "noDecimal": true
        }
      },
      {
        "id": "status",
        "name": "status",
        "type": "select",
        "system": false,
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": ["active", "maintenance", "disabled"]
        }
      },
      {
        "id": "health_check_url",
        "name": "health_check_url",
        "type": "url",
        "system": false,
        "required": false,
        "options": {
          "exceptDomains": [],
          "onlyDomains": []
        }
      },
      {
        "id": "last_check",
        "name": "last_check",
        "type": "date",
        "system": false,
        "required": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "id": "latency_ms",
        "name": "latency_ms",
        "type": "number",
        "system": false,
        "required": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_mirrors_name` ON `mirrors` (`name`)",
      "CREATE INDEX `idx_mirrors_region` ON `mirrors` (`region`)",
      "CREATE INDEX `idx_mirrors_status` ON `mirrors` (`status`)",
      "CREATE INDEX `idx_mirrors_priority` ON `mirrors` (`priority`)"
    ],
    "listRule": "status = 'active' || @request.auth.role = 'admin'",
    "viewRule": "status = 'active' || @request.auth.role = 'admin'",
    "createRule": "@request.auth.role = 'admin'",
    "updateRule": "@request.auth.role = 'admin'",
    "deleteRule": "@request.auth.role = 'admin'"
  },
  {
    "id": "newsletter",
    "name": "newsletter",
    "type": "base",
    "system": false,
    "schema": [
      {
        "id": "email",
        "name": "email",
        "type": "email",
        "system": false,
        "required": true,
        "options": {
          "exceptDomains": [],
          "onlyDomains": []
        }
      },
      {
        "id": "status",
        "name": "status",
        "type": "select",
        "system": false,
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": ["pending", "confirmed", "unsubscribed"]
        }
      },
      {
        "id": "token",
        "name": "token",
        "type": "text",
        "system": false,
        "required": true,
        "options": {
          "min": 32,
          "max": 64,
          "pattern": "^[a-zA-Z0-9]+$"
        }
      },
      {
        "id": "subscribed_at",
        "name": "subscribed_at",
        "type": "date",
        "system": false,
        "required": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "id": "confirmed_at",
        "name": "confirmed_at",
        "type": "date",
        "system": false,
        "required": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "id": "unsubscribed_at",
        "name": "unsubscribed_at",
        "type": "date",
        "system": false,
        "required": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "id": "source",
        "name": "source",
        "type": "text",
        "system": false,
        "required": false,
        "options": {
          "min": null,
          "max": 100,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_newsletter_email` ON `newsletter` (`email`)",
      "CREATE UNIQUE INDEX `idx_newsletter_token` ON `newsletter` (`token`)",
      "CREATE INDEX `idx_newsletter_status` ON `newsletter` (`status`)"
    ],
    "listRule": "@request.auth.role = 'admin'",
    "viewRule": "@request.auth.role = 'admin'",
    "createRule": "",
    "updateRule": null,
    "deleteRule": "@request.auth.role = 'admin'"
  }
]
```

---

## 5. Seed Data

### 5.1 Initial Admin User

```json
{
  "collection": "users",
  "data": {
    "email": "admin@pocketbase.cn",
    "username": "admin",
    "github_id": 0,
    "avatar": "",
    "bio": "PocketBase.cn Administrator",
    "website": "https://pocketbase.cn",
    "role": "admin",
    "verified": true
  }
}
```

### 5.2 Sample Mirrors

```json
{
  "collection": "mirrors",
  "data": [
    {
      "name": "Aliyun OSS (Beijing)",
      "base_url": "https://pocketbase-cn.oss-cn-beijing.aliyuncs.com",
      "region": "cn-north",
      "provider": "Alibaba Cloud",
      "priority": 10,
      "status": "active",
      "health_check_url": "https://pocketbase-cn.oss-cn-beijing.aliyuncs.com/health"
    },
    {
      "name": "Tencent COS (Shanghai)",
      "base_url": "https://pocketbase-cn-1234567890.cos.ap-shanghai.myqcloud.com",
      "region": "cn-east",
      "provider": "Tencent Cloud",
      "priority": 20,
      "status": "active",
      "health_check_url": "https://pocketbase-cn-1234567890.cos.ap-shanghai.myqcloud.com/health"
    },
    {
      "name": "GitHub Releases (Fallback)",
      "base_url": "https://github.com/pocketbase/pocketbase/releases/download",
      "region": "us-west",
      "provider": "GitHub",
      "priority": 100,
      "status": "active"
    }
  ]
}
```

### 5.3 Sample Plugin

```json
{
  "collection": "plugins",
  "data": {
    "author": "{{admin_user_id}}",
    "name": "WeChat Auth",
    "slug": "wechat-auth",
    "description": "WeChat OAuth2 authentication provider for PocketBase. Supports both Web and Mini Program login flows.",
    "readme": "# WeChat Auth for PocketBase\n\nThis plugin adds WeChat OAuth2 authentication...",
    "repository": "https://github.com/pocketbase-cn/wechat-auth",
    "homepage": "https://pocketbase.cn/plugins/wechat-auth",
    "category": "auth",
    "tags": ["wechat", "oauth", "authentication", "china"],
    "license": "MIT",
    "status": "approved",
    "featured": true
  }
}
```

### 5.4 Sample Plugin Version

```json
{
  "collection": "plugin_versions",
  "data": {
    "plugin": "{{wechat_auth_plugin_id}}",
    "version": "1.0.0",
    "changelog": "## v1.0.0\n\n- Initial release\n- Web OAuth2 login\n- Mini Program login\n- Session management",
    "download_url": "https://github.com/pocketbase-cn/wechat-auth/releases/download/v1.0.0/wechat-auth-1.0.0.zip",
    "pocketbase_version": ">=0.22.0",
    "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "file_size": 102400,
    "downloads": 0,
    "prerelease": false
  }
}
```

### 5.5 Sample Showcase

```json
{
  "collection": "showcase",
  "data": [
    {
      "author": "{{admin_user_id}}",
      "title": "PocketBase Admin Dashboard",
      "description": "A modern admin dashboard template built with Vue 3 and PocketBase. Features real-time updates, dark mode, and responsive design.",
      "url": "https://demo.pocketbase.cn/admin-dashboard",
      "repository": "https://github.com/pocketbase-cn/admin-dashboard",
      "category": "tool",
      "tags": ["vue", "dashboard", "admin", "template"],
      "status": "approved",
      "featured": true
    }
  ]
}
```

---

## 6. Query Patterns

### 6.1 Plugin Marketplace Queries

#### List Approved Plugins (Paginated with Stats)

```javascript
// GET /api/collections/plugins/records
const params = {
  filter: 'status = "approved"',
  sort: "-created",
  expand: "author",
  fields: "id,name,slug,description,category,tags,icon,author,created",
  page: 1,
  perPage: 20,
};

// Join with stats (client-side or via view)
const stats = await pb.collection("plugin_stats").getList(1, 100, {
  filter: `plugin ?~ "${pluginIds.join('","')}"`,
  sort: "-downloads_total",
});
```

#### Plugin Detail with Versions

```javascript
// GET /api/collections/plugins/records/:id
const plugin = await pb.collection("plugins").getOne(pluginId, {
  expand: "author",
});

// GET /api/collections/plugin_versions/records
const versions = await pb.collection("plugin_versions").getList(1, 50, {
  filter: `plugin = "${pluginId}"`,
  sort: "-created",
});

// GET /api/collections/plugin_stats/records
const stats = await pb
  .collection("plugin_stats")
  .getFirstListItem(`plugin = "${pluginId}"`);
```

#### Search Plugins

```javascript
// Full-text search with filters
const params = {
  filter: `status = "approved" && (name ~ "${query}" || description ~ "${query}" || tags ?~ "${query}")`,
  sort: "-featured,-created",
  expand: "author",
};
```

#### Featured Plugins

```javascript
const params = {
  filter: 'status = "approved" && featured = true',
  sort: "-created",
  perPage: 6,
  expand: "author",
};
```

#### Plugins by Category

```javascript
const params = {
  filter: `status = "approved" && category = "${category}"`,
  sort: "-created",
  expand: "author",
};
```

#### Popular Plugins (Sorted by Downloads)

```javascript
// First get top stats
const topStats = await pb.collection("plugin_stats").getList(1, 20, {
  sort: "-downloads_total",
});

// Then fetch corresponding plugins
const pluginIds = topStats.items.map((s) => s.plugin);
const plugins = await pb.collection("plugins").getList(1, 20, {
  filter: `id ?~ "${pluginIds.join('","')}" && status = "approved"`,
  expand: "author",
});
```

### 6.2 User Queries

#### User Profile with Plugins

```javascript
const user = await pb.collection("users").getOne(userId);

const plugins = await pb.collection("plugins").getList(1, 50, {
  filter: `author = "${userId}" && status = "approved"`,
  sort: "-created",
});

const showcase = await pb.collection("showcase").getList(1, 50, {
  filter: `author = "${userId}" && status = "approved"`,
  sort: "-created",
});
```

### 6.3 Mirror Selection

#### Get Best Mirror by Region

```javascript
const mirrors = await pb.collection("mirrors").getList(1, 10, {
  filter: `status = "active" && region = "${userRegion}"`,
  sort: "priority,latency_ms",
});

const bestMirror = mirrors.items[0];
const downloadUrl = `${bestMirror.base_url}/${version}/pocketbase_${version}_linux_amd64.zip`;
```

### 6.4 Admin Queries

#### Pending Moderation Queue

```javascript
// Plugins pending approval
const pendingPlugins = await pb.collection("plugins").getList(1, 50, {
  filter: 'status = "pending"',
  sort: "created",
  expand: "author",
});

// Showcase pending approval
const pendingShowcase = await pb.collection("showcase").getList(1, 50, {
  filter: 'status = "pending"',
  sort: "created",
  expand: "author",
});
```

#### Newsletter Statistics

```javascript
const stats = {
  total: await pb.collection("newsletter").getList(1, 1, {}).totalItems,
  confirmed: await pb.collection("newsletter").getList(1, 1, {
    filter: 'status = "confirmed"',
  }).totalItems,
  pending: await pb.collection("newsletter").getList(1, 1, {
    filter: 'status = "pending"',
  }).totalItems,
};
```

---

## 7. Performance Optimization

### 7.1 Index Strategy

#### Covering Indexes

The schema uses covering indexes for common query patterns:

```sql
-- Plugin listing: covers filter + sort
CREATE INDEX idx_plugins_status_featured ON plugins(status, featured);

-- Plugin stats ranking
CREATE INDEX idx_plugin_stats_downloads ON plugin_stats(downloads_total DESC);
CREATE INDEX idx_plugin_stats_weekly ON plugin_stats(downloads_weekly DESC);
```

#### Composite Indexes for Relations

```sql
-- Version lookup by plugin
CREATE UNIQUE INDEX idx_plugin_versions_plugin_version ON plugin_versions(plugin, version);
```

### 7.2 Query Optimization Tips

1. **Avoid N+1 Queries**
   - Use `expand` parameter for related records
   - Batch fetch stats using `?~` operator

2. **Pagination**
   - Always use pagination for lists
   - Default `perPage: 20`, max `perPage: 100`

3. **Field Selection**
   - Use `fields` parameter to reduce payload
   - Exclude large text fields (readme, changelog) from lists

4. **Caching Strategy**
   ```javascript
   // Cache-Control headers for static content
   // plugins list: max-age=60 (1 min)
   // plugin detail: max-age=300 (5 min)
   // mirrors: max-age=3600 (1 hour)
   // stats: no-cache (real-time)
   ```

### 7.3 Stats Separation Pattern

The `plugin_stats` collection is separated from `plugins` to:

1. **Reduce Write Contention**: Stats updates (views, downloads) are high-frequency writes that would lock the main plugins table.

2. **Enable Atomic Increments**:

   ```javascript
   // In pb_hooks
   $app.dao().runInTransaction((txDao) => {
     const stats = txDao.findFirstRecordByData(
       "plugin_stats",
       "plugin",
       pluginId,
     );
     stats.set("downloads_total", stats.getInt("downloads_total") + 1);
     txDao.saveRecord(stats);
   });
   ```

3. **Weekly Counter Reset**:
   ```javascript
   // Cron job (every Monday 00:00)
   cronAdd("reset_weekly_stats", "0 0 * * 1", () => {
     $app
       .dao()
       .db()
       .newQuery(
         `
       UPDATE plugin_stats SET downloads_weekly = 0, views_weekly = 0
     `,
       )
       .execute();
   });
   ```

### 7.4 File Storage Optimization

1. **Thumbnail Generation**
   - Icons: 100x100
   - Screenshots: 320x240, 640x480

2. **Size Limits**
   - Icons: 512KB max
   - Screenshots: 2MB each, 5 max

3. **Allowed Formats**
   - Icons: PNG, SVG
   - Images: PNG, JPEG, WebP

### 7.5 Database Maintenance

```javascript
// Scheduled cleanup tasks (pb_hooks)

// Clean unconfirmed newsletter subscriptions (older than 7 days)
cronAdd("cleanup_unconfirmed", "0 3 * * *", () => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  $app
    .dao()
    .db()
    .newQuery(
      `
    DELETE FROM newsletter
    WHERE status = 'pending' AND created < {:cutoff}
  `,
    )
    .bind({ cutoff })
    .execute();
});

// Vacuum database weekly
cronAdd("vacuum_db", "0 4 * * 0", () => {
  $app.dao().db().newQuery("VACUUM").execute();
});
```

---

## Appendix A: PocketBase Hooks

### A.1 Auto-create Plugin Stats

```javascript
// pb_hooks/plugin_stats.pb.js
onRecordAfterCreateRequest((e) => {
  if (e.collection.name === "plugins") {
    const stats = new Record(
      e.collection.app.dao().findCollectionByNameOrId("plugin_stats"),
    );
    stats.set("plugin", e.record.id);
    stats.set("downloads_total", 0);
    stats.set("downloads_weekly", 0);
    stats.set("views_total", 0);
    stats.set("views_weekly", 0);
    stats.set("stars", 0);
    e.collection.app.dao().saveRecord(stats);
  }
}, "plugins");
```

### A.2 Newsletter Token Generation

```javascript
// pb_hooks/newsletter.pb.js
onRecordBeforeCreateRequest((e) => {
  if (e.collection.name === "newsletter") {
    const token = $security.randomString(32);
    e.record.set("token", token);
    e.record.set("status", "pending");
    e.record.set("subscribed_at", new Date().toISOString());

    // Send confirmation email
    $app.newMailClient().send({
      to: [{ address: e.record.getString("email") }],
      subject: "Confirm your subscription to PocketBase.cn",
      html: `<a href="https://pocketbase.cn/api/newsletter/confirm/${token}">Confirm</a>`,
    });
  }
}, "newsletter");
```

---

## Appendix B: OAuth2 Configuration

### GitHub OAuth Setup

```javascript
// settings.json
{
  "github": {
    "enabled": true,
    "clientId": "{{GITHUB_CLIENT_ID}}",
    "clientSecret": "{{GITHUB_CLIENT_SECRET}}",
    "authUrl": "https://github.com/login/oauth/authorize",
    "tokenUrl": "https://github.com/login/oauth/access_token",
    "userApiUrl": "https://api.github.com/user"
  }
}
```

### User Creation Hook

```javascript
// pb_hooks/github_oauth.pb.js
onRecordAuthWithOAuth2Request((e) => {
  if (e.providerName === "github") {
    e.record.set("github_id", e.oAuth2User.id);
    e.record.set("avatar", e.oAuth2User.avatarUrl);
    e.record.set("role", "user");
    e.record.set("verified", false);
  }
}, "users");
```

---

_Document generated for PocketBase.cn v1.0.0_
