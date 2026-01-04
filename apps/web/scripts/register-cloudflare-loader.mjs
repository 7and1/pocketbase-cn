// Custom Node.js loader to handle cloudflare: protocol during build
import { register } from "node:module";

register("./cloudflare-protocol-loader.mjs", import.meta.url);

// Now run the build
import { execSync } from "node:child_process";
try {
  execSync("pnpm astro build", { stdio: "inherit" });
} catch (err) {
  process.exit(1);
}
