export type ErrorCode =
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "AUTH_ERROR"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "TIMEOUT_ERROR"
  | "UNKNOWN_ERROR";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  VALIDATION_ERROR: "Invalid input. Please check your data.",
  AUTH_ERROR: "Authentication failed. Please log in again.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
  UNKNOWN_ERROR: "An unexpected error occurred.",
};

export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = "UNKNOWN_ERROR",
    public statusCode: number = 500,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static fromResponse(response: Response, body?: unknown): AppError {
    const code = errorCodeFromStatus(response.status);
    const message = extractErrorMessage(body) || ERROR_MESSAGES[code];
    return new AppError(message, code, response.status, body);
  }

  static fromUnknown(err: unknown): AppError {
    if (err instanceof AppError) return err;
    if (err instanceof Error) {
      if (isNetworkError(err)) {
        return new AppError(err.message, "NETWORK_ERROR");
      }
      return new AppError(err.message, "UNKNOWN_ERROR");
    }
    return new AppError(String(err), "UNKNOWN_ERROR");
  }

  getUserMessage(): string {
    return ERROR_MESSAGES[this.code] || this.message;
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.NETWORK_ERROR,
    details?: unknown,
  ) {
    super(message, "NETWORK_ERROR", 0, details);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthError extends AppError {
  constructor(message: string = ERROR_MESSAGES.AUTH_ERROR, details?: unknown) {
    super(message, "AUTH_ERROR", 401, details);
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NOT_FOUND, details?: unknown) {
    super(message, "NOT_FOUND", 404, details);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

function errorCodeFromStatus(status: number): ErrorCode {
  if (status >= 400 && status < 500) {
    if (status === 401 || status === 403) return "AUTH_ERROR";
    if (status === 404) return "NOT_FOUND";
    if (status === 400 || status === 422) return "VALIDATION_ERROR";
    return "VALIDATION_ERROR";
  }
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

function extractErrorMessage(body: unknown): string | null {
  if (typeof body === "string") return body;
  if (body && typeof body === "object") {
    if ("message" in body && typeof body.message === "string")
      return body.message;
    if ("error" in body && typeof body.error === "string") return body.error;
  }
  return null;
}

function isNetworkError(err: Error): boolean {
  return (
    err.name === "TypeError" ||
    err.message.includes("fetch") ||
    err.message.includes("network") ||
    err.message.includes("ECONNREFUSED") ||
    err.message.includes("ENOTFOUND")
  );
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function getErrorMessage(err: unknown): string {
  if (isAppError(err)) return err.getUserMessage();
  if (err instanceof Error) return err.message;
  return String(err);
}
