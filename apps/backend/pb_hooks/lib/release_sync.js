/// <reference path="../../types.d.ts" />

function githubHeaders() {
  var headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "pocketbase-cn-sync",
  };
  var token = $os.getenv("GITHUB_TOKEN") || "";
  if (token) headers.Authorization = "Bearer " + token;
  return headers;
}

function fetchJson(url) {
  try {
    var res = $http.send({
      url: url,
      method: "GET",
      timeout: 20,
      headers: githubHeaders(),
    });
    if (!res || res.statusCode < 200 || res.statusCode >= 300) return null;
    return JSON.parse(res.raw || "null");
  } catch (_) {
    return null;
  }
}

function fetchText(url) {
  try {
    var res = $http.send({
      url: url,
      method: "GET",
      timeout: 20,
      headers: githubHeaders(),
    });
    if (!res || res.statusCode < 200 || res.statusCode >= 300) return null;
    return res.raw || null;
  } catch (_) {
    return null;
  }
}

function parseChecksums(text) {
  var map = {};
  var lines = String(text || "").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = String(lines[i] || "").replace(/^\s+|\s+$/g, "");
    if (!line) continue;
    var m = line.match(/^([a-f0-9]{64})\s+[* ](.+)$/i);
    if (!m) continue;
    map[String(m[2])] = String(m[1]).toLowerCase();
  }
  return map;
}

function hasMarker(key, endpoint) {
  try {
    $app.findFirstRecordByFilter("rate_limits", "key={:k} && endpoint={:e}", {
      k: String(key),
      e: String(endpoint),
    });
    return true;
  } catch (_) {
    return false;
  }
}

function createMarker(key, endpoint) {
  try {
    var col = $app.findCollectionByNameOrId("rate_limits");
    var r = new Record(col);
    r.set("key", String(key));
    r.set("endpoint", String(endpoint));
    r.set("count", 1);
    r.set("window_start", new Date().toISOString());
    $app.save(r);
    return true;
  } catch (_) {
    return false;
  }
}

function upsertDownload(row) {
  try {
    var existing = $app.findFirstRecordByFilter(
      "downloads",
      "version={:v} && platform={:p} && arch={:a}",
      { v: row.version, p: row.platform, a: row.arch },
    );
    existing.set("checksum", row.checksum || "");
    existing.set("size", row.size || 0);
    existing.set("prerelease", !!row.prerelease);
    existing.set("published_at", row.published_at || null);
    existing.set("url", row.url || null);
    $app.save(existing);
    return { created: false, record: existing };
  } catch (_) {
    var col = $app.findCollectionByNameOrId("downloads");
    var r = new Record(col);
    r.set("version", row.version);
    r.set("platform", row.platform);
    r.set("arch", row.arch);
    r.set("checksum", row.checksum || "");
    r.set("size", row.size || 0);
    r.set("prerelease", !!row.prerelease);
    r.set("published_at", row.published_at || null);
    r.set("url", row.url || null);
    $app.save(r);
    return { created: true, record: r };
  }
}

function sendReleaseWebhook(version, url) {
  var hook = $os.getenv("ALERT_WEBHOOK_URL") || "";
  if (!hook) return false;
  try {
    $http.send({
      url: hook,
      method: "POST",
      timeout: 10,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "[RELEASE] PocketBase v" + version + " " + (url || ""),
      }),
    });
    return true;
  } catch (_) {
    return false;
  }
}

