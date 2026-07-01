/**
 * Authentication middleware. Verifies the Firebase ID token from the
 * Authorization: Bearer <token> header and attaches the decoded identity to the
 * request. Works for anonymous users too (they have a uid), which is what makes
 * deferred registration possible.
 */
import { NextFunction, Request, Response } from "express";
import { auth } from "../../config/firebase";
import { unauthorized } from "../errors";

export interface AuthedUser {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  isAnonymous: boolean;
}

// Augment Express's Request with our authenticated user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.header("Authorization") ?? "";
    const match = header.match(/^Bearer (.+)$/i);
    if (!match) {
      throw unauthorized("Missing or malformed Authorization header");
    }

    const decoded = await auth.verifyIdToken(match[1]);
    req.user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
      // Firebase marks the anonymous provider as "anonymous".
      isAnonymous: decoded.firebase?.sign_in_provider === "anonymous",
    };
    next();
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      next(err);
    } else {
      next(unauthorized("Invalid or expired token"));
    }
  }
}

/** Convenience: throw if the request somehow reached a handler unauthenticated. */
export function requireUser(req: Request): AuthedUser {
  if (!req.user) throw unauthorized();
  return req.user;
}
