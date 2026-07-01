/**
 * Tuning constants for the calorie engine. Kept separate from logic so the
 * product/nutrition assumptions are auditable in one place.
 */
import { ActivityLevel, DietaryPreference, Goal, ReportReason } from "./types";

/** Standard Mifflin-St Jeor activity multipliers (4 levels per prototype). */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
};

/** Daily kcal adjustment applied on top of TDEE for each goal. */
export const GOAL_KCAL_ADJUSTMENT: Record<Goal, number> = {
  lose_weight: -500,
  gain_muscle: 300,
  maintain_tone: 0,
  healthy_habits: 0,
};

/**
 * Macro split (fraction of total calories) per goal. Each tuple sums to 1.0.
 * Protein/Carbs/Fat. Defensible general-purpose splits; not medical advice.
 */
export const MACRO_SPLIT: Record<Goal, { protein: number; carbs: number; fat: number }> = {
  lose_weight: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  gain_muscle: { protein: 0.3, carbs: 0.5, fat: 0.2 },
  maintain_tone: { protein: 0.25, carbs: 0.45, fat: 0.3 },
  healthy_habits: { protein: 0.2, carbs: 0.5, fat: 0.3 },
};

/** Calories per gram of each macronutrient. */
export const KCAL_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;

/**
 * Safety floor for the computed daily goal. We never recommend below this,
 * regardless of deficit, to avoid unsafe targets.
 */
export const MIN_DAILY_KCAL = 1200;

/** Water target heuristic: ml per kg of body weight, then clamped. */
export const WATER_ML_PER_KG = 35;
export const WATER_MIN_ML = 2000;
export const WATER_MAX_ML = 4000;
export const WATER_DEFAULT_ML = 2500;

/** Validation bounds for body metrics (guards against nonsense input). */
export const METRIC_BOUNDS = {
  ageYears: { min: 13, max: 120 },
  heightCm: { min: 90, max: 250 },
  weightKg: { min: 30, max: 400 },
} as const;

/** Canonical lists for client dropdowns / validation. */
export const ALL_GOALS: Goal[] = [
  "lose_weight",
  "maintain_tone",
  "gain_muscle",
  "healthy_habits",
];

export const ALL_ACTIVITY_LEVELS: ActivityLevel[] = [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
];

export const ALL_DIETARY_PREFERENCES: DietaryPreference[] = [
  "vegetarian",
  "vegan",
  "keto",
  "gluten_free",
  "mediterranean",
  "paleo",
];

// ---- Phase 3: Social ----

/** @handle rules: 3-20 chars, starts with a letter, [a-z0-9_]. Stored lowercase. */
export const HANDLE_REGEX = /^[a-z][a-z0-9_]{2,19}$/;
export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;

/** Free-text limits for the public profile. */
export const DISPLAY_NAME_MAX = 80;
export const BIO_MAX = 160;

/** Caption length for a feed post. */
export const CAPTION_MAX = 500;

/** Reasons a post can be reported (moderation). */
export const ALL_REPORT_REASONS: ReportReason[] = [
  "spam",
  "inappropriate",
  "harassment",
  "other",
];

/** Free-text note length on a report. */
export const REPORT_NOTE_MAX = 500;
