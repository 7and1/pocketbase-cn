/// <reference path="../types.d.ts" />

// PocketBase releases sync + notifications.
// Keep the route/cron callbacks self-contained (JSVM handlers are isolated).

// Scheduled sync (every 30 minutes). Guard in case cronAdd isn't available in this build.
try {
  cronAdd("pb_release_sync", "*/30 * * * *", function () {
    try {
      require(__hooks + "/lib/release_sync.js").syncPocketBaseReleases();
    } catch (err) {
      console.error("[RELEASE_SYNC] Failed:", err);
    }
  });
} catch (_) {}

// Reset weekly stats every Monday at 00:00 UTC.
try {
  cronAdd("reset_weekly_stats", "0 0 * * 1", function () {
    try {
      $app
        .db()
        .newQuery(
          "UPDATE plugin_stats SET downloads_weekly = 0, views_weekly = 0",
        )
        .execute();
      console.log("[STATS] Weekly stats reset completed");
    } catch (err) {
      console.error("[STATS] Weekly stats reset failed:", err);
    }
  });
} catch (_) {}

// Manual trigger (superusers only).
routerAdd(
  "POST",
  "/api/admin/releases/sync",
  function (c) {
    var pbcn = require(__hooks + "/lib/pbcn.js");

    var ip = "";
    try {
      ip = c.realIP();
    } catch (_) {}

    if (
      !pbcn.rateLimitAllow({
        id: "admin_release_sync",
        windowSec: 60,
        max: 5,
        key: ip || "anon",
      })
    ) {
      return c.json(429, {
        error: { code: "RATE_LIMITED", message: "Too many requests" },
      });
    }

    return c.json(200, {
      data: require(__hooks + "/lib/release_sync.js").syncPocketBaseReleases(),
    });
  },
  $apis.requireAuth("_superusers"),
);
