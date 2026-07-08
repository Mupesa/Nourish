/**
 * Zod schemas — the trust boundary. Every request body is parsed through these
 * before it touches business logic, so invalid client data never reaches
 * Firestore or the calorie engine.
 */
import { z } from "zod";
import {
  ALL_ACTIVITY_LEVELS,
  ALL_DIETARY_PREFERENCES,
  ALL_GOALS,
  ALL_REPORT_REASONS,
  BIO_MAX,
  CAPTION_MAX,
  DISPLAY_NAME_MAX,
  HANDLE_REGEX,
  METRIC_BOUNDS,
  REPORT_NOTE_MAX,
} from "./constants";

export const goalSchema = z.enum(ALL_GOALS as [string, ...string[]]);
export const activityLevelSchema = z.enum(
  ALL_ACTIVITY_LEVELS as [string, ...string[]],
);
export const dietaryPreferenceSchema = z.enum(
  ALL_DIETARY_PREFERENCES as [string, ...string[]],
);

export const bodyMetricsSchema = z.object({
  ageYears: z
    .number()
    .int()
    .min(METRIC_BOUNDS.ageYears.min)
    .max(METRIC_BOUNDS.ageYears.max),
  biologicalSex: z.enum(["male", "female"]),
  heightCm: z
    .number()
    .min(METRIC_BOUNDS.heightCm.min)
    .max(METRIC_BOUNDS.heightCm.max),
  weightKg: z
    .number()
    .min(METRIC_BOUNDS.weightKg.min)
    .max(METRIC_BOUNDS.weightKg.max),
});

/** Full onboarding payload — everything the calorie engine needs in one call. */
export const onboardingSchema = z.object({
  goal: goalSchema,
  activityLevel: activityLevelSchema,
  dietaryPreferences: z.array(dietaryPreferenceSchema).max(6).default([]),
  metrics: bodyMetricsSchema,
});

/** Partial profile update — any subset of the personalization fields. */
export const profileUpdateSchema = z
  .object({
    goal: goalSchema.optional(),
    activityLevel: activityLevelSchema.optional(),
    dietaryPreferences: z.array(dietaryPreferenceSchema).max(6).optional(),
    metrics: bodyMetricsSchema.partial().optional(),
    displayName: z.string().min(1).max(80).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const macrosSchema = z.object({
  proteinG: z.number().min(0).max(2000),
  carbsG: z.number().min(0).max(2000),
  fatG: z.number().min(0).max(2000),
});

/** A meal being logged into the diary. */
export const logMealSchema = z.object({
  slot: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  name: z.string().min(1).max(120),
  kcal: z.number().min(0).max(10000),
  macros: macrosSchema.default({ proteinG: 0, carbsG: 0, fatG: 0 }),
  source: z.enum(["quick", "spoonacular", "recipe"]).default("quick"),
  sourceId: z.string().max(120).nullable().default(null),
  imageUrl: z.string().url().max(2048).nullable().default(null),
});

/** Setting water intake for a day. Either absolute set or relative delta. */
export const waterSchema = z
  .object({
    setMl: z.number().int().min(0).max(10000).optional(),
    addMl: z.number().int().min(-2000).max(2000).optional(),
  })
  .refine((d) => d.setMl !== undefined || d.addMl !== undefined, {
    message: "Provide either setMl or addMl",
  });

/** A YYYY-MM-DD date path param. */
export const dateParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type LogMealInput = z.infer<typeof logMealSchema>;
export type WaterInput = z.infer<typeof waterSchema>;

// ===================== Phase 2: Recipes & Planner =====================

const macrosInput = z.object({
  proteinG: z.number().min(0).max(2000),
  carbsG: z.number().min(0).max(2000),
  fatG: z.number().min(0).max(2000),
});

export const recipeMealTypeSchema = z.enum([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

export const recipeCuisineRegionSchema = z.enum([
  "southern_africa",
  "west_africa",
  "east_africa",
  "asian",
  "indian",
  "western",
]);

/** Community recipe submission (POST /recipes/community). */
export const communityRecipeSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).default(""),
  imageUrl: z.string().url().max(2048).nullable().default(null),
  imagePath: z.string().max(512).nullable().default(null),
  mealTypes: z.array(recipeMealTypeSchema).min(1).max(4),
  cuisine: z.string().trim().min(2).max(80),
  cuisineRegion: recipeCuisineRegionSchema.default("western"),
  dietaryTags: z.array(dietaryPreferenceSchema).max(6).default([]),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  servings: z.number().int().min(1).max(50).default(2),
  prepMins: z.number().int().min(0).max(1440).default(0),
  cookMins: z.number().int().min(0).max(1440).default(0),
  kcal: z.number().min(0).max(10000),
  macros: macrosInput.default({ proteinG: 0, carbsG: 0, fatG: 0 }),
  nutritionDisclaimer: z
    .string()
    .max(240)
    .default("Estimated per serving; not medical advice."),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1).max(160),
        quantity: z.string().max(60).default(""),
      }),
    )
    .min(1)
    .max(60),
  steps: z
    .array(
      z.object({
        title: z.string().min(1).max(160),
        body: z.string().min(1).max(2000),
        icon: z.string().max(60).nullable().default(null),
      }),
    )
    .min(1)
    .max(40),
});

