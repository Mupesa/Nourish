/**
 * Premium gating. Phase 1 features (tracking, diary, calorie engine) are all
 * FREE per the freemium decision, so no Phase 1 route uses this yet. It exists
 * now so Phase 2 (Meal Planner, full Recipe Library) can gate cleanly:
 *
 *   router.get("/planner", authenticate, requirePremium, handler)
 */
import { NextFunction, Request, Response } from "express";
import { db } from "../../config/firebase";
import { forbidden, paymentRequired, unauthorized } from "../errors";

export async function requirePremium(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw unauthorized();
    const snap = await db.collection("users").doc(req.user.uid).get();
    if (!snap.exists) throw forbidden("Profile not found");
    const isPremium = snap.get("isPremium") === true;
    if (!isPremium) throw paymentRequired();
    next();
  } catch (err) {
    next(err);
  }
}
