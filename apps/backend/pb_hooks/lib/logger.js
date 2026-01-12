/// <reference path="../../types.d.ts" />

// Structured logging utility for PocketBase.cn hooks.
// Keep ES5-compatible syntax (Goja).

// Log levels
var LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Current log level (default: INFO)
var currentLevel = LEVELS.INFO;

// Set from environment
var logLevelEnv = $os.getenv("PB_LOG_LEVEL") || "";
if (logLevelEnv) {
  var upper = String(logLevelEnv).toUpperCase();
  if (upper === "DEBUG") currentLevel = LEVELS.DEBUG;
  else if (upper === "INFO") currentLevel = LEVELS.INFO;
  else if (upper === "WARN") currentLevel = LEVELS.WARN;
  else if (upper === "ERROR") currentLevel = LEVELS.ERROR;
}

// Generate request ID for correlation
function generateRequestId() {
  try {
    if ($security && $security.randomBytes) {
      var bytes = $security.randomBytes(8);
      if (bytes && typeof bytes === "string") {
        var hex = "";
        var chars = "0123456789abcdef";
        for (var i = 0; i < bytes.length; i++) {
          var b = bytes.charCodeAt(i);
          hex += chars.charAt((b >> 4) & 0xf) + chars.charAt(b & 0xf);
        }
        return hex;
      }
    }
  } catch (_) {}
  // Fallback: timestamp + random
  return (
    String(Date.now().toString(36)) +
    "-" +
    String(Math.random().toString(36)).substr(2, 8)
  );
}

// Store request ID in context (simplified - use header if available)
function getContextRequestId(c) {
  try {
    if (c && c.request && c.request.header) {
      var reqId = c.request.header.get("X-Request-ID") || "";
      if (reqId) return reqId;
    }
  } catch (_) {}
  return generateRequestId();
}

// Format log entry as JSON
function formatLogEntry(level, context, message, data) {
  var entry = {
    ts: new Date().toISOString(),
    level: level,
    msg: message || "",
  };

  if (context) entry.ctx = context;
  if (data) entry.data = data;

  try {
    return JSON.stringify(entry);
  } catch (_) {
    return JSON.stringify({
      ts: entry.ts,
      level: level,
      msg: String(message || ""),
    });
  }
}

// Log functions
function debug(context, message, data) {
  if (currentLevel > LEVELS.DEBUG) return;
  console.log(formatLogEntry("DEBUG", context, message, data));
}

function info(context, message, data) {
  if (currentLevel > LEVELS.INFO) return;
  console.log(formatLogEntry("INFO", context, message, data));
}

function warn(context, message, data) {
  if (currentLevel > LEVELS.WARN) return;
  console.log(formatLogEntry("WARN", context, message, data));
}

function error(context, message, data) {
  if (currentLevel > LEVELS.ERROR) return;
  console.log(formatLogEntry("ERROR", context, message, data));
}

// Shorthand with default context
function logDebug(message, data) {
  debug(null, message, data);
}

function logInfo(message, data) {
  info(null, message, data);
}

function logWarn(message, data) {
  warn(null, message, data);
}

function logError(message, data) {
  error(null, message, data);
}

module.exports = {
  debug: debug,
  info: info,
  warn: warn,
  error: error,
  logDebug: logDebug,
  logInfo: logInfo,
  logWarn: logWarn,
  logError: logError,
  getContextRequestId: getContextRequestId,
  generateRequestId: generateRequestId,
  LEVELS: LEVELS,
};
