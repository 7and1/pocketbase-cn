onRecordCreateRequest(function (e) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  if (!e.collection || e.collection.name !== "comments") return e.next();
  if (!e.record) return e.next();

  var auth = e.auth || null;

  // Always enforce author from the authenticated user (collection rules already require auth).
  if (auth) e.record.set("author", auth.id);

  var author = e.record.get("author");
  if (!author) throw new BadRequestError("Missing author");

  var plugin = e.record.get("plugin");
  var showcase = e.record.get("showcase");
  if (!!plugin === !!showcase) {
    throw new BadRequestError("Exactly one of plugin/showcase must be set");
  }

  var status = e.record.get("status");

  // Default moderation: pending unless moderator/admin.
  var role = "";
  try {
    role = auth ? String(auth.get("role") || "") : "";
  } catch (_) {}

  if (role && role.match(/admin|moderator/)) {
    e.record.set("status", status || "approved");
  } else {
    e.record.set("status", "pending");
  }

  return e.next();
});

onRecordUpdateRequest(function (e) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  if (!e.collection || e.collection.name !== "comments") return e.next();
  if (!e.record) return e.next();

  var auth = e.auth || null;

  // Ensure comment still targets exactly one entity.
  try {
    var plugin = e.record.get("plugin");
    var showcase = e.record.get("showcase");
    if (!!plugin === !!showcase)
      throw new BadRequestError("Exactly one of plugin/showcase must be set");
  } catch (err) {
    throw err;
  }

  // Non-staff cannot change moderation status.
  if (!pbcn.isStaff(auth)) {
    try {
      var current = $app.findRecordById("comments", e.record.id);
      e.record.set("status", current.get("status"));
    } catch (_) {}
  }

  // Author is immutable.
  try {
    var current2 = $app.findRecordById("comments", e.record.id);
    e.record.set("author", current2.get("author"));
  } catch (_) {}

  return e.next();
});

