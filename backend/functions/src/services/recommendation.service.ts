import {
  diversifyRecommendations,
  scoreRecipeForProfile,
} from "../domain/recommendations";
import { RecipeRecommendation } from "../domain/types";
import { RecommendedRecipeQueryInput } from "../domain/validation";
import { getProfile } from "./profile.service";
import { listApprovedRecipes, recipeMatchesQuery } from "./recipe.service";

export interface RecommendedRecipePage {
  recipes: RecipeRecommendation[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function listRecommendedRecipes(
  uid: string,
  q: RecommendedRecipeQueryInput,
): Promise<RecommendedRecipePage> {
  const [profile, allRecipes] = await Promise.all([
    getProfile(uid),
    listApprovedRecipes(),
  ]);
  const filtered = allRecipes.filter((recipe) => recipeMatchesQuery(recipe, q));
  const scored = filtered
    .map((recipe) => scoreRecipeForProfile(profile, recipe, q.mealType))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.recipe.imageUrl && !b.recipe.imageUrl) return -1;
      if (!a.recipe.imageUrl && b.recipe.imageUrl) return 1;
      return a.recipe.id.localeCompare(b.recipe.id);
    });

  const ranked = diversifyRecommendations(scored);
  const total = ranked.length;
  const totalPages = Math.max(1, Math.ceil(total / q.limit));
  const offset = (q.page - 1) * q.limit;
  const pageItems = ranked.slice(offset, offset + q.limit).map((item) =>
    q.includeReasons ? item : { ...item, reasons: [] },
  );

  return {
    recipes: pageItems,
    page: q.page,
    limit: q.limit,
    total,
    totalPages,
  };
}
