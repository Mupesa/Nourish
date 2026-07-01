/**
 * Spoonacular integration for FR-1 "Quick Meal" nutrition lookups. Two uses:
 *   - guessNutritionByTitle: estimate kcal/macros from a free-text meal name.
 *   - searchRecipes: lightweight recipe search with nutrition (also used as a
 *     seed for Phase 2's recipe library).
 *
 * The API key never leaves the backend — the client always calls our endpoints.
 */
import axios, { AxiosError } from "axios";
import * as logger from "firebase-functions/logger";
import { getSpoonacularKey } from "../config/secrets";
import {
  DietaryPreference,
  Macros,
  RecipeIngredient,
  RecipeStep,
} from "../domain/types";
import { serverError, serviceUnavailable } from "../http/errors";

const BASE_URL = "https://api.spoonacular.com";

export interface NutritionEstimate {
  kcal: number;
  macros: Macros;
}

export interface RecipeSearchResult extends NutritionEstimate {
  spoonacularId: number;
  title: string;
  imageUrl: string | null;
}

/** Pull a numeric value out of values that may be number or "81g" strings. */
function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function client() {
  const key = getSpoonacularKey();
  if (!key) {
    throw serverError("Spoonacular API key is not configured");
  }
  return axios.create({
    baseURL: BASE_URL,
    timeout: 8000,
    params: { apiKey: key },
  });
}

function handleUpstreamError(context: string, err: unknown): never {
  const axiosErr = err as AxiosError;
  logger.error(`Spoonacular ${context} failed`, {
    status: axiosErr.response?.status,
    data: axiosErr.response?.data,
  });
  if (axiosErr.response?.status === 402) {
    throw serviceUnavailable("Nutrition data quota exceeded; try again later");
  }
  throw serviceUnavailable("Nutrition service is temporarily unavailable");
}

/** Estimate nutrition for a free-text meal title. */
export async function guessNutritionByTitle(
  title: string,
): Promise<NutritionEstimate> {
  try {
    const { data } = await client().get("/recipes/guessNutrition", {
      params: { title },
    });
    return {
      kcal: Math.round(toNumber(data?.calories?.value)),
      macros: {
        proteinG: Math.round(toNumber(data?.protein?.value)),
        carbsG: Math.round(toNumber(data?.carbs?.value)),
        fatG: Math.round(toNumber(data?.fat?.value)),
      },
    };
  } catch (err) {
    return handleUpstreamError("guessNutrition", err);
  }
}

interface SpoonacularNutrient {
  name: string;
  amount: number;
}

function extractMacros(nutrients: SpoonacularNutrient[] = []): NutritionEstimate {
  const find = (name: string) =>
    nutrients.find((n) => n.name.toLowerCase() === name.toLowerCase())?.amount ??
    0;
  return {
    kcal: Math.round(find("Calories")),
    macros: {
      proteinG: Math.round(find("Protein")),
      carbsG: Math.round(find("Carbohydrates")),
      fatG: Math.round(find("Fat")),
    },
  };
}

/** A normalised recipe detail from Spoonacular (shaped for the client/library). */
export interface SpoonacularRecipeDetail extends NutritionEstimate {
  spoonacularId: number;
  title: string;
  description: string;
  imageUrl: string | null;
  servings: number;
  prepMins: number;
  cookMins: number;
  dietaryTags: DietaryPreference[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

/** Map Spoonacular's free-text diet strings to our canonical enum. */
function mapDiets(diets: string[] = []): DietaryPreference[] {
  const out = new Set<DietaryPreference>();
  for (const d of diets.map((x) => x.toLowerCase())) {
    if (d.includes("vegetarian")) out.add("vegetarian");
    if (d.includes("vegan")) out.add("vegan");
    if (d.includes("ketogenic") || d.includes("keto")) out.add("keto");
    if (d.includes("gluten")) out.add("gluten_free");
    if (d.includes("mediterranean")) out.add("mediterranean");
    if (d.includes("paleo")) out.add("paleo");
  }
  return [...out];
}

/** Fetch a full recipe (ingredients + steps + nutrition) by Spoonacular id. */
export async function getRecipeDetail(
  id: number,
): Promise<SpoonacularRecipeDetail> {
  try {
    const { data } = await client().get(`/recipes/${id}/information`, {
      params: { includeNutrition: true },
    });
    const nutrients: SpoonacularNutrient[] = data?.nutrition?.nutrients ?? [];
    const { kcal, macros } = extractMacros(nutrients);

    const ingredients: RecipeIngredient[] = (data?.extendedIngredients ?? []).map(
      (i: { name?: string; original?: string; amount?: number; unit?: string }) => ({
        name: i.name ?? i.original ?? "Ingredient",
        quantity:
          i.amount != null ? `${i.amount} ${i.unit ?? ""}`.trim() : i.original ?? "",
      }),
    );

    const instructionGroups: { steps?: { number: number; step: string }[] }[] =
      data?.analyzedInstructions ?? [];
    const steps: RecipeStep[] = (instructionGroups[0]?.steps ?? []).map((s) => ({
      title: `Step ${s.number}`,
      body: s.step,
      icon: null,
    }));

    return {
      spoonacularId: id,
      title: data?.title ?? "Recipe",
      description: (data?.summary ?? "").replace(/<[^>]+>/g, ""),
      imageUrl: data?.image ?? null,
      servings: data?.servings ?? 1,
      prepMins: 0,
      cookMins: data?.readyInMinutes ?? 0,
      dietaryTags: mapDiets(data?.diets),
      kcal,
      macros,
      ingredients,
      steps,
    };
  } catch (err) {
    return handleUpstreamError("recipeInformation", err);
  }
}

/** Search recipes by query, returning nutrition for each hit. */
export async function searchRecipes(
  query: string,
  limit = 10,
): Promise<RecipeSearchResult[]> {
  try {
    const { data } = await client().get("/recipes/complexSearch", {
      params: {
        query,
        number: Math.min(Math.max(limit, 1), 25),
        addRecipeNutrition: true,
      },
    });
    const results: unknown[] = data?.results ?? [];
    return results.map((raw) => {
      const r = raw as {
        id: number;
        title: string;
        image?: string;
        nutrition?: { nutrients?: SpoonacularNutrient[] };
      };
      const nutrition = extractMacros(r.nutrition?.nutrients);
      return {
        spoonacularId: r.id,
        title: r.title,
        imageUrl: r.image ?? null,
        ...nutrition,
      };
    });
  } catch (err) {
    return handleUpstreamError("complexSearch", err);
  }
}
