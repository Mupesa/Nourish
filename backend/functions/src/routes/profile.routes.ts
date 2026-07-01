/**
 * Profile + onboarding routes. All require authentication (anonymous is fine).
 */
import { Router } from "express";
import { asyncHandler } from "../http/async-handler";
import { requireUser } from "../http/middleware/auth";
import { parse } from "../http/validate";
import { onboardingSchema, profileUpdateSchema } from "../domain/validation";
import {
  completeOnboarding,
  getProfile,
  updateProfile,
} from "../services/profile.service";

export const profileRouter = Router();

/** POST /profile/onboarding — one-shot onboarding; computes & stores targets. */
profileRouter.post(
  "/onboarding",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const input = parse(onboardingSchema, req.body);
    const profile = await completeOnboarding(user, input);
    res.status(201).json({ profile });
  }),
);

/** GET /profile — current profile + computed targets. */
profileRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const profile = await getProfile(user.uid);
    res.json({ profile });
  }),
);

/** PATCH /profile — partial update; recomputes targets when inputs change. */
profileRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const input = parse(profileUpdateSchema, req.body);
    const profile = await updateProfile(user.uid, input);
    res.json({ profile });
  }),
);
