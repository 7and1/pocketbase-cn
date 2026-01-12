/// <reference path="../types.d.ts" />

// Downloads API routes - all cache/ETag helpers are in lib/pbcn.js

routerAdd("GET", "/api/downloads/versions", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  var rows = $app.findRecordsByFilter("downloads", "", "-published_at", 200, 0);
  var seen = {};
  var versions = [];

  for (var i = 0; i < (rows || []).length; i++) {
    var r = rows[i];
    var v = pbcn.trim(r.get("version") || "");
    if (!v || seen[v]) continue;
    seen[v] = true;
    versions.push(v);
  }

  versions.sort(pbcn.semverDesc);

  var response = { data: versions };
  var etag = pbcn.generateETag(response);

  if (pbcn.checkETag(c, etag)) {
    return c.noContent(304);
  }

  pbcn.setCacheHeaders(
    c,
    etag,
    "public, max-age=600, s-maxage=1800, stale-while-revalidate=60",
  );
  return c.json(200, response);
});

routerAdd("GET", "/api/downloads/files", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  var info = c.requestInfo() || {};
  var version =
    info.query && info.query.version ? String(info.query.version) : "";
  version = pbcn.trim(version);
  if (!version) {
    return c.json(400, {
      error: { code: "MISSING_VERSION", message: "Missing version" },
    });
  }

  var rows = $app.findRecordsByFilter(
    "downloads",
    "version = {:version}",
    "platform,arch",
    0,
    0,
    { version: version },
  );

  var data = [];
  for (var i = 0; i < (rows || []).length; i++) {
    var r = rows[i];
    data.push({
      id: r.id,
      version: r.get("version"),
      platform: r.get("platform"),
      arch: r.get("arch"),
      checksum: r.get("checksum") || "",
      size: r.get("size") || 0,
      prerelease: !!r.get("prerelease"),
      published_at: r.get("published_at") || null,
      url: r.get("url") || null,
      file: r.get("file") || null,
    });
  }

  var response = { data: data };
  var etag = pbcn.generateETag(response);

  if (pbcn.checkETag(c, etag)) {
    return c.noContent(304);
  }

  pbcn.setCacheHeaders(
    c,
    etag,
    "public, max-age=600, s-maxage=1800, stale-while-revalidate=60",
  );
  return c.json(200, response);
});

routerAdd("POST", "/api/downloads/track", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  var ip = "";
  try {
    ip = c.realIP();
  } catch (_) {}

  if (
    !pbcn.rateLimitAllow({
      id: "downloads_track",
      windowSec: 60,
      max: 20,
      key: ip || "anon",
    })
  ) {
    return c.json(429, {
      error: { code: "RATE_LIMITED", message: "Too many requests" },
    });
  }

  var info = c.requestInfo() || {};
  var body = info.body || {};

  var version = pbcn.trim(body.version || "");
  var platform = pbcn.trim(body.platform || "");
  var arch = pbcn.trim(body.arch || "");

  if (!version || !platform || !arch) {
    return c.json(400, {
      error: { code: "INVALID_BODY", message: "Missing version/platform/arch" },
    });
  }

  var date = new Date().toISOString().slice(0, 10);

  try {
    var r = $app.findFirstRecordByFilter(
      "download_stats",
      "version={:version} && platform={:platform} && arch={:arch} && date={:date}",
      { version: version, platform: platform, arch: arch, date: date },
    );
    r.set("count", parseInt(String(r.get("count") || 0), 10) + 1);
    $app.save(r);
    return c.json(200, { data: { ok: true, counted: true } });
  } catch (_) {
    var col = $app.findCollectionByNameOrId("download_stats");
    var r2 = new Record(col);
    r2.set("version", version);
    r2.set("platform", platform);
    r2.set("arch", arch);
    r2.set("date", date);
    r2.set("count", 1);
    $app.save(r2);
    return c.json(200, { data: { ok: true, counted: true } });
  }
});
