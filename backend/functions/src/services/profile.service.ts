/**
 * Profile service. Owns the users/{uid} document and is the ONLY place that
 * writes server-computed nutrition targets — guaranteeing they always reflect
 * the current metrics/goal/activity (they can never be forged by the client).
 */
import { db } from "../config/firebase";
import { AuthedUser } from "../http/middleware/auth";
import { notFound } from "../http/errors";
import { computeNutritionTargets } from "../domain/calorie-engine";
import {
  BodyMetrics,
  UserProfile,
} from "../domain/types";
import { OnboardingInput, ProfileUpdateInput } from "../domain/validation";

const usersCol = () => db.collection("users");

function now(): number {
  return Date.now();
}

/** Create or fully (re)initialise a profile from the onboarding payload. */
export async function completeOnboarding(
  user: AuthedUser,
  input: OnboardingInput,
): Promise<UserProfile> {
  const ref = usersCol().doc(user.uid);
  const existing = await ref.get();
  const metrics = input.metrics as BodyMetrics;

  const targets = computeNutritionTargets(
    metrics,
    input.activityLevel as UserProfile["activityLevel"],
    input.goal as UserProfile["goal"],
  );

  const createdAt = existing.exists
    ? (existing.get("createdAt") as number)
    : now();

  const profile: UserProfile = {
    uid: user.uid,
    displayName: user.name,
    email: user.email,
    photoURL: user.picture,
    isAnonymous: user.isAnonymous,
    goal: input.goal as UserProfile["goal"],
    activityLevel: input.activityLevel as UserProfile["activityLevel"],
    dietaryPreferences:
      input.dietaryPreferences as UserProfile["dietaryPreferences"],
    metrics,
    targets,
    // Preserve premium status across re-onboarding; default false on create.
    isPremium: existing.exists ? existing.get("isPremium") === true : false,
    onboardingCompleted: true,
    createdAt,
    updatedAt: now(),
  };

  await ref.set(profile, { merge: true });
  return profile;
}

/** Fetch a profile or throw 404. */
export async function getProfile(uid: string): Promise<UserProfile> {
  const snap = await usersCol().doc(uid).get();
  if (!snap.exists) throw notFound("Profile not found. Complete onboarding first.");
  return snap.data() as UserProfile;
}

/**
 * Partial update. Any change that affects the calorie pipeline triggers a
 * recompute of targets so cached values never drift from inputs.
 */
export async function updateProfile(
  uid: string,
  input: ProfileUpdateInput,
): Promise<UserProfile> {
  const ref = usersCol().doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw notFound("Profile not found. Complete onboarding first.");
  const current = snap.data() as UserProfile;

  const goal = (input.goal as UserProfile["goal"]) ?? current.goal;
  const activityLevel =
    (input.activityLevel as UserProfile["activityLevel"]) ??
    current.activityLevel;
  const dietaryPreferences =
    (input.dietaryPreferences as UserProfile["dietaryPreferences"]) ??
    current.dietaryPreferences;
  const metrics: BodyMetrics = {
    ...current.metrics,
    ...(input.metrics ?? {}),
  };

  const targets = computeNutritionTargets(metrics, activityLevel, goal);

  const updated: UserProfile = {
    ...current,
    goal,
    activityLevel,
    dietaryPreferences,
    metrics,
    targets,
    displayName: input.displayName ?? current.displayName,
    updatedAt: now(),
  };

  await ref.set(updated, { merge: true });
  return updated;
}
