/// <reference path="../../types.d.ts" />

// Security helpers shared across pb_hooks.
// Keep ES5-compatible syntax (Goja).

// Cryptographically secure random nonce generator for CSP
function generateNonce() {
  try {
    if ($security && $security.randomBytes) {
      var bytes = $security.randomBytes(16);
      if (bytes && typeof bytes === "string") {
        var hex = "";
        var chars = "0123456789abcdef";
        for (var i = 0; i < bytes.length; i++) {
          var b = bytes.charCodeAt(i);
          hex += chars.charAt((b >> 4) & 0xf) + chars.charAt(b & 0xf);
        }
        return hex;
      }
    }
  } catch (_) {}
  // Fallback: timestamp + random
  return String(Date.now()) + "-" + String(Math.random()).replace(".", "");
}

// Validate request timestamp to prevent replay attacks
// Window: 5 minutes (300 seconds)
function validateRequestTimestamp(timestampStr) {
  if (!timestampStr) return false;
  var ts = parseInt(String(timestampStr), 10);
  if (isNaN(ts)) return false;
  var now = Date.now();
  var windowMs = 5 * 60 * 1000;
  if (ts < now - windowMs || ts > now + windowMs) {
    return false;
  }
  return true;
}

function env(key, fallback) {
  var v = "";
  try {
    v = $os.getenv(String(key)) || "";
  } catch (_) {
    v = "";
  }
  if (v) return String(v);
  return fallback != null ? String(fallback) : "";
}

var DEFAULT_DEV_CSRF_SECRET =
  "dev-only-insecure-csrf-secret-please-change-0000000000";

function isDevEnv() {
  var envName = env("PB_ENV", "");
  envName = String(envName || "").toLowerCase();
  return envName === "development" || envName === "dev" || envName === "local";
}

function hmacSha256(data, secret) {
  // PocketBase exposes `$security` helpers; use the built-in HS256 signer.
  // Signature is stable for the same (data, secret) pair.
  try {
    if ($security && $security.hs256)
      return $security.hs256(String(data), String(secret));
  } catch (_) {}
  throw new Error("Missing $security.hs256");
}

var _csrfSecret = null;

function getCsrfSecret() {
  if (_csrfSecret == null) {
    _csrfSecret = env("PB_CSRF_SECRET", "");
    if (!_csrfSecret || String(_csrfSecret).length < 32) {
      throw new Error(
        "[SECURITY] PB_CSRF_SECRET must be set (32+ chars) to enable CSRF protection",
      );
    }
    if (String(_csrfSecret) === DEFAULT_DEV_CSRF_SECRET && !isDevEnv()) {
      throw new Error(
        "[SECURITY] PB_CSRF_SECRET is using the dev default; set a real secret for non-dev environments",
      );
    }
  }
  return _csrfSecret;
}

function getSessionId(ctx) {
  var authRecord = null;
  try {
    authRecord = ctx && ctx.auth ? ctx.auth : null;
  } catch (_) {}

  if (authRecord && authRecord.id) return authRecord.id;

  var ip = "";
  try {
    if (ctx && ctx.realIP) ip = ctx.realIP() || "";
  } catch (_) {}

  if (!ip) {
    try {
      ip =
        (ctx.request && (ctx.request.remoteAddr || ctx.request.remoteIP)) || "";
    } catch (_) {}
  }

  if (!ip) {
    try {
      var xff = "";
      if (ctx.request && ctx.request.header && ctx.request.header.get) {
        xff =
          ctx.request.header.get("X-Forwarded-For") ||
          ctx.request.header.get("x-forwarded-for") ||
          "";
      }
      if (xff)
        ip = String(xff)
          .split(",")[0]
          .replace(/^\s+|\s+$/g, "");
    } catch (_) {}
  }

  return "anon:" + String(ip);
}

function generateCsrfToken(sessionId) {
  if (!sessionId) return null;
  var secret = getCsrfSecret();
  var timestamp = Date.now();
  var data = String(sessionId) + ":" + String(timestamp);
  var signature = hmacSha256(data, secret);
  return data + ":" + String(signature);
}

function validateCsrfToken(token, sessionId) {
  if (!token || !sessionId) return false;

  var parts = String(token).split(":");
  if (parts.length !== 3) return false;

  var tokenSession = parts[0];
  var timestamp = parseInt(parts[1], 10);
  var signature = parts[2];

  if (String(tokenSession) !== String(sessionId)) return false;

  var now = Date.now();
  var maxAge = 24 * 60 * 60 * 1000;
  if (!timestamp || now - timestamp > maxAge) return false;
  if (timestamp > now) return false;

  var secret = getCsrfSecret();
  var data = String(sessionId) + ":" + String(timestamp);
  var expectedSig = hmacSha256(data, secret);
  try {
    if ($security && $security.equal) {
      return !!$security.equal(String(signature), String(expectedSig));
    }
  } catch (_) {}
  return String(signature) === String(expectedSig);
}

// Fail-fast CSRF secret validation on module load
try {
  getCsrfSecret();
  console.log("[SECURITY] CSRF secret validated successfully");
} catch (err) {
  console.error(String(err && err.message ? err.message : err));
  if (!isDevEnv()) {
    throw err;
  }
  console.warn("[SECURITY] Running in dev mode with weak CSRF secret");
}

module.exports = {
  getCsrfSecret: getCsrfSecret,
  getSessionId: getSessionId,
  generateCsrfToken: generateCsrfToken,
  validateCsrfToken: validateCsrfToken,
  generateNonce: generateNonce,
  validateRequestTimestamp: validateRequestTimestamp,
};
