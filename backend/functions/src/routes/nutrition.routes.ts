/**
 * Nutrition lookup routes (Spoonacular proxy). FREE tier — quick-meal lookups
 * are core to tracking. Authenticated to prevent anonymous quota abuse.
 */
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../http/async-handler";
import { requireUser } from "../http/middleware/auth";
import { parse } from "../http/validate";
import {
  guessNutritionByTitle,
  searchRecipes,
} from "../services/spoonacular.service";

export const nutritionRouter = Router();

const guessQuerySchema = z.object({
  title: z.string().min(2).max(120),
});

const searchQuerySchema = z.object({
  q: z.string().min(2).max(120),
  limit: z.coerce.number().int().min(1).max(25).optional(),
});

/** GET /nutrition/guess?title=... — estimate kcal/macros for a meal name. */
nutritionRouter.get(
  "/guess",
  asyncHandler(async (req, res) => {
    requireUser(req);
    const { title } = parse(guessQuerySchema, req.query);
    res.json({ estimate: await guessNutritionByTitle(title) });
  }),
);

/** GET /nutrition/search?q=...&limit=... — recipe search with nutrition. */
nutritionRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    requireUser(req);
    const { q, limit } = parse(searchQuerySchema, req.query);
    res.json({ results: await searchRecipes(q, limit) });
  }),
);
