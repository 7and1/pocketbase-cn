import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const dist = path.resolve(root, "dist");

function mustExist(rel) {
  const p = path.resolve(root, rel);
  if (!fs.existsSync(p)) throw new Error(`[smoke] missing: ${rel}`);
}

function maybeExist(rel) {
  const p = path.resolve(root, rel);
  return fs.existsSync(p);
}

const hasWorker = maybeExist("dist/_worker.js");

if (hasWorker) {
  mustExist("dist/_worker.js");
  mustExist("dist/_routes.json");
  mustExist("dist/_headers");
  mustExist("dist/_astro");
} else {
  mustExist("dist/index.html");
}

mustExist("dist/robots.txt");
mustExist("dist/og-image.png");

if (!hasWorker) {
  mustExist("dist/sitemap-index.xml");
  mustExist("dist/pagefind/pagefind.js");
} else {
  if (maybeExist("dist/sitemap-index.xml")) {
    mustExist("dist/sitemap-index.xml");
  }
  if (maybeExist("dist/pagefind/pagefind.js")) {
    mustExist("dist/pagefind/pagefind.js");
  }
}

console.log("[smoke] web dist ok");