routerAdd("GET", "/api/comments/list", function (c) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  var info = c.requestInfo() || {};
  var pluginSlug = pbcn.trim(
    info.query && info.query.plugin ? String(info.query.plugin) : "",
  );
  var showcaseSlug = pbcn.trim(
    info.query && info.query.showcase ? String(info.query.showcase) : "",
  );
  var parent = pbcn.trim(
    info.query && info.query.parent ? String(info.query.parent) : "",
  );

  if (!!pluginSlug === !!showcaseSlug) {
    return c.json(400, {
      error: {
        code: "INVALID_TARGET",
        message: "Exactly one of plugin/showcase is required",
      },
    });
  }

  var limitRaw =
    info.query && info.query.limit
      ? parseInt(String(info.query.limit), 10)
      : 30;
  var limit = limitRaw && limitRaw > 0 ? limitRaw : 30;
  if (limit > 100) limit = 100;

  var offsetRaw =
    info.query && info.query.offset
      ? parseInt(String(info.query.offset), 10)
      : 0;
  var offset = offsetRaw && offsetRaw > 0 ? offsetRaw : 0;
  if (offset < 0) offset = 0;
  if (offset > 20000) offset = 20000;

  var auth = c.auth || null;
  var staff = pbcn.isStaff(auth);

  var targetId = "";
  try {
    if (pluginSlug) {
      var p = $app.findFirstRecordByFilter("plugins", "slug = {:s}", {
        s: pluginSlug,
      });
      targetId = p.id;
    } else {
      var s = $app.findFirstRecordByFilter("showcase", "slug = {:s}", {
        s: showcaseSlug,
      });
      targetId = s.id;
    }
  } catch (_) {
    return c.json(404, {
      error: { code: "NOT_FOUND", message: "Target not found" },
    });
  }

  var filter = pluginSlug ? "plugin = {:id}" : "showcase = {:id}";
  var params = { id: targetId };

  if (!staff) {
    if (auth) {
      filter += " && (status = 'approved' || author = {:author})";
      params.author = auth.id;
    } else {
      filter += " && status = 'approved'";
    }
  }

  if (parent) {
    filter += " && parent = {:parent}";
    params.parent = parent;
  } else {
    // top-level comments only
    filter += " && parent = ''";
  }

  var rows = $app.findRecordsByFilter(
    "comments",
    filter,
    "-created",
    limit + 1,
    offset,
    params,
  );
  var hasMore = false;
  if (rows && rows.length > limit) {
    hasMore = true;
    rows = rows.slice(0, limit);
  }

  function authorInfo(userId) {
    if (!userId) return null;
    try {
      var u = $app.findRecordById("users", String(userId));
      return {
        id: u.id,
        username: u.get("username") || "",
        name: u.get("name") || "",
        avatar: u.get("avatar") || "",
      };
    } catch (_) {
      return { id: String(userId) };
    }
  }

  var data = [];
  for (var i = 0; i < (rows || []).length; i++) {
    var r = rows[i];
    data.push({
      id: r.id,
      author: authorInfo(r.get("author")),
      content: r.get("content") || "",
      status: r.get("status") || "",
      parent: r.get("parent") || "",
      created: r.get("created") || null,
      updated: r.get("updated") || null,
    });
  }

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

routerAdd(
  "POST",
  "/api/comments/create",
  function (c) {
    var pbcn = require(__hooks + "/lib/pbcn.js");

    var auth = c.auth || null;
    if (!auth)
      return c.json(401, {
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });

    var ip = "";
    try {
      ip = c.realIP();
    } catch (_) {}

    if (
      !pbcn.rateLimitAllow({
        id: "comments_create",
        windowSec: 60,
        max: 10,
        key: ip || auth.id,
      })
    ) {
      return c.json(429, {
        error: { code: "RATE_LIMITED", message: "Too many requests" },
      });
    }

    var info = c.requestInfo() || {};
    var body = info.body || {};

    var pluginSlug = pbcn.trim(body.plugin || "");
    var showcaseSlug = pbcn.trim(body.showcase || "");
    var parent = pbcn.trim(body.parent || "");
    var content = pbcn.trim(body.content || "");

    if (!!pluginSlug === !!showcaseSlug) {
      return c.json(400, {
        error: {
          code: "INVALID_TARGET",
          message: "Exactly one of plugin/showcase is required",
        },
      });
    }

    if (!content || content.length < 1) {
      return c.json(400, {
        error: { code: "INVALID_CONTENT", message: "Missing content" },
      });
    }
    if (content.length > 5000) {
      return c.json(400, {
        error: { code: "INVALID_CONTENT", message: "Content too long" },
      });
    }

    var targetId = "";
    try {
      if (pluginSlug) {
        var p = $app.findFirstRecordByFilter("plugins", "slug = {:s}", {
          s: pluginSlug,
        });
        targetId = p.id;
      } else {
        var s = $app.findFirstRecordByFilter("showcase", "slug = {:s}", {
          s: showcaseSlug,
        });
        targetId = s.id;
      }
    } catch (_) {
      return c.json(404, {
        error: { code: "NOT_FOUND", message: "Target not found" },
      });
    }

    var col = $app.findCollectionByNameOrId("comments");
    var r = new Record(col);
    r.set("author", auth.id);
    if (pluginSlug) r.set("plugin", targetId);
    else r.set("showcase", targetId);
    if (parent) r.set("parent", parent);
    r.set("content", content);
    r.set("status", pbcn.isStaff(auth) ? "approved" : "pending");

    // status and other invariants are enforced by hooks.
    $app.save(r);

    return c.json(200, {
      data: {
        id: r.id,
        author: { id: auth.id },
        content: r.get("content") || "",
        status: r.get("status") || "",
        parent: r.get("parent") || "",
        created: r.get("created") || null,
      },
    });
  },
  $apis.requireAuth(),
);
