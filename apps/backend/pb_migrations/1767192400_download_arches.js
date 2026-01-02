/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    var values = ["amd64", "arm64", "386", "armv7", "ppc64le", "s390x"];

    try {
      var downloads = app.findCollectionByNameOrId("downloads");
      var arch = downloads.fields.getByName("arch");
      arch.values = values;
      app.save(downloads);
    } catch (_) {}

    try {
      var stats = app.findCollectionByNameOrId("download_stats");
      var sArch = stats.fields.getByName("arch");
      sArch.values = values;
      app.save(stats);
    } catch (_) {}

    return null;
  },
  (app) => {
    return null;
  },
);
