/// <reference path="../../types.d.ts" />

// Input validation layer for PocketBase.cn hooks.
// Extends existing sanitize utilities with comprehensive validation.
// Keep ES5-compatible syntax (Goja).

// Basic types
function isString(val) {
  return typeof val === "string";
}

function isNumber(val) {
  return typeof val === "number" && !isNaN(val);
}

function isBoolean(val) {
  return val === true || val === false;
}

function isArray(val) {
  return Object.prototype.toString.call(val) === "[object Array]";
}

function isObject(val) {
  return val !== null && typeof val === "object" && !isArray(val);
}

// String validators
function isNotEmpty(str) {
  return isString(str) && String(str).length > 0;
}

function minLength(str, min) {
  return isString(str) && String(str).length >= min;
}

function maxLength(str, max) {
  return isString(str) && String(str).length <= max;
}

function isLength(str, min, max) {
  return minLength(str, min) && maxLength(str, max);
}

function matchesPattern(str, pattern) {
  if (!isString(str)) return false;
  try {
    var regex = new RegExp(pattern);
    return regex.test(String(str));
  } catch (_) {
    return false;
  }
}

// Common pattern validators
function isEmail(str) {
  return matchesPattern(str, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
}

function isUrl(str) {
  if (!isString(str)) return false;
  try {
    var s = String(str).toLowerCase();
    return s.indexOf("http://") === 0 || s.indexOf("https://") === 0;
  } catch (_) {
    return false;
  }
}

function isGitHubUrl(str) {
  if (!isString(str)) return false;
  return matchesPattern(str, /^https?:\/\/github\.com\/[^/]+\/[^/]+/);
}

function isSlug(str) {
  return matchesPattern(str, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
}

function isUUID(str) {
  return matchesPattern(
    str,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
}

// Number validators
function isPositive(num) {
  return isNumber(num) && num > 0;
}

function isNonNegative(num) {
  return isNumber(num) && num >= 0;
}

function isInRange(num, min, max) {
  return isNumber(num) && num >= min && num <= max;
}

function isInteger(num) {
  return isNumber(num) && num % 1 === 0;
}

// Array validators
function hasMinItems(arr, min) {
  return isArray(arr) && arr.length >= min;
}

function hasMaxItems(arr, max) {
  return isArray(arr) && arr.length <= max;
}

function isLengthRange(arr, min, max) {
  return hasMinItems(arr, min) && hasMaxItems(arr, max);
}

// Sanitization functions (XSS prevention)
var XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick=
  /<embed/gi,
  /<object/gi,
  /<link/gi,
  /<meta/gi,
  /<style/gi,
  /<base/gi,
];

function sanitizeHtml(str) {
  if (!isString(str)) return "";
  var s = String(str);

  // Remove known XSS patterns
  for (var i = 0; i < XSS_PATTERNS.length; i++) {
    s = s.replace(XSS_PATTERNS[i], "");
  }

  // Escape HTML entities
  s = s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

  return s;
}

function sanitizeStrict(str) {
  if (!isString(str)) return "";
  // Keep only safe characters: alphanumeric, spaces, and basic punctuation
  return String(str).replace(/[^\w\s\-.,!?@#%&+=]/g, "");
}

function sanitizeSlug(str) {
  if (!isString(str)) return "";
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeNumber(val, defaultValue) {
  var num = parseInt(String(val), 10);
  if (isNaN(num)) return defaultValue != null ? defaultValue : 0;
  return num;
}

function sanitizeBoolean(val, defaultValue) {
  if (val === true || val === false) return val;
  var s = String(val).toLowerCase();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return defaultValue != null ? defaultValue : false;
}

// Field validation result
function ValidationResult(isValid, errors) {
  this.isValid = isValid;
  this.errors = errors || {};
}

// Validation schema builder
function Schema() {
  this.fields = {};
}

Schema.prototype.string = function (name, options) {
  options = options || {};
  this.fields[name] = {
    type: "string",
    required: options.required || false,
    minLength: options.minLength || null,
    maxLength: options.maxLength || null,
    pattern: options.pattern || null,
    sanitize: options.sanitize !== false,
    enum: options.enum || null,
  };
  return this;
};

Schema.prototype.number = function (name, options) {
  options = options || {};
  this.fields[name] = {
    type: "number",
    required: options.required || false,
    min: options.min || null,
    max: options.max || null,
    integer: options.integer || false,
    defaultValue: options.defaultValue || null,
  };
  return this;
};

Schema.prototype.boolean = function (name, options) {
  options = options || {};
  this.fields[name] = {
    type: "boolean",
    required: options.required || false,
    defaultValue: options.defaultValue || false,
  };
  return this;
};

Schema.prototype.array = function (name, options) {
  options = options || {};
  this.fields[name] = {
    type: "array",
    required: options.required || false,
    minItems: options.minItems || null,
    maxItems: options.maxItems || null,
    itemType: options.itemType || null,
  };
  return this;
};

Schema.prototype.email = function (name, options) {
  options = options || {};
  this.fields[name] = {
    type: "email",
    required: options.required || false,
    sanitize: options.sanitize !== false,
  };
  return this;
};

Schema.prototype.url = function (name, options) {
  options = options || {};
  this.fields[name] = {
    type: "url",
    required: options.required || false,
    protocols: options.protocols || ["http", "https"],
  };
  return this;
};

Schema.prototype.validate = function (data, options) {
  options = options || {};
  var errors = {};
  var sanitized = {};
  var stopOnFirstError = options.stopOnFirstError || false;

  for (var fieldName in this.fields) {
    if (this.fields.hasOwnProperty(fieldName)) {
      var field = this.fields[fieldName];
      var value = data[fieldName];

      // Check required
      if (
        field.required &&
        (value === null || value === undefined || value === "")
      ) {
        errors[fieldName] = "This field is required";
        if (stopOnFirstError) break;
        continue;
      }

      // Skip validation for optional empty fields
      if (
        !field.required &&
        (value === null || value === undefined || value === "")
      ) {
        sanitized[fieldName] = field.defaultValue || null;
        continue;
      }

      // Type-specific validation
      switch (field.type) {
        case "string":
          if (!isString(value)) {
            errors[fieldName] = "Must be a string";
          } else {
            var strVal = String(value);
            if (field.sanitize) strVal = sanitizeHtml(strVal);
            if (field.minLength && strVal.length < field.minLength) {
              errors[fieldName] =
                "Must be at least " + field.minLength + " characters";
            }
            if (field.maxLength && strVal.length > field.maxLength) {
              errors[fieldName] =
                "Must be at most " + field.maxLength + " characters";
            }
            if (field.pattern && !matchesPattern(strVal, field.pattern)) {
              errors[fieldName] = "Invalid format";
            }
            if (field.enum && field.enum.indexOf(strVal) < 0) {
              errors[fieldName] = "Must be one of: " + field.enum.join(", ");
            }
            sanitized[fieldName] = strVal;
          }
          break;

        case "number":
          var numVal = Number(value);
          if (isNaN(numVal)) {
            errors[fieldName] = "Must be a number";
          } else {
            if (field.integer && !isInteger(numVal)) {
              errors[fieldName] = "Must be an integer";
            }
            if (field.min != null && numVal < field.min) {
              errors[fieldName] = "Must be at least " + field.min;
            }
            if (field.max != null && numVal > field.max) {
              errors[fieldName] = "Must be at most " + field.max;
            }
            sanitized[fieldName] = numVal;
          }
          break;

        case "boolean":
          sanitized[fieldName] = sanitizeBoolean(value, field.defaultValue);
          break;

        case "array":
          if (!isArray(value)) {
            errors[fieldName] = "Must be an array";
          } else {
            if (field.minItems && value.length < field.minItems) {
              errors[fieldName] =
                "Must have at least " + field.minItems + " items";
            }
            if (field.maxItems && value.length > field.maxItems) {
              errors[fieldName] =
                "Must have at most " + field.maxItems + " items";
            }
            sanitized[fieldName] = value;
          }
          break;

        case "email":
          if (!isEmail(value)) {
            errors[fieldName] = "Must be a valid email address";
          } else {
            sanitized[fieldName] = field.sanitize
              ? sanitizeHtml(String(value))
              : String(value);
          }
          break;

        case "url":
          if (!isUrl(value)) {
            errors[fieldName] = "Must be a valid URL";
          } else {
            sanitized[fieldName] = String(value);
          }
          break;
      }

      if (stopOnFirstError && errors[fieldName]) break;
    }
  }

  return new ValidationResult(Object.keys(errors).length === 0, errors);
};

// Create schema instance
function createSchema() {
  return new Schema();
}

// Common validation presets
var PRESETS = {
  pluginName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_\.]+$/,
  },
  pluginSlug: {
    required: true,
    pattern: /^[a-z0-9-]+$/,
  },
  pluginDescription: {
    required: true,
    minLength: 10,
    maxLength: 1000,
  },
  commentContent: {
    required: true,
    minLength: 1,
    maxLength: 5000,
  },
  githubRepo: {
    required: false,
    pattern: /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/,
  },
};

// Quick validate single field
function validateField(value, fieldName, preset) {
  var rules = PRESETS[fieldName] || preset;
  if (!rules) return { valid: true, errors: {} };

  var errors = [];

  if (rules.required && !isNotEmpty(value)) {
    errors.push("This field is required");
  }

  if (isNotEmpty(value)) {
    if (rules.minLength && !minLength(value, rules.minLength)) {
      errors.push("Must be at least " + rules.minLength + " characters");
    }
    if (rules.maxLength && !maxLength(value, rules.maxLength)) {
      errors.push("Must be at most " + rules.maxLength + " characters");
    }
    if (rules.pattern && !matchesPattern(value, rules.pattern)) {
      errors.push("Invalid format");
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? { field: errors.join(", ") } : {},
  };
}

// Export public API
module.exports = {
  // Type checks
  isString: isString,
  isNumber: isNumber,
  isBoolean: isBoolean,
  isArray: isArray,
  isObject: isObject,
  // String validators
  isNotEmpty: isNotEmpty,
  minLength: minLength,
  maxLength: maxLength,
  isLength: isLength,
  matchesPattern: matchesPattern,
  isEmail: isEmail,
  isUrl: isUrl,
  isGitHubUrl: isGitHubUrl,
  isSlug: isSlug,
  isUUID: isUUID,
  // Number validators
  isPositive: isPositive,
  isNonNegative: isNonNegative,
  isInRange: isInRange,
  isInteger: isInteger,
  // Array validators
  hasMinItems: hasMinItems,
  hasMaxItems: hasMaxItems,
  isLengthRange: isLengthRange,
  // Sanitization
  sanitizeHtml: sanitizeHtml,
  sanitizeStrict: sanitizeStrict,
  sanitizeSlug: sanitizeSlug,
  sanitizeNumber: sanitizeNumber,
  sanitizeBoolean: sanitizeBoolean,
  // Schema validation
  createSchema: createSchema,
  Schema: Schema,
  ValidationResult: ValidationResult,
  validateField: validateField,
  PRESETS: PRESETS,
};
