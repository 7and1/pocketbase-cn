/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Add search optimization indexes for plugins
    const plugins = app.findCollectionByNameOrId("plugins");
    if (plugins) {
      // Composite index for status + created sorting (common list query pattern)
      const idxPluginsStatusCreated =
        "CREATE INDEX IF NOT EXISTS `idx_plugins_status_created` ON `plugins` (`status`, `created` DESC)";
      if (!plugins.indexes) plugins.indexes = [];
      if (plugins.indexes.indexOf(idxPluginsStatusCreated) === -1) {
        plugins.indexes.push(idxPluginsStatusCreated);
      }

      // Composite index for featured sorting
      const idxPluginsFeaturedCreated =
        "CREATE INDEX IF NOT EXISTS `idx_plugins_featured_created` ON `plugins` (`featured` DESC, `created` DESC)";
      if (plugins.indexes.indexOf(idxPluginsFeaturedCreated) === -1) {
        plugins.indexes.push(idxPluginsFeaturedCreated);
      }

      // Index for name/description search (LIKE queries benefit from covering index)
      const idxPluginsName =
        "CREATE INDEX IF NOT EXISTS `idx_plugins_name` ON `plugins` (`name`)";
      if (plugins.indexes.indexOf(idxPluginsName) === -1) {
        plugins.indexes.push(idxPluginsName);
      }

      app.save(plugins);
    }

    // Add search optimization indexes for showcase
    const showcase = app.findCollectionByNameOrId("showcase");
    if (showcase) {
      // Composite index for status + created sorting
      const idxShowcaseStatusCreated =
        "CREATE INDEX IF NOT EXISTS `idx_showcase_status_created` ON `showcase` (`status`, `created` DESC)";
      if (!showcase.indexes) showcase.indexes = [];
      if (showcase.indexes.indexOf(idxShowcaseStatusCreated) === -1) {
        showcase.indexes.push(idxShowcaseStatusCreated);
      }

      // Composite index for featured sorting
      const idxShowcaseFeaturedCreated =
        "CREATE INDEX IF NOT EXISTS `idx_showcase_featured_created` ON `showcase` (`featured` DESC, `created` DESC)";
      if (showcase.indexes.indexOf(idxShowcaseFeaturedCreated) === -1) {
        showcase.indexes.push(idxShowcaseFeaturedCreated);
      }

      // Index for title search
      const idxShowcaseTitle =
        "CREATE INDEX IF NOT EXISTS `idx_showcase_title` ON `showcase` (`title`)";
      if (showcase.indexes.indexOf(idxShowcaseTitle) === -1) {
        showcase.indexes.push(idxShowcaseTitle);
      }

      // Index for views sorting
      const idxShowcaseViews =
        "CREATE INDEX IF NOT EXISTS `idx_showcase_views` ON `showcase` (`views` DESC)";
      if (showcase.indexes.indexOf(idxShowcaseViews) === -1) {
        showcase.indexes.push(idxShowcaseViews);
      }

      app.save(showcase);
    }

    // Add composite index for plugin_stats (trending query optimization)
    const pluginStats = app.findCollectionByNameOrId("plugin_stats");
    if (pluginStats) {
      // Composite index for downloads_weekly + created (trending with recency tie-breaker)
      const idxStatsWeeklyCreated =
        "CREATE INDEX IF NOT EXISTS `idx_plugin_stats_weekly_created` ON `plugin_stats` (`downloads_weekly` DESC, `created` DESC)";
      if (!pluginStats.indexes) pluginStats.indexes = [];
      if (pluginStats.indexes.indexOf(idxStatsWeeklyCreated) === -1) {
        pluginStats.indexes.push(idxStatsWeeklyCreated);
      }

      app.save(pluginStats);
    }

    return app;
  },
  (app) => {
    return app;
  },
);
