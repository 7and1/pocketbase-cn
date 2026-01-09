// Showcase API routes - all cache/ETag helpers are in lib/pbcn.js

routerAdd("GET", "/api/showcase/featured", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  var items = $app.findRecordsByFilter(
    "showcase",
    "status = 'approved' && featured = true",
    "-created",
    12,
    0,
  );

  // Batch load votes to avoid N+1 queries
  var showcaseIds = [];
  for (var i = 0; i < (items || []).length; i++) {
    showcaseIds.push(items[i].id);
  }
  var votesMap = pbcn.batchLoadShowcaseVotes(showcaseIds);

  var data = [];
  for (var j = 0; j < (items || []).length; j++) {
    var s = items[j];
    data.push({
      id: s.id,
      title: s.get("title"),
      slug: s.get("slug"),
      description: s.get("description"),
      url: s.get("url"),
      repository: s.get("repository") || "",
      category: s.get("category") || "",
      tags: s.get("tags") || [],
      featured: !!s.get("featured"),
      thumbnail: s.get("thumbnail") || "",
      screenshots: s.get("screenshots") || [],
      views: s.get("views") || 0,
      votes: votesMap[s.id] || 0,
      updated: s.get("updated") || null,
    });
  }

  var response = { data: data, meta: { total: data.length } };
  var etag = pbcn.generateETag(response);

  if (pbcn.checkETag(c, etag)) {
    return c.noContent(304);
  }

  pbcn.setCacheHeaders(
    c,
    etag,
    "public, max-age=300, s-maxage=600, stale-while-revalidate=30",
  );

  return c.json(200, response);
});

routerAdd("GET", "/api/showcase/list", function (c) {
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

  var limitRaw =
    info.query && info.query.limit
      ? parseInt(String(info.query.limit), 10)
      : 24;
  var limit = limitRaw && limitRaw > 0 ? limitRaw : 24;
  if (limit > 100) limit = 100;

  var offsetRaw =
    info.query && info.query.offset
      ? parseInt(String(info.query.offset), 10)
      : 0;
  var offset = offsetRaw && offsetRaw > 0 ? offsetRaw : 0;
  if (offset < 0) offset = 0;
  if (offset > 20000) offset = 20000;

  var filter = "status = 'approved'";
  var params = {};

  if (q) {
    filter += " && (title ~ {:q} || description ~ {:q})";
    params.q = q;
  }

  if (category) {
    filter += " && category = {:category}";
    params.category = category;
  }

  var items = $app.findRecordsByFilter(
    "showcase",
    filter,
    sort,
    limit + 1,
    offset,
    params,
  );
  var hasMore = false;
  if (items && items.length > limit) {
    hasMore = true;
    items = items.slice(0, limit);
  }

  // Batch load votes to avoid N+1 queries
  var showcaseIds = [];
  for (var x = 0; x < (items || []).length; x++) {
    showcaseIds.push(items[x].id);
  }
  var votesMap = pbcn.batchLoadShowcaseVotes(showcaseIds);

  var data = [];
  for (var i = 0; i < (items || []).length; i++) {
    var s = items[i];
    data.push({
      id: s.id,
      title: s.get("title"),
      slug: s.get("slug"),
      description: s.get("description"),
      url: s.get("url"),
      repository: s.get("repository") || "",
      category: s.get("category") || "",
      tags: s.get("tags") || [],
      featured: !!s.get("featured"),
      thumbnail: s.get("thumbnail") || "",
      screenshots: s.get("screenshots") || [],
      views: s.get("views") || 0,
      votes: votesMap[s.id] || 0,
      updated: s.get("updated") || null,
    });
  }

  var response = {
    data: data,
    meta: {
      offset: offset,
      limit: limit,
      hasMore: hasMore,
      nextOffset: offset + data.length,
    },
  };

  // Use shorter cache for search results, longer for filtered lists
  var cacheAge = q ? 30 : 60;
  var etag = pbcn.generateETag(response);

  if (pbcn.checkETag(c, etag)) {
    return c.noContent(304);
  }

  pbcn.setCacheHeaders(
    c,
    etag,
    "public, max-age=" + cacheAge + ", s-maxage=120, stale-while-revalidate=10",
  );

  return c.json(200, response);
});

routerAdd("GET", "/api/showcase/{slug}", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  var slug = "";
  try {
    slug = pbcn.trim(c.request.pathValue("slug"));
  } catch (_) {}

  if (!slug)
    return c.json(400, {
      error: { code: "MISSING_SLUG", message: "Missing slug" },
    });

  var s = null;
  try {
    s = $app.findFirstRecordByFilter(
      "showcase",
      "slug = {:slug} && status = 'approved'",
      { slug: slug },
    );
  } catch (_) {
    return c.json(404, {
      error: { code: "NOT_FOUND", message: "Showcase not found" },
    });
  }

  // Best-effort view increment.
  try {
    s.set("views", parseInt(String(s.get("views") || 0), 10) + 1);
    $app.save(s);
  } catch (_) {}

  // Get vote count (single query for detail view)
  var votes = 0;
  try {
    var voteRows = $app.findRecordsByFilter(
      "showcase_votes",
      "showcase = {:id}",
      "",
      0,
      0,
      { id: s.id },
    );
    votes = (voteRows || []).length;
  } catch (_) {}

  var response = {
    data: {
      id: s.id,
      title: s.get("title"),
      slug: s.get("slug"),
      description: s.get("description"),
      content: s.get("content") || "",
      url: s.get("url") || "",
      repository: s.get("repository") || "",
      category: s.get("category") || "",
      tags: s.get("tags") || [],
      featured: !!s.get("featured"),
      thumbnail: s.get("thumbnail") || "",
      screenshots: s.get("screenshots") || [],
      views: s.get("views") || 0,
      votes: votes,
      updated: s.get("updated") || null,
    },
  };

  // Detail view gets shorter cache due to view increment
  pbcn.setCacheHeaders(
    c,
    null,
    "public, max-age=60, s-maxage=120, stale-while-revalidate=15",
  );

  return c.json(200, response);
});

routerAdd(
  "POST",
  "/api/showcase/{slug}/vote",
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

    var showcase = null;
    try {
      showcase = $app.findFirstRecordByFilter(
        "showcase",
        "slug = {:slug} && status = 'approved'",
        { slug: slug },
      );
    } catch (_) {
      return c.json(404, {
        error: { code: "NOT_FOUND", message: "Showcase not found" },
      });
    }

    // Get vote count after toggle (single query)
    var getVoteCount = function (sid) {
      try {
        var rows = $app.findRecordsByFilter(
          "showcase_votes",
          "showcase = {:id}",
          "",
          0,
          0,
          { id: sid },
        );
        return (rows || []).length;
      } catch (_) {
        return 0;
      }
    };

    try {
      var existing = $app.findFirstRecordByFilter(
        "showcase_votes",
        "showcase = {:showcase} && user = {:user}",
        { showcase: showcase.id, user: authRecord.id },
      );
      $app.delete(existing);
      return c.json(200, {
        data: { voted: false, votes: getVoteCount(showcase.id) },
      });
    } catch (_) {
      var col = $app.findCollectionByNameOrId("showcase_votes");
      var r = new Record(col);
      r.set("showcase", showcase.id);
      r.set("user", authRecord.id);
      $app.save(r);
      return c.json(200, {
        data: { voted: true, votes: getVoteCount(showcase.id) },
      });
    }
  },
  $apis.requireAuth(),
);
