/// <reference path="../types.d.ts" />

// Custom probes (PocketBase already provides /api/health).
routerAdd("GET", "/api/live", function (c) {
  try {
    if (c.response && c.response.header) {
      c.response
        .header()
        .set("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  } catch (_) {}
  return c.json(200, { alive: true, timestamp: new Date().toISOString() });
});

routerAdd("GET", "/api/ready", function (c) {
  try {
    // DB probe (avoid raw SQL because dbx query scanners require special types).
    $app.countRecords("_superusers");
    try {
      if (c.response && c.response.header) {
        c.response
          .header()
          .set("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    } catch (_) {}
    return c.json(200, { ready: true });
  } catch (err) {
    return c.json(503, {
      ready: false,
    });
  }
});

// Backup status endpoint - checks Litestream replication health
// Requires Litestream to be configured with S3/R2 backend
routerAdd("GET", "/api/health/backup", function (c) {
  try {
    if (c.response && c.response.header) {
      c.response
        .header()
        .set("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  } catch (_) {}

  // Check if Litestream is configured
  var hasLitestream = false;
  var bucket = "";
  try {
    bucket = $os.getenv("LITESTREAM_BUCKET") || "";
    hasLitestream = !!bucket;
  } catch (_) {}

  if (!hasLitestream) {
    return c.json(503, {
      healthy: false,
      message: "Litestream backup not configured",
      configured: false,
    });
  }

  // Parse configurable threshold (default 1 hour)
  var maxAgeSeconds = 3600;
  try {
    var envMaxAge = $os.getenv("BACKUP_MAX_AGE_SECONDS") || "";
    if (envMaxAge) {
      var parsed = parseInt(String(envMaxAge), 10);
      if (!isNaN(parsed) && parsed > 0) {
        maxAgeSeconds = parsed;
      }
    }
  } catch (_) {}

  // Check last backup by reading Litestream db file modification time
  // Litestream maintains checkpoint info in auxiliary.db
  var fs = require("fs");
  var dbPath = "/opt/pocketbase/pb_data/data.db";
  var lastBackupTime = null;
  var backupAgeSeconds = null;

  try {
    var stats = fs.stat(dbPath);
    if (stats && stats.mtime) {
      lastBackupTime = new Date(stats.mtime);
      backupAgeSeconds = Math.floor(
        (Date.now() - lastBackupTime.getTime()) / 1000,
      );
    }
  } catch (err) {
    return c.json(503, {
      healthy: false,
      message: "Cannot determine last backup time",
      configured: true,
      error: "db_stat_failed",
    });
  }

  var healthy = backupAgeSeconds !== null && backupAgeSeconds <= maxAgeSeconds;

  return c.json(200, {
    healthy: healthy,
    configured: true,
    bucket: bucket,
    lastBackupTime: lastBackupTime ? lastBackupTime.toISOString() : null,
    backupAgeSeconds: backupAgeSeconds,
    maxAgeSeconds: maxAgeSeconds,
    status: healthy ? "ok" : "stale",
  });
});
