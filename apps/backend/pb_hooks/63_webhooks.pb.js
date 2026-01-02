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
  if (secret) {
    var info = c.requestInfo() || {};
    var token = pbcn.trim(
      header(info, "x-pbcn-token") || header(info, "x-webhook-token"),
    );

    if (!token || token !== secret) {
      return c.json(401, {
        error: { code: "UNAUTHORIZED", message: "Invalid webhook token" },
      });
    }
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
