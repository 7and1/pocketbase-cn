// Fetch plugin README from GitHub on create/update.
// Keep each handler self-contained (JSVM handlers are isolated).

onRecordAfterCreateSuccess(function (e) {
  if (!e.record) return;
  var readme = String(e.record.get("readme") || "").replace(/^\s+|\s+$/g, "");
  if (readme && readme.length >= 80) return;

  var pbcn = require(__hooks + "/lib/pbcn.js");

  var repo = pbcn.parseGitHubRepo(e.record.get("repository"));
  if (!repo) return;

  var token = $os.getenv("GITHUB_TOKEN");
  var headers = token ? { Authorization: "Bearer " + token } : {};

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

  var token = $os.getenv("GITHUB_TOKEN");
  var headers = token ? { Authorization: "Bearer " + token } : {};

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

  if (!md) return;

  try {
    e.record.set("readme", md);
    (e.app || $app).unsafeWithoutHooks().save(e.record);
  } catch (_) {}
}, "plugins");
