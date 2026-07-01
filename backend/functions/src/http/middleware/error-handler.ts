/**
 * Central error middleware. Converts ApiError (and anything else) into a
 * consistent JSON error envelope: { error: { code, message, details? } }.
 */
import { NextFunction, Request, Response } from "express";
import * as logger from "firebase-functions/logger";
import { ApiError } from "../errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // next is required for Express to recognise this as an error handler.
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    if (err.status >= 500) logger.error(err.message, err.details ?? err);
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({
    error: { code: "internal", message: "Internal server error" },
  });
}

/** 404 fallback for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "not_found", message: "Route not found" },
  });
}
