// Shared helpers for PocketBase.cn hooks/routes.
// Keep ES5-compatible syntax (Goja).

function trim(s) {
  return String(s || "").replace(/^\s+|\s+$/g, "");
}

function env(key, fallback) {
  var v = $os.getenv(String(key));
  if (v) return String(v);
  return fallback != null ? String(fallback) : "";
}

function parseGitHubRepo(url) {
  if (!url) return null;
  var m = String(url).match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: String(m[2]).replace(/\.git$/i, "") };
}

function slugify(input) {
  var s = String(input || "")
    .replace(/^\s+|\s+$/g, "")
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "untitled";
}

function semverDesc(a, b) {
  var pa = String(a).split(".");
  var pb = String(b).split(".");
  for (var i = 0; i < 3; i++) {
    var da = parseInt(pa[i] || "0", 10) || 0;
    var db = parseInt(pb[i] || "0", 10) || 0;
    if (da !== db) return db - da;
  }
  return 0;
}

function ensurePluginStats(pluginId) {
  try {
    return $app.findFirstRecordByFilter("plugin_stats", "plugin = {:plugin}", {
      plugin: pluginId,
    });
  } catch (_) {
    var col = $app.findCollectionByNameOrId("plugin_stats");
    var r = new Record(col);
    r.set("plugin", pluginId);
    r.set("downloads_total", 0);
    r.set("downloads_weekly", 0);
    r.set("views_total", 0);
    r.set("views_weekly", 0);
    r.set("stars", 0);
    $app.save(r);
    return r;
  }
}

// Batch load showcase vote counts for multiple showcase IDs.
// Returns a Map-like object keyed by showcaseId.
function batchLoadShowcaseVotes(showcaseIds) {
  var votesMap = {};
  if (!showcaseIds || !showcaseIds.length) return votesMap;

  var placeholders = [];
  var params = {};
  for (var i = 0; i < showcaseIds.length; i++) {
    var key = "id" + i;
    placeholders.push("{:" + key + "}");
    params[key] = showcaseIds[i];
  }

  try {
    var votes = $app.findRecordsByFilter(
      "showcase_votes",
      "showcase IN (" + placeholders.join(",") + ")",
      "",
      0,
      0,
      params,
    );
    for (var j = 0; j < (votes || []).length; j++) {
      var v = votes[j];
      var sid = v.get("showcase");
      votesMap[sid] = (votesMap[sid] || 0) + 1;
    }
  } catch (_) {}

  for (var k = 0; k < showcaseIds.length; k++) {
    if (!votesMap[showcaseIds[k]]) {
      votesMap[showcaseIds[k]] = 0;
    }
  }

  return votesMap;
}

// Batch load plugin stats for multiple plugin IDs.
// Returns a Map-like object keyed by pluginId.
function batchLoadPluginStats(pluginIds) {
  var statsMap = {};
  if (!pluginIds || !pluginIds.length) return statsMap;

  // Build filter for batch query
  var placeholders = [];
  var params = {};
  for (var i = 0; i < pluginIds.length; i++) {
    var key = "p" + i;
    placeholders.push("{:" + key + "}");
    params[key] = pluginIds[i];
  }

  var filter = "plugin IN (" + placeholders.join(",") + ")";

  try {
    var statsList = $app.findRecordsByFilter(
      "plugin_stats",
      filter,
      "",
      0,
      0,
      params,
    );
    for (var j = 0; j < (statsList || []).length; j++) {
      var s = statsList[j];
      statsMap[s.get("plugin")] = s;
    }
  } catch (_) {}

  // Create missing stats records
  var col = null;
  for (var k = 0; k < pluginIds.length; k++) {
    var pid = pluginIds[k];
    if (!statsMap[pid]) {
      if (!col) col = $app.findCollectionByNameOrId("plugin_stats");
      var r = new Record(col);
      r.set("plugin", pid);
      r.set("downloads_total", 0);
      r.set("downloads_weekly", 0);
      r.set("views_total", 0);
      r.set("views_weekly", 0);
      r.set("stars", 0);
      try {
        $app.save(r);
        statsMap[pid] = r;
      } catch (_) {}
    }
  }

  return statsMap;
}

// Unified pagination parser with validation.
function parsePagination(query, defaults) {
  var limit =
    parseInt(String((query && query.limit) || defaults.limit), 10) ||
    defaults.limit;
  if (limit < 1) limit = defaults.limit;
  if (limit > defaults.maxLimit) limit = defaults.maxLimit;
  var offset = parseInt(String((query && query.offset) || 0), 10) || 0;
  if (offset < 0) offset = 0;
  if (defaults.maxOffset && offset > defaults.maxOffset)
    offset = defaults.maxOffset;
  return { limit: limit, offset: offset };
}

function authRole(authRecord) {
  try {
    return String(
      authRecord && authRecord.get ? authRecord.get("role") || "" : "",
    );
  } catch (_) {
    return "";
  }
}

