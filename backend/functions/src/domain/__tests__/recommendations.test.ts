import {
  diversifyRecommendations,
  scoreRecipeForProfile,
} from "../recommendations";
import { Recipe, UserProfile } from "../types";

const baseProfile: UserProfile = {
  uid: "u1",
  displayName: null,
  email: null,
  photoURL: null,
  isAnonymous: true,
  goal: "lose_weight",
  activityLevel: "moderately_active",
  dietaryPreferences: [],
  metrics: {
    ageYears: 30,
    biologicalSex: "female",
    heightCm: 165,
    weightKg: 70,
  },
  targets: {
    bmrKcal: 1400,
    tdeeKcal: 2100,
    dailyGoalKcal: 1600,
    macroTargets: { proteinG: 120, carbsG: 160, fatG: 53 },
    waterGoalMl: 2450,
  },
  isPremium: false,
  onboardingCompleted: true,
  createdAt: 1,
  updatedAt: 1,
};

function recipe(overrides: Partial<Recipe>): Recipe {
  return {
    id: "r1",
    title: "Recipe",
    description: "Test recipe",
    imageUrl: null,
    imagePath: null,
    source: "curated",
    status: "approved",
    submittedBy: null,
    mealTypes: ["dinner"],
    cuisine: "Mediterranean & Middle Eastern",
    dietaryTags: [],
    difficulty: "medium",
    servings: 2,
    prepMins: 10,
    cookMins: 20,
    kcal: 480,
    macros: { proteinG: 34, carbsG: 44, fatG: 16 },
    nutritionDisclaimer: "Estimated per serving; not medical advice.",
    ingredients: [],
    steps: [],
    spoonacularId: null,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("scoreRecipeForProfile", () => {
  it("strongly prefers recipes that match selected dietary preferences", () => {
    const profile = {
      ...baseProfile,
      dietaryPreferences: ["vegan" as const],
    };
    const vegan = scoreRecipeForProfile(
      profile,
      recipe({ id: "vegan", dietaryTags: ["vegan", "vegetarian"] }),
      "dinner",
    );
    const nonVegan = scoreRecipeForProfile(
      profile,
      recipe({ id: "salmon", dietaryTags: ["mediterranean"] }),
      "dinner",
    );

    expect(vegan.score).toBeGreaterThan(nonVegan.score + 25);
    expect(vegan.reasons.some((r) => r.text.includes("vegan"))).toBe(true);
  });

  it("shifts gain-muscle users toward higher-protein recipes", () => {
    const profile = {
      ...baseProfile,
      goal: "gain_muscle" as const,
      targets: {
        ...baseProfile.targets,
        dailyGoalKcal: 2500,
        macroTargets: { proteinG: 188, carbsG: 313, fatG: 56 },
      },
    };
    const highProtein = scoreRecipeForProfile(
      profile,
      recipe({ id: "chicken", kcal: 620, macros: { proteinG: 58, carbsG: 48, fatG: 18 } }),
      "dinner",
    );
    const lowProtein = scoreRecipeForProfile(
      profile,
      recipe({ id: "toast", kcal: 620, macros: { proteinG: 14, carbsG: 88, fatG: 24 } }),
      "dinner",
    );

    expect(highProtein.score).toBeGreaterThan(lowProtein.score);
    expect(highProtein.reasons.some((r) => r.text.includes("protein"))).toBe(true);
  });

  it("adds a small readiness boost for recipes that already have images", () => {
    const withImage = scoreRecipeForProfile(
      baseProfile,
      recipe({ imageUrl: "http://example.test/hero.webp" }),
    );
    const withoutImage = scoreRecipeForProfile(baseProfile, recipe({ imageUrl: null }));

    expect(withImage.score).toBe(withoutImage.score + 5);
  });
});

describe("diversifyRecommendations", () => {
  it("can choose a near-scored different cuisine over a same-cuisine repeat", () => {
    const first = scoreRecipeForProfile(
      baseProfile,
      recipe({ id: "a", cuisine: "Mediterranean & Middle Eastern" }),
    );
    const repeat = {
      ...scoreRecipeForProfile(
        baseProfile,
        recipe({ id: "b", cuisine: "Mediterranean & Middle Eastern" }),
      ),
      score: first.score - 1,
    };
    const diverse = {
      ...scoreRecipeForProfile(
        baseProfile,
        recipe({ id: "c", cuisine: "East & Southeast Asian", mealTypes: ["lunch"] }),
      ),
      score: first.score - 2,
    };

    const ranked = diversifyRecommendations([first, repeat, diverse]);
    expect(ranked.map((r) => r.recipe.id)).toEqual(["a", "c", "b"]);
  });
});
