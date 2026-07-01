/**
 * Typed adapter over the generated JSON catalogue.
 *
 * Regenerate after editing the outline:
 *   node tools/generate-recipe-catalog.mjs
 */
import catalogue from "./recipes.catalog.json";
import { Recipe } from "../domain/types";

export const curatedRecipes = catalogue as Recipe[];
