/**
 * Public metadata routes. No auth. Exposes a health check and the canonical
 * enum lists so the mobile app can populate onboarding choices from the server
 * (one source of truth), should it choose to.
 */
import { Router } from "express";
import {
  ACTIVITY_MULTIPLIERS,
  ALL_ACTIVITY_LEVELS,
  ALL_DIETARY_PREFERENCES,
  ALL_GOALS,
  GOAL_KCAL_ADJUSTMENT,
  METRIC_BOUNDS,
} from "../domain/constants";

export const metaRouter = Router();

metaRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "nourish-api", time: Date.now() });
});

metaRouter.get("/enums", (_req, res) => {
  res.json({
    goals: ALL_GOALS,
    goalAdjustments: GOAL_KCAL_ADJUSTMENT,
    activityLevels: ALL_ACTIVITY_LEVELS,
    activityMultipliers: ACTIVITY_MULTIPLIERS,
    dietaryPreferences: ALL_DIETARY_PREFERENCES,
    metricBounds: METRIC_BOUNDS,
  });
});
