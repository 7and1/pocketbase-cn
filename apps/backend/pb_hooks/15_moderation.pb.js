// Moderation/ownership guards for writable collections.
// Keep ES5-compatible syntax (Goja).

onRecordCreateRequest(function (e) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  if (!e.collection || !e.collection.name) return e.next();
  if (!e.record) return e.next();

  var col = String(e.collection.name);
  if (col !== "plugins" && col !== "showcase" && col !== "plugin_versions")
    return e.next();

  var auth = e.auth || null;

  // Collection rules will block anonymous creates, so just continue.
  if (!auth) return e.next();

  var staff = pbcn.isStaff(auth);

  if (col === "plugins") {
    // Block SVG uploads (XSS risk).
    var icon = e.record.get("icon");
    if (icon) {
      var iconStr = String(icon).toLowerCase();
      if (
        iconStr.indexOf(".svg") !== -1 ||
        iconStr.indexOf("image/svg") !== -1
      ) {
        throw new BadRequestError("SVG files are not allowed");
      }
    }

    // Always enforce author to the authenticated user.
    e.record.set("author", auth.id);

    // Ensure slug is present.
    var slug = pbcn.trim(e.record.get("slug"));
    if (!slug) {
      slug = pbcn.slugify(e.record.get("name"));
      e.record.set("slug", slug);
    }

    // Default to pending unless staff.
    if (!staff) e.record.set("status", "pending");
  }

  if (col === "showcase") {
    // Block SVG uploads (XSS risk).
    var sicon = e.record.get("icon");
    if (sicon) {
      var siconStr = String(sicon).toLowerCase();
      if (
        siconStr.indexOf(".svg") !== -1 ||
        siconStr.indexOf("image/svg") !== -1
      ) {
        throw new BadRequestError("SVG files are not allowed");
      }
    }

    e.record.set("author", auth.id);

    var sslug = pbcn.trim(e.record.get("slug"));
    if (!sslug) {
      sslug = pbcn.slugify(e.record.get("title"));
      e.record.set("slug", sslug);
    }

    if (!staff) e.record.set("status", "pending");
  }

  if (col === "plugin_versions") {
    var pluginId = pbcn.trim(e.record.get("plugin"));
    if (!pluginId) throw new BadRequestError("Missing plugin");

    var plugin = null;
    try {
      plugin = $app.findRecordById("plugins", pluginId);
    } catch (_) {
      throw new BadRequestError("Invalid plugin");
    }

    // Only allow the plugin author to create versions, unless staff.
    if (!staff) {
      var owner = "";
      try {
        owner = pbcn.trim(plugin.get("author"));
      } catch (_) {}
      if (!owner || owner !== auth.id) throw new ForbiddenError("Not allowed");
    }

    // Prevent user-supplied counters.
    e.record.set("downloads", 0);

    // Basic semver validation.
    var version = pbcn.trim(e.record.get("version"));
    if (
      !version ||
      !/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)
    ) {
      throw new BadRequestError("Invalid version");
    }
  }

  return e.next();
});

onRecordUpdateRequest(function (e) {
  var pbcn = require(__hooks + "/lib/pbcn.js");

  if (!e.collection || !e.collection.name) return e.next();
  if (!e.record) return e.next();

  var col = String(e.collection.name);
  if (col !== "plugins" && col !== "showcase") return e.next();

  var auth = e.auth || null;

  // Collection rules already enforce ownership; we only protect staff-only fields.
  var staff = pbcn.isStaff(auth);
  if (staff) return e.next();

  // Fetch existing to keep protected fields unchanged.
  var current = null;
  try {
    current = $app.findRecordById(col, e.record.id);
  } catch (_) {
    return e.next();
  }

  // Prevent non-staff from changing moderation fields.
  try {
    e.record.set("status", current.get("status"));
  } catch (_) {}
  try {
    e.record.set("featured", current.get("featured"));
  } catch (_) {}

  // Prevent author changes.
  try {
    e.record.set("author", current.get("author"));
  } catch (_) {}

  // Keep slug stable for public URLs.
  try {
    e.record.set("slug", current.get("slug"));
  } catch (_) {}

  return e.next();
});
