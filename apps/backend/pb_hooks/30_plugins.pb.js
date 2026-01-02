routerAdd("GET", "/api/plugins/featured", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  var plugins = $app.findRecordsByFilter(
    "plugins",
    "status = 'approved' && featured = true",
    "-created",
    10,
    0,
  );

  // Batch load stats to avoid N+1 queries
  var pluginIds = [];
  for (var i = 0; i < (plugins || []).length; i++) {
    pluginIds.push(plugins[i].id);
  }
  var statsMap = pbcn.batchLoadPluginStats(pluginIds);

  var data = [];
  for (var j = 0; j < (plugins || []).length; j++) {
    var p = plugins[j];
    var stats = statsMap[p.id] || {};
    data.push({
      id: p.id,
      name: p.get("name"),
      slug: p.get("slug"),
      description: p.get("description"),
      category: p.get("category") || "",
      icon: p.get("icon") || "",
      screenshots: p.get("screenshots") || [],
      downloads_total: (stats.get ? stats.get("downloads_total") : 0) || 0,
      stars: (stats.get ? stats.get("stars") : 0) || 0,
    });
  }

  c.response().header().set("Cache-Control", "public, max-age=300");
  return c.json(200, { data: data, meta: { total: data.length } });
});

routerAdd("GET", "/api/plugins/trending", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  var info = c.requestInfo() || {};
  var paging = pbcn.parsePagination(info.query, {
    limit: 10,
    maxLimit: 50,
  });

  var statsList = $app.findRecordsByFilter(
    "plugin_stats",
    "downloads_weekly > 0",
    "-downloads_weekly",
    paging.limit,
    0,
  );

  // Batch load plugins to avoid N+1 queries
  var pluginIds = [];
  for (var i = 0; i < (statsList || []).length; i++) {
    pluginIds.push(statsList[i].get("plugin"));
  }

  var pluginsMap = {};
  if (pluginIds.length) {
    var placeholders = [];
    var params = {};
    for (var k = 0; k < pluginIds.length; k++) {
      var key = "id" + k;
      placeholders.push("{:" + key + "}");
      params[key] = pluginIds[k];
    }
    try {
      var pluginsList = $app.findRecordsByFilter(
        "plugins",
        "id IN (" + placeholders.join(",") + ") && status = 'approved'",
        "",
        0,
        0,
        params,
      );
      for (var m = 0; m < (pluginsList || []).length; m++) {
        pluginsMap[pluginsList[m].id] = pluginsList[m];
      }
    } catch (_) {}
  }

  var data = [];
  for (var j = 0; j < (statsList || []).length; j++) {
    var s = statsList[j];
    var pluginId = s.get("plugin");
    var p = pluginsMap[pluginId];
    if (!p) continue;
    data.push({
      id: p.id,
      name: p.get("name"),
      slug: p.get("slug"),
      description: p.get("description"),
      category: p.get("category") || "",
      icon: p.get("icon") || "",
      screenshots: p.get("screenshots") || [],
      downloads_weekly: s.get("downloads_weekly") || 0,
      downloads_total: s.get("downloads_total") || 0,
      stars: s.get("stars") || 0,
    });
  }

  c.response().header().set("Cache-Control", "public, max-age=300");
  return c.json(200, { data: data, meta: { total: data.length } });
});

