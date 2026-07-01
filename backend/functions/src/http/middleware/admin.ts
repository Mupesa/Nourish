/**
 * Admin gate for recipe moderation. Admin uids come from the ADMIN_UIDS env var
 * (comma-separated). Simple and sufficient for a solo project; can move to a
 * Firebase custom claim later.
 */
import { NextFunction, Request, Response } from "express";
import { forbidden, unauthorized } from "../errors";

function adminUids(): string[] {
  return (process.env.ADMIN_UIDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) return next(unauthorized());
  if (!adminUids().includes(req.user.uid)) {
    return next(forbidden("Admin access required"));
  }
  next();
}
