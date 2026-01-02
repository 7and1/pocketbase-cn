// Global security + CORS headers for all routes.
// NOTE: PocketBase JS middlewares use the RequestEvent API (e.next()), not Echo-like (next)=>... factories.
// Keep conservative defaults to avoid breaking the PocketBase admin UI.

// CSRF Secret validation on startup
onBeforeServe(function (e) {
  var csrfSecret = $os.getenv("PB_CSRF_SECRET") || "";
  if (!csrfSecret || csrfSecret.length < 32) {
    throw new Error(
      "FATAL: PB_CSRF_SECRET must be set and at least 32 characters long",
    );
  }
  return e.next();
});

routerUse(function (e) {
  var path = "";
  try {
    path = (e.request && e.request.url && e.request.url.path) || "";
  } catch (_) {}

  // Don't interfere with the PocketBase admin UI.
  if (String(path).indexOf("/_/") === 0) {
    return e.next();
  }

  var origin = "";
  try {
    origin =
      e.request.header.get("Origin") || e.request.header.get("origin") || "";
  } catch (_) {}

  var allowedOrigins = [];
  var raw = $os.getenv("PB_CORS_ORIGINS") || "";
  if (raw) {
    var parts = String(raw).split(",");
    for (var i = 0; i < parts.length; i++) {
      var s = String(parts[i]).replace(/^\s+|\s+$/g, "");
      if (s) allowedOrigins.push(s);
    }
  }

  // Deny-by-default: only allow explicitly whitelisted origins
  if (origin && allowedOrigins.indexOf(origin) >= 0) {
    e.response.header().set("Access-Control-Allow-Origin", origin);
    e.response.header().set("Vary", "Origin");
    e.response.header().set("Access-Control-Allow-Credentials", "true");

    var reqHeaders = "";
    try {
      reqHeaders = e.request.header.get("Access-Control-Request-Headers") || "";
    } catch (_) {}
    e.response
      .header()
      .set(
        "Access-Control-Allow-Headers",
        reqHeaders || "Authorization, Content-Type",
      );

    var reqMethod = "";
    try {
      reqMethod = e.request.header.get("Access-Control-Request-Method") || "";
    } catch (_) {}
    e.response
      .header()
      .set(
        "Access-Control-Allow-Methods",
        reqMethod || "GET,POST,PATCH,DELETE,OPTIONS",
      );

    e.response.header().set("Access-Control-Max-Age", "600");
  } else if (origin && allowedOrigins.length > 0) {
    // Log blocked origin attempts (visible in PocketBase logs)
    console.log("[SECURITY] Blocked CORS request from origin: " + origin);
  }

  e.response.header().set("Referrer-Policy", "strict-origin-when-cross-origin");
  e.response
    .header()
    .set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  e.response.header().set("X-Content-Type-Options", "nosniff");
  e.response.header().set("X-Frame-Options", "DENY");
  e.response.header().set("X-XSS-Protection", "1; mode=block");

  // Content-Security-Policy headers (enforce mode)
  var cspDomain = $os.getenv("PB_CSP_DOMAIN") || "'self'";
  e.response
    .header()
    .set(
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
        "upgrade-insecure-requests; " +
        "report-uri /api/csp-report",
    );

  var method = "";
  try {
    method = e.request && e.request.method ? e.request.method : "";
  } catch (_) {}

  if (String(method).toUpperCase() === "OPTIONS") {
    return e.noContent(204);
  }

  // CSRF validation for state-changing requests
  // Skip for GET, HEAD, OPTIONS requests and exempted paths
  var methodUpper = String(method).toUpperCase();
  var csrfExemptPaths = ["/api/csrf-token", "/api/health", "/api/search"];
  var isCsrfExempt = false;

  for (var i = 0; i < csrfExemptPaths.length; i++) {
    if (String(path).indexOf(csrfExemptPaths[i]) === 0) {
      isCsrfExempt = true;
      break;
    }
  }

  if (
    !isCsrfExempt &&
    methodUpper !== "GET" &&
    methodUpper !== "HEAD" &&
    methodUpper !== "OPTIONS"
  ) {
    var csrfToken = "";
    try {
      csrfToken = e.request.header.get("X-CSRF-Token") || "";
    } catch (_) {}

    var sessionId = "";
    try {
      sessionId = __pbcn.getSessionId(e);
    } catch (_) {}

    if (!__pbcn.validateCsrfToken(csrfToken, sessionId)) {
      console.log("[SECURITY] CSRF validation failed for path: " + path);
      return e.json(403, {
        error: "Forbidden",
        message: "Invalid or missing CSRF token",
      });
    }
  }

  return e.next();
});
