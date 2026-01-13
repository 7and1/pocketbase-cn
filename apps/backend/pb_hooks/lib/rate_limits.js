/// <reference path="../../types.d.ts" />

// Rate limit configuration and utilities for PocketBase.cn hooks.
// Provides endpoint-specific and user-tier-based rate limiting.
// Keep ES5-compatible syntax (Goja).

// Rate limit tiers by user role
var TIERS = {
  // Anonymous/unauthenticated users
  anon: {
    windowSec: 60,
    limits: {
      // Read-heavy endpoints
      search: { max: 30, windowSec: 60 },
      list: { max: 60, windowSec: 60 },
      // Write operations
      create: { max: 5, windowSec: 60 },
      update: { max: 10, windowSec: 60 },
      delete: { max: 5, windowSec: 60 },
      // Special endpoints
      comment: { max: 5, windowSec: 60 },
      download: { max: 20, windowSec: 60 },
      sync: { max: 3, windowSec: 300 },
    },
  },
  // Authenticated regular users
  user: {
    windowSec: 60,
    limits: {
      search: { max: 60, windowSec: 60 },
      list: { max: 120, windowSec: 60 },
      create: { max: 15, windowSec: 60 },
      update: { max: 30, windowSec: 60 },
      delete: { max: 10, windowSec: 60 },
      comment: { max: 15, windowSec: 60 },
      download: { max: 50, windowSec: 60 },
      sync: { max: 10, windowSec: 300 },
    },
  },
  // Moderators
  moderator: {
    windowSec: 60,
    limits: {
      search: { max: 100, windowSec: 60 },
      list: { max: 200, windowSec: 60 },
      create: { max: 50, windowSec: 60 },
      update: { max: 100, windowSec: 60 },
      delete: { max: 30, windowSec: 60 },
      comment: { max: 50, windowSec: 60 },
      download: { max: 100, windowSec: 60 },
      sync: { max: 30, windowSec: 300 },
    },
  },
  // Admins (effectively unlimited for normal operations)
  admin: {
    windowSec: 60,
    limits: {
      search: { max: 500, windowSec: 60 },
      list: { max: 1000, windowSec: 60 },
      create: { max: 200, windowSec: 60 },
      update: { max: 500, windowSec: 60 },
      delete: { max: 100, windowSec: 60 },
      comment: { max: 200, windowSec: 60 },
      download: { max: 500, windowSec: 60 },
      sync: { max: 100, windowSec: 300 },
    },
  },
};

// Endpoint type categorization
var ENDPOINT_TYPES = {
  // Read operations
  "/api/search": "search",
  "/api/search/fts": "search",
  "/api/plugins": "list",
  "/api/showcase": "list",
  "/api/comments/list": "list",
  "/api/releases": "list",
  // Write operations
  "/api/comments/create": "comment",
  "/api/plugins/create": "create",
  "/api/showcase/create": "create",
  "/api/webhooks/": "sync",
  "/api/sync/": "sync",
  "/api/downloads/": "download",
};

// Get user tier based on auth record
function getUserTier(auth) {
  if (!auth) return "anon";
  try {
    var role = auth.get ? auth.get("role") : "";
    if (role === "admin") return "admin";
    if (role === "moderator") return "moderator";
    return "user";
  } catch (_) {
    return "user";
  }
}

// Get endpoint type from path
function getEndpointType(path) {
  if (!path) return "list";
  var p = String(path);

  // Check for exact matches first
  if (ENDPOINT_TYPES[p]) return ENDPOINT_TYPES[p];

  // Check for prefix matches
  for (var key in ENDPOINT_TYPES) {
    if (p.indexOf(key) === 0) return ENDPOINT_TYPES[key];
  }

  // Default classification based on HTTP method hints
  if (p.indexOf("create") >= 0 || p.indexOf("submit") >= 0) return "create";
  if (p.indexOf("delete") >= 0) return "delete";
  if (p.indexOf("update") >= 0 || p.indexOf("edit") >= 0) return "update";

  return "list";
}

// Get limit config for tier and endpoint type
function getLimitConfig(tier, endpointType) {
  var tierConfig = TIERS[tier] || TIERS.anon;
  return (
    (tierConfig.limits && tierConfig.limits[endpointType]) || {
      max: tierConfig.windowSec ? 60 : 60,
      windowSec: 60,
    }
  );
}

// Core rate limit check using DB-backed rate_limits collection
function checkRateLimit(ctx, endpointType, customKey) {
  var pbcn = null;
  try {
    pbcn = require(__hooks + "/lib/pbcn.js");
  } catch (_) {
    return { allowed: true, reason: "pbcn_not_available" };
  }

  var tier = getUserTier(ctx.auth || null);
  var config = getLimitConfig(tier, endpointType);

  // Build rate limit key: tier:endpointType:customKey or ip/userId
  var keyPart = customKey;
  if (!keyPart) {
    try {
      if (ctx.auth && ctx.auth.id) {
        keyPart = "user:" + ctx.auth.id;
      } else if (ctx.realIP) {
        keyPart = "ip:" + ctx.realIP();
      } else if (ctx.request && ctx.request.remoteAddr) {
        keyPart = "ip:" + ctx.request.remoteAddr;
      } else {
        keyPart = "unknown";
      }
    } catch (_) {
      keyPart = "unknown";
    }
  }

  var limitKey = tier + ":" + endpointType + ":" + keyPart;
  var limitId = endpointType; // Use endpoint type as the ID

  var allowed = pbcn.rateLimitAllow({
    id: limitId,
    key: limitKey,
    windowSec: config.windowSec,
    max: config.max,
  });

  return {
    allowed: allowed,
    tier: tier,
    endpointType: endpointType,
    limit: config.max,
    windowSec: config.windowSec,
    key: limitKey,
  };
}

// Rate limit middleware wrapper
function rateLimitMiddleware(endpointType, customKeyFn) {
  return function (ctx) {
    var key = customKeyFn ? customKeyFn(ctx) : null;
    var result = checkRateLimit(ctx, endpointType, key);

    if (!result.allowed) {
      try {
        var resp = null;
        try {
          resp = require(__hooks + "/lib/response.js");
        } catch (_) {}

        if (resp && resp.rateLimited) {
          return resp.rateLimited(
            ctx,
            "Rate limit exceeded. Please try again later.",
          );
        }
        return ctx.json(429, {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please try again later.",
          },
        });
      } catch (_) {
        return ctx.json(429, { error: "Rate limited" });
      }
    }

    return null; // Signal to proceed with handler
  };
}

// Quick helper for common endpoints
function allowSearch(ctx) {
  return checkRateLimit(ctx, "search", null);
}

function allowCreate(ctx) {
  return checkRateLimit(ctx, "create", null);
}

function allowComment(ctx) {
  return checkRateLimit(ctx, "comment", null);
}

function allowDownload(ctx) {
  return checkRateLimit(ctx, "download", null);
}

function allowSync(ctx) {
  return checkRateLimit(ctx, "sync", null);
}

// Export public API
module.exports = {
  TIERS: TIERS,
  ENDPOINT_TYPES: ENDPOINT_TYPES,
  getUserTier: getUserTier,
  getEndpointType: getEndpointType,
  getLimitConfig: getLimitConfig,
  checkRateLimit: checkRateLimit,
  rateLimitMiddleware: rateLimitMiddleware,
  allowSearch: allowSearch,
  allowCreate: allowCreate,
  allowComment: allowComment,
  allowDownload: allowDownload,
  allowSync: allowSync,
};
