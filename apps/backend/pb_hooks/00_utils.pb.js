// Shared helpers for PocketBase.cn hooks/routes.
// Keep ES5-compatible syntax (Goja).

var __pbcn = this.__pbcn || (this.__pbcn = {});

__pbcn.env = function (key, fallback) {
  var v = $os.getenv(key);
  if (v) return String(v);
  return fallback != null ? String(fallback) : "";
};

// Delegate to lib/pbcn.js for these functions (consolidated module)
__pbcn.parseGitHubRepo = function (url) {
  var pbcn = (function () {
    try {
      return require(__hooks + "/lib/pbcn.js");
    } catch (_) {
      return null;
    }
  })();
  return pbcn && pbcn.parseGitHubRepo ? pbcn.parseGitHubRepo(url) : null;
};

__pbcn.slugify = function (input) {
  var pbcn = (function () {
    try {
      return require(__hooks + "/lib/pbcn.js");
    } catch (_) {
      return null;
    }
  })();
  return pbcn && pbcn.slugify ? pbcn.slugify(input) : String(input || "");
};

// Delegate rate limiting to DB-backed implementation in lib/pbcn.js
// This ensures consistent rate limiting across multiple instances
__pbcn.allow = function (opts) {
  var pbcn = (function () {
    try {
      return require(__hooks + "/lib/pbcn.js");
    } catch (_) {
      return null;
    }
  })();
  return pbcn && pbcn.rateLimitAllow ? pbcn.rateLimitAllow(opts) : false;
};

__pbcn.ensurePluginStats = function (pluginId) {
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
};

// CSRF Token generation and validation
// Uses HMAC-SHA256 for token signing
var __pbcnCsrfSecret = null;

__pbcn.getCsrfSecret = function () {
  if (!__pbcnCsrfSecret) {
    __pbcnCsrfSecret = __pbcn.env("PB_CSRF_SECRET", "");
    if (!__pbcnCsrfSecret) {
      throw new Error("[SECURITY] PB_CSRF_SECRET must be set in production");
    }
  }
  return __pbcnCsrfSecret;
};

// Generate CSRF token for a session
__pbcn.generateCsrfToken = function (sessionId) {
  if (!sessionId) return null;
  var secret = __pbcn.getCsrfSecret();
  var timestamp = Date.now();
  var data = String(sessionId) + ":" + String(timestamp);
  var signature = $security.hmacsha256(data, secret);
  return data + ":" + String(signature);
};

// Validate CSRF token
__pbcn.validateCsrfToken = function (token, sessionId) {
  if (!token || !sessionId) return false;

  var parts = String(token).split(":");
  if (parts.length !== 3) return false;

  var tokenSession = parts[0];
  var timestamp = parseInt(parts[1], 10);
  var signature = parts[2];

  // Check token belongs to session
  if (String(tokenSession) !== String(sessionId)) return false;

  // Check token age (max 24 hours)
  var now = Date.now();
  var maxAge = 24 * 60 * 60 * 1000; // 24 hours
  if (now - timestamp > maxAge) return false;
  if (timestamp > now) return false; // Future tokens

  // Verify signature
  var secret = __pbcn.getCsrfSecret();
  var data = String(sessionId) + ":" + String(timestamp);
  var expectedSig = $security.hmacsha256(data, secret);

  return String(signature) === String(expectedSig);
};

// Get session ID from auth record or generate one
__pbcn.getSessionId = function (e) {
  var authRecord = null;
  try {
    authRecord = e.auth;
  } catch (_) {}

  if (authRecord && authRecord.id) {
    return authRecord.id;
  }

  // For anonymous requests, use IP-based session
  var ip = "";
  try {
    ip = e.request.remoteAddr || "";
  } catch (_) {}
  return "anon:" + String(ip);
};
