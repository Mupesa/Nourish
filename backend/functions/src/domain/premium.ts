/**
 * Pure freemium decision logic — no Firestore. The transactional wrapper lives
 * in services/premium.service.ts; this is the part worth unit-testing.
 *
 * Free users may open up to FREE_RECIPE_VIEW_CAP *distinct* recipe details.
 * Re-opening an already-unlocked recipe never counts again, so the recipes a
 * free user has unlocked stay open forever. Premium users are unmetered.
 */
export const FREE_RECIPE_VIEW_CAP = 20;

export interface RecipeViewDecision {
  /** Whether the view is allowed. */
  allowed: boolean;
  /** Whether the key should be persisted (newly unlocked). */
  record: boolean;
  /** Distinct free views still available after this one. */
  freeViewsRemaining: number;
}

/**
 * Decide whether a recipe-detail view is permitted under the free-tier cap.
 *
 * @param isPremium   whether the user is premium (unmetered)
 * @param viewedKeys  recipe keys the user has already unlocked
 * @param key         the recipe key being opened
 * @param cap         the free-tier distinct-view cap
 */
export function decideRecipeView(
  isPremium: boolean,
  viewedKeys: readonly string[],
  key: string,
  cap: number = FREE_RECIPE_VIEW_CAP,
): RecipeViewDecision {
  if (isPremium) {
    return { allowed: true, record: false, freeViewsRemaining: cap };
  }

  const count = viewedKeys.length;

  // Already unlocked — free re-open, nothing to record.
  if (viewedKeys.includes(key)) {
    return {
      allowed: true,
      record: false,
      freeViewsRemaining: Math.max(0, cap - count),
    };
  }

  // New recipe but cap reached → blocked.
  if (count >= cap) {
    return { allowed: false, record: false, freeViewsRemaining: 0 };
  }

  // Under the cap — unlock and record this recipe.
  return { allowed: true, record: true, freeViewsRemaining: cap - (count + 1) };
}
