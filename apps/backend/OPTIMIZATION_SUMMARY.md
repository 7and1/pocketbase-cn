# Backend Optimization Summary

## Changes Made

### 1. P0-2: Rate Limit Cleanup (`05_security.pb.js`)

**Endpoint Added:** `POST /api/admin/rate-limits/cleanup`

- Deletes expired rate limit records older than 24 hours
- Requires staff role access
- Batches deletion up to 500 records at a time
- Logs cleanup results

**Usage:**

```bash
curl -X POST http://localhost:8090/api/admin/rate-limits/cleanup \
  -H "Authorization: Bearer <token>"
```

### 2. P2-B1: README Fetching Optimization (`70_readme_fetcher.pb.js`)

**Changes:**

- Added `fetchReadmeWithCache()` function with 7-day cache
- Reads from `readme_cache` collection before hitting GitHub API
- Cache key format: `owner/repo`
- Misses are cached after successful fetch

**Required Collection:** `readme_cache`

- Fields: `repo_key` (text, unique), `content` (text), `updated` (auto)

### 3. Database Indexes (`pb_data/migrations/1736660000_performance_indexes.sql`)

**Indexes Created:**

```sql
-- Plugins
CREATE INDEX idx_plugins_status_featured_created ON plugins (status, featured, created DESC);
CREATE INDEX idx_plugins_slug ON plugins (slug);

-- Downloads
CREATE INDEX idx_downloads_plugin_version ON downloads (plugin, version);

-- Comments
CREATE INDEX idx_comments_created_approved ON comments (created DESC, approved);

-- Showcase
CREATE INDEX idx_showcase_status_featured_created ON showcase (status, featured, created DESC);
CREATE INDEX idx_showcase_slug ON showcase (slug);

-- Plugin stats
CREATE INDEX idx_plugin_stats_plugin ON plugin_stats (plugin);

-- Rate limits
CREATE INDEX idx_rate_limits_key_endpoint_window ON rate_limits (key, endpoint, window_start);

-- Showcase votes
CREATE INDEX idx_showcase_votes_showcase ON showcase_votes (showcase);

-- Newsletter
CREATE INDEX idx_newsletter_email ON newsletter (email);

-- Readme cache
CREATE INDEX idx_readme_cache_repo_key ON readme_cache (repo_key);

-- View logs
CREATE INDEX idx_view_logs_plugin_date ON view_logs (plugin, created);
```

**Apply migration:**

```bash
sqlite3 pb_data/data.db < pb_data/migrations/1736660000_performance_indexes.sql
```

### 4. P2-B3: Structured Logging (`lib/logger.js`)

**New Utility Module:**

```javascript
var logger = require(__hooks + "/lib/logger.js");

// With context
logger.info("search", "Search completed", { results: 10 });
logger.error("api", "Request failed", { error: "timeout" });

// Shorthand
logger.logInfo("Search completed");
logger.logError("Request failed");
```

**Features:**

- JSON-formatted log entries
- Log levels: DEBUG, INFO, WARN, ERROR
- Environment-based level control via `PB_LOG_LEVEL`
- Request ID correlation support

### 5. Batch Loading Optimization

**Status:** Already implemented correctly

- `batchLoadPluginStats()` in `lib/pbcn.js` uses proper IN queries
- `batchLoadShowcaseVotes()` in `lib/pbcn.js` uses proper IN queries
- All API endpoints use these batch helpers

### 6. FTS5 Full-Text Search (`20_search.pb.js`)

**New Endpoints:**

1. `POST /api/admin/search/init-fts` - Initialize FTS5 tables (staff only)
   - Creates `plugins_fts` virtual table
   - Creates `showcase_fts` virtual table
   - Sets up INSERT/UPDATE/DELETE triggers

2. `GET /api/search/fts` - FTS-powered search endpoint
   - Falls back to LIKE search if FTS not available
   - Returns `meta.fts: true/false` to indicate method used

**Setup:**

```bash
# Initialize FTS (one-time setup)
curl -X POST http://localhost:8090/api/admin/search/init-fts \
  -H "Authorization: Bearer <token>"
```

**Usage:**

```bash
# FTS search (faster for large datasets)
curl "http://localhost:8090/api/search/fts?q=database&type=plugins&limit=20"

# Legacy search (still supported)
curl "http://localhost:8090/api/search?q=database&type=plugins"
```

## Deployment Checklist

1. Create `readme_cache` collection in PocketBase Admin UI
2. Run performance indexes migration SQL
3. (Optional) Initialize FTS5 tables via admin endpoint
4. Set `PB_LOG_LEVEL` environment variable if needed
5. Set up cron job for rate limit cleanup (e.g., daily)

## Collection Schema Requirements

### readme_cache (new collection)

- `repo_key` - Text (unique, required)
- `content` - Text (required)
- `created` - Auto now
- `updated` - Auto now update
