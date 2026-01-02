routerAdd(
  "POST",
  "/api/me/delete",
  function (c) {
    var pbcn = require(__hooks + "/lib/pbcn.js");

    var auth = c.auth || null;
    if (!auth)
      return c.json(401, {
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });

    if (pbcn.hasRole(auth, /admin/)) {
      return c.json(403, {
        error: {
          code: "FORBIDDEN",
          message: "Admin accounts cannot self-delete via API",
        },
      });
    }

    var info = c.requestInfo() || {};
    var body = info.body || {};
    var confirm = pbcn.trim(body.confirm || "");
    if (confirm !== "DELETE") {
      return c.json(400, {
        error: {
          code: "CONFIRM_REQUIRED",
          message: "Send { confirm: 'DELETE' } to proceed",
        },
      });
    }

    var ip = "";
    try {
      ip = c.realIP();
    } catch (_) {}

    if (
      !pbcn.rateLimitAllow({
        id: "account_delete",
        windowSec: 3600,
        max: 3,
        key: ip || auth.id,
      })
    ) {
      return c.json(429, {
        error: { code: "RATE_LIMITED", message: "Too many requests" },
      });
    }

    function deleteByFilter(collection, filter, params) {
      try {
        var rows = $app.findRecordsByFilter(
          collection,
          filter,
          "",
          0,
          0,
          params || {},
        );
        for (var i = 0; i < (rows || []).length; i++) {
          try {
            $app.delete(rows[i]);
          } catch (_) {}
        }
      } catch (_) {}
    }

    // Remove user-generated interactions first.
    deleteByFilter("plugin_stars", "user = {:u}", { u: auth.id });
    deleteByFilter("showcase_votes", "user = {:u}", { u: auth.id });
    deleteByFilter("comments", "author = {:u}", { u: auth.id });

    // Remove user submissions (and dependent records).
    try {
      var plugins = $app.findRecordsByFilter(
        "plugins",
        "author = {:u}",
        "",
        0,
        0,
        { u: auth.id },
      );
      for (var pi = 0; pi < (plugins || []).length; pi++) {
        var p = plugins[pi];
        deleteByFilter("plugin_versions", "plugin = {:p}", { p: p.id });
        deleteByFilter("plugin_stats", "plugin = {:p}", { p: p.id });
        deleteByFilter("plugin_stars", "plugin = {:p}", { p: p.id });
        deleteByFilter("comments", "plugin = {:p}", { p: p.id });
        try {
          $app.delete(p);
        } catch (_) {}
      }
    } catch (_) {}

    try {
      var showcases = $app.findRecordsByFilter(
        "showcase",
        "author = {:u}",
        "",
        0,
        0,
        { u: auth.id },
      );
      for (var si = 0; si < (showcases || []).length; si++) {
        var s = showcases[si];
        deleteByFilter("showcase_votes", "showcase = {:s}", { s: s.id });
        deleteByFilter("comments", "showcase = {:s}", { s: s.id });
        try {
          $app.delete(s);
        } catch (_) {}
      }
    } catch (_) {}

    // Finally delete the auth record itself.
    try {
      var urec = $app.findRecordById("users", auth.id);
      $app.delete(urec);
    } catch (_) {}

    return c.json(200, { data: { ok: true } });
  },
  $apis.requireAuth(),
);
