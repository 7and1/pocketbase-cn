#!/usr/bin/env node

/**
 * Seed Plugins for PocketBase.cn
 *
 * Usage: node scripts/seed-plugins.js
 *
 * This script seeds the plugins collection with sample PocketBase extensions.
 */

const PocketBase = require("pocketbase");
const fs = require("fs");
const path = require("path");

const PB_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || "admin";

// Sample plugins data - these are popular PocketBase extensions
const SAMPLE_PLUGINS = [
  {
    name: "pocketbase",
    slug: "pocketbase",
    description: "PocketBase is a standalone openSource Go backend framework",
    long_description:
      "PocketBase is a openSource Go backend framework. It's built on top of sqlite and provides realtime database, auth, file storage, and admin UI out of the box.",
    category: "Framework",
    tags: ["go", "backend", "framework", "realtime"],
    license: "MIT",
    repository: "https://github.com/pocketbase/pocketbase",
    homepage: "https://pocketbase.io",
    icon: "https://pocketbase.io/images/logo.png",
    screenshots: [],
    featured: true,
    status: "approved",
  },
  {
    name: "pocketbase-ui",
    slug: "pocketbase-ui",
    description:
      "Modern UI components for PocketBase admin panel customization",
    long_description:
      "A collection of modern, reusable UI components designed to extend and customize the PocketBase admin panel. Built with vanilla JavaScript and CSS.",
    category: "UI",
    tags: ["ui", "admin", "components", "css"],
    license: "MIT",
    repository: "https://github.com/pocketbase-ui/pocketbase-ui",
    homepage: "https://pocketbase-ui.dev",
    icon: "https://pocketbase-ui.dev/icon.png",
    screenshots: [],
    featured: true,
    status: "approved",
  },
  {
    name: "pb_uploads_s3",
    slug: "pb-uploads-s3",
    description: "S3/Backblaze B2/R2 file storage extension for PocketBase",
    long_description:
      "Store uploaded files in S3-compatible storage services (AWS S3, Backblaze B2, Cloudflare R2) instead of local filesystem. Supports presigned URLs and multipart uploads.",
    category: "Storage",
    tags: ["s3", "storage", "aws", "r2", "b2"],
    license: "MIT",
    repository: "https://github.com/frgl/pb_uploads_s3",
    homepage: "",
    icon: "",
    screenshots: [],
    featured: false,
    status: "approved",
  },
  {
    name: "pb_hooks_tester",
    slug: "pb-hooks-tester",
    description: "Test PocketBase hooks locally with hot reload",
    long_description:
      "Development tool for testing PocketBase hooks with hot reload. Watch for changes in your pb_hooks directory and automatically reload the server.",
    category: "DevTools",
    tags: ["testing", "development", "hooks", "hot-reload"],
    license: "MIT",
    repository: "https://github.com/frgl/pb_hooks_tester",
    homepage: "",
    icon: "",
    screenshots: [],
    featured: false,
    status: "approved",
  },
  {
    name: "pocketbase-typescript",
    slug: "pocketbase-typescript",
    description: "TypeScript definitions and utilities for PocketBase JS SDK",
    long_description:
      "Full TypeScript type definitions for PocketBase JavaScript SDK. Includes typed query builders, automatic type inference, and utility functions.",
    category: "DevTools",
    tags: ["typescript", "types", "sdk", "javascript"],
    license: "MIT",
    repository: "https://github.com/pocketbase-ts/pocketbase-typescript",
    homepage: "",
    icon: "",
    screenshots: [],
    featured: true,
    status: "approved",
  },
  {
    name: "pb_admin",
    slug: "pb-admin",
    description: "Custom admin UI for PocketBase with enhanced features",
    long_description:
      "A custom admin interface for PocketBase with enhanced features including dark mode, improved navigation, and additional management tools.",
    category: "UI",
    tags: ["admin", "ui", "dashboard", "customization"],
    license: "Apache-2.0",
    repository: "https://github.com/pb-admin/pb_admin",
    homepage: "",
    icon: "",
    screenshots: [],
    featured: false,
    status: "approved",
  },
  {
    name: "pb_social_auth",
    slug: "pb-social-auth",
    description: "Extended OAuth2 providers for PocketBase authentication",
    long_description:
      "Add support for additional OAuth2 providers including Google, Facebook, Twitter, Discord, and more beyond the built-in GitHub provider.",
    category: "Auth",
    tags: ["oauth", "auth", "social", "authentication"],
    license: "MIT",
    repository: "https://github.com/pb-ext/social-auth",
    homepage: "",
    icon: "",
    screenshots: [],
    featured: false,
    status: "approved",
  },
  {
    name: "pb_rate_limit",
    slug: "pb-rate-limit",
    description: "Rate limiting middleware for PocketBase APIs",
    long_description:
      "Flexible rate limiting solution for PocketBase APIs. Configure limits per route, IP, or user with various strategies (sliding window, token bucket, fixed window).",
    category: "Middleware",
    tags: ["rate-limit", "middleware", "api", "security"],
    license: "MIT",
    repository: "https://github.com/pb-middleware/rate-limit",
    homepage: "",
    icon: "",
    screenshots: [],
    featured: false,
    status: "approved",
  },
];

async function seedPlugins() {
  const pb = new PocketBase(PB_URL);

  try {
    // Authenticate as admin
    console.log(`Connecting to PocketBase at ${PB_URL}...`);
    await pb.admins.authenticateWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log("✓ Authenticated as admin");

    // Get or find a default user for author
    let authorId = null;
    try {
      const users = await pb.collection("users").getList(1, 1);
      if (users.items.length > 0) {
        authorId = users.items[0].id;
        console.log(`✓ Using existing user as author: ${authorId}`);
      }
    } catch (e) {
      console.log("⚠ No users found, plugins will have no author");
    }

    let created = 0;
    let updated = 0;

    for (const plugin of SAMPLE_PLUGINS) {
      try {
        // Check if plugin already exists
        const existing = await pb
          .collection("plugins")
          .getFirstListItem(`slug = "${plugin.slug}"`)
          .catch(() => null);

        const data = {
          ...plugin,
          author: authorId,
          readme: plugin.long_description || plugin.description,
          github_stars: 0,
          github_updated_at: new Date().toISOString(),
        };

        if (existing) {
          await pb.collection("plugins").update(existing.id, data);
          console.log(`  Updated: ${plugin.name}`);
          updated++;
        } else {
          await pb.collection("plugins").create(data);
          console.log(`  Created: ${plugin.name}`);
          created++;
        }
      } catch (err) {
        console.error(`  ✗ Failed to save ${plugin.name}:`, err.message);
      }
    }

    console.log(
      `\n✓ Done! Created ${created} plugins, updated ${updated} plugins`,
    );
  } catch (err) {
    console.error("✗ Error:", err.message);
    process.exit(1);
  }
}

// Run
seedPlugins();
