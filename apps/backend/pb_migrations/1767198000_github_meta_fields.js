/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    try {
      var plugins = app.findCollectionByNameOrId("plugins");

      function ensureField(name, field) {
        try {
          plugins.fields.getByName(name);
        } catch (_) {
          plugins.fields.add(new Field(field));
        }
      }

      ensureField("github_stars", {
        type: "number",
        name: "github_stars",
        system: false,
        hidden: false,
        presentable: false,
        onlyInt: true,
        required: false,
        min: 0,
        max: null,
      });

      ensureField("github_updated_at", {
        type: "date",
        name: "github_updated_at",
        system: false,
        hidden: false,
        presentable: false,
        min: "",
        max: "",
        required: false,
      });

      app.save(plugins);
    } catch (_) {}

    return null;
  },
  (app) => {
    return null;
  },
);
