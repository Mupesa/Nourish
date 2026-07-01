/**
 * Diary service. Owns users/{uid}/diaryEntries/{YYYY-MM-DD}. All mutations run
 * inside Firestore transactions and recompute the denormalised totals from the
 * meal list, so the dashboard's "remaining" figure is always trustworthy.
 */
import { randomUUID } from "crypto";
import { db } from "../config/firebase";
import { sumMacros } from "../domain/calorie-engine";
import {
  DiaryDaySummary,
  DiaryEntry,
  LoggedMeal,
  Macros,
} from "../domain/types";
import { LogMealInput, WaterInput } from "../domain/validation";
import { getProfile } from "./profile.service";
import { recordCookDay } from "./social.service";
import { notFound } from "../http/errors";

const entryRef = (uid: string, date: string) =>
  db.collection("users").doc(uid).collection("diaryEntries").doc(date);

function emptyEntry(date: string): DiaryEntry {
  const ts = Date.now();
  return {
    date,
    meals: [],
    waterMl: 0,
    totals: { kcal: 0, macros: { proteinG: 0, carbsG: 0, fatG: 0 } },
    createdAt: ts,
    updatedAt: ts,
  };
}

/** Recompute totals from the meal list — the single source of truth for rollups. */
function recomputeTotals(meals: LoggedMeal[]): DiaryEntry["totals"] {
  const kcal = meals.reduce((sum, m) => sum + m.kcal, 0);
  const macros: Macros = sumMacros(meals.map((m) => m.macros));
  return { kcal: Math.round(kcal), macros };
}

/** Read an entry (or a fresh empty one) and wrap it with the day's targets. */
export async function getDaySummary(
  uid: string,
  date: string,
): Promise<DiaryDaySummary> {
  const profile = await getProfile(uid); // throws 404 if not onboarded
  const snap = await entryRef(uid, date).get();
  const entry = snap.exists ? (snap.data() as DiaryEntry) : emptyEntry(date);

  const goalKcal = profile.targets.dailyGoalKcal;
  return {
    entry,
    goalKcal,
    remainingKcal: goalKcal - entry.totals.kcal,
    waterGoalMl: profile.targets.waterGoalMl,
    macroTargets: profile.targets.macroTargets,
  };
}

/** Add a meal to a day, creating the entry if needed. Returns the new summary. */
export async function addMeal(
  uid: string,
  date: string,
  input: LogMealInput,
): Promise<DiaryDaySummary> {
  // Ensure the user is onboarded before allowing logging.
  await getProfile(uid);

  const ref = entryRef(uid, date);
  const meal: LoggedMeal = {
    id: randomUUID(),
    slot: input.slot,
    name: input.name,
    kcal: Math.round(input.kcal),
    macros: input.macros,
    source: input.source,
    sourceId: input.sourceId,
    imageUrl: input.imageUrl,
    loggedAt: Date.now(),
  };

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const entry = snap.exists ? (snap.data() as DiaryEntry) : emptyEntry(date);
    const meals = [...entry.meals, meal];
    tx.set(ref, {
      ...entry,
      meals,
      totals: recomputeTotals(meals),
      updatedAt: Date.now(),
    } satisfies DiaryEntry);
  });

  // Advance the cooking streak (best-effort — never block a meal log on it).
  try {
    await recordCookDay(uid, date);
  } catch (e) {
    console.warn("[diary] streak update failed", e);
  }

  return getDaySummary(uid, date);
}

/** Remove a meal by id. Throws 404 if the meal isn't present. */
export async function deleteMeal(
  uid: string,
  date: string,
  mealId: string,
): Promise<DiaryDaySummary> {
  const ref = entryRef(uid, date);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound("Diary entry not found");
    const entry = snap.data() as DiaryEntry;
    const meals = entry.meals.filter((m) => m.id !== mealId);
    if (meals.length === entry.meals.length) {
      throw notFound("Meal not found");
    }
    tx.set(ref, {
      ...entry,
      meals,
      totals: recomputeTotals(meals),
      updatedAt: Date.now(),
    } satisfies DiaryEntry);
  });

  return getDaySummary(uid, date);
}

/** Set or adjust the day's water intake (clamped at >= 0). */
export async function setWater(
  uid: string,
  date: string,
  input: WaterInput,
): Promise<DiaryDaySummary> {
  await getProfile(uid);
  const ref = entryRef(uid, date);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const entry = snap.exists ? (snap.data() as DiaryEntry) : emptyEntry(date);
    const next =
      input.setMl !== undefined
        ? input.setMl
        : entry.waterMl + (input.addMl ?? 0);
    tx.set(ref, {
      ...entry,
      waterMl: Math.max(0, Math.round(next)),
      updatedAt: Date.now(),
    } satisfies DiaryEntry);
  });

  return getDaySummary(uid, date);
}