routerAdd("GET", "/api/plugins/list", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  var info = c.requestInfo() || {};
  var q = info.query && info.query.q ? String(info.query.q) : "";
  q = pbcn.trim(q);

  var category =
    info.query && info.query.category ? String(info.query.category) : "";
  category = pbcn.trim(category);

  var sort =
    info.query && info.query.sort
      ? String(info.query.sort)
      : "-featured,-created";
  if (!sort) sort = "-featured,-created";

  var paging = pbcn.parsePagination(info.query, {
    limit: 30,
    maxLimit: 100,
    maxOffset: 20000,
  });
  var limit = paging.limit;
  var offset = paging.offset;

  var filter = "status = 'approved'";
  var params = {};

  if (q) {
    filter += " && (name ~ {:q} || description ~ {:q})";
    params.q = q;
  }

  if (category) {
    filter += " && category = {:category}";
    params.category = category;
  }

  var plugins = $app.findRecordsByFilter(
    "plugins",
    filter,
    sort,
    limit + 1,
    offset,
    params,
  );
  var hasMore = false;
  if (plugins && plugins.length > limit) {
    hasMore = true;
    plugins = plugins.slice(0, limit);
  }

  // Batch load stats to avoid N+1 queries
  var pluginIds = [];
  for (var i = 0; i < (plugins || []).length; i++) {
    pluginIds.push(plugins[i].id);
  }
  var statsMap = pbcn.batchLoadPluginStats(pluginIds);

  var data = [];
  for (var j = 0; j < (plugins || []).length; j++) {
    var p = plugins[j];
    var stats = statsMap[p.id] || {};
    data.push({
      id: p.id,
      name: p.get("name"),
      slug: p.get("slug"),
      description: p.get("description"),
      category: p.get("category") || "",
      tags: p.get("tags") || [],
      repository: p.get("repository") || "",
      homepage: p.get("homepage") || "",
      featured: !!p.get("featured"),
      icon: p.get("icon") || "",
      screenshots: p.get("screenshots") || [],
      github_stars: p.get("github_stars") || 0,
      github_updated_at: p.get("github_updated_at") || null,
      downloads_total: (stats.get ? stats.get("downloads_total") : 0) || 0,
      downloads_weekly: (stats.get ? stats.get("downloads_weekly") : 0) || 0,
      stars: (stats.get ? stats.get("stars") : 0) || 0,
    });
  }

  c.response().header().set("Cache-Control", "public, max-age=60");
  return c.json(200, {
    data: data,
    meta: {
      offset: offset,
      limit: limit,
      hasMore: hasMore,
      nextOffset: offset + data.length,
    },
  });
});

routerAdd("GET", "/api/plugins/{slug}", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  var slug = "";
  try {
    slug = pbcn.trim(c.request.pathValue("slug"));
  } catch (_) {}

  if (!slug)
    return c.json(400, {
      error: { code: "MISSING_SLUG", message: "Missing slug" },
    });

  var plugin = null;
  try {
    plugin = $app.findFirstRecordByFilter(
      "plugins",
      "slug = {:slug} && status = 'approved'",
      { slug: slug },
    );
  } catch (_) {
    return c.json(404, {
      error: { code: "NOT_FOUND", message: "Plugin not found" },
    });
  }

  var stats = pbcn.ensurePluginStats(plugin.id);

  // Best-effort view increment (rate-limited per IP + slug).
  try {
    var ip = "";
    try {
      ip = c.realIP();
    } catch (_) {}

    if (
      ip &&
      pbcn.rateLimitAllow({
        id: "plugin_view:" + slug,
        windowSec: 3600,
        max: 5,
        key: ip,
      })
    ) {
      stats.set(
        "views_total",
        parseInt(String(stats.get("views_total") || 0), 10) + 1,
      );
      stats.set(
        "views_weekly",
        parseInt(String(stats.get("views_weekly") || 0), 10) + 1,
      );
      $app.save(stats);
    }
  } catch (_) {}

  var versions = $app.findRecordsByFilter(
    "plugin_versions",
    "plugin = {:plugin}",
    "-created",
    10,
    0,
    { plugin: plugin.id },
  );

  var v = [];
  for (var i = 0; i < (versions || []).length; i++) {
    var r = versions[i];
    v.push({
      id: r.id,
      version: r.get("version"),
      download_url: r.get("download_url") || "",
      changelog: r.get("changelog") || "",
      downloads: r.get("downloads") || 0,
      created: r.get("created") || null,
    });
  }

  return c.json(200, {
    data: {
      id: plugin.id,
      name: plugin.get("name"),
      slug: plugin.get("slug"),
      description: plugin.get("description"),
      readme: plugin.get("readme") || "",
      repository: plugin.get("repository") || "",
      homepage: plugin.get("homepage") || "",
      category: plugin.get("category") || "",
      tags: plugin.get("tags") || [],
      license: plugin.get("license") || "",
      featured: !!plugin.get("featured"),
      icon: plugin.get("icon") || "",
      screenshots: plugin.get("screenshots") || [],
      github_stars: plugin.get("github_stars") || 0,
      github_updated_at: plugin.get("github_updated_at") || null,
      stats: {
        downloads_total: stats.get("downloads_total") || 0,
        downloads_weekly: stats.get("downloads_weekly") || 0,
        views_total: stats.get("views_total") || 0,
        views_weekly: stats.get("views_weekly") || 0,
        stars: stats.get("stars") || 0,
      },
      versions: v,
    },
  });
});

