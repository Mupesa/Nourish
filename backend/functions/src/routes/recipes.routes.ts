/**
 * Recipe library routes. The local library (curated + approved community) is
 * served from Firestore; Spoonacular provides breadth via proxied search/detail.
 * All free in Phase 2 (premium gating deferred to Phase 4).
 *
 * Route ORDER matters: specific paths (/featured, /spoonacular/*) are declared
 * before the catch-all /:id so they aren't shadowed.
 */
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../http/async-handler";
import { requireUser } from "../http/middleware/auth";
import { parse } from "../http/validate";
import { badRequest } from "../http/errors";
import {
  communityRecipeSchema,
  recommendedRecipeQuerySchema,
  recipeQuerySchema,
} from "../domain/validation";
import {
  getFeatured,
  getRecipe,
  listRecipes,
  submitCommunityRecipe,
} from "../services/recipe.service";
import {
  getRecipeDetail,
  searchRecipes,
} from "../services/spoonacular.service";
import {
  enforceRecipeView,
  localKey,
  spoonKey,
} from "../services/premium.service";
import { listRecommendedRecipes } from "../services/recommendation.service";

export const recipesRouter = Router();

/** GET /recipes — list curated + approved community recipes. */
recipesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    requireUser(req);
    const q = parse(recipeQuerySchema, req.query);
    res.json(await listRecipes(q));
  }),
);

/** GET /recipes/featured — a small featured set for the Home tab. */
recipesRouter.get(
  "/featured",
  asyncHandler(async (req, res) => {
    requireUser(req);
    res.json({ recipes: await getFeatured() });
  }),
);

/** GET /recipes/recommended — personalized local recipe recommendations. */
recipesRouter.get(
  "/recommended",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const q = parse(recommendedRecipeQuerySchema, req.query);
    res.json(await listRecommendedRecipes(user.uid, q));
  }),
);

/** GET /recipes/spoonacular/search?q=&limit= — external recipe search. */
recipesRouter.get(
  "/spoonacular/search",
  asyncHandler(async (req, res) => {
    requireUser(req);
    const { q, limit } = parse(
      z.object({ q: z.string().min(2).max(120), limit: z.coerce.number().int().min(1).max(25).optional() }),
      req.query,
    );
    res.json({ results: await searchRecipes(q, limit) });
  }),
);

/** GET /recipes/spoonacular/:id — full external recipe detail (metered). */
recipesRouter.get(
  "/spoonacular/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw badRequest("Invalid recipe id");
    const access = await enforceRecipeView(user.uid, spoonKey(id));
    res.json({ recipe: await getRecipeDetail(id), ...access });
  }),
);

/** POST /recipes/community — submit a recipe for admin review. */
recipesRouter.post(
  "/community",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const input = parse(communityRecipeSchema, req.body);
    const recipe = await submitCommunityRecipe(user.uid, input);
    res.status(201).json({ recipe });
  }),
);

/** GET /recipes/:id — a single local recipe (metered). */
recipesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const recipe = await getRecipe(req.params.id);
    const access = await enforceRecipeView(user.uid, localKey(recipe.id));
    res.json({ recipe, ...access });
  }),
);
