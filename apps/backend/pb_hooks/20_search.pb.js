/// <reference path="../types.d.ts" />

// Initialize FTS5 tables for full-text search
// This route should be called once during setup
routerAdd("POST", "/api/admin/search/init-fts", function (c) {
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

  try {
    // Create FTS5 virtual tables and triggers for plugins
    var sql = "";

    // Drop existing tables if they exist
    sql += "DROP TABLE IF EXISTS plugins_fts;\n";
    sql += "DROP TRIGGER IF EXISTS plugins_ai_fts;\n";
    sql += "DROP TRIGGER IF EXISTS plugins_ad_fts;\n";
    sql += "DROP TRIGGER IF EXISTS plugins_au_fts;\n";

    // Create FTS5 virtual table for plugins
    sql +=
      "CREATE VIRTUAL TABLE plugins_fts USING fts5(name, description, category, tags, content='plugins', content_rowid='id');\n";

    // Copy existing data
    sql +=
      "INSERT INTO plugins_fts(rowid, name, description, category, tags) SELECT id, name, description, category, tags FROM plugins;\n";

    // Create triggers to keep FTS in sync
    sql += "CREATE TRIGGER plugins_ai_fts AFTER INSERT ON plugins BEGIN\n";
    sql +=
      "  INSERT INTO plugins_fts(rowid, name, description, category, tags)\n";
    sql +=
      "  VALUES (NEW.id, NEW.name, NEW.description, NEW.category, NEW.tags);\n";
    sql += "END;\n";

    sql += "CREATE TRIGGER plugins_ad_fts AFTER DELETE ON plugins BEGIN\n";
    sql +=
      "  INSERT INTO plugins_fts(plugins_fts, rowid, name, description, category, tags)\n";
    sql +=
      "  VALUES ('delete', OLD.id, OLD.name, OLD.description, OLD.category, OLD.tags);\n";
    sql += "END;\n";

    sql += "CREATE TRIGGER plugins_au_fts AFTER UPDATE ON plugins BEGIN\n";
    sql +=
      "  INSERT INTO plugins_fts(plugins_fts, rowid, name, description, category, tags)\n";
    sql +=
      "  VALUES ('delete', OLD.id, OLD.name, OLD.description, OLD.category, OLD.tags);\n";
    sql +=
      "  INSERT INTO plugins_fts(rowid, name, description, category, tags)\n";
    sql +=
      "  VALUES (NEW.id, NEW.name, NEW.description, NEW.category, NEW.tags);\n";
    sql += "END;\n";

    // Same for showcase
    sql += "DROP TABLE IF EXISTS showcase_fts;\n";
    sql += "DROP TRIGGER IF EXISTS showcase_ai_fts;\n";
    sql += "DROP TRIGGER IF EXISTS showcase_ad_fts;\n";
    sql += "DROP TRIGGER IF EXISTS showcase_au_fts;\n";

    sql +=
      "CREATE VIRTUAL TABLE showcase_fts USING fts5(title, description, category, tags, content='showcase', content_rowid='id');\n";

    sql +=
      "INSERT INTO showcase_fts(rowid, title, description, category, tags) SELECT id, title, description, category, tags FROM showcase;\n";

    sql += "CREATE TRIGGER showcase_ai_fts AFTER INSERT ON showcase BEGIN\n";
    sql +=
      "  INSERT INTO showcase_fts(rowid, title, description, category, tags)\n";
    sql +=
      "  VALUES (NEW.id, NEW.title, NEW.description, NEW.category, NEW.tags);\n";
    sql += "END;\n";

    sql += "CREATE TRIGGER showcase_ad_fts AFTER DELETE ON showcase BEGIN\n";
    sql +=
      "  INSERT INTO showcase_fts(showcase_fts, rowid, title, description, category, tags)\n";
    sql +=
      "  VALUES ('delete', OLD.id, OLD.title, OLD.description, OLD.category, OLD.tags);\n";
    sql += "END;\n";

    sql += "CREATE TRIGGER showcase_au_fts AFTER UPDATE ON showcase BEGIN\n";
    sql +=
      "  INSERT INTO showcase_fts(showcase_fts, rowid, title, description, category, tags)\n";
    sql +=
      "  VALUES ('delete', OLD.id, OLD.title, OLD.description, OLD.category, OLD.tags);\n";
    sql +=
      "  INSERT INTO showcase_fts(rowid, title, description, category, tags)\n";
    sql +=
      "  VALUES (NEW.id, NEW.title, NEW.description, NEW.category, NEW.tags);\n";
    sql += "END;\n";

    // Execute SQL
    var db = $app.newQuery(sql);
    db.execute();
    db.close();

    console.log("[FTS] Full-text search tables initialized");

    return c.json(200, {
      success: true,
      message: "FTS5 tables and triggers created",
    });
  } catch (err) {
    console.log("[FTS] Initialization error: " + String(err));
    return c.json(500, {
      error: "FTS initialization failed: " + String(err),
    });
  }
});