function sendReleaseEmails(version) {
  var apiKey = $os.getenv("RESEND_API_KEY") || "";
  var from = $os.getenv("NEWSLETTER_FROM") || $os.getenv("RESEND_FROM") || "";
  var base = (
    $os.getenv("PUBLIC_SITE_URL") ||
    $os.getenv("SITE_URL") ||
    ""
  ).replace(/\/+$/g, "");
  var link = base
    ? base + "/downloads?version=" + encodeURIComponent(version)
    : "";

  if (!apiKey || !from) {
    sendReleaseWebhook(version, link);
    return { attempted: 0, sent: 0, via: "webhook" };
  }

  var subscribers = $app.findRecordsByFilter(
    "newsletter",
    "status='confirmed'",
    "-created",
    0,
    0,
  );
  var subject = "PocketBase v" + version + " 已发布";
  var text = "PocketBase v" + version + " 已发布。\n\n下载：\n" + link;
  var html =
    "<p><strong>PocketBase v" +
    version +
    "</strong> 已发布。</p>" +
    (link ? '<p><a href="' + link + '">前往下载页</a></p>' : "");

  var sent = 0;
  for (var i = 0; i < (subscribers || []).length; i++) {
    var to = String(subscribers[i].get("email") || "");
    if (!to) continue;
    try {
      var res = $http.send({
        url: "https://api.resend.com/emails",
        method: "POST",
        timeout: 20,
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: from,
          to: [to],
          subject: subject,
          text: text,
          html: html,
        }),
      });
      if (res && res.statusCode >= 200 && res.statusCode < 300) sent++;
    } catch (_) {}
  }

  return { attempted: (subscribers || []).length, sent: sent, via: "resend" };
}

function syncPocketBaseReleases() {
  var releases = fetchJson(
    "https://api.github.com/repos/pocketbase/pocketbase/releases?per_page=10",
  );
  if (!releases || !releases.length)
    return { ok: false, reason: "no_releases" };

  var includePrerelease =
    String($os.getenv("NEWSLETTER_INCLUDE_PRERELEASE") || "") === "1";
  var created = 0;
  var updated = 0;

  for (var ri = 0; ri < releases.length; ri++) {
    var rel = releases[ri] || {};
    var tag = String(rel.tag_name || "").replace(/^v/i, "");
    if (!tag) continue;

    var prerelease = !!rel.prerelease;
    var publishedAt = rel.published_at || null;

    var checksumMap = {};
    var assets = rel.assets || [];
    for (var ai = 0; ai < assets.length; ai++) {
      var aname = String(assets[ai].name || "");
      var lower = aname.toLowerCase();
      var isChecksumText =
        lower === "checksums.txt" ||
        lower.indexOf("checksum") >= 0 ||
        lower.indexOf("sha256") >= 0;
      if (isChecksumText && lower.indexOf(".txt") >= 0) {
        var raw = fetchText(String(assets[ai].browser_download_url || ""));
        if (raw) checksumMap = parseChecksums(raw);
      }
    }

    var relevant = 0;
    for (var aj = 0; aj < assets.length; aj++) {
      var asset = assets[aj] || {};
      var name = String(asset.name || "");
      if (!name) continue;

      var m = name.match(
        /^pocketbase_([0-9]+\.[0-9]+\.[0-9]+)_(darwin|linux|windows)_(amd64|arm64|386|armv7|ppc64le|s390x)\.zip$/i,
      );
      if (!m) continue;
      relevant++;

      var row = {
        version: String(m[1]),
        platform: String(m[2]).toLowerCase(),
        arch: String(m[3]).toLowerCase(),
        size: asset.size || 0,
        url: asset.browser_download_url || null,
        checksum: checksumMap[name] || "",
        prerelease: prerelease,
        published_at: publishedAt,
      };

      var r = upsertDownload(row);
      if (r.created) created++;
      else updated++;
    }

    // Notify once per version if we synced at least one file.
    if (relevant > 0) {
      if (
        (!prerelease || includePrerelease) &&
        !hasMarker("release_notified:" + tag, "release_notifications")
      ) {
        sendReleaseEmails(tag);
        createMarker("release_notified:" + tag, "release_notifications");
        sendReleaseWebhook(
          tag,
          ($os.getenv("PUBLIC_SITE_URL") || "") + "/downloads?version=" + tag,
        );
      }
    }
  }

  return { ok: true, created: created, updated: updated };
}

module.exports = {
  syncPocketBaseReleases: syncPocketBaseReleases,
};
