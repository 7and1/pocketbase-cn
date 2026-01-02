// Custom probes (PocketBase already provides /api/health).
routerAdd("GET", "/api/live", function (c) {
  return c.json(200, { alive: true, timestamp: new Date().toISOString() });
});

routerAdd("GET", "/api/ready", function (c) {
  try {
    // DB probe (avoid raw SQL because dbx query scanners require special types).
    $app.countRecords("_superusers");
    return c.json(200, { ready: true });
  } catch (err) {
    return c.json(503, {
      ready: false,
      error: String(err && err.message ? err.message : err),
    });
  }
});

// CSRF token endpoint for authenticated and anonymous users
routerAdd("GET", "/api/csrf-token", function (c) {
  try {
    var sessionId = "";
    try {
      sessionId = __pbcn.getSessionId(c);
    } catch (_) {
      sessionId = "unknown";
    }

    var token = __pbcn.generateCsrfToken(sessionId);
    return c.json(200, {
      token: token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    return c.json(500, {
      error: "Failed to generate CSRF token",
      message: String(err && err.message ? err.message : err),
    });
  }
});
