/**
 * Premium / freemium enforcement that needs Firestore state (as opposed to the
 * simple boolean check in http/middleware/premium.ts).
 *
 * Free-tier recipe browsing is metered: a free user may open up to
 * FREE_RECIPE_VIEW_CAP *distinct* recipe details (curated or Spoonacular).
 * Re-opening one they've already seen never counts again, so the recipes they've
 * unlocked stay open. Premium users are unmetered.
 *
 * The set of unlocked recipe keys lives in a single private doc:
 *   users/{uid}/private/recipeAccess  ->  { viewedKeys: string[], updatedAt }
 * Keys are namespaced so a curated id can't collide with a Spoonacular id:
 *   local:<recipeId>   ·   spoon:<spoonacularId>
 */
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../config/firebase";
import { notFound, paymentRequired } from "../http/errors";
import { decideRecipeView, FREE_RECIPE_VIEW_CAP } from "../domain/premium";

export { FREE_RECIPE_VIEW_CAP };

const userRef = (uid: string) => db.collection("users").doc(uid);
const accessRef = (uid: string) =>
  userRef(uid).collection("private").doc("recipeAccess");

/** Namespaced access keys (so curated vs Spoonacular ids never collide). */
export const localKey = (recipeId: string) => `local:${recipeId}`;
export const spoonKey = (spoonacularId: number | string) =>
  `spoon:${spoonacularId}`;

export interface RecipeViewResult {
  /** Remaining free distinct views (Infinity-safe number; cap for premium). */
  freeViewsRemaining: number;
  isPremium: boolean;
}

/**
 * Authorise a recipe-detail view, enforcing the free-tier cap. Premium users
 * always pass. Free users pass if they've seen this key before, or are still
 * under the cap (in which case the key is recorded). Otherwise throws 402.
 *
 * Runs in a transaction so concurrent opens can't race past the cap.
 */
export async function enforceRecipeView(
  uid: string,
  key: string,
): Promise<RecipeViewResult> {
  return db.runTransaction(async (tx) => {
    const [uSnap, aSnap] = await Promise.all([
      tx.get(userRef(uid)),
      tx.get(accessRef(uid)),
    ]);

    const isPremium = uSnap.get("isPremium") === true;
    const viewed: string[] = (aSnap.get("viewedKeys") as string[]) ?? [];

    const decision = decideRecipeView(isPremium, viewed, key);

    if (!decision.allowed) {
      throw paymentRequired(
        `Free plan is limited to ${FREE_RECIPE_VIEW_CAP} recipes. Upgrade to unlock the full library.`,
      );
    }

    if (decision.record) {
      tx.set(
        accessRef(uid),
        { viewedKeys: FieldValue.arrayUnion(key), updatedAt: Date.now() },
        { merge: true },
      );
    }

    return { isPremium, freeViewsRemaining: decision.freeViewsRemaining };
  });
}

/** Admin/billing: set a user's premium flag (later set by the RevenueCat webhook). */
export async function setUserPremium(
  uid: string,
  isPremium: boolean,
): Promise<void> {
  const ref = userRef(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw notFound("Profile not found");
  }
  await ref.set({ isPremium, updatedAt: Date.now() }, { merge: true });
}
