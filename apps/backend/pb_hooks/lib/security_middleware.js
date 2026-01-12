/// <reference path="../../types.d.ts" />

// Shared security middleware utilities.
// Reduces duplication in 05_security.pb.js which has two code paths (routerUse and event).
// Keep ES5-compatible syntax (Goja).

function trim(s) {
  return String(s || "").replace(/^\s+|\s+$/g, "");
}

function getPath(ctx) {
  try {
    if (ctx && ctx.request && ctx.request.url && ctx.request.url.path != null) {
      return String(ctx.request.url.path);
    }
  } catch (_) {}
  try {
    if (ctx && ctx.request && ctx.request.path != null) {
      return String(ctx.request.path);
    }
  } catch (_) {}
  return "";
}

function getMethod(ctx) {
  try {
    if (ctx && ctx.request && ctx.request.method)
      return String(ctx.request.method);
  } catch (_) {}
  return "";
}

function getHeader(ctx, name) {
  try {
    if (ctx && ctx.request && ctx.request.header && ctx.request.header.get) {
      return (
        ctx.request.header.get(name) ||
        ctx.request.header.get(String(name).toLowerCase()) ||
        ""
      );
    }
  } catch (_) {}
  return "";
}

function setHeader(ctx, key, value) {
  try {
    if (ctx && ctx.response && ctx.response.header) {
      ctx.response.header().set(key, value);
      return;
    }
  } catch (_) {}
  try {
    if (ctx && ctx.response && ctx.response().header) {
      ctx.response().header().set(key, value);
    }
  } catch (_) {}
}

function getCorsOrigins() {
  var allowedOrigins = [];
  var raw = "";
  try {
    raw = $os.getenv("PB_CORS_ORIGINS") || "";
  } catch (_) {
    raw = "";
  }
  if (raw) {
    var parts = String(raw).split(",");
    for (var i = 0; i < parts.length; i++) {
      var s = trim(parts[i]);
      if (s) allowedOrigins.push(s);
    }
  }
  return allowedOrigins;
}

function handleCors(ctx, path, origin) {
  var allowedOrigins = getCorsOrigins();
  if (origin && allowedOrigins.indexOf(origin) >= 0) {
    setHeader(ctx, "Access-Control-Allow-Origin", origin);
    setHeader(ctx, "Vary", "Origin");
    setHeader(ctx, "Access-Control-Allow-Credentials", "true");

    var reqHeaders = getHeader(ctx, "Access-Control-Request-Headers");
    setHeader(
      ctx,
      "Access-Control-Allow-Headers",
      reqHeaders || "Authorization, Content-Type, X-CSRF-Token",
    );

    var reqMethod = getHeader(ctx, "Access-Control-Request-Method");
    setHeader(
      ctx,
      "Access-Control-Allow-Methods",
      reqMethod || "GET,POST,PATCH,DELETE,OPTIONS",
    );

    setHeader(ctx, "Access-Control-Max-Age", "600");
    return true;
  } else if (origin && allowedOrigins.length > 0) {
    console.log("[SECURITY] Blocked CORS request from origin: " + origin);
  }
  return false;
}

