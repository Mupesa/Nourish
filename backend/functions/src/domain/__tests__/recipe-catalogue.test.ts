import { Recipe } from "../types";

// Loaded via require (not a typed `import ... from "*.json"`) so TypeScript does
// not infer a 100-element literal type for the 228 KB catalogue — that inference
// OOMs the memory-capped ts-jest worker. The runtime value is identical.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const recipes = require("../../data/recipes.catalog.json") as Recipe[];

function counts(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((result, value) => {
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}

describe("curated recipe catalogue", () => {
  it("contains exactly 100 unique stable recipes", () => {
    expect(recipes).toHaveLength(100);
    expect(new Set(recipes.map((recipe) => recipe.id)).size).toBe(100);
    expect(new Set(recipes.map((recipe) => recipe.title.toLowerCase())).size).toBe(
      100,
    );
    expect(recipes[0].id).toBe("curated-001");
    expect(recipes[99].id).toBe("curated-100");
  });

  it("matches the required primary meal distribution", () => {
    expect(counts(recipes.flatMap((recipe) => recipe.mealTypes))).toEqual({
      dinner: 38,
      breakfast: 22,
      lunch: 28,
      snack: 12,
    });
  });

  it("matches the required cuisine distribution", () => {
    expect(counts(recipes.map((recipe) => recipe.cuisine))).toEqual({
      "Mediterranean & Middle Eastern": 18,
      "North American & Global": 18,
      "East & Southeast Asian": 15,
      "South Asian": 10,
      "African & Mauritian": 15,
      European: 12,
      "Latin American & Caribbean": 12,
    });
  });

  it("meets or exceeds all dietary targets", () => {
    const tagCounts = counts(recipes.flatMap((recipe) => recipe.dietaryTags));
    expect(tagCounts.vegetarian).toBeGreaterThanOrEqual(36);
    expect(tagCounts.vegan).toBeGreaterThanOrEqual(20);
    expect(tagCounts.gluten_free).toBeGreaterThanOrEqual(32);
    expect(tagCounts.keto).toBeGreaterThanOrEqual(12);
    expect(tagCounts.mediterranean).toBeGreaterThanOrEqual(16);
    expect(tagCounts.paleo).toBeGreaterThanOrEqual(10);
  });

  it("has complete content and internally consistent estimated nutrition", () => {
    for (const recipe of recipes) {
      expect(recipe.ingredients.length).toBeGreaterThanOrEqual(5);
      expect(recipe.ingredients.length).toBeLessThanOrEqual(12);
      expect(recipe.steps.length).toBeGreaterThanOrEqual(4);
      expect(recipe.steps.length).toBeLessThanOrEqual(8);
      expect(recipe.mealTypes.length).toBeGreaterThan(0);
      expect(recipe.cuisine.length).toBeGreaterThan(1);
      expect(recipe.imagePath).toBe(`recipes/${recipe.id}/hero.webp`);
      const macroKcal =
        recipe.macros.proteinG * 4 +
        recipe.macros.carbsG * 4 +
        recipe.macros.fatG * 9;
      expect(Math.abs(macroKcal - recipe.kcal)).toBeLessThanOrEqual(18);
    }
  });
});
