/// <reference path="../../types.d.ts" />

// Unified response formatter for PocketBase.cn hooks.
// Keep ES5-compatible syntax (Goja).

// Standard error codes mapping
var ERROR_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

// Success response with data
function success(c, data, meta) {
  var payload = { data: data };
  if (meta) payload.meta = meta;

  // Add X-Request-ID header if available
  try {
    if (c && c.response && c.response.header) {
      var reqId =
        c.request && c.request.header
          ? c.request.header.get("X-Request-ID")
          : "";
      if (reqId) c.response.header().set("X-Request-ID", reqId);
    }
  } catch (_) {}

  return c.json(200, payload);
}

// Created response (201)
function created(c, data, meta) {
  var payload = { data: data };
  if (meta) payload.meta = meta;

  try {
    if (c && c.response && c.response.header) {
      var reqId =
        c.request && c.request.header
          ? c.request.header.get("X-Request-ID")
          : "";
      if (reqId) c.response.header().set("X-Request-ID", reqId);
    }
  } catch (_) {}

  return c.json(201, payload);
}

// No content response (204)
function noContent(c) {
  try {
    if (c && c.response && c.response.header) {
      var reqId =
        c.request && c.request.header
          ? c.request.header.get("X-Request-ID")
          : "";
      if (reqId) c.response.header().set("X-Request-ID", reqId);
    }
  } catch (_) {}
  return c.noContent(204);
}

// Paginated response
function paginated(c, items, meta) {
  var payload = {
    data: items,
    meta: meta || {},
  };

  // Add X-Request-ID header if available
  try {
    if (c && c.response && c.response.header) {
      var reqId =
        c.request && c.request.header
          ? c.request.header.get("X-Request-ID")
          : "";
      if (reqId) c.response.header().set("X-Request-ID", reqId);
    }
  } catch (_) {}

  return c.json(200, payload);
}

// Error response
function error(c, code, message, statusCode) {
  var payload = {
    error: {
      code: code,
      message: message || "An error occurred",
    },
  };

  // Default status codes
  if (!statusCode) {
    statusCode = ERROR_CODES[code] || 500;
  }

  // Add X-Request-ID header if available
  try {
    if (c && c.response && c.response.header) {
      var reqId =
        c.request && c.request.header
          ? c.request.header.get("X-Request-ID")
          : "";
      if (reqId) c.response.header().set("X-Request-ID", reqId);
    }
  } catch (_) {}

  return c.json(statusCode, payload);
}

// Convenience error methods
function badRequest(c, message) {
  return error(c, "BAD_REQUEST", message, 400);
}

function unauthorized(c, message) {
  return error(c, "UNAUTHORIZED", message || "Authentication required", 401);
}

function forbidden(c, message) {
  return error(c, "FORBIDDEN", message || "Access denied", 403);
}

function notFound(c, message) {
  return error(c, "NOT_FOUND", message || "Resource not found", 404);
}

function conflict(c, message) {
  return error(c, "CONFLICT", message, 409);
}

function rateLimited(c, message) {
  return error(c, "RATE_LIMITED", message || "Too many requests", 429);
}

function internalError(c, message) {
  return error(c, "INTERNAL_ERROR", message || "Internal server error", 500);
}

// Validation error with field details
function validationError(c, fields, message) {
  var payload = {
    error: {
      code: "VALIDATION_ERROR",
      message: message || "Validation failed",
      fields: fields || {},
    },
  };

  try {
    if (c && c.response && c.response.header) {
      var reqId =
        c.request && c.request.header
          ? c.request.header.get("X-Request-ID")
          : "";
      if (reqId) c.response.header().set("X-Request-ID", reqId);
    }
  } catch (_) {}

  return c.json(400, payload);
}

// Wrap response to inject request ID from header
function wrapResponse(c, statusCode, payload) {
  try {
    if (c && c.response && c.response.header) {
      var reqId =
        c.request && c.request.header
          ? c.request.header.get("X-Request-ID")
          : "";
      if (reqId) c.response.header().set("X-Request-ID", reqId);
    }
  } catch (_) {}
  return c.json(statusCode, payload);
}

// Extracted X-Request-ID handler for reusability
function setRequestIdHeader(c) {
  try {
    if (c && c.response && c.response.header) {
      var reqId =
        c.request && c.request.header
          ? c.request.header.get("X-Request-ID")
          : "";
      if (reqId) c.response.header().set("X-Request-ID", reqId);
    }
  } catch (_) {}
}

module.exports = {
  success: success,
  created: created,
  noContent: noContent,
  paginated: paginated,
  error: error,
  badRequest: badRequest,
  unauthorized: unauthorized,
  forbidden: forbidden,
  notFound: notFound,
  conflict: conflict,
  rateLimited: rateLimited,
  internalError: internalError,
  validationError: validationError,
  ERROR_CODES: ERROR_CODES,
  setRequestIdHeader: setRequestIdHeader,
};
