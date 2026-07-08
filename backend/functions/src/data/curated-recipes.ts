/**
 * Typed adapter over the generated JSON catalogue.
 *
 * Regenerate after editing the outline:
 *   node tools/generate-recipe-catalog.mjs
 */
import catalogue from "./recipes.catalog.json";
import { cookAroundWorldRecipes } from "./cook-around-world-recipes";
import { Recipe, RecipeCuisineRegion } from "../domain/types";

type LegacyRecipe = Omit<Recipe, "cuisineRegion"> & {
  cuisineRegion?: RecipeCuisineRegion;
};

function inferCuisineRegion(recipe: LegacyRecipe): RecipeCuisineRegion {
  const hay = `${recipe.title} ${recipe.description} ${recipe.cuisine}`.toLowerCase();
  if (/(jollof|west african|plantain|peanut|ghana|nigerian|suya|waakye|egusi|maafe)/.test(hay)) {
    return "west_africa";
  }
  if (/(berbere|ethiopian|injera|ugali|nyama|pilau|sukuma|somali|tanzanian|kenyan|east african)/.test(hay)) {
    return "east_africa";
  }
  if (/(mauritian|peri-peri|cape malay|chakalaka|pap|sadza|bobotie|bunny|braai|southern african|african)/.test(hay)) {
    return "southern_africa";
  }
  if (/(south asian|indian|masala|tandoori|chana|palak|dal|biryani|butter chicken|curry)/.test(hay)) {
    return "indian";
  }
  if (/(east & southeast asian|thai|korean|japanese|vietnamese|miso|gochujang|lemongrass|soba|donburi|asian)/.test(hay)) {
    return "asian";
  }
  return "western";
}

const legacyRecipes = (catalogue as LegacyRecipe[]).map((recipe) => ({
  ...recipe,
  cuisineRegion: recipe.cuisineRegion ?? inferCuisineRegion(recipe),
}));

export const curatedRecipes = [...legacyRecipes, ...cookAroundWorldRecipes] as Recipe[];
