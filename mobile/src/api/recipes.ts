import { api } from "./client";
import {
  DietaryPreference,
  Recipe,
  RecipeMealType,
  RecipeRecommendation,
  RecipeSearchResult,
} from "../types/domain";

interface ListParams {
  q?: string;
  tag?: DietaryPreference;
  mealType?: RecipeMealType;
  cuisine?: string;
  page?: number;
  limit?: number;
}

export interface RecipePage {
  recipes: Recipe[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RecommendationPage {
  recipes: RecipeRecommendation[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Local library (curated + approved community). */
export async function listRecipes(
  params: ListParams = {},
): Promise<RecipePage> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.tag) qs.set("tag", params.tag);
  if (params.mealType) qs.set("mealType", params.mealType);
  if (params.cuisine) qs.set("cuisine", params.cuisine);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return api.get<RecipePage>(
    `/api/v1/recipes${suffix}`,
  );
}

export async function getRecommendedRecipes(
  params: ListParams & { includeReasons?: boolean } = {},
): Promise<RecommendationPage> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.tag) qs.set("tag", params.tag);
  if (params.mealType) qs.set("mealType", params.mealType);
  if (params.cuisine) qs.set("cuisine", params.cuisine);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.includeReasons != null) {
    qs.set("includeReasons", String(params.includeReasons));
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return api.get<RecommendationPage>(`/api/v1/recipes/recommended${suffix}`);
}

export async function getFeatured(): Promise<Recipe[]> {
  const { recipes } = await api.get<{ recipes: Recipe[] }>(
    "/api/v1/recipes/featured",
  );
  return recipes;
}

/** A recipe detail plus the freemium access info the backend returns. */
export interface RecipeDetailResult {
  recipe: Recipe;
  /** Remaining free distinct views after this one (cap value for premium). */
  freeViewsRemaining: number;
  isPremium: boolean;
}

export async function getLocalRecipe(id: string): Promise<RecipeDetailResult> {
  const { recipe, freeViewsRemaining, isPremium } = await api.get<{
    recipe: Recipe;
    freeViewsRemaining: number;
    isPremium: boolean;
  }>(`/api/v1/recipes/${id}`);
  return { recipe, freeViewsRemaining, isPremium };
}

/** External search via the Spoonacular proxy. */
export async function searchExternalRecipes(
  q: string,
  limit = 12,
): Promise<RecipeSearchResult[]> {
  const { results } = await api.get<{ results: RecipeSearchResult[] }>(
    `/api/v1/recipes/spoonacular/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  );
  return results;
}

interface SpoonacularDetail {
  spoonacularId: number;
  title: string;
  description: string;
  imageUrl: string | null;
  servings: number;
  prepMins: number;
  cookMins: number;
  dietaryTags: DietaryPreference[];
  kcal: number;
  macros: Recipe["macros"];
  nutritionDisclaimer?: string;
  ingredients: Recipe["ingredients"];
  steps: Recipe["steps"];
}

/** Fetch a recipe by source and normalise to the unified Recipe shape. */
export async function getRecipe(
  id: string,
  source: "recipe" | "spoonacular",
): Promise<RecipeDetailResult> {
  if (source === "recipe") return getLocalRecipe(id);

  const { recipe, freeViewsRemaining, isPremium } = await api.get<{
    recipe: SpoonacularDetail;
    freeViewsRemaining: number;
    isPremium: boolean;
  }>(`/api/v1/recipes/spoonacular/${id}`);
  return {
    recipe: {
      id: String(recipe.spoonacularId),
      title: recipe.title,
      description: recipe.description,
      imageUrl: recipe.imageUrl,
      imagePath: null,
      source: "spoonacular",
      mealTypes: [],
      cuisine: "Global",
      dietaryTags: recipe.dietaryTags,
      difficulty: "medium",
      servings: recipe.servings,
      prepMins: recipe.prepMins,
      cookMins: recipe.cookMins,
      kcal: recipe.kcal,
      macros: recipe.macros,
      nutritionDisclaimer:
        recipe.nutritionDisclaimer ??
        "Estimated per serving; not medical advice.",
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      spoonacularId: recipe.spoonacularId,
    },
    freeViewsRemaining,
    isPremium,
  };
}
