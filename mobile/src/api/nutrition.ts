import { api } from "./client";
import { NutritionEstimate, RecipeSearchResult } from "../types/domain";

/** Estimate kcal/macros from a free-text meal name (Quick Meal). */
export function guessNutrition(title: string) {
  return api.get<{ estimate: NutritionEstimate }>(
    `/api/v1/nutrition/guess?title=${encodeURIComponent(title)}`,
  );
}

/** Search recipes with nutrition. */
export function searchNutrition(q: string, limit = 10) {
  return api.get<{ results: RecipeSearchResult[] }>(
    `/api/v1/nutrition/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  );
}
