/**
 * A small typed error hierarchy so route handlers can throw meaningful errors
 * and the central error middleware maps them to clean HTTP responses.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new ApiError(400, "bad_request", msg, details);

export const unauthorized = (msg = "Authentication required") =>
  new ApiError(401, "unauthorized", msg);

export const forbidden = (msg = "Forbidden") =>
  new ApiError(403, "forbidden", msg);

export const notFound = (msg = "Not found") =>
  new ApiError(404, "not_found", msg);

export const conflict = (msg = "Conflict", details?: unknown) =>
  new ApiError(409, "conflict", msg, details);

export const paymentRequired = (msg = "Premium subscription required") =>
  new ApiError(402, "premium_required", msg);

export const serverError = (msg = "Internal server error", details?: unknown) =>
  new ApiError(500, "internal", msg, details);

export const serviceUnavailable = (msg = "Upstream service unavailable") =>
  new ApiError(503, "service_unavailable", msg);
