/// <reference path="../types.d.ts" />

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
  var resp = null;
  var log = null;
  try {
    resp = require(__hooks + "/lib/response.js");
    log = require(__hooks + "/lib/logger.js");
  } catch (_) {
    return c.json(500, { error: "Failed to load helpers" });
  }

  var ctx = log.withRequestContext(c, { endpoint: "comments_list" });

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
    return resp.badRequest(c, "Exactly one of plugin/showcase is required");
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
    return resp.notFound(c, "Target not found");
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

  log.info(ctx, "Comments listed", {
    target: pluginSlug || showcaseSlug,
    count: data.length,
    hasMore: hasMore,
  });

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
    var resp = null;
    var log = null;
    var validator = null;
    try {
      resp = require(__hooks + "/lib/response.js");
      log = require(__hooks + "/lib/logger.js");
      validator = require(__hooks + "/lib/validator.js");
    } catch (_) {
      return c.json(500, { error: "Failed to load helpers" });
    }

    var ctx = log.withRequestContext(c, { endpoint: "comments_create" });
    var perf = log.createPerfContext();
    ctx.perf = perf;

    var auth = c.auth || null;
    if (!auth) return resp.unauthorized(c, "Authentication required");

    var ip = "";
    try {
      ip = c.realIP();
    } catch (_) {}

    // Use rate_limits module for tier-based limiting
    var rateLimits = null;
    try {
      rateLimits = require(__hooks + "/lib/rate_limits.js");
    } catch (_) {}

    if (rateLimits) {
      var rateResult = rateLimits.checkRateLimit(c, "comment", null);
      if (!rateResult.allowed) {
        log.warn(ctx, "Rate limit exceeded", {
          tier: rateResult.tier,
          key: rateResult.key,
        });
        return resp.rateLimited(
          c,
          "Too many comment requests. Please try again later.",
        );
      }
    } else {
      // Fallback to pbcn rate limiting
      if (
        !pbcn.rateLimitAllow({
          id: "comments_create",
          windowSec: 60,
          max: 10,
          key: ip || auth.id,
        })
      ) {
        return resp.rateLimited(c, "Too many requests");
      }
    }

    log.addCheckpoint(perf, "rate_limit_checked");

    var info = c.requestInfo() || {};
    var body = info.body || {};

    var pluginSlug = pbcn.trim(body.plugin || "");
    var showcaseSlug = pbcn.trim(body.showcase || "");
    var parent = pbcn.trim(body.parent || "");
    var content = pbcn.trim(body.content || "");

    if (!!pluginSlug === !!showcaseSlug) {
      return resp.badRequest(c, "Exactly one of plugin/showcase is required");
    }

    // Use validator for content validation
    if (!validator.isLength(content, 1, 5000)) {
      return resp.badRequest(
        c,
        "Content must be between 1 and 5000 characters",
      );
    }

    // Sanitize content to prevent XSS
    content = validator.sanitizeHtml(content);

    log.addCheckpoint(perf, "validation_complete");

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
      return resp.notFound(c, "Target not found");
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

    log.addCheckpoint(perf, "comment_saved");

    log.info(ctx, "Comment created", {
      commentId: r.id,
      target: pluginSlug || showcaseSlug,
      status: r.get("status"),
    });

    return resp.created(c, {
      id: r.id,
      author: { id: auth.id },
      content: r.get("content") || "",
      status: r.get("status") || "",
      parent: r.get("parent") || "",
      created: r.get("created") || null,
    });
  },
  $apis.requireAuth(),
);
