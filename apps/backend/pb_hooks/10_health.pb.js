// Custom probes (PocketBase already provides /api/health).
routerAdd("GET", "/api/live", function (c) {
  try {
    if (c.response && c.response.header) {
      c.response
        .header()
        .set("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  } catch (_) {}
  return c.json(200, { alive: true, timestamp: new Date().toISOString() });
});

routerAdd("GET", "/api/ready", function (c) {
  try {
    // DB probe (avoid raw SQL because dbx query scanners require special types).
    $app.countRecords("_superusers");
    try {
      if (c.response && c.response.header) {
        c.response
          .header()
          .set("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    } catch (_) {}
    return c.json(200, { ready: true });
  } catch (err) {
    return c.json(503, {
      ready: false,
    });
  }
});

// CSRF token endpoint for authenticated and anonymous users
routerAdd("GET", "/api/csrf-token", function (c) {
  try {
    var sec = require(__hooks + "/lib/security.js");
    var sessionId = "";
    try {
      sessionId = sec.getSessionId(c);
    } catch (_) {
      sessionId = "unknown";
    }

    var token = sec.generateCsrfToken(sessionId);
    var nonce = "";
    try {
      nonce = sec.generateNonce();
    } catch (_) {
      nonce = "";
    }

    return c.json(200, {
      token: token,
      nonce: nonce,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    return c.json(500, {
      error: "Failed to generate security token",
    });
  }
});
