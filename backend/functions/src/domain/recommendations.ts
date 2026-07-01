import {
  DietaryPreference,
  Goal,
  RecommendationReason,
  Recipe,
  RecipeMealType,
  RecipeRecommendation,
  UserProfile,
} from "./types";

const MEAL_TARGETS: Record<RecipeMealType, { min: number; ideal: number; max: number }> = {
  breakfast: { min: 0.2, ideal: 0.23, max: 0.27 },
  lunch: { min: 0.25, ideal: 0.28, max: 0.32 },
  dinner: { min: 0.3, ideal: 0.33, max: 0.38 },
  snack: { min: 0.08, ideal: 0.1, max: 0.14 },
};

const GENERAL_MEAL_TARGET = { min: 0.22, ideal: 0.3, max: 0.38 };

function hasTag(recipe: Recipe, tag: DietaryPreference): boolean {
  return recipe.dietaryTags.includes(tag);
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function addReason(
  reasons: RecommendationReason[],
  code: RecommendationReason["code"],
  text: string,
  points: number,
): number {
  if (points <= 0) return 0;
  reasons.push({ code, text, points: Math.round(points) });
  return points;
}

function labelPreference(pref: DietaryPreference): string {
  return pref.replace("_", " ");
}

function scoreDietary(
  profile: UserProfile,
  recipe: Recipe,
  reasons: RecommendationReason[],
): number {
  if (profile.dietaryPreferences.length === 0) return 12;

  let points = 0;
  for (const pref of profile.dietaryPreferences) {
    if (hasTag(recipe, pref)) {
      points += 10;
      addReason(
        reasons,
        "dietary_match",
        `Matches your ${labelPreference(pref)} preference`,
        10,
      );
    } else if (pref === "vegan") {
      points -= 35;
    } else if (pref === "vegetarian") {
      points -= 25;
    } else if (pref === "gluten_free") {
      points -= 10;
    }
  }

  if (hasTag(recipe, "vegan") && profile.dietaryPreferences.includes("vegetarian")) {
    points += 6;
  }

  return Math.max(-35, Math.min(35, points));
}

function scoreCalories(
  profile: UserProfile,
  recipe: Recipe,
  mealType: RecipeMealType | undefined,
  reasons: RecommendationReason[],
): number {
  const target = mealType ? MEAL_TARGETS[mealType] : GENERAL_MEAL_TARGET;
  const daily = profile.targets.dailyGoalKcal;
  const idealKcal = daily * target.ideal;
  const minKcal = daily * target.min;
  const maxKcal = daily * target.max;

  let points = 0;
  if (recipe.kcal >= minKcal && recipe.kcal <= maxKcal) {
    const distance = Math.abs(recipe.kcal - idealKcal);
    const span = Math.max(idealKcal - minKcal, maxKcal - idealKcal);
    points = 25 * (1 - clamp(distance / span));
  } else {
    const nearest = recipe.kcal < minKcal ? minKcal : maxKcal;
    const miss = Math.abs(recipe.kcal - nearest);
    points = Math.max(0, 14 - (miss / daily) * 100);
  }

  return addReason(
    reasons,
    "calorie_fit",
    "Fits your daily calorie target",
    points >= 12 ? points : 0,
  );
}

function proteinPer100Kcal(recipe: Recipe): number {
  if (recipe.kcal <= 0) return 0;
  return (recipe.macros.proteinG / recipe.kcal) * 100;
}

function scoreGoal(
  profile: UserProfile,
  recipe: Recipe,
  reasons: RecommendationReason[],
): number {
  const proteinDensity = proteinPer100Kcal(recipe);
  const carbKcal = recipe.macros.carbsG * 4;
  const carbRatio = recipe.kcal > 0 ? carbKcal / recipe.kcal : 0;
  let points = 0;
  let text = "";

  switch (profile.goal as Goal) {
    case "lose_weight":
      points = clamp((proteinDensity - 4) / 5) * 20;
      if (recipe.kcal <= profile.targets.dailyGoalKcal * 0.33) points += 5;
      text = "Good fit for your weight-loss goal";
      break;
    case "gain_muscle":
      points = clamp((proteinDensity - 5) / 5) * 22;
      if (recipe.kcal >= profile.targets.dailyGoalKcal * 0.25) points += 3;
      text = "Higher protein for your muscle-gain goal";
      break;
    case "maintain_tone":
      points = 18 - Math.abs(proteinDensity - 6) * 2;
      text = "Balanced for maintaining your routine";
      break;
    case "healthy_habits":
      points = 12;
      if (recipe.difficulty === "easy") points += 6;
      if (recipe.prepMins + recipe.cookMins <= 35) points += 4;
      text = "Practical for healthy habits";
      break;
  }

  if (profile.dietaryPreferences.includes("keto")) {
    const ketoBoost = carbRatio <= 0.15 ? 6 : carbRatio <= 0.25 ? 3 : -8;
    points += ketoBoost;
  }

  points = Math.max(0, Math.min(25, points));
  return addReason(reasons, "goal_fit", text, points >= 10 ? points : 0);
}

function scoreMacroBalance(
  profile: UserProfile,
  recipe: Recipe,
  reasons: RecommendationReason[],
): number {
  const target = profile.targets.macroTargets;
  const targetTotal =
    target.proteinG * 4 + target.carbsG * 4 + target.fatG * 9;
  const recipeTotal =
    recipe.macros.proteinG * 4 + recipe.macros.carbsG * 4 + recipe.macros.fatG * 9;
  if (targetTotal <= 0 || recipeTotal <= 0) return 0;

  const targetRatios = {
    protein: (target.proteinG * 4) / targetTotal,
    carbs: (target.carbsG * 4) / targetTotal,
    fat: (target.fatG * 9) / targetTotal,
  };
  const recipeRatios = {
    protein: (recipe.macros.proteinG * 4) / recipeTotal,
    carbs: (recipe.macros.carbsG * 4) / recipeTotal,
    fat: (recipe.macros.fatG * 9) / recipeTotal,
  };

  const distance =
    Math.abs(targetRatios.protein - recipeRatios.protein) +
    Math.abs(targetRatios.carbs - recipeRatios.carbs) +
    Math.abs(targetRatios.fat - recipeRatios.fat);
  const points = Math.max(0, 15 * (1 - distance));
  return addReason(
    reasons,
    "macro_fit",
    "Balanced with your macro targets",
    points >= 7 ? points : 0,
  );
}

function scorePractical(recipe: Recipe, reasons: RecommendationReason[]): number {
  const totalMins = recipe.prepMins + recipe.cookMins;
  let points = 0;
  if (recipe.difficulty === "easy") points += 4;
  else if (recipe.difficulty === "medium") points += 2;
  if (totalMins <= 25) points += 6;
  else if (totalMins <= 45) points += 4;
  else if (totalMins <= 60) points += 2;

  return addReason(
    reasons,
    "practical",
    "Quick option for busy days",
    points >= 5 ? points : 0,
  );
}

export function scoreRecipeForProfile(
  profile: UserProfile,
  recipe: Recipe,
  mealType?: RecipeMealType,
): RecipeRecommendation {
  const reasons: RecommendationReason[] = [];
  const rawScore =
    scoreDietary(profile, recipe, reasons) +
    scoreCalories(profile, recipe, mealType, reasons) +
    scoreGoal(profile, recipe, reasons) +
    scoreMacroBalance(profile, recipe, reasons) +
    scorePractical(recipe, reasons) +
    addReason(
      reasons,
      "image_ready",
      "Ready with a recipe photo",
      recipe.imageUrl ? 5 : 0,
    );

  reasons.sort((a, b) => b.points - a.points);
  return {
    recipe,
    score: Math.round(Math.max(0, rawScore)),
    reasons: reasons.slice(0, 3),
  };
}

export function diversifyRecommendations(
  recommendations: RecipeRecommendation[],
): RecipeRecommendation[] {
  const result: RecipeRecommendation[] = [];
  const pool = [...recommendations];

  while (pool.length > 0) {
    const previous = result[result.length - 1];
    let pickIndex = 0;
    if (previous) {
      const diverseIndex = pool.findIndex(
        (candidate) =>
          candidate.recipe.cuisine !== previous.recipe.cuisine &&
          !candidate.recipe.mealTypes.some((mealType) =>
            previous.recipe.mealTypes.includes(mealType),
          ),
      );
      if (
        diverseIndex > 0 &&
        pool[0].score - pool[diverseIndex].score <= 8
      ) {
        pickIndex = diverseIndex;
      }
    }
    result.push(pool.splice(pickIndex, 1)[0]);
  }

  return result;
}
