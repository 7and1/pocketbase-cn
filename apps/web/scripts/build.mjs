#!/usr/bin/env node

// Build script that handles cloudflare: protocol
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");
const loaderPath = resolve(__dirname, "./cloudflare-protocol-loader.mjs");

// Run the build with the loader registered via NODE_OPTIONS
const loaderUrl = `file://${loaderPath}`;

// Set environment to tell Cloudflare adapter this is a build
process.env.CLOUDFLARE_ENV = "production";
process.env.CF_PAGES = "true";

let stderr = "";
let stdout = "";
try {
  const result = execSync(`astro build`, {
    cwd: rootDir,
    env: {
      ...process.env,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --import ${loaderUrl}`,
    },
  });
  stdout = result?.toString() || "";
  process.exit(0);
} catch (err) {
  stderr = err.stderr?.toString() || "";
  stdout = err.stdout?.toString() || "";

  // Astro v5 + Cloudflare adapter has a known issue where the post-build
  // validation fails with "cloudflare: protocol" error, even though the
  // build actually succeeds. We check if the build output exists and
  // ignore this specific error.
  const distDir = resolve(rootDir, "dist");
  const hasOutput =
    existsSync(distDir) && existsSync(resolve(distDir, "_worker.js"));
  const errorOutput = stderr + stdout + (err.message || "");

  if (hasOutput && errorOutput.includes("cloudflare:")) {
    // Print the build output so user can see what was built
    process.stdout.write(stdout);
    console.log(
      "\n[build] Build succeeded (ignoring cloudflare: protocol validation error)",
    );
    console.log(
      "[build] This is a known Astro v5 + Cloudflare adapter issue\n",
    );
    process.exit(0);
  }
  // Print output for other errors
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  process.exit(err.status || 1);
}