function setSecurityHeaders(ctx) {
  setHeader(ctx, "Referrer-Policy", "strict-origin-when-cross-origin");
  setHeader(
    ctx,
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );
  setHeader(ctx, "X-Content-Type-Options", "nosniff");
  setHeader(ctx, "X-Frame-Options", "DENY");
  setHeader(ctx, "X-XSS-Protection", "1; mode=block");
  setHeader(
    ctx,
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  setHeader(ctx, "Cross-Origin-Opener-Policy", "same-origin");
  setHeader(ctx, "Cross-Origin-Resource-Policy", "same-origin");
}

function getCspDomain() {
  try {
    return $os.getenv("PB_CSP_DOMAIN") || "'self'";
  } catch (_) {
    return "'self'";
  }
}

function setCspHeader(ctx) {
  var cspDomain = getCspDomain();
  setHeader(
    ctx,
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
}

function noContent(ctx, code) {
  try {
    if (ctx && ctx.noContent) return ctx.noContent(code);
  } catch (_) {}
  try {
    return ctx.json(code, {});
  } catch (_) {}
  return null;
}

function isOptionsRequest(method) {
  return String(method).toUpperCase() === "OPTIONS";
}

function hasAuthorization(ctx) {
  return !!getHeader(ctx, "Authorization");
}

function shouldExemptFromCsrf(path) {
  return (
    String(path).indexOf("/api/health") === 0 ||
    String(path).indexOf("/api/csrf-token") === 0
  );
}

function validateCsrf(ctx, path) {
  var csrfToken = getHeader(ctx, "X-CSRF-Token");
  var sessionId = "";
  var sec = null;
  try {
    sec = require(__hooks + "/lib/security.js");
  } catch (_) {
    sec = null;
  }
  try {
    if (sec && sec.getSessionId) sessionId = sec.getSessionId(ctx);
  } catch (_) {}

  if (
    !sec ||
    !sec.validateCsrfToken ||
    !sec.validateCsrfToken(csrfToken, sessionId)
  ) {
    console.log("[SECURITY] CSRF validation failed for path: " + path);
    return { valid: false, sessionId: sessionId };
  }
  return { valid: true, sessionId: sessionId };
}

function csrfError(ctx) {
  try {
    return ctx.json(403, {
      error: {
        code: "FORBIDDEN",
        message: "Invalid or missing CSRF token",
      },
    });
  } catch (_) {
    return null;
  }
}

// Event-context specific wrappers (for Variant B in routerUse)
function getPathEvent(e) {
  try {
    if (e && e.request && e.request.url && e.request.url.path != null) {
      return String(e.request.url.path);
    }
  } catch (_) {}
  return "";
}

function getMethodEvent(e) {
  try {
    if (e && e.request && e.request.method) return String(e.request.method);
  } catch (_) {}
  return "";
}

function getHeaderEvent(e, name) {
  try {
    if (e && e.request && e.request.header && e.request.header.get) {
      return (
        e.request.header.get(name) ||
        e.request.header.get(String(name).toLowerCase()) ||
        ""
      );
    }
  } catch (_) {}
  return "";
}

function setHeaderEvent(e, key, value) {
  try {
    if (e && e.response && e.response.header) {
      e.response.header().set(key, value);
    }
  } catch (_) {}
}

function noContentEvent(e, code) {
  try {
    if (e && e.noContent) return e.noContent(code);
  } catch (_) {}
  try {
    return e.json(code, {});
  } catch (_) {
    return null;
  }
}

function nextEvent(e) {
  try {
    return e.next();
  } catch (_) {
    return null;
  }
}

function csrfErrorEvent(e) {
  try {
    return e.json(403, {
      error: {
        code: "FORBIDDEN",
        message: "Invalid or missing CSRF token",
      },
    });
  } catch (_) {
    return null;
  }
}

function validateCsrfEvent(e, path) {
  var csrfToken = getHeaderEvent(e, "X-CSRF-Token");
  var sessionId = "";
  var sec = null;
  try {
    sec = require(__hooks + "/lib/security.js");
  } catch (_) {
    sec = null;
  }
  try {
    if (sec && sec.getSessionId) sessionId = sec.getSessionId(e);
  } catch (_) {}

  if (
    !sec ||
    !sec.validateCsrfToken ||
    !sec.validateCsrfToken(csrfToken, sessionId)
  ) {
    console.log("[SECURITY] CSRF validation failed for path: " + path);
    return { valid: false, sessionId: sessionId };
  }
  return { valid: true, sessionId: sessionId };
}

module.exports = {
  trim: trim,
  getPath: getPath,
  getMethod: getMethod,
  getHeader: getHeader,
  setHeader: setHeader,
  getCorsOrigins: getCorsOrigins,
  handleCors: handleCors,
  setSecurityHeaders: setSecurityHeaders,
  getCspDomain: getCspDomain,
  setCspHeader: setCspHeader,
  noContent: noContent,
  isOptionsRequest: isOptionsRequest,
  hasAuthorization: hasAuthorization,
  shouldExemptFromCsrf: shouldExemptFromCsrf,
  validateCsrf: validateCsrf,
  csrfError: csrfError,
  // Event context helpers
  getPathEvent: getPathEvent,
  getMethodEvent: getMethodEvent,
  getHeaderEvent: getHeaderEvent,
  setHeaderEvent: setHeaderEvent,
  noContentEvent: noContentEvent,
  nextEvent: nextEvent,
  csrfErrorEvent: csrfErrorEvent,
  validateCsrfEvent: validateCsrfEvent,
};