function hasRole(authRecord, re) {
  var role = authRole(authRecord);
  if (!role) return false;
  try {
    if (re && re.test) return re.test(role);
  } catch (_) {}
  return false;
}

function isStaff(authRecord) {
  return hasRole(authRecord, /admin|moderator/);
}

// DB-backed rate limiting using the `rate_limits` collection.
//
// The schema uses a unique index on (key, endpoint), so we store the current window
// start timestamp in `window_start` and increment `count` within that window.
// ETag generation for HTTP caching (304 Not Modified support)
function generateETag(data) {
  try {
    var json = JSON.stringify(data || {});
    if ($security && $security.hs256) {
      return $security.hs256(json, "pbcn-etag-v1");
    }
    // Fallback: simple hash-like string
    var hash = 0;
    for (var i = 0; i < json.length; i++) {
      var ch = json.charCodeAt(i);
      hash = (hash << 5) - hash + ch;
      hash = hash & hash;
    }
    return "h-" + Math.abs(hash).toString(36);
  } catch (_) {
    return Date.now().toString(36);
  }
}

// Check if ETag matches and return 304 if so
function checkETag(c, etag) {
  try {
    var ifNoneMatch = "";
    if (c.request && c.request.header) {
      ifNoneMatch = c.request.header.get("If-None-Match") || "";
    }
    if (ifNoneMatch && ifNoneMatch === etag) {
      return true;
    }
  } catch (_) {}
  return false;
}

// Set both ETag and Cache-Control headers
function setCacheHeaders(c, etag, cacheControl) {
  try {
    if (c && c.response && c.response.header) {
      var h = c.response.header();
      if (etag) h.set("ETag", etag);
      h.set("Cache-Control", cacheControl);
      h.set("Vary", "Accept, Accept-Encoding");
      return;
    }
  } catch (_) {}
  try {
    if (c && c.response && c.response().header) {
      var h2 = c.response().header();
      if (etag) h2.set("ETag", etag);
      h2.set("Cache-Control", cacheControl);
      h2.set("Vary", "Accept, Accept-Encoding");
    }
  } catch (_) {}
}

function setCacheControl(c, value) {
  setCacheHeaders(c, null, value);
}

// DB-backed rate limiting using the `rate_limits` collection.
function rateLimitAllow(opts) {
  var id = trim(opts && opts.id ? opts.id : "default");
  var key = trim(opts && opts.key ? opts.key : "");
  var windowSec = parseInt(
    String(opts && opts.windowSec ? opts.windowSec : 60),
    10,
  );
  var max = parseInt(String(opts && opts.max ? opts.max : 10), 10);

  if (!id) id = "default";
  if (!key) key = "anon";
  if (!windowSec || windowSec < 1) windowSec = 60;
  if (!max || max < 1) max = 10;

  var nowMs = Date.now();
  var bucketMs = Math.floor(nowMs / (windowSec * 1000)) * (windowSec * 1000);
  var bucketIso = new Date(bucketMs).toISOString();

  var params = { k: key, e: id };

  try {
    var rec = $app.findFirstRecordByFilter(
      "rate_limits",
      "key = {:k} && endpoint = {:e}",
      params,
    );

    var ws = rec.get("window_start");
    var wsMs = 0;
    try {
      wsMs = ws ? Date.parse(String(ws)) : 0;
    } catch (_) {}

    if (wsMs !== bucketMs) {
      rec.set("window_start", bucketIso);
      rec.set("count", 1);
      $app.save(rec);
      return true;
    }

    var count = parseInt(String(rec.get("count") || 0), 10) || 0;
    if (count >= max) return false;

    rec.set("count", count + 1);
    $app.save(rec);
    return true;
  } catch (_) {
    try {
      var col = $app.findCollectionByNameOrId("rate_limits");
      var r = new Record(col);
      r.set("key", key);
      r.set("endpoint", id);
      r.set("window_start", bucketIso);
      r.set("count", 1);
      $app.save(r);
      return true;
    } catch (err) {
      // On unexpected DB errors, fail-closed for security.
      console.log(
        "[SECURITY] Rate limit DB error for key=" + key + " endpoint=" + id,
      );
      return false;
    }
  }
}

module.exports = {
  trim: trim,
  env: env,
  parseGitHubRepo: parseGitHubRepo,
  slugify: slugify,
  semverDesc: semverDesc,
  ensurePluginStats: ensurePluginStats,
  batchLoadPluginStats: batchLoadPluginStats,
  batchLoadShowcaseVotes: batchLoadShowcaseVotes,
  parsePagination: parsePagination,
  authRole: authRole,
  hasRole: hasRole,
  isStaff: isStaff,
  rateLimitAllow: rateLimitAllow,
  generateETag: generateETag,
  checkETag: checkETag,
  setCacheHeaders: setCacheHeaders,
  setCacheControl: setCacheControl,
};