routerAdd("GET", "/api/search", function (c) {
  var resp = null;
  var log = null;
  try {
    resp = require(__hooks + "/lib/response.js");
    log = require(__hooks + "/lib/logger.js");
  } catch (_) {
    return c.json(500, { error: "Failed to load helpers" });
  }

  var ctx = log.withRequestContext(c, { endpoint: "search" });
  var perf = log.createPerfContext();
  ctx.perf = perf;

  var info = c.requestInfo() || {};
  var q = info.query && info.query.q ? String(info.query.q) : "";
  q = q.replace(/^\s+|\s+$/g, "");

  var type = info.query && info.query.type ? String(info.query.type) : "all";

  var limitRaw =
    info.query && info.query.limit
      ? parseInt(String(info.query.limit), 10)
      : 20;
  var limit = limitRaw && limitRaw > 0 ? limitRaw : 20;
  if (limit > 100) limit = 100;

  if (!q || q.length < 2) {
    return resp.badRequest(c, "Query must be at least 2 characters");
  }

  var data = { plugins: [], showcase: [] };

  // Use CASE-INSENSITIVE search with better performance
  // The ~ operator in PocketBase is case-insensitive LIKE
  var searchQ = q.toLowerCase();
  log.addCheckpoint(perf, "validation_complete");

  if (type === "all" || type === "plugins") {
    var plugins = $app.findRecordsByFilter(
      "plugins",
      "status = 'approved' && (name ~ {:q} || description ~ {:q} || category ~ {:q})",
      "-featured,-created",
      limit,
      0,
      { q: q },
    );

    for (var i = 0; i < (plugins || []).length; i++) {
      var p = plugins[i];
      data.plugins.push({
        id: p.id,
        name: p.get("name"),
        slug: p.get("slug"),
        description: p.get("description"),
        category: p.get("category") || "",
      });
    }
  }

  log.addCheckpoint(perf, "plugins_search_complete");

  if (type === "all" || type === "showcase") {
    var showcases = $app.findRecordsByFilter(
      "showcase",
      "status = 'approved' && (title ~ {:q} || description ~ {:q} || category ~ {:q})",
      "-featured,-created",
      limit,
      0,
      { q: q },
    );

    for (var j = 0; j < (showcases || []).length; j++) {
      var s = showcases[j];
      data.showcase.push({
        id: s.id,
        title: s.get("title"),
        slug: s.get("slug"),
        description: s.get("description"),
        category: s.get("category") || "",
      });
    }
  }

  log.addCheckpoint(perf, "showcase_search_complete");

  // Add cache headers for search results
  try {
    if (c.response && c.response.header) {
      var h = c.response.header();
      h.set("Cache-Control", "public, max-age=30, stale-while-revalidate=10");
      h.set("Vary", "Accept, Accept-Encoding");
    }
  } catch (_) {}

  log.info(ctx, "Search completed", {
    query: q.substring(0, 50),
    type: type,
    pluginCount: data.plugins.length,
    showcaseCount: data.showcase.length,
  });

  return resp.success(c, data, {
    elapsed: log.getElapsed(perf) + "ms",
  });
});

