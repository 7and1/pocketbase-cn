import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const dist = path.resolve(root, "dist");

function mustExist(rel) {
  const p = path.resolve(root, rel);
  if (!fs.existsSync(p)) throw new Error(`[smoke] missing: ${rel}`);
}

mustExist("dist/index.html");
mustExist("dist/robots.txt");
mustExist("dist/og-image.png");
mustExist("dist/sitemap-index.xml");
mustExist("dist/pagefind/pagefind.js");

console.log("[smoke] web dist ok");
