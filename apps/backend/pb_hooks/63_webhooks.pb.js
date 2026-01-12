/// <reference path="../types.d.ts" />

routerAdd("POST", "/api/webhooks/github/release", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");
  var rel = require(__hooks + "/lib/release_sync.js");

  function header(info, name) {
    var headers = info && info.headers ? info.headers : {};
    var target = String(name || "").toLowerCase();
    try {
      for (var k in headers) {
        if (String(k).toLowerCase() === target) return String(headers[k] || "");
      }
    } catch (_) {}
    return "";
  }

  var secret = pbcn.trim(pbcn.env("GITHUB_WEBHOOK_TOKEN", ""));

  // Fail-fast: webhook token must be configured in production
  var isDev =
    pbcn.trim(pbcn.env("PB_ENV", "")) === "development" ||
    pbcn.trim(pbcn.env("PB_ENV", "")) === "dev" ||
    pbcn.trim(pbcn.env("PB_ENV", "")) === "local";
  if (!secret && !isDev) {
    console.error("[WEBHOOK] GITHUB_WEBHOOK_TOKEN not configured");
    return c.json(500, {
      error: { code: "CONFIGURATION_ERROR", message: "Webhook not configured" },
    });
  }

  if (secret) {
    var info = c.requestInfo() || {};
    var token = pbcn.trim(
      header(info, "x-pbcn-token") || header(info, "x-webhook-token"),
    );

    if (!token || token !== secret) {
      console.warn(
        "[WEBHOOK] Invalid webhook token from: " + (c.realIP() || "unknown"),
      );
      return c.json(401, {
        error: { code: "UNAUTHORIZED", message: "Invalid webhook token" },
      });
    }
  } else if (!isDev) {
    // Should not reach here due to above check, but defensive coding
    return c.json(500, {
      error: { code: "CONFIGURATION_ERROR", message: "Webhook not configured" },
    });
  }

  var result = null;
  try {
    result = rel.syncPocketBaseReleases();
  } catch (e) {
    return c.json(500, {
      error: { code: "SYNC_FAILED", message: "Sync failed" },
    });
  }

  return c.json(200, { data: result || { ok: true } });
});
