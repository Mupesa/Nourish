/**
 * Recipe service. Owns the recipes/{id} collection: the curated library, plus
 * community submissions (pending until an admin approves them). Spoonacular
 * recipes are proxied live (see spoonacular.service) and are not stored here
 * unless seeded.
 */
import { randomUUID } from "crypto";
import { db } from "../config/firebase";
import { notFound } from "../http/errors";
import { DietaryPreference, Recipe } from "../domain/types";
import { CommunityRecipeInput, RecipeQueryInput } from "../domain/validation";

const recipesCol = () => db.collection("recipes");

function normalizeCuisine(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function recipeMatchesQuery(recipe: Recipe, q: RecipeQueryInput): boolean {
  return matchesQuery(recipe, q);
}

export async function listApprovedRecipes(): Promise<Recipe[]> {
  const snap = await recipesCol().where("status", "==", "approved").get();
  return snap.docs.map((d) => d.data() as Recipe);
}

function matchesQuery(recipe: Recipe, q: RecipeQueryInput): boolean {
  if (q.tag && !recipe.dietaryTags.includes(q.tag as DietaryPreference))
    return false;
  if (q.mealType && !recipe.mealTypes.includes(q.mealType)) return false;
  if (q.cuisineRegion && recipe.cuisineRegion !== q.cuisineRegion) {
    return false;
  }
  if (
    q.cuisine &&
    normalizeCuisine(recipe.cuisine) !== normalizeCuisine(q.cuisine)
  ) {
    return false;
  }
  if (q.q) {
    const needle = q.q.toLowerCase();
    const hay =
      `${recipe.title} ${recipe.description} ${recipe.cuisine} ${recipe.cuisineRegion}`.toLowerCase();
    if (!hay.includes(needle)) return false;
  }
  return true;
}

/** List approved recipes (curated + approved community), filtered in memory. */
export async function listRecipes(q: RecipeQueryInput): Promise<{
  recipes: Recipe[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  const all = await listApprovedRecipes();
  const filtered = all.filter((r) => matchesQuery(r, q));
  filtered.sort((a, b) => b.createdAt - a.createdAt);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / q.limit));
  const offset = (q.page - 1) * q.limit;
  return {
    recipes: filtered.slice(offset, offset + q.limit),
    page: q.page,
    limit: q.limit,
    total,
    totalPages,
  };
}

/** A small "featured" set for the Home tab. */
export async function getFeatured(limit = 10): Promise<Recipe[]> {
  const snap = await recipesCol()
    .where("status", "==", "approved")
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as Recipe);
}

/** Fetch one recipe by id (must exist). */
export async function getRecipe(id: string): Promise<Recipe> {
  const snap = await recipesCol().doc(id).get();
  if (!snap.exists) throw notFound("Recipe not found");
  return snap.data() as Recipe;
}

/** Submit a community recipe; stored as pending for admin review. */
export async function submitCommunityRecipe(
  uid: string,
  input: CommunityRecipeInput,
): Promise<Recipe> {
  const id = randomUUID();
  const now = Date.now();
  const recipe: Recipe = {
    id,
    title: input.title,
    description: input.description,
    imageUrl: input.imageUrl,
    imagePath: input.imagePath,
    source: "community",
    status: "pending",
    submittedBy: uid,
    mealTypes: input.mealTypes,
    cuisine: input.cuisine,
    cuisineRegion: input.cuisineRegion,
    dietaryTags: input.dietaryTags as DietaryPreference[],
    difficulty: input.difficulty,
    servings: input.servings,
    prepMins: input.prepMins,
    cookMins: input.cookMins,
    kcal: Math.round(input.kcal),
    macros: input.macros,
    nutritionDisclaimer: input.nutritionDisclaimer,
    ingredients: input.ingredients,
    steps: input.steps.map((s) => ({ ...s, icon: s.icon ?? null })),
    spoonacularId: null,
    createdAt: now,
    updatedAt: now,
  };
  await recipesCol().doc(id).set(recipe);
  return recipe;
}

/** Admin: list recipes awaiting review. */
export async function listPendingRecipes(): Promise<Recipe[]> {
  const snap = await recipesCol().where("status", "==", "pending").get();
  return snap.docs.map((d) => d.data() as Recipe);
}

/** Admin: approve or reject a community recipe. */
export async function setRecipeStatus(
  id: string,
  status: "approved" | "rejected",
): Promise<Recipe> {
  const ref = recipesCol().doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound("Recipe not found");
  await ref.set({ status, updatedAt: Date.now() }, { merge: true });
  return { ...(snap.data() as Recipe), status };
}
