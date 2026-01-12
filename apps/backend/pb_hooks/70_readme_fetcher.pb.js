/// <reference path="../types.d.ts" />

// Fetch plugin README from GitHub on create/update.
// Uses caching via readme_cache collection to avoid blocking requests.
// Keep each handler self-contained (JSVM handlers are isolated).

// Fetch README with cache lookup
function fetchReadmeWithCache(repo, recordId) {
  var cacheKey = repo.owner + "/" + repo.repo;
  var token = $os.getenv("GITHUB_TOKEN");
  var headers = token ? { Authorization: "Bearer " + token } : {};

  // Check cache first (valid for 7 days)
  var cacheCutoff = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  try {
    var cached = $app.findFirstRecordByFilter(
      "readme_cache",
      "repo_key = {:key} && updated > {:cutoff}",
      { key: cacheKey, cutoff: cacheCutoff },
    );
    if (cached && cached.get("content")) {
      console.log("[README_CACHE] Hit for: " + cacheKey);
      return cached.get("content");
    }
  } catch (_) {}

  // Cache miss - fetch from GitHub
  console.log("[README_CACHE] Miss for: " + cacheKey);
  var paths = ["README.md", "readme.md", "docs/README.md"];
  var branches = ["main", "master"];
  var md = null;

  for (var bi = 0; bi < branches.length && !md; bi++) {
    var branch = branches[bi];
    for (var pi = 0; pi < paths.length && !md; pi++) {
      var filePath = paths[pi];
      var url =
        "https://raw.githubusercontent.com/" +
        repo.owner +
        "/" +
        repo.repo +
        "/" +
        branch +
        "/" +
        filePath;

      try {
        var res = $http.send({
          url: url,
          method: "GET",
          timeout: 10,
          headers: headers,
        });
        if (res && res.statusCode === 200 && res.raw) md = res.raw;
      } catch (_) {}
    }
  }

  if (!md) return null;

  // Update cache
  try {
    var col = $app.findCollectionByNameOrId("readme_cache");
    var cacheRec = null;
    try {
      cacheRec = $app.findFirstRecordByFilter(
        "readme_cache",
        "repo_key = {:key}",
        { key: cacheKey },
      );
    } catch (_) {}
    if (!cacheRec) {
      cacheRec = new Record(col);
      cacheRec.set("repo_key", cacheKey);
    }
    cacheRec.set("content", md);
    $app.save(cacheRec);
  } catch (_) {}

  return md;
}

onRecordAfterCreateSuccess(function (e) {
  if (!e.record) return;
  var readme = String(e.record.get("readme") || "").replace(/^\s+|\s+$/g, "");
  if (readme && readme.length >= 80) return;

  var pbcn = require(__hooks + "/lib/pbcn.js");
  var repo = pbcn.parseGitHubRepo(e.record.get("repository"));
  if (!repo) return;

  var md = fetchReadmeWithCache(repo, e.record.id);
  if (!md) return;

  try {
    e.record.set("readme", md);
    (e.app || $app).unsafeWithoutHooks().save(e.record);
  } catch (_) {}
}, "plugins");

onRecordAfterUpdateSuccess(function (e) {
  if (!e.record) return;
  var readme = String(e.record.get("readme") || "").replace(/^\s+|\s+$/g, "");
  if (readme && readme.length >= 80) return;

  var pbcn = require(__hooks + "/lib/pbcn.js");
  var repo = pbcn.parseGitHubRepo(e.record.get("repository"));
  if (!repo) return;

  var md = fetchReadmeWithCache(repo, e.record.id);
  if (!md) return;

  try {
    e.record.set("readme", md);
    (e.app || $app).unsafeWithoutHooks().save(e.record);
  } catch (_) {}
}, "plugins");
