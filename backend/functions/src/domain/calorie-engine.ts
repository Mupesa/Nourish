/**
 * The Nourish calorie engine.
 *
 * Pure, deterministic functions — no I/O, no Firebase — so they can be unit
 * tested in isolation and run identically on any input. This is the single
 * authoritative implementation of the Mifflin-St Jeor pipeline (FR-1).
 */
import {
  ACTIVITY_MULTIPLIERS,
  GOAL_KCAL_ADJUSTMENT,
  KCAL_PER_GRAM,
  MACRO_SPLIT,
  MIN_DAILY_KCAL,
  WATER_DEFAULT_ML,
  WATER_MAX_ML,
  WATER_MIN_ML,
  WATER_ML_PER_KG,
} from "./constants";
import {
  ActivityLevel,
  BodyMetrics,
  Goal,
  Macros,
  NutritionTargets,
} from "./types";

/**
 * Basal Metabolic Rate via the Mifflin-St Jeor equation.
 *   male:   BMR = 10*kg + 6.25*cm - 5*age + 5
 *   female: BMR = 10*kg + 6.25*cm - 5*age - 161
 */
export function calculateBmr(metrics: BodyMetrics): number {
  const { weightKg, heightCm, ageYears, biologicalSex } = metrics;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const sexOffset = biologicalSex === "male" ? 5 : -161;
  return base + sexOffset;
}

/** Total Daily Energy Expenditure = BMR * activity multiplier. */
export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

/**
 * Daily calorie goal = TDEE + goal adjustment, clamped to a safe floor.
 */
export function calculateDailyGoal(tdee: number, goal: Goal): number {
  const adjusted = tdee + GOAL_KCAL_ADJUSTMENT[goal];
  return Math.max(MIN_DAILY_KCAL, Math.round(adjusted));
}

/**
 * Split a calorie budget into macro gram targets using the goal's ratio.
 */
export function calculateMacroTargets(dailyGoalKcal: number, goal: Goal): Macros {
  const split = MACRO_SPLIT[goal];
  return {
    proteinG: Math.round((dailyGoalKcal * split.protein) / KCAL_PER_GRAM.protein),
    carbsG: Math.round((dailyGoalKcal * split.carbs) / KCAL_PER_GRAM.carbs),
    fatG: Math.round((dailyGoalKcal * split.fat) / KCAL_PER_GRAM.fat),
  };
}

/** Water target from body weight, clamped to a sensible range. */
export function calculateWaterGoal(weightKg: number): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return WATER_DEFAULT_ML;
  const raw = weightKg * WATER_ML_PER_KG;
  const rounded = Math.round(raw / 100) * 100; // nearest 100ml
  return Math.min(WATER_MAX_ML, Math.max(WATER_MIN_ML, rounded));
}

/**
 * Run the full pipeline: metrics + activity + goal -> all nutrition targets.
 * This is what the profile service calls whenever inputs change.
 */
export function computeNutritionTargets(
  metrics: BodyMetrics,
  activityLevel: ActivityLevel,
  goal: Goal,
): NutritionTargets {
  const bmrKcal = Math.round(calculateBmr(metrics));
  const tdeeRaw = calculateTdee(calculateBmr(metrics), activityLevel);
  const tdeeKcal = Math.round(tdeeRaw);
  const dailyGoalKcal = calculateDailyGoal(tdeeRaw, goal);
  return {
    bmrKcal,
    tdeeKcal,
    dailyGoalKcal,
    macroTargets: calculateMacroTargets(dailyGoalKcal, goal),
    waterGoalMl: calculateWaterGoal(metrics.weightKg),
  };
}

/** Sum a list of macro objects into a single total. */
export function sumMacros(items: Macros[]): Macros {
  return items.reduce<Macros>(
    (acc, m) => ({
      proteinG: acc.proteinG + m.proteinG,
      carbsG: acc.carbsG + m.carbsG,
      fatG: acc.fatG + m.fatG,
    }),
    { proteinG: 0, carbsG: 0, fatG: 0 },
  );
}
