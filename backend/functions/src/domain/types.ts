/**
 * Nourish domain types — the canonical shape of every entity the backend owns.
 * These mirror the Firestore document structure described in the architecture
 * plan and are reconciled against the actual onboarding prototypes.
 */

// ---- Enums (locked against the onboarding prototypes) ----

/** The four goals shown on the "What's your main goal?" screen. */
export type Goal =
  | "lose_weight"
  | "maintain_tone"
  | "gain_muscle"
  | "healthy_habits";

/** The four levels shown on the "How active are you?" screen. */
export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active";

/** The six chips shown on the "Any dietary preferences?" screen. */
export type DietaryPreference =
  | "vegetarian"
  | "vegan"
  | "keto"
  | "gluten_free"
  | "mediterranean"
  | "paleo";

/** Biological sex — required by the Mifflin-St Jeor equation. */
export type BiologicalSex = "male" | "female";

/** Meal slots used in the daily diary. */
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

/** Where a logged meal's data originated. */
export type MealSource = "quick" | "spoonacular" | "recipe";

// ---- Value objects ----

/** Raw body metrics needed to compute BMR/TDEE. Stored canonically in metric. */
export interface BodyMetrics {
  ageYears: number;
  biologicalSex: BiologicalSex;
  heightCm: number;
  weightKg: number;
}

/** Macronutrient amounts in grams. */
export interface Macros {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Server-computed nutrition targets derived from metrics + goal + activity. */
export interface NutritionTargets {
  bmrKcal: number;
  tdeeKcal: number;
  dailyGoalKcal: number;
  macroTargets: Macros;
  waterGoalMl: number;
}

// ---- Entities ----

/** A user profile document: users/{uid}. */
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

  /** Cached server-computed targets. Recomputed on any metrics/goal change. */
  targets: NutritionTargets;

  isPremium: boolean;
  onboardingCompleted: boolean;

  createdAt: number; // epoch millis
  updatedAt: number; // epoch millis
}

/** A single logged meal inside a diary entry. */
export interface LoggedMeal {
  id: string;
  slot: MealSlot;
  name: string;
  kcal: number;
  macros: Macros;
  source: MealSource;
  /** Reference to the source item when source !== 'quick'. */
  sourceId: string | null;
  imageUrl: string | null;
  loggedAt: number; // epoch millis
}

/** A daily diary document: users/{uid}/diaryEntries/{YYYY-MM-DD}. */
export interface DiaryEntry {
  date: string; // YYYY-MM-DD (user's local day)
  meals: LoggedMeal[];
  waterMl: number;

  /** Denormalised, server-maintained rollups for fast dashboard reads. */
  totals: {
    kcal: number;
    macros: Macros;
  };

  createdAt: number;
  updatedAt: number;
}

/** The dashboard payload returned for a given day (entry + remaining budget). */
export interface DiaryDaySummary {
  entry: DiaryEntry;
  goalKcal: number;
  remainingKcal: number;
  waterGoalMl: number;
  macroTargets: Macros;
}

// ===================== Phase 2: Recipes & Planner =====================

export type RecipeDifficulty = "easy" | "medium" | "hard";
export type RecipeSource = "curated" | "community" | "spoonacular";
export type RecipeStatus = "approved" | "pending" | "rejected";
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
  /** Free-text amount as shown in the UI, e.g. "1.5 cups", "300g". */
  quantity: string;
}

export interface RecipeStep {
  title: string;
  body: string;
  /** Optional Material icon name for the step (e.g. "skillet"). */
  icon: string | null;
}

