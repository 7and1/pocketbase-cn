routerAdd("GET", "/api/search", function (c) {
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
    return c.json(400, {
      error: {
        code: "INVALID_QUERY",
        message: "Query must be at least 2 characters",
      },
    });
  }

  var data = { plugins: [], showcase: [] };

  // Use CASE-INSENSITIVE search with better performance
  // The ~ operator in PocketBase is case-insensitive LIKE
  var searchQ = q.toLowerCase();

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

  // Add cache headers for search results
  try {
    if (c.response && c.response.header) {
      var h = c.response.header();
      h.set("Cache-Control", "public, max-age=30, stale-while-revalidate=10");
      h.set("Vary", "Accept, Accept-Encoding");
    }
  } catch (_) {}

  return c.json(200, { data: data });
});
