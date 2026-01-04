// Global security + CORS + CSRF (cookie/session only).
// Keep ES5-compatible syntax (Goja).
//
// Notes:
// - Avoid breaking PocketBase admin UI assets (`/_/`).
// - Avoid breaking token-based API clients and the admin UI API calls:
//   CSRF is enforced only when there is NO `Authorization` header.

routerUse(function (arg1) {
  // Variant A: echo-like middleware factory -> (next) => (c) => ...
  if (typeof arg1 === "function") {
    var next = arg1;
    return function (c) {
      function trim(s) {
        return String(s || "").replace(/^\s+|\s+$/g, "");
      }

      function getPath() {
        try {
          if (c && c.request && c.request.url && c.request.url.path != null) {
            return String(c.request.url.path);
          }
        } catch (_) {}
        try {
          if (c && c.request && c.request.path != null) {
            return String(c.request.path);
          }
        } catch (_) {}
        return "";
      }

      function getMethod() {
        try {
          if (c && c.request && c.request.method)
            return String(c.request.method);
        } catch (_) {}
        return "";
      }

      function getHeader(name) {
        try {
          if (c && c.request && c.request.header && c.request.header.get) {
            return (
              c.request.header.get(name) ||
              c.request.header.get(String(name).toLowerCase()) ||
              ""
            );
          }
        } catch (_) {}
        return "";
      }

      function setHeader(key, value) {
        try {
          if (c && c.response && c.response.header) {
            c.response.header().set(key, value);
            return;
          }
        } catch (_) {}
        try {
          if (c && c.response && c.response().header) {
            c.response().header().set(key, value);
          }
        } catch (_) {}
      }

      function noContent(code) {
        try {
          if (c && c.noContent) return c.noContent(code);
        } catch (_) {}
        return c.json(code, {});
      }

      var path = getPath();
      if (String(path).indexOf("/_/") === 0) {
        return next(c);
      }

      var origin = getHeader("Origin");
      var allowedOrigins = [];
      var raw = $os.getenv("PB_CORS_ORIGINS") || "";
      if (raw) {
        var parts = String(raw).split(",");
        for (var i = 0; i < parts.length; i++) {
          var s = trim(parts[i]);
          if (s) allowedOrigins.push(s);
        }
      }

      if (origin && allowedOrigins.indexOf(origin) >= 0) {
        setHeader("Access-Control-Allow-Origin", origin);
        setHeader("Vary", "Origin");
        setHeader("Access-Control-Allow-Credentials", "true");

        var reqHeaders = getHeader("Access-Control-Request-Headers");
        setHeader(
          "Access-Control-Allow-Headers",
          reqHeaders || "Authorization, Content-Type, X-CSRF-Token",
        );

        var reqMethod = getHeader("Access-Control-Request-Method");
        setHeader(
          "Access-Control-Allow-Methods",
          reqMethod || "GET,POST,PATCH,DELETE,OPTIONS",
        );

        setHeader("Access-Control-Max-Age", "600");
      } else if (origin && allowedOrigins.length > 0) {
        console.log("[SECURITY] Blocked CORS request from origin: " + origin);
      }

      setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      setHeader(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=()",
      );
      setHeader("X-Content-Type-Options", "nosniff");
      setHeader("X-Frame-Options", "DENY");
      setHeader("X-XSS-Protection", "1; mode=block");
      setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
      setHeader("Cross-Origin-Opener-Policy", "same-origin");
      setHeader("Cross-Origin-Resource-Policy", "same-origin");

      var cspDomain = $os.getenv("PB_CSP_DOMAIN") || "'self'";
      setHeader(
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

      var methodUpper = String(getMethod()).toUpperCase();
      if (methodUpper === "OPTIONS") {
        return noContent(204);
      }

      // CSRF only for cookie/session flows (no Authorization header).
      var hasAuthz = !!getHeader("Authorization");
      if (!hasAuthz && methodUpper !== "GET" && methodUpper !== "HEAD") {
        // Exempt health endpoints and token minting itself.
        if (
          String(path).indexOf("/api/health") !== 0 &&
          String(path).indexOf("/api/csrf-token") !== 0
        ) {
          var csrfToken = getHeader("X-CSRF-Token");
          var sessionId = "";
          var sec = null;
          try {
            sec = require(__hooks + "/lib/security.js");
          } catch (_) {
            sec = null;
          }
          try {
            if (sec && sec.getSessionId) sessionId = sec.getSessionId(c);
          } catch (_) {}

          if (
            !sec ||
            !sec.validateCsrfToken ||
            !sec.validateCsrfToken(csrfToken, sessionId)
          ) {
            console.log("[SECURITY] CSRF validation failed for path: " + path);
            return c.json(403, {
              error: {
                code: "FORBIDDEN",
                message: "Invalid or missing CSRF token",
              },
            });
          }
        }
      }

      return next(c);
    };
  }

  // Variant B: request event middleware -> (e) => e.next()
  var e = arg1;

  function trim2(s) {
    return String(s || "").replace(/^\s+|\s+$/g, "");
  }

  function getPath2() {
    try {
      if (e && e.request && e.request.url && e.request.url.path != null) {
        return String(e.request.url.path);
      }
    } catch (_) {}
    return "";
  }

  function getMethod2() {
    try {
      if (e && e.request && e.request.method) return String(e.request.method);
    } catch (_) {}
    return "";
  }

  function getHeader2(name) {
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

  function setHeader2(key, value) {
    try {
      if (e && e.response && e.response.header) {
        e.response.header().set(key, value);
      }
    } catch (_) {}
  }

  function noContent2(code) {
    try {
      if (e && e.noContent) return e.noContent(code);
    } catch (_) {}
    try {
      return e.json(code, {});
    } catch (_) {
      return null;
    }
  }

  function next2() {
    try {
      return e.next();
    } catch (_) {
      return null;
    }
  }

  var path2 = getPath2();
  if (String(path2).indexOf("/_/") === 0) {
    return next2();
  }

  var origin2 = getHeader2("Origin");
  var allowedOrigins2 = [];
  var raw2 = $os.getenv("PB_CORS_ORIGINS") || "";
  if (raw2) {
    var parts2 = String(raw2).split(",");
    for (var j = 0; j < parts2.length; j++) {
      var s2 = trim2(parts2[j]);
      if (s2) allowedOrigins2.push(s2);
    }
  }

  if (origin2 && allowedOrigins2.indexOf(origin2) >= 0) {
    setHeader2("Access-Control-Allow-Origin", origin2);
    setHeader2("Vary", "Origin");
    setHeader2("Access-Control-Allow-Credentials", "true");

    var reqHeaders2 = getHeader2("Access-Control-Request-Headers");
    setHeader2(
      "Access-Control-Allow-Headers",
      reqHeaders2 || "Authorization, Content-Type, X-CSRF-Token",
    );

    var reqMethod2 = getHeader2("Access-Control-Request-Method");
    setHeader2(
      "Access-Control-Allow-Methods",
      reqMethod2 || "GET,POST,PATCH,DELETE,OPTIONS",
    );

    setHeader2("Access-Control-Max-Age", "600");
  } else if (origin2 && allowedOrigins2.length > 0) {
    console.log("[SECURITY] Blocked CORS request from origin: " + origin2);
  }

  setHeader2("Referrer-Policy", "strict-origin-when-cross-origin");
  setHeader2("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  setHeader2("X-Content-Type-Options", "nosniff");
  setHeader2("X-Frame-Options", "DENY");
  setHeader2("X-XSS-Protection", "1; mode=block");
  setHeader2(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  setHeader2("Cross-Origin-Opener-Policy", "same-origin");
  setHeader2("Cross-Origin-Resource-Policy", "same-origin");

  var cspDomain2 = $os.getenv("PB_CSP_DOMAIN") || "'self'";
  setHeader2(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' " +
      cspDomain2 +
      "; " +
      "style-src 'self' 'unsafe-inline' " +
      cspDomain2 +
      "; " +
      "img-src 'self' data: https: " +
      cspDomain2 +
      "; " +
      "connect-src 'self' " +
      cspDomain2 +
      "; " +
      "font-src 'self' data: " +
      cspDomain2 +
      "; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'none'; " +
      "upgrade-insecure-requests;",
  );

  var methodUpper2 = String(getMethod2()).toUpperCase();
  if (methodUpper2 === "OPTIONS") {
    return noContent2(204);
  }

  var hasAuthz2 = !!getHeader2("Authorization");
  if (!hasAuthz2 && methodUpper2 !== "GET" && methodUpper2 !== "HEAD") {
    if (
      String(path2).indexOf("/api/health") !== 0 &&
      String(path2).indexOf("/api/csrf-token") !== 0
    ) {
      var csrfToken2 = getHeader2("X-CSRF-Token");
      var sessionId2 = "";
      var sec2 = null;
      try {
        sec2 = require(__hooks + "/lib/security.js");
      } catch (_) {
        sec2 = null;
      }
      try {
        if (sec2 && sec2.getSessionId) sessionId2 = sec2.getSessionId(e);
      } catch (_) {}

      if (
        !sec2 ||
        !sec2.validateCsrfToken ||
        !sec2.validateCsrfToken(csrfToken2, sessionId2)
      ) {
        console.log("[SECURITY] CSRF validation failed for path: " + path2);
        return e.json(403, {
          error: {
            code: "FORBIDDEN",
            message: "Invalid or missing CSRF token",
          },
        });
      }
    }
  }

  return next2();
});
