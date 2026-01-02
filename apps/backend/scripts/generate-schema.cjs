const fs = require("node:fs");

// PocketBase v0.23 collection id default:
//   id = "pbc_" + strconv.Itoa(int(crc32.ChecksumIEEE([]byte(type+name))))
function crc32IEEE(str) {
  const table =
    crc32IEEE._table ||
    (crc32IEEE._table = (function () {
      const t = new Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++)
          c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[i] = c >>> 0;
      }
      return t;
    })());

  let crc = 0xffffffff;
  for (let i = 0; i < str.length; i++) {
    crc = table[(crc ^ str.charCodeAt(i)) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function collectionId(type, name) {
  return "pbc_" + String(crc32IEEE(String(type) + String(name)));
}

const IDS = {
  // Built-in default auth collection (created automatically by PocketBase).
  users: "_pb_users_auth_",

  plugins: collectionId("base", "plugins"),
  plugin_versions: collectionId("base", "plugin_versions"),
  plugin_stats: collectionId("base", "plugin_stats"),
  showcase: collectionId("base", "showcase"),
  mirrors: collectionId("base", "mirrors"),
  newsletter: collectionId("base", "newsletter"),
  downloads: collectionId("base", "downloads"),
  download_stats: collectionId("base", "download_stats"),
  plugin_stars: collectionId("base", "plugin_stars"),
  showcase_votes: collectionId("base", "showcase_votes"),
  comments: collectionId("base", "comments"),
  rate_limits: collectionId("base", "rate_limits"),
};

function commonField(name, overrides = {}) {
  return Object.assign(
    {
      type: overrides.type,
      name,
      system: !!overrides.system,
      hidden: !!overrides.hidden,
      presentable: !!overrides.presentable,
    },
    overrides,
  );
}

function text(name, opts = {}) {
  return commonField(
    name,
    Object.assign(
      {
        type: "text",
        min: opts.min || 0,
        max: opts.max || 0,
        pattern: opts.pattern || "",
        autogeneratePattern: opts.autogeneratePattern || "",
        required: !!opts.required,
        primaryKey: !!opts.primaryKey,
      },
      opts,
    ),
  );
}

function email(name, opts = {}) {
  return commonField(
    name,
    Object.assign(
      {
        type: "email",
        exceptDomains: opts.exceptDomains || [],
        onlyDomains: opts.onlyDomains || [],
        required: !!opts.required,
      },
      opts,
    ),
  );
}

function url(name, opts = {}) {
  return commonField(
    name,
    Object.assign(
      {
        type: "url",
        exceptDomains: opts.exceptDomains || [],
        onlyDomains: opts.onlyDomains || [],
        required: !!opts.required,
      },
      opts,
    ),
  );
}

function number(name, opts = {}) {
  const f = commonField(
    name,
    Object.assign(
      {
        type: "number",
        onlyInt: !!opts.onlyInt,
        required: !!opts.required,
      },
      opts,
    ),
  );
  f.min = typeof opts.min === "number" ? opts.min : null;
  f.max = typeof opts.max === "number" ? opts.max : null;
  return f;
}

function bool(name, opts = {}) {
  return commonField(
    name,
    Object.assign({ type: "bool", required: !!opts.required }, opts),
  );
}

function select(name, values, opts = {}) {
  return commonField(
    name,
    Object.assign(
      {
        type: "select",
        values,
        maxSelect: opts.maxSelect || 1,
        required: !!opts.required,
      },
      opts,
    ),
  );
}

function json(name, opts = {}) {
  return commonField(
    name,
    Object.assign(
      { type: "json", maxSize: opts.maxSize || 0, required: !!opts.required },
      opts,
    ),
  );
}

function file(name, opts = {}) {
  return commonField(
    name,
    Object.assign(
      {
        type: "file",
        maxSize: opts.maxSize || 0,
        maxSelect: opts.maxSelect || 1,
        mimeTypes: opts.mimeTypes || [],
        thumbs: opts.thumbs || [],
        protected: !!opts.protected,
        required: !!opts.required,
      },
      opts,
    ),
  );
}

function editor(name, opts = {}) {
  return commonField(
    name,
    Object.assign(
      {
        type: "editor",
        maxSize: opts.maxSize || 0,
        convertURLs: !!opts.convertURLs,
        required: !!opts.required,
      },
      opts,
    ),
  );
}

function date(name, opts = {}) {
  return commonField(
    name,
    Object.assign(
      {
        type: "date",
        min: opts.min || "",
        max: opts.max || "",
        required: !!opts.required,
      },
      opts,
    ),
  );
}

function autodate(name, opts = {}) {
  return commonField(
    name,
    Object.assign(
      {
        type: "autodate",
        onCreate: !!opts.onCreate,
        onUpdate: !!opts.onUpdate,
      },
      opts,
    ),
  );
}

function relation(name, collectionId, opts = {}) {
  return commonField(
    name,
    Object.assign(
      {
        type: "relation",
        collectionId,
        cascadeDelete: !!opts.cascadeDelete,
        minSelect: opts.minSelect || 0,
        maxSelect: opts.maxSelect || 1,
        required: !!opts.required,
      },
      opts,
    ),
  );
}

function collection({
  id,
  name,
  type,
  system = false,
  rules = {},
  indexes = [],
  fields = [],
}) {
  return {
    id,
    name,
    type,
    system,
    listRule: rules.listRule ?? null,
    viewRule: rules.viewRule ?? null,
    createRule: rules.createRule ?? null,
    updateRule: rules.updateRule ?? null,
    deleteRule: rules.deleteRule ?? null,
    fields,
    indexes,
  };
}

const roleIsStaff = "@request.auth.role ~ 'admin|moderator'";

const collections = [];

// Users: patch the built-in auth collection (_pb_users_auth_).
//
// IMPORTANT:
// - DO NOT include built-in auth fields (email, verified, avatar, etc) in a snapshot import.
// - PocketBase creates the users collection on first start; we only append our extra fields/rules/indexes.
const usersPatch = {
  id: IDS.users,
  rules: {
    listRule: roleIsStaff,
    viewRule: "@request.auth.id = id || " + roleIsStaff,
    // allow public signup; adjust in production if you require invites
    createRule: "",
    updateRule: "@request.auth.id = id || " + roleIsStaff,
    deleteRule: "@request.auth.role = 'admin'",
  },
  // Only custom indexes; keep existing PocketBase defaults.
  indexesToEnsure: [
    "CREATE UNIQUE INDEX `idx_users_github_id` ON `users` (`github_id`)",
    "CREATE INDEX `idx_users_role` ON `users` (`role`)",
  ],
  // Only custom fields; PocketBase already has username/email/avatar/etc.
  fieldsToEnsure: [
    number("github_id", { onlyInt: true, min: 1 }),
    text("bio", { max: 500 }),
    url("website", {}),
    select("role", ["user", "contributor", "moderator", "admin"], {
      required: false,
      maxSelect: 1,
    }),
    bool("profile_verified", {}),
  ],
};

// Plugins
collections.push(
  collection({
    id: IDS.plugins,
    name: "plugins",
    type: "base",
    rules: {
      listRule:
        "status = 'approved' || author = @request.auth.id || " + roleIsStaff,
      viewRule:
        "status = 'approved' || author = @request.auth.id || " + roleIsStaff,
      createRule: "@request.auth.id != ''",
      updateRule: "author = @request.auth.id || " + roleIsStaff,
      deleteRule: "@request.auth.role = 'admin'",
    },
    indexes: [
      "CREATE UNIQUE INDEX `idx_plugins_slug` ON `plugins` (`slug`)",
      "CREATE INDEX `idx_plugins_author` ON `plugins` (`author`)",
      "CREATE INDEX `idx_plugins_category` ON `plugins` (`category`)",
      "CREATE INDEX `idx_plugins_status` ON `plugins` (`status`)",
      "CREATE INDEX `idx_plugins_featured` ON `plugins` (`featured`)",
      "CREATE INDEX `idx_plugins_status_featured` ON `plugins` (`status`, `featured`)",
    ],
    fields: [
      autodate("created", { onCreate: true }),
      autodate("updated", { onCreate: true, onUpdate: true }),
      relation("author", IDS.users, { required: true, maxSelect: 1 }),
      text("name", { required: true, min: 3, max: 100 }),
      text("slug", {
        required: true,
        min: 3,
        max: 100,
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
      }),
      text("description", { required: true, min: 10, max: 500 }),
      editor("readme", {}),
      url("repository", {
        required: true,
        onlyDomains: ["github.com", "gitee.com"],
      }),
      url("homepage", {}),
      select(
        "category",
        [
          "hooks",
          "auth",
          "storage",
          "api",
          "admin",
          "integration",
          "utility",
          "template",
          "other",
        ],
        { required: true },
      ),
      json("tags", {}),
      text("license", { max: 50 }),
      file("icon", {
        mimeTypes: ["image/png", "image/svg+xml"],
        thumbs: ["100x100"],
        maxSelect: 1,
        maxSize: 512 * 1024,
      }),
      file("screenshots", {
        mimeTypes: ["image/png", "image/jpeg", "image/webp"],
        thumbs: ["320x240", "640x480"],
        maxSelect: 5,
        maxSize: 2 * 1024 * 1024,
      }),
      select("status", ["pending", "approved", "rejected", "hidden"], {
        required: true,
      }),
      bool("featured", {}),
    ],
  }),
);

// Plugin versions
collections.push(
  collection({
    id: IDS.plugin_versions,
    name: "plugin_versions",
    type: "base",
    rules: {
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.id != ''",
      updateRule: roleIsStaff,
      deleteRule: "@request.auth.role = 'admin'",
    },
    indexes: [
      "CREATE INDEX `idx_plugin_versions_plugin` ON `plugin_versions` (`plugin`)",
      "CREATE UNIQUE INDEX `idx_plugin_versions_plugin_version` ON `plugin_versions` (`plugin`, `version`)",
    ],
    fields: [
      autodate("created", { onCreate: true }),
      autodate("updated", { onCreate: true, onUpdate: true }),
      relation("plugin", IDS.plugins, { required: true, maxSelect: 1 }),
      text("version", {
        required: true,
        min: 1,
        max: 32,
        pattern: "^\\d+\\.\\d+\\.\\d+(?:[-+].+)?$",
      }),
      editor("changelog", {}),
      url("download_url", { required: true }),
      text("pocketbase_version", { required: true, min: 1, max: 32 }),
      text("checksum", { max: 256 }),
      number("file_size", { onlyInt: true, min: 0 }),
      number("downloads", { onlyInt: true, min: 0 }),
      bool("prerelease", {}),
    ],
  }),
);

// Plugin stats
collections.push(
  collection({
    id: IDS.plugin_stats,
    name: "plugin_stats",
    type: "base",
    rules: {
      listRule: "",
      viewRule: "",
      createRule: roleIsStaff,
      updateRule: roleIsStaff,
      deleteRule: "@request.auth.role = 'admin'",
    },
    indexes: [
      "CREATE UNIQUE INDEX `idx_plugin_stats_plugin` ON `plugin_stats` (`plugin`)",
      "CREATE INDEX `idx_plugin_stats_downloads` ON `plugin_stats` (`downloads_total` DESC)",
      "CREATE INDEX `idx_plugin_stats_stars` ON `plugin_stats` (`stars` DESC)",
      "CREATE INDEX `idx_plugin_stats_weekly` ON `plugin_stats` (`downloads_weekly` DESC)",
    ],
    fields: [
      autodate("created", { onCreate: true }),
      autodate("updated", { onCreate: true, onUpdate: true }),
      relation("plugin", IDS.plugins, { required: true, maxSelect: 1 }),
      number("downloads_total", { onlyInt: true, min: 0 }),
      number("downloads_weekly", { onlyInt: true, min: 0 }),
      number("views_total", { onlyInt: true, min: 0 }),
      number("views_weekly", { onlyInt: true, min: 0 }),
      number("stars", { onlyInt: true, min: 0 }),
    ],
  }),
);

// Showcase
collections.push(
  collection({
    id: IDS.showcase,
    name: "showcase",
    type: "base",
    rules: {
      listRule:
        "status = 'approved' || author = @request.auth.id || " + roleIsStaff,
      viewRule:
        "status = 'approved' || author = @request.auth.id || " + roleIsStaff,
      createRule: "@request.auth.id != ''",
      updateRule: "author = @request.auth.id || " + roleIsStaff,
      deleteRule: "@request.auth.role = 'admin'",
    },
    indexes: [
      "CREATE UNIQUE INDEX `idx_showcase_slug` ON `showcase` (`slug`)",
      "CREATE INDEX `idx_showcase_author` ON `showcase` (`author`)",
      "CREATE INDEX `idx_showcase_category` ON `showcase` (`category`)",
      "CREATE INDEX `idx_showcase_status` ON `showcase` (`status`)",
      "CREATE INDEX `idx_showcase_featured` ON `showcase` (`featured`)",
    ],
    fields: [
      autodate("created", { onCreate: true }),
      autodate("updated", { onCreate: true, onUpdate: true }),
      relation("author", IDS.users, { required: true, maxSelect: 1 }),
      text("title", { required: true, min: 3, max: 100 }),
      text("slug", {
        required: true,
        min: 3,
        max: 140,
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
      }),
      text("description", { required: true, min: 10, max: 1000 }),
      editor("content", {}),
      url("url", { required: true }),
      url("repository", {}),
      file("thumbnail", {
        mimeTypes: ["image/png", "image/jpeg", "image/webp"],
        thumbs: ["320x240", "640x480"],
        maxSelect: 1,
        maxSize: 2 * 1024 * 1024,
      }),
      file("screenshots", {
        mimeTypes: ["image/png", "image/jpeg", "image/webp"],
        thumbs: ["320x240", "640x480", "1280x720"],
        maxSelect: 5,
        maxSize: 5 * 1024 * 1024,
      }),
      select(
        "category",
        [
          "saas",
          "ecommerce",
          "cms",
          "mobile",
          "desktop",
          "api",
          "tool",
          "game",
          "other",
        ],
        { required: true },
      ),
      json("tags", {}),
      select("status", ["pending", "approved", "rejected", "hidden"], {
        required: true,
      }),
      bool("featured", {}),
      number("views", { onlyInt: true, min: 0 }),
    ],
  }),
);

// Mirrors
collections.push(
  collection({
    id: IDS.mirrors,
    name: "mirrors",
    type: "base",
    rules: {
      listRule: "",
      viewRule: "",
      createRule: roleIsStaff,
      updateRule: roleIsStaff,
      deleteRule: "@request.auth.role = 'admin'",
    },
    indexes: [
      "CREATE UNIQUE INDEX `idx_mirrors_name` ON `mirrors` (`name`)",
      "CREATE UNIQUE INDEX `idx_mirrors_base_url` ON `mirrors` (`base_url`)",
      "CREATE INDEX `idx_mirrors_region` ON `mirrors` (`region`)",
      "CREATE INDEX `idx_mirrors_status` ON `mirrors` (`status`)",
      "CREATE INDEX `idx_mirrors_priority` ON `mirrors` (`priority`)",
    ],
    fields: [
      autodate("created", { onCreate: true }),
      autodate("updated", { onCreate: true, onUpdate: true }),
      text("name", { required: true, min: 2, max: 60 }),
      url("base_url", { required: true }),
      select(
        "region",
        [
          "cn-north",
          "cn-south",
          "cn-east",
          "hk",
          "sg",
          "us-west",
          "us-east",
          "eu",
        ],
        { required: true },
      ),
      text("provider", { required: true, min: 1, max: 60 }),
      number("priority", { onlyInt: true, min: 0 }),
      select("status", ["active", "maintenance", "disabled"], {
        required: true,
      }),
      url("health_check_url", {}),
      date("last_check", {}),
      number("latency_ms", { onlyInt: true, min: 0 }),
    ],
  }),
);

// Newsletter
collections.push(
  collection({
    id: IDS.newsletter,
    name: "newsletter",
    type: "base",
    rules: {
      listRule: roleIsStaff,
      viewRule: roleIsStaff,
      createRule: "",
      updateRule: roleIsStaff,
      deleteRule: "@request.auth.role = 'admin'",
    },
    indexes: [
      "CREATE UNIQUE INDEX `idx_newsletter_email` ON `newsletter` (`email`)",
      "CREATE UNIQUE INDEX `idx_newsletter_token` ON `newsletter` (`token`)",
      "CREATE INDEX `idx_newsletter_status` ON `newsletter` (`status`)",
    ],
    fields: [
      autodate("created", { onCreate: true }),
      autodate("updated", { onCreate: true, onUpdate: true }),
      email("email", { required: true }),
      select("status", ["pending", "confirmed", "unsubscribed"], {
        required: true,
      }),
      text("token", { required: true, min: 20, max: 120 }),
      autodate("subscribed_at", { onCreate: true }),
      date("confirmed_at", {}),
      date("unsubscribed_at", {}),
      text("source", { max: 60 }),
    ],
  }),
);

// Downloads
collections.push(
  collection({
    id: IDS.downloads,
    name: "downloads",
    type: "base",
    rules: {
      listRule: "",
      viewRule: "",
      createRule: roleIsStaff,
      updateRule: roleIsStaff,
      deleteRule: "@request.auth.role = 'admin'",
    },
    indexes: [
      "CREATE UNIQUE INDEX `idx_downloads_version_platform_arch` ON `downloads` (`version`, `platform`, `arch`)",
      "CREATE INDEX `idx_downloads_version` ON `downloads` (`version`)",
    ],
    fields: [
      autodate("created", { onCreate: true }),
      autodate("updated", { onCreate: true, onUpdate: true }),
      text("version", {
        required: true,
        min: 1,
        max: 32,
        pattern: "^\\d+\\.\\d+\\.\\d+$",
      }),
      select("platform", ["darwin", "linux", "windows"], { required: true }),
      select("arch", ["amd64", "arm64", "386"], { required: true }),
      file("file", {
        mimeTypes: ["application/zip"],
        maxSelect: 1,
        maxSize: 250 * 1024 * 1024,
      }),
      url("url", {}),
      text("checksum", { max: 256 }),
      number("size", { onlyInt: true, min: 0 }),
      bool("prerelease", {}),
      date("published_at", {}),
    ],
  }),
);

collections.push(
  collection({
    id: IDS.download_stats,
    name: "download_stats",
    type: "base",
    rules: {
      listRule: "",
      viewRule: "",
      createRule: roleIsStaff,
      updateRule: roleIsStaff,
      deleteRule: "@request.auth.role = 'admin'",
    },
    indexes: [
      "CREATE UNIQUE INDEX `idx_download_stats_unique` ON `download_stats` (`version`, `platform`, `arch`, `date`)",
      "CREATE INDEX `idx_download_stats_date` ON `download_stats` (`date` DESC)",
    ],
    fields: [
      autodate("created", { onCreate: true }),
      autodate("updated", { onCreate: true, onUpdate: true }),
      text("version", { required: true, min: 1, max: 32 }),
      select("platform", ["darwin", "linux", "windows"], { required: true }),
      select("arch", ["amd64", "arm64", "386"], { required: true }),
      number("count", { onlyInt: true, min: 0 }),
      date("date", { required: true }),
    ],
  }),
);

// Stars / votes
collections.push(
  collection({
    id: IDS.plugin_stars,
    name: "plugin_stars",
    type: "base",
    rules: {
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: roleIsStaff,
      deleteRule: "@request.auth.id != '' || " + roleIsStaff,
    },
    indexes: [
      "CREATE UNIQUE INDEX `idx_plugin_stars_unique` ON `plugin_stars` (`plugin`, `user`)",
      "CREATE INDEX `idx_plugin_stars_plugin` ON `plugin_stars` (`plugin`)",
      "CREATE INDEX `idx_plugin_stars_user` ON `plugin_stars` (`user`)",
    ],
    fields: [
      autodate("created", { onCreate: true }),
      relation("plugin", IDS.plugins, { required: true, maxSelect: 1 }),
      relation("user", IDS.users, { required: true, maxSelect: 1 }),
    ],
  }),
);

collections.push(
  collection({
    id: IDS.showcase_votes,
    name: "showcase_votes",
    type: "base",
    rules: {
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: roleIsStaff,
      deleteRule: "@request.auth.id != '' || " + roleIsStaff,
    },
    indexes: [
      "CREATE UNIQUE INDEX `idx_showcase_votes_unique` ON `showcase_votes` (`showcase`, `user`)",
      "CREATE INDEX `idx_showcase_votes_showcase` ON `showcase_votes` (`showcase`)",
      "CREATE INDEX `idx_showcase_votes_user` ON `showcase_votes` (`user`)",
    ],
    fields: [
      autodate("created", { onCreate: true }),
      relation("showcase", IDS.showcase, { required: true, maxSelect: 1 }),
      relation("user", IDS.users, { required: true, maxSelect: 1 }),
    ],
  }),
);

// Comments
collections.push(
  collection({
    id: IDS.comments,
    name: "comments",
    type: "base",
    rules: {
      listRule:
        "status = 'approved' || author = @request.auth.id || " + roleIsStaff,
      viewRule:
        "status = 'approved' || author = @request.auth.id || " + roleIsStaff,
      createRule: "@request.auth.id != ''",
      updateRule: "author = @request.auth.id || " + roleIsStaff,
      deleteRule: "author = @request.auth.id || " + roleIsStaff,
    },
    indexes: [
      "CREATE INDEX `idx_comments_plugin` ON `comments` (`plugin`)",
      "CREATE INDEX `idx_comments_showcase` ON `comments` (`showcase`)",
      "CREATE INDEX `idx_comments_parent` ON `comments` (`parent`)",
      "CREATE INDEX `idx_comments_status` ON `comments` (`status`)",
    ],
    fields: [
      autodate("created", { onCreate: true }),
      autodate("updated", { onCreate: true, onUpdate: true }),
      relation("author", IDS.users, { required: true, maxSelect: 1 }),
      relation("plugin", IDS.plugins, { maxSelect: 1 }),
      relation("showcase", IDS.showcase, { maxSelect: 1 }),
      relation("parent", IDS.comments, { maxSelect: 1 }),
      text("content", { required: true, min: 1, max: 5000 }),
      select("status", ["pending", "approved", "rejected", "spam"], {
        required: true,
      }),
    ],
  }),
);

// Rate limits (admin-only)
collections.push(
  collection({
    id: IDS.rate_limits,
    name: "rate_limits",
    type: "base",
    rules: {
      listRule: roleIsStaff,
      viewRule: roleIsStaff,
      createRule: roleIsStaff,
      updateRule: roleIsStaff,
      deleteRule: "@request.auth.role = 'admin'",
    },
    indexes: [
      "CREATE UNIQUE INDEX `idx_rate_limits_key_endpoint` ON `rate_limits` (`key`, `endpoint`)",
      "CREATE INDEX `idx_rate_limits_window_start` ON `rate_limits` (`window_start` DESC)",
    ],
    fields: [
      autodate("created", { onCreate: true }),
      text("key", { required: true, min: 1, max: 200 }),
      text("endpoint", { required: true, min: 1, max: 200 }),
      number("count", { onlyInt: true, min: 0 }),
      date("window_start", { required: true }),
    ],
  }),
);

fs.writeFileSync(
  "apps/backend/pb_schema.json",
  JSON.stringify(collections, null, 2) + "\n",
);

const header = '/// <reference path="../pb_data/types.d.ts" />\n';
const body =
  "migrate((app) => {\n" +
  "  const snapshot = " +
  JSON.stringify(collections, null, 2) +
  ";\n" +
  "  const usersPatch = " +
  JSON.stringify(usersPatch, null, 2) +
  ";\n\n" +
  "  // Import base collections (excluding built-in users).\n" +
  "  app.importCollections(snapshot, false);\n\n" +
  "  // Patch the built-in auth collection (_pb_users_auth_).\n" +
  "  var users = app.findCollectionByNameOrId(usersPatch.id);\n" +
  "  users.listRule = usersPatch.rules.listRule;\n" +
  "  users.viewRule = usersPatch.rules.viewRule;\n" +
  "  users.createRule = usersPatch.rules.createRule;\n" +
  "  users.updateRule = usersPatch.rules.updateRule;\n" +
  "  users.deleteRule = usersPatch.rules.deleteRule;\n\n" +
  "  for (var i = 0; i < usersPatch.fieldsToEnsure.length; i++) {\n" +
  "    var f = usersPatch.fieldsToEnsure[i];\n" +
  "    users.fields.add(new Field(f));\n" +
  "  }\n\n" +
  "  if (!users.indexes) users.indexes = [];\n" +
  "  for (var j = 0; j < usersPatch.indexesToEnsure.length; j++) {\n" +
  "    var idx = usersPatch.indexesToEnsure[j];\n" +
  "    if (users.indexes.indexOf(idx) === -1) users.indexes.push(idx);\n" +
  "  }\n\n" +
  "  return app.save(users);\n" +
  "}, (app) => {\n" +
  "  return null;\n" +
  "})\n";

fs.writeFileSync(
  "apps/backend/pb_migrations/1767105800_collections_snapshot.js",
  header + body,
);

console.log(
  "Wrote apps/backend/pb_schema.json and apps/backend/pb_migrations/1767105800_collections_snapshot.js",
);
