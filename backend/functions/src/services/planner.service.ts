/**
 * Meal Planner service. Owns users/{uid}/mealPlans/{YYYY-MM-DD} (one DayPlan
 * per day). "Mark cooked" auto-logs the planned meal into that day's diary, so
 * planning flows straight into tracking (FR-1).
 */
import { randomUUID } from "crypto";
import { db } from "../config/firebase";
import { notFound } from "../http/errors";
import { DayPlan, MealSlot, PlanItem } from "../domain/types";
import { PlanItemInput } from "../domain/validation";
import { addMeal } from "./diary.service";
import { getRecipe } from "./recipe.service";
import { getRecipeDetail } from "./spoonacular.service";

const planRef = (uid: string, date: string) =>
  db.collection("users").doc(uid).collection("mealPlans").doc(date);

function emptyDayPlan(date: string): DayPlan {
  const ts = Date.now();
  return {
    date,
    meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
    createdAt: ts,
    updatedAt: ts,
  };
}

/** Add days to a YYYY-MM-DD string, returning a new YYYY-MM-DD. */
function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export async function getDayPlan(uid: string, date: string): Promise<DayPlan> {
  const snap = await planRef(uid, date).get();
  return snap.exists ? (snap.data() as DayPlan) : emptyDayPlan(date);
}

/** Seven consecutive day plans starting at `start` (for the weekly view). */
export async function getWeekPlan(
  uid: string,
  start: string,
): Promise<DayPlan[]> {
  const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return Promise.all(dates.map((d) => getDayPlan(uid, d)));
}

/** Resolve a recipe reference into a denormalised PlanItem. */
async function buildPlanItem(input: PlanItemInput): Promise<PlanItem> {
  if (input.source === "spoonacular") {
    const detail = await getRecipeDetail(Number(input.recipeId));
    return {
      id: randomUUID(),
      recipeId: input.recipeId,
      source: "spoonacular",
      title: detail.title,
      kcal: detail.kcal,
      macros: detail.macros,
      imageUrl: detail.imageUrl,
      cooked: false,
    };
  }
  const recipe = await getRecipe(input.recipeId);
  return {
    id: randomUUID(),
    recipeId: recipe.id,
    source: "recipe",
    title: recipe.title,
    kcal: recipe.kcal,
    macros: recipe.macros,
    imageUrl: recipe.imageUrl,
    cooked: false,
  };
}

export async function addPlanItem(
  uid: string,
  date: string,
  input: PlanItemInput,
): Promise<DayPlan> {
  const item = await buildPlanItem(input);
  const ref = planRef(uid, date);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const plan = snap.exists ? (snap.data() as DayPlan) : emptyDayPlan(date);
    plan.meals[input.slot] = [...plan.meals[input.slot], item];
    plan.updatedAt = Date.now();
    tx.set(ref, plan);
  });
  return getDayPlan(uid, date);
}

export async function removePlanItem(
  uid: string,
  date: string,
  slot: MealSlot,
  itemId: string,
): Promise<DayPlan> {
  const ref = planRef(uid, date);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound("Day plan not found");
    const plan = snap.data() as DayPlan;
    const before = plan.meals[slot].length;
    plan.meals[slot] = plan.meals[slot].filter((i) => i.id !== itemId);
    if (plan.meals[slot].length === before) throw notFound("Plan item not found");
    plan.updatedAt = Date.now();
    tx.set(ref, plan);
  });
  return getDayPlan(uid, date);
}

/**
 * Mark a planned item cooked: flips its flag and logs it into the diary for the
 * same date. Idempotent-ish — re-marking re-logs, so the client should disable
 * the action once cooked.
 */
export async function markPlanItemCooked(
  uid: string,
  date: string,
  slot: MealSlot,
  itemId: string,
): Promise<DayPlan> {
  const ref = planRef(uid, date);
  let target: PlanItem | undefined;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound("Day plan not found");
    const plan = snap.data() as DayPlan;
    target = plan.meals[slot].find((i) => i.id === itemId);
    if (!target) throw notFound("Plan item not found");
    target.cooked = true;
    plan.updatedAt = Date.now();
    tx.set(ref, plan);
  });

  if (target) {
    await addMeal(uid, date, {
      slot,
      name: target.title,
      kcal: target.kcal,
      macros: target.macros,
      source: target.source,
      sourceId: target.recipeId,
      imageUrl: target.imageUrl,
    });
  }

  return getDayPlan(uid, date);
}
