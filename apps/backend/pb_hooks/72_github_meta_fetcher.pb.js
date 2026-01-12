/// <reference path="../types.d.ts" />

// Fetch GitHub repository metadata (stars, updated_at) for plugins.
// Keep ES5-compatible syntax (Goja).

function githubHeaders() {
  var headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "pocketbase-cn",
  };
  var token = $os.getenv("GITHUB_TOKEN") || "";
  if (token) headers.Authorization = "Bearer " + token;
  return headers;
}

function fetchRepoMeta(owner, repo) {
  try {
    var res = $http.send({
      url: "https://api.github.com/repos/" + owner + "/" + repo,
      method: "GET",
      timeout: 15,
      headers: githubHeaders(),
    });
    if (!res || res.statusCode < 200 || res.statusCode >= 300) return null;
    return JSON.parse(res.raw || "null");
  } catch (_) {
    return null;
  }
}

function applyMeta(e) {
  if (!e || !e.record) return;

  var pbcn = require(__hooks + "/lib/pbcn.js");
  var parsed = pbcn.parseGitHubRepo(e.record.get("repository"));
  if (!parsed) return;

  // Simple global rate limit per repo.
  if (
    !pbcn.rateLimitAllow({
      id: "github_meta",
      windowSec: 3600,
      max: 1,
      key: parsed.owner + "/" + parsed.repo,
    })
  ) {
    return;
  }

  var meta = fetchRepoMeta(parsed.owner, parsed.repo);
  if (!meta) return;

  try {
    var stars = parseInt(String(meta.stargazers_count || 0), 10) || 0;
    var updatedAt = meta.pushed_at || meta.updated_at || null;

    e.record.set("github_stars", stars);
    if (updatedAt) e.record.set("github_updated_at", String(updatedAt));

    (e.app || $app).unsafeWithoutHooks().save(e.record);
  } catch (_) {}
}

onRecordAfterCreateSuccess(function (e) {
  applyMeta(e);
}, "plugins");

onRecordAfterUpdateSuccess(function (e) {
  applyMeta(e);
}, "plugins");
