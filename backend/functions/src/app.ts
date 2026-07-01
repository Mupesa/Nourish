/**
 * Express application assembly — the Nourish monolith. One app, mounted as a
 * single Cloud Function (see index.ts). All feature routers hang off /api/v1.
 */
import cors from "cors";
import express from "express";
import { authenticate } from "./http/middleware/auth";
import { requirePremium } from "./http/middleware/premium";
import {
  errorHandler,
  notFoundHandler,
} from "./http/middleware/error-handler";
import { adminRouter } from "./routes/admin.routes";
import { diaryRouter } from "./routes/diary.routes";
import { feedRouter } from "./routes/feed.routes";
import { metaRouter } from "./routes/meta.routes";
import { nutritionRouter } from "./routes/nutrition.routes";
import { plannerRouter } from "./routes/planner.routes";
import { profileRouter } from "./routes/profile.routes";
import { recipesRouter } from "./routes/recipes.routes";
import { socialRouter } from "./routes/social.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "1mb" }));
  app.disable("x-powered-by");

  // Public.
  app.use("/api/v1/meta", metaRouter);

  // Authenticated feature routes.
  app.use("/api/v1/profile", authenticate, profileRouter);
  app.use("/api/v1/diary", authenticate, diaryRouter);
  app.use("/api/v1/nutrition", authenticate, nutritionRouter);
  app.use("/api/v1/recipes", authenticate, recipesRouter);
  // Meal Planner is a premium feature (freemium gate).
  app.use("/api/v1/planner", authenticate, requirePremium, plannerRouter);
  app.use("/api/v1/social", authenticate, socialRouter);
  app.use("/api/v1/feed", authenticate, feedRouter);
  app.use("/api/v1/admin", authenticate, adminRouter);

  // Fallbacks.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
