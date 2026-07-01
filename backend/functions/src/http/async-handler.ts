import { NextFunction, Request, Response } from "express";

/**
 * Wraps an async route handler so any thrown/rejected error is forwarded to the
 * Express error middleware instead of crashing the request. Avoids try/catch
 * boilerplate in every handler.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
