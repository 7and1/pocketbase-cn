/// <reference path="../types.d.ts" />

// Global security + CORS + CSRF (cookie/session only).
// Keep ES5-compatible syntax (Goja).
//
// Notes:
// - Avoid breaking PocketBase admin UI assets (`/_/`).
// - Avoid breaking token-based API clients and the admin UI API calls:
//   CSRF is enforced only when there is NO `Authorization` header.
// - Refactored to use shared security_middleware utilities.

routerUse(function (arg1) {
  // Variant A: echo-like middleware factory -> (next) => (c) => ...
  if (typeof arg1 === "function") {
    var next = arg1;
    var mw = require(__hooks + "/lib/security_middleware.js");

    return function (c) {
      var path = mw.getPath(c);
      if (String(path).indexOf("/_/") === 0) {
        return next(c);
      }

      var origin = mw.getHeader(c, "Origin");
      mw.handleCors(c, path, origin);

      mw.setSecurityHeaders(c);
      mw.setCspHeader(c);

      var method = mw.getMethod(c);
      if (mw.isOptionsRequest(method)) {
        return mw.noContent(c, 204);
      }

      // CSRF only for cookie/session flows (no Authorization header).
      var hasAuthz = mw.hasAuthorization(c);
      if (
        !hasAuthz &&
        !mw.isOptionsRequest(method) &&
        method !== "GET" &&
        method !== "HEAD"
      ) {
        if (!mw.shouldExemptFromCsrf(path)) {
          var result = mw.validateCsrf(c, path);
          if (!result.valid) {
            return mw.csrfError(c);
          }
        }
      }

      return next(c);
    };
  }

  // Variant B: request event middleware -> (e) => e.next()
  var e = arg1;
  var mw = require(__hooks + "/lib/security_middleware.js");

  var path = mw.getPathEvent(e);
  if (String(path).indexOf("/_/") === 0) {
    return mw.nextEvent(e);
  }

  var origin = mw.getHeaderEvent(e, "Origin");
  var allowedOrigins = mw.getCorsOrigins();

  if (origin && allowedOrigins.indexOf(origin) >= 0) {
    mw.setHeaderEvent(e, "Access-Control-Allow-Origin", origin);
    mw.setHeaderEvent(e, "Vary", "Origin");
    mw.setHeaderEvent(e, "Access-Control-Allow-Credentials", "true");

    var reqHeaders = mw.getHeaderEvent(e, "Access-Control-Request-Headers");
    mw.setHeaderEvent(
      e,
      "Access-Control-Allow-Headers",
      reqHeaders || "Authorization, Content-Type, X-CSRF-Token",
    );

    var reqMethod = mw.getHeaderEvent(e, "Access-Control-Request-Method");
    mw.setHeaderEvent(
      e,
      "Access-Control-Allow-Methods",
      reqMethod || "GET,POST,PATCH,DELETE,OPTIONS",
    );

    mw.setHeaderEvent(e, "Access-Control-Max-Age", "600");
  } else if (origin && allowedOrigins.length > 0) {
    console.log("[SECURITY] Blocked CORS request from origin: " + origin);
  }

  mw.setHeaderEvent(e, "Referrer-Policy", "strict-origin-when-cross-origin");
  mw.setHeaderEvent(
    e,
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );
  mw.setHeaderEvent(e, "X-Content-Type-Options", "nosniff");
  mw.setHeaderEvent(e, "X-Frame-Options", "DENY");
  mw.setHeaderEvent(e, "X-XSS-Protection", "1; mode=block");
  mw.setHeaderEvent(
    e,
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  mw.setHeaderEvent(e, "Cross-Origin-Opener-Policy", "same-origin");
  mw.setHeaderEvent(e, "Cross-Origin-Resource-Policy", "same-origin");

  var cspDomain = mw.getCspDomain();
  mw.setHeaderEvent(
    e,
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' " +
      cspDomain +
      "; " +
      "style-src 'self' 'unsafe-inline' " +
      cspDomain +
      "; " +
      "img-src 'self' data: https: " +
      cspDomain +
      "; " +
      "connect-src 'self' " +
      cspDomain +
      "; " +
      "font-src 'self' data: " +
      cspDomain +
      "; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'none'; " +
      "upgrade-insecure-requests;",
  );

  var method = mw.getMethodEvent(e);
  if (mw.isOptionsRequest(method)) {
    return mw.noContentEvent(e, 204);
  }

  var hasAuthz = !!mw.getHeaderEvent(e, "Authorization");
  if (
    !hasAuthz &&
    !mw.isOptionsRequest(method) &&
    method !== "GET" &&
    method !== "HEAD"
  ) {
    if (!mw.shouldExemptFromCsrf(path)) {
      var result = mw.validateCsrfEvent(e, path);
      if (!result.valid) {
        return mw.csrfErrorEvent(e);
      }
    }
  }

  return mw.nextEvent(e);
});

// Rate limit cleanup: remove expired records older than 24h
// Call via POST /api/admin/rate-limits/cleanup (requires staff role)
routerAdd("POST", "/api/admin/rate-limits/cleanup", function (c) {
  var pbcn = null;
  try {
    pbcn = require(__hooks + "/lib/pbcn.js");
  } catch (_) {
    return c.json(500, { error: "Failed to load helpers" });
  }

  // Staff only
  if (!pbcn.isStaff(c.auth)) {
    return c.json(403, { error: "Forbidden: staff only" });
  }

  var cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  var deleted = 0;

  try {
    // Find and delete expired rate limit records
    var expired = $app.findRecordsByFilter(
      "rate_limits",
      "window_start < {:cutoff}",
      "",
      500,
      0,
      { cutoff: cutoff },
    );

    for (var i = 0; i < (expired || []).length; i++) {
      try {
        $app.delete(expired[i]);
        deleted++;
      } catch (_) {}
    }

    console.log("[CLEANUP] Deleted " + deleted + " expired rate limit records");

    return c.json(200, {
      success: true,
      deleted: deleted,
    });
  } catch (err) {
    console.log("[CLEANUP] Rate limit cleanup error: " + String(err));
    return c.json(500, { error: "Cleanup failed" });
  }
});

// CSRF token endpoint with auto-refresh
// Returns a new CSRF token for the current session
routerAdd("GET", "/api/csrf-token", function (c) {
  var sec = null;
  try {
    sec = require(__hooks + "/lib/security.js");
  } catch (_) {
    return c.json(500, { error: "Failed to load security module" });
  }

  var sessionId = sec.getSessionId(c);
  if (!sessionId) {
    return c.json(400, { error: "Could not determine session" });
  }

  // Generate and set CSRF token header (auto-rotates if needed)
  var token = sec.setCsrfTokenHeader(c, sessionId);
  if (!token) {
    return c.json(500, { error: "Failed to generate CSRF token" });
  }

  // Check if token was rotated
  var existingToken = "";
  try {
    if (c.request && c.request.header) {
      existingToken = c.request.header.get("X-CSRF-Token") || "";
    }
  } catch (_) {}

  var rotated = sec.shouldRotateCsrfToken(existingToken);

  // Set cache control to prevent caching
  try {
    if (c.response && c.response.header) {
      var h = c.response.header();
      h.set("Cache-Control", "no-store, no-cache, must-revalidate");
      h.set("Pragma", "no-cache");
    }
  } catch (_) {}

  return c.json(200, {
    token: token,
    rotated: rotated,
  });
});
