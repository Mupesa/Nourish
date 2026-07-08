/**
 * Client mirror of the backend domain types (backend/functions/src/domain).
 * Kept in sync manually — the two are intentionally decoupled to avoid the
 * monorepo/Functions deploy friction noted in the architecture plan.
 */

export type Goal =
  | "lose_weight"
  | "maintain_tone"
  | "gain_muscle"
  | "healthy_habits";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active";

export type DietaryPreference =
  | "vegetarian"
  | "vegan"
  | "keto"
  | "gluten_free"
  | "mediterranean"
  | "paleo";

export type BiologicalSex = "male" | "female";
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
export type MealSource = "quick" | "spoonacular" | "recipe";

export interface BodyMetrics {
  ageYears: number;
  biologicalSex: BiologicalSex;
  heightCm: number;
  weightKg: number;
}

export interface Macros {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface NutritionTargets {
  bmrKcal: number;
  tdeeKcal: number;
  dailyGoalKcal: number;
  macroTargets: Macros;
  waterGoalMl: number;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  goal: Goal;
  activityLevel: ActivityLevel;
  dietaryPreferences: DietaryPreference[];
  metrics: BodyMetrics;
  targets: NutritionTargets;
  isPremium: boolean;
  onboardingCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LoggedMeal {
  id: string;
  slot: MealSlot;
  name: string;
  kcal: number;
  macros: Macros;
  source: MealSource;
  sourceId: string | null;
  imageUrl: string | null;
  loggedAt: number;
}

export interface DiaryEntry {
  date: string;
  meals: LoggedMeal[];
  waterMl: number;
  totals: { kcal: number; macros: Macros };
  createdAt: number;
  updatedAt: number;
}

export interface DiaryDaySummary {
  entry: DiaryEntry;
  goalKcal: number;
  remainingKcal: number;
  waterGoalMl: number;
  macroTargets: Macros;
}

export interface NutritionEstimate {
  kcal: number;
  macros: Macros;
}

export interface RecipeSearchResult extends NutritionEstimate {
  spoonacularId: number;
  title: string;
  imageUrl: string | null;
}

// ---- Onboarding payload (matches POST /profile/onboarding) ----
export interface OnboardingPayload {
  goal: Goal;
  activityLevel: ActivityLevel;
  dietaryPreferences: DietaryPreference[];
  metrics: BodyMetrics;
}

// ---- Phase 2: Recipes & Planner ----
export type RecipeDifficulty = "easy" | "medium" | "hard";
export type RecipeSourceKind = "curated" | "community" | "spoonacular";
export type RecipeMealType = "breakfast" | "lunch" | "dinner" | "snack";
export type RecipeCuisineRegion =
  | "southern_africa"
  | "west_africa"
  | "east_africa"
  | "asian"
  | "indian"
  | "western";

export interface RecipeIngredient {
  name: string;
  quantity: string;
}

export interface RecipeStep {
  title: string;
  body: string;
  icon: string | null;
}

/** Unified recipe shape used by the UI for both local + Spoonacular recipes. */
export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  imagePath: string | null;
  source: RecipeSourceKind;
  mealTypes: RecipeMealType[];
  cuisine: string;
  cuisineRegion: RecipeCuisineRegion | null;
  dietaryTags: DietaryPreference[];
  difficulty: RecipeDifficulty;
  servings: number;
  prepMins: number;
  cookMins: number;
  kcal: number;
  macros: Macros;
  nutritionDisclaimer: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  spoonacularId: number | null;
}

/** A lighter recipe shape for grids/cards (search + featured). */
export interface RecipeCardData {
  id: string;
  title: string;
  imageUrl: string | null;
  kcal: number;
  cookMins?: number;
  source: "recipe" | "spoonacular";
  reason?: string;
}

export type RecommendationReasonCode =
  | "dietary_match"
  | "calorie_fit"
  | "goal_fit"
  | "macro_fit"
  | "practical"
  | "image_ready";

export interface RecommendationReason {
  code: RecommendationReasonCode;
  text: string;
  points: number;
}

export interface RecipeRecommendation {
  recipe: Recipe;
  score: number;
  reasons: RecommendationReason[];
}

export interface PlanItem {
  id: string;
  recipeId: string;
  source: "recipe" | "spoonacular";
  title: string;
  kcal: number;
  macros: Macros;
  imageUrl: string | null;
  cooked: boolean;
}

export interface DayPlan {
  date: string;
  meals: Record<MealSlot, PlanItem[]>;
  createdAt: number;
  updatedAt: number;
}

// ---- Phase 3: Social ----

export interface FriendStreak {
  current: number;
  longest: number;
  lastCookedDate: string | null;
}

/** Public profile card (mirror of backend profiles/{uid}). */
export interface PublicProfile {
  uid: string;
  handle: string | null;
  handleLower: string | null;
  displayName: string | null;
  photoURL: string | null;
  bio: string;
  streak: FriendStreak;
  postCount: number;
  friendCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Friend {
  uid: string;
  handle: string | null;
  displayName: string | null;
  photoURL: string | null;
  since: number;
}

export type Relationship =
  | "self"
  | "friends"
  | "outgoing_pending"
  | "incoming_pending"
  | "blocked"
  | "blocked_by"
  | "none";

export interface FriendRequestCard {
  uid: string;
  handle: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
}

export interface SearchResult extends PublicProfile {
  relationship: Relationship;
}

export interface Post {
  id: string;
  authorUid: string;
  authorHandle: string | null;
  authorName: string | null;
  authorPhoto: string | null;
  imageUrl: string;
  imagePath: string;
  caption: string;
  kcal: number | null;
  recipeId: string | null;
  likeCount: number;
  createdAt: number;
}

/** A post annotated with whether the current user has liked it. */
export interface FeedPost extends Post {
  likedByMe: boolean;
}