// FTS5-powered search endpoint (faster for large datasets)
// Falls back to LIKE search if FTS tables don't exist
routerAdd("GET", "/api/search/fts", function (c) {
  var resp = null;
  var log = null;
  try {
    resp = require(__hooks + "/lib/response.js");
    log = require(__hooks + "/lib/logger.js");
  } catch (_) {
    return c.json(500, { error: "Failed to load helpers" });
  }

  var ctx = log.withRequestContext(c, { endpoint: "search_fts" });
  var perf = log.createPerfContext();
  ctx.perf = perf;

  var info = c.requestInfo() || {};
  var q = info.query && info.query.q ? String(info.query.q) : "";
  q = q.replace(/^\s+|\s+$/g, "");

  var type = info.query && info.query.type ? String(info.query.type) : "all";

  var limitRaw =
    info.query && info.query.limit
      ? parseInt(String(info.query.limit), 10)
      : 20;
  var limit = limitRaw && limitRaw > 0 ? limitRaw : 20;
  if (limit > 100) limit = 100;

  if (!q || q.length < 2) {
    return resp.badRequest(c, "Query must be at least 2 characters");
  }

  var data = { plugins: [], showcase: [] };
  log.addCheckpoint(perf, "validation_complete");

  // Try FTS5 search first, fall back to LIKE if FTS not available
  var useFts = true;
  var pluginIds = [];
  var showcaseIds = [];

  try {
    // Check if FTS tables exist by attempting a query
    if (type === "all" || type === "plugins") {
      var ftsSql =
        "SELECT rowid FROM plugins_fts WHERE plugins_fts MATCH ? LIMIT ?";
      var ftsQuery = $app.newQuery(ftsSql);
      ftsQuery.bind(String(q), limit);
      var ftsResults = ftsQuery.execute();
      ftsQuery.close();

      for (var i = 0; i < ftsResults.length; i++) {
        pluginIds.push(ftsResults[i].rowid);
      }
    }
    log.addCheckpoint(perf, "fts_plugins_complete");

    if (type === "all" || type === "showcase") {
      var ftsSql2 =
        "SELECT rowid FROM showcase_fts WHERE showcase_fts MATCH ? LIMIT ?";
      var ftsQuery2 = $app.newQuery(ftsSql2);
      ftsQuery2.bind(String(q), limit);
      var ftsResults2 = ftsQuery2.execute();
      ftsQuery2.close();

      for (var j = 0; j < ftsResults2.length; j++) {
        showcaseIds.push(ftsResults2[j].rowid);
      }
    }
    log.addCheckpoint(perf, "fts_showcase_complete");
  } catch (err) {
    // FTS not available, fall back to LIKE search
    useFts = false;
    log.warn(ctx, "FTS not available, using LIKE fallback", {
      error: String(err),
    });
  }

  if (useFts) {
    // Fetch full records by FTS results
    if (pluginIds.length > 0) {
      var placeholders = [];
      var params = {};
      for (var k = 0; k < pluginIds.length; k++) {
        var key = "pid" + k;
        placeholders.push("{:" + key + "}");
        params[key] = pluginIds[k];
      }
      try {
        var plugins = $app.findRecordsByFilter(
          "plugins",
          "id IN (" + placeholders.join(",") + ") && status = 'approved'",
          "-featured,-created",
          limit,
          0,
          params,
        );
        for (var m = 0; m < (plugins || []).length; m++) {
          var p = plugins[m];
          data.plugins.push({
            id: p.id,
            name: p.get("name"),
            slug: p.get("slug"),
            description: p.get("description"),
            category: p.get("category") || "",
          });
        }
      } catch (_) {}
    }

    if (showcaseIds.length > 0) {
      var placeholders2 = [];
      var params2 = {};
      for (var n = 0; n < showcaseIds.length; n++) {
        var key2 = "sid" + n;
        placeholders2.push("{:" + key2 + "}");
        params2[key2] = showcaseIds[n];
      }
      try {
        var showcases = $app.findRecordsByFilter(
          "showcase",
          "id IN (" + placeholders2.join(",") + ") && status = 'approved'",
          "-featured,-created",
          limit,
          0,
          params2,
        );
        for (var x = 0; x < (showcases || []).length; x++) {
          var s = showcases[x];
          data.showcase.push({
            id: s.id,
            title: s.get("title"),
            slug: s.get("slug"),
            description: s.get("description"),
            category: s.get("category") || "",
          });
        }
      } catch (_) {}
    }
  } else {
    // Fallback to LIKE search
    if (type === "all" || type === "plugins") {
      var plugins2 = $app.findRecordsByFilter(
        "plugins",
        "status = 'approved' && (name ~ {:q} || description ~ {:q} || category ~ {:q})",
        "-featured,-created",
        limit,
        0,
        { q: q },
      );
      for (var y = 0; y < (plugins2 || []).length; y++) {
        var p2 = plugins2[y];
        data.plugins.push({
          id: p2.id,
          name: p2.get("name"),
          slug: p2.get("slug"),
          description: p2.get("description"),
          category: p2.get("category") || "",
        });
      }
    }

    if (type === "all" || type === "showcase") {
      var showcases2 = $app.findRecordsByFilter(
        "showcase",
        "status = 'approved' && (title ~ {:q} || description ~ {:q} || category ~ {:q})",
        "-featured,-created",
        limit,
        0,
        { q: q },
      );
      for (var z = 0; z < (showcases2 || []).length; z++) {
        var s2 = showcases2[z];
        data.showcase.push({
          id: s2.id,
          title: s2.get("title"),
          slug: s2.get("slug"),
          description: s2.get("description"),
          category: s2.get("category") || "",
        });
      }
    }
  }

  log.addCheckpoint(perf, "fetch_complete");

  // Add cache headers for search results
  try {
    if (c.response && c.response.header) {
      var h = c.response.header();
      h.set("Cache-Control", "public, max-age=30, stale-while-revalidate=10");
      h.set("Vary", "Accept, Accept-Encoding");
    }
  } catch (_) {}

  log.info(ctx, "FTS search completed", {
    query: q.substring(0, 50),
    type: type,
    ftsUsed: useFts,
    pluginCount: data.plugins.length,
    showcaseCount: data.showcase.length,
  });

  return resp.success(c, data, {
    fts: useFts,
    elapsed: log.getElapsed(perf) + "ms",
  });
});
