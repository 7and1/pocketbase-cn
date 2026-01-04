import { z } from "zod";
import type { ZodSchema } from "zod";

export type FieldError = {
  field: string;
  message: string;
};

export type FormErrors = Record<string, string>;

export type ValidationStatus = "idle" | "validating" | "valid" | "invalid";

export interface ValidationResult {
  valid: boolean;
  errors: FormErrors;
  fieldErrors: FieldError[];
}

/**
 * Validates a single field against a schema
 */
export function validateField<T extends Record<string, unknown>>(
  schema: ZodSchema,
  data: T,
  fieldName: keyof T,
): string | null {
  try {
    schema.parse({ ...data, [fieldName]: data[fieldName] });
    return null;
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldIssue = err.issues.find((issue) => {
        const path = issue.path.join(".");
        return path === String(fieldName);
      });
      return fieldIssue?.message || null;
    }
    return "Validation failed";
  }
}

/**
 * Validates entire form data against schema
 */
export function validateForm<T>(schema: ZodSchema, data: T): ValidationResult {
  try {
    schema.parse(data);
    return { valid: true, errors: {}, fieldErrors: [] };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors: FormErrors = {};
      const fieldErrors: FieldError[] = [];

      for (const issue of err.issues) {
        const path = issue.path.join(".");
        errors[path] = issue.message;
        fieldErrors.push({ field: path, message: issue.message });
      }

      return { valid: false, errors, fieldErrors };
    }
    return {
      valid: false,
      errors: { _form: "Validation failed" },
      fieldErrors: [{ field: "_form", message: "Validation failed" }],
    };
  }
}

/**
 * Real-time validation hook helper
 * Debounces validation to avoid excessive checks
 */
export class DebouncedValidator {
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private delay: number;

  constructor(delay = 300) {
    this.delay = delay;
  }

  validate<T extends Record<string, unknown>>(
    schema: ZodSchema,
    data: T,
    fieldName: keyof T,
    callback: (error: string | null) => void,
  ): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      const error = validateField(schema, data, fieldName);
      callback(error);
    }, this.delay);
  }

  cancel(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  dispose(): void {
    this.cancel();
  }
}

/**
 * Common validation patterns
 */
export const validators = {
  required: (message = "This field is required") =>
    z.string().min(1, { message }),

  minLength: (min: number, message?: string) =>
    z.string().min(min, {
      message: message || `Must be at least ${min} characters`,
    }),

  maxLength: (max: number, message?: string) =>
    z.string().max(max, {
      message: message || `Must be no more than ${max} characters`,
    }),

  url: (message = "Must be a valid URL") => z.string().url({ message }),

  email: (message = "Must be a valid email") => z.string().email({ message }),

  pattern: (regex: RegExp, message = "Invalid format") =>
    z.string().regex(regex, { message }),

  optionalUrl: () => z.string().url().optional().or(z.literal("")),

  tagString: (maxTags = 10) =>
    z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return [];
        return val
          .split(/[,，]/g)
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, maxTags);
      }),
};

/**
 * Checks if a field has been touched (user has interacted with it)
 */
export function createTouchTracker() {
  const touched = new Set<string>();

  return {
    touch: (field: string) => touched.add(field),
    isTouched: (field: string) => touched.has(field),
    reset: () => touched.clear(),
    getAllTouched: () => Array.from(touched),
  };
}

/**
 * Creates a validator that only validates touched fields
 */
export function createTouchedValidator(
  schema: ZodSchema,
  touchTracker: ReturnType<typeof createTouchTracker>,
) {
  return {
    validateField<T extends Record<string, unknown>>(
      data: T,
      fieldName: keyof T,
    ): string | null {
      if (!touchTracker.isTouched(String(fieldName))) {
        return null;
      }
      return validateField(schema, data, fieldName);
    },

    validateForm<T>(data: T): ValidationResult {
      const result = validateForm(schema, data);
      // Filter errors to only show touched fields
      const filteredErrors: FormErrors = {};
      const filteredFieldErrors: FieldError[] = [];

      for (const [field, message] of Object.entries(result.errors)) {
        if (touchTracker.isTouched(field)) {
          filteredErrors[field] = message;
          const fieldError = result.fieldErrors.find((e) => e.field === field);
          if (fieldError) {
            filteredFieldErrors.push(fieldError);
          }
        }
      }

      return {
        valid: Object.keys(filteredErrors).length === 0,
        errors: filteredErrors,
        fieldErrors: filteredFieldErrors,
      };
    },
  };
}