/** A recipe document: recipes/{recipeId} (curated + approved community). */
export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  /** Firebase Storage object path for project-owned recipe imagery. */
  imagePath: string | null;
  source: RecipeSource;
  status: RecipeStatus;
  /** uid of the community submitter, when source === 'community'. */
  submittedBy: string | null;
  mealTypes: RecipeMealType[];
  /** Human-readable cuisine group used for discovery filters. */
  cuisine: string;
  /** Normalised cuisine region used by Cook Around the World filters. */
  cuisineRegion: RecipeCuisineRegion;
  dietaryTags: DietaryPreference[];
  difficulty: RecipeDifficulty;
  servings: number;
  prepMins: number;
  cookMins: number;
  /** Per-serving nutrition. */
  kcal: number;
  macros: Macros;
  nutritionDisclaimer: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  /** Set when sourced/seeded from Spoonacular. */
  spoonacularId: number | null;
  createdAt: number;
  updatedAt: number;
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

/** A single planned meal inside a day's plan. */
export interface PlanItem {
  id: string;
  /** recipes/{id} when source 'recipe'; the Spoonacular id (string) otherwise. */
  recipeId: string;
  source: "recipe" | "spoonacular";
  title: string;
  kcal: number;
  macros: Macros;
  imageUrl: string | null;
  /** Marked cooked -> auto-logged into the diary for that date. */
  cooked: boolean;
}

/** A day's meal plan: users/{uid}/mealPlans/{YYYY-MM-DD}. */
export interface DayPlan {
  date: string;
  meals: Record<MealSlot, PlanItem[]>;
  createdAt: number;
  updatedAt: number;
}

// ===================== Phase 3: Social =====================

/** A user's personal cooking streak. Evaluated lazily on read (no scheduler). */
export interface FriendStreak {
  current: number;
  longest: number;
  /** YYYY-MM-DD of the last day a meal was logged, or null if never. */
  lastCookedDate: string | null;
}

/**
 * Public-facing profile card: profiles/{uid}. Deliberately separate from the
 * private users/{uid} doc so calorie metrics/targets are never exposed to
 * friends. Only the backend writes this (Admin SDK).
 */
export interface PublicProfile {
  uid: string;
  /** Unique @handle (lowercase), or null until claimed. */
  handle: string | null;
  /** Lowercased handle used as the handles/{id} key + for search. */
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

export type FriendRequestStatus = "pending" | "accepted" | "declined";

/** A pending friend request, mirrored into both users' request subcollections. */
export interface FriendRequest {
  fromUid: string;
  toUid: string;
  status: FriendRequestStatus;
  createdAt: number;
}

/** A denormalised friend entry: users/{uid}/friends/{friendUid}. */
export interface Friend {
  uid: string;
  handle: string | null;
  displayName: string | null;
  photoURL: string | null;
  since: number;
}

/** The viewer's relationship to another user — drives which action a UI shows. */
export type Relationship =
  | "self"
  | "friends"
  | "outgoing_pending"
  | "incoming_pending"
  | "blocked"
  | "blocked_by"
  | "none";

/** A pending request as shown in a list (the OTHER party's card). */
export interface FriendRequestCard {
  uid: string;
  handle: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
}

/** A community feed post: posts/{postId}. */
export interface Post {
  id: string;
  authorUid: string;
  authorHandle: string | null;
  authorName: string | null;
  authorPhoto: string | null;
  /** Public download URL of the uploaded meal photo. */
  imageUrl: string;
  /** Storage path (posts/{uid}/...) so the backend can delete the object. */
  imagePath: string;
  caption: string;
  /** Optional manual calorie tag. */
  kcal: number | null;
  /** Optional link back to the recipe this meal came from. */
  recipeId: string | null;
  likeCount: number;
  createdAt: number;
}

/** A post annotated with whether the requesting user has liked it. */
export interface FeedPost extends Post {
  likedByMe: boolean;
}

export type ReportReason =
  | "spam"
  | "inappropriate"
  | "harassment"
  | "other";

/** A moderation report against a post: reports/{reportId}. */
export interface Report {
  id: string;
  reporterUid: string;
  postId: string;
  authorUid: string;
  reason: ReportReason;
  note: string;
  status: "open" | "resolved";
  createdAt: number;
}