/** Recipe library list/search query. */
export const recipeQuerySchema = z.object({
  q: z.string().max(120).optional(),
  tag: dietaryPreferenceSchema.optional(),
  mealType: recipeMealTypeSchema.optional(),
  cuisine: z.string().trim().min(2).max(80).optional(),
  cuisineRegion: recipeCuisineRegionSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return value;
}, z.boolean().default(true));

/** Personalized local recipe recommendations. */
export const recommendedRecipeQuerySchema = recipeQuerySchema.extend({
  includeReasons: booleanQuerySchema,
});

/** Add an item to a day's plan. */
export const planItemSchema = z.object({
  slot: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  recipeId: z.string().min(1).max(120),
  source: z.enum(["recipe", "spoonacular"]).default("recipe"),
});

/** Week range query for the planner. */
export const weekQuerySchema = z.object({
  start: dateParamSchema,
});

export type CommunityRecipeInput = z.infer<typeof communityRecipeSchema>;
export type RecipeQueryInput = z.infer<typeof recipeQuerySchema>;
export type RecommendedRecipeQueryInput = z.infer<
  typeof recommendedRecipeQuerySchema
>;
export type PlanItemInput = z.infer<typeof planItemSchema>;

// ===================== Phase 3: Social =====================

/** A normalised @handle: trimmed, lowercased, then shape-checked. */
export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    HANDLE_REGEX,
    "Handle must be 3-20 characters: letters, numbers or underscore, starting with a letter",
  );

/** Claim or change the user's unique handle (PUT /social/handle). */
export const claimHandleSchema = z.object({
  handle: handleSchema,
});

/** Update mutable public-profile fields (PATCH /social/profile). */
export const socialProfileUpdateSchema = z
  .object({
    displayName: z.string().trim().min(1).max(DISPLAY_NAME_MAX).optional(),
    bio: z.string().trim().max(BIO_MAX).optional(),
    photoURL: z.string().url().max(2048).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

export type ClaimHandleInput = z.infer<typeof claimHandleSchema>;
export type SocialProfileUpdateInput = z.infer<typeof socialProfileUpdateSchema>;

/** Handle prefix search (GET /social/users/search?q=). Allows partial prefixes. */
export const userSearchSchema = z.object({
  q: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(20)
    .regex(/^[a-z0-9_]+$/, "Search letters, numbers or underscore only"),
});

/** Send a friend request (POST /social/friends/requests). */
export const sendFriendRequestSchema = z.object({
  toUid: z.string().min(1).max(128),
});

/** A bare uid path param. */
export const uidParamSchema = z.string().min(1).max(128);

export type UserSearchInput = z.infer<typeof userSearchSchema>;
export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;

/** Create a feed post (POST /feed/posts). Image is already uploaded to Storage. */
export const createPostSchema = z.object({
  imageUrl: z.string().url().max(2048),
  imagePath: z.string().min(1).max(512),
  caption: z.string().trim().max(CAPTION_MAX).default(""),
  kcal: z.number().int().min(0).max(20000).nullable().default(null),
  recipeId: z.string().max(128).nullable().default(null),
});

/** Feed pagination (GET /feed?before=&limit=). `before` is a createdAt cursor. */
export const feedQuerySchema = z.object({
  before: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type FeedQueryInput = z.infer<typeof feedQuerySchema>;

/** Report a post (POST /feed/posts/:id/report). */
export const reportPostSchema = z.object({
  reason: z.enum(ALL_REPORT_REASONS as [string, ...string[]]),
  note: z.string().trim().max(REPORT_NOTE_MAX).default(""),
});

/** Admin: filter the moderation queue. */
export const reportQuerySchema = z.object({
  status: z.enum(["open", "resolved"]).optional(),
});

/** Admin: resolve a report — dismiss it or remove the offending post. */
export const resolveReportSchema = z.object({
  action: z.enum(["dismiss", "removed"]).default("dismiss"),
});

export type ReportPostInput = z.infer<typeof reportPostSchema>;
export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;

/** Admin: grant/revoke premium (POST /admin/users/:uid/premium). */
export const setPremiumSchema = z.object({
  isPremium: z.boolean(),
});

export type SetPremiumInput = z.infer<typeof setPremiumSchema>;