routerAdd(
  "POST",
  "/api/plugins/{slug}/star",
  function (c) {
    var pbcn = require(__hooks + "/lib/pbcn.js");

    var authRecord = c.auth || null;
    if (!authRecord) {
      return c.json(401, {
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    var slug = "";
    try {
      slug = pbcn.trim(c.request.pathValue("slug"));
    } catch (_) {}

    if (!slug)
      return c.json(400, {
        error: { code: "MISSING_SLUG", message: "Missing slug" },
      });

    var plugin = null;
    try {
      plugin = $app.findFirstRecordByFilter(
        "plugins",
        "slug = {:slug} && status = 'approved'",
        { slug: slug },
      );
    } catch (_) {
      return c.json(404, {
        error: { code: "NOT_FOUND", message: "Plugin not found" },
      });
    }

    var stats = pbcn.ensurePluginStats(plugin.id);

    try {
      var existing = $app.findFirstRecordByFilter(
        "plugin_stars",
        "plugin = {:plugin} && user = {:user}",
        { plugin: plugin.id, user: authRecord.id },
      );
      $app.delete(existing);

      var nextStars = parseInt(String(stats.get("stars") || 0), 10) - 1;
      if (nextStars < 0) nextStars = 0;
      stats.set("stars", nextStars);
      $app.save(stats);

      return c.json(200, { data: { starred: false, stars: nextStars } });
    } catch (_) {
      var col = $app.findCollectionByNameOrId("plugin_stars");
      var r = new Record(col);
      r.set("plugin", plugin.id);
      r.set("user", authRecord.id);
      $app.save(r);

      var nextStars2 = parseInt(String(stats.get("stars") || 0), 10) + 1;
      stats.set("stars", nextStars2);
      $app.save(stats);

      return c.json(200, { data: { starred: true, stars: nextStars2 } });
    }
  },
  $apis.requireAuth(),
);

routerAdd("GET", "/api/plugins/{slug}/download", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  var slug = "";
  try {
    slug = pbcn.trim(c.request.pathValue("slug"));
  } catch (_) {}

  if (!slug)
    return c.json(400, {
      error: { code: "MISSING_SLUG", message: "Missing slug" },
    });

  var ip = "";
  try {
    ip = c.realIP();
  } catch (_) {}

  if (
    !pbcn.rateLimitAllow({
      id: "plugin_download",
      windowSec: 60,
      max: 30,
      key: ip || "anon",
    })
  ) {
    return c.json(429, {
      error: { code: "RATE_LIMITED", message: "Too many requests" },
    });
  }

  var info = c.requestInfo() || {};
  var version =
    info.query && info.query.version ? String(info.query.version) : "";
  version = pbcn.trim(version);

  var plugin = null;
  try {
    plugin = $app.findFirstRecordByFilter(
      "plugins",
      "slug = {:slug} && status = 'approved'",
      { slug: slug },
    );
  } catch (_) {
    return c.json(404, {
      error: { code: "NOT_FOUND", message: "Plugin not found" },
    });
  }

  var stats = pbcn.ensurePluginStats(plugin.id);

  var pv = null;
  try {
    if (version) {
      pv = $app.findFirstRecordByFilter(
        "plugin_versions",
        "plugin = {:plugin} && version = {:version}",
        { plugin: plugin.id, version: version },
      );
    } else {
      var list = $app.findRecordsByFilter(
        "plugin_versions",
        "plugin = {:plugin}",
        "-created",
        1,
        0,
        { plugin: plugin.id },
      );
      pv = list && list.length ? list[0] : null;
    }
  } catch (_) {
    pv = null;
  }

  if (!pv)
    return c.json(404, {
      error: { code: "NOT_FOUND", message: "No downloadable version found" },
    });

  var url = pv.get("download_url");
  if (!url)
    return c.json(404, {
      error: { code: "NOT_FOUND", message: "Missing download URL" },
    });

  try {
    pv.set("downloads", parseInt(String(pv.get("downloads") || 0), 10) + 1);
    $app.save(pv);
  } catch (_) {}

  try {
    stats.set(
      "downloads_total",
      parseInt(String(stats.get("downloads_total") || 0), 10) + 1,
    );
    stats.set(
      "downloads_weekly",
      parseInt(String(stats.get("downloads_weekly") || 0), 10) + 1,
    );
    $app.save(stats);
  } catch (_) {}

  return c.redirect(302, url);
});
