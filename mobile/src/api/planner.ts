import { api } from "./client";
import { DayPlan, MealSlot } from "../types/domain";

export async function getWeek(start: string): Promise<DayPlan[]> {
  const { days } = await api.get<{ days: DayPlan[] }>(
    `/api/v1/planner/week?start=${start}`,
  );
  return days;
}

export async function getDayPlan(date: string): Promise<DayPlan> {
  const { plan } = await api.get<{ plan: DayPlan }>(`/api/v1/planner/${date}`);
  return plan;
}

export async function addPlanItem(
  date: string,
  body: { slot: MealSlot; recipeId: string; source: "recipe" | "spoonacular" },
): Promise<DayPlan> {
  const { plan } = await api.post<{ plan: DayPlan }>(
    `/api/v1/planner/${date}/items`,
    body,
  );
  return plan;
}

export async function removePlanItem(
  date: string,
  slot: MealSlot,
  itemId: string,
): Promise<DayPlan> {
  const { plan } = await api.del<{ plan: DayPlan }>(
    `/api/v1/planner/${date}/items/${slot}/${itemId}`,
  );
  return plan;
}

export async function markPlanItemCooked(
  date: string,
  slot: MealSlot,
  itemId: string,
): Promise<DayPlan> {
  const { plan } = await api.post<{ plan: DayPlan }>(
    `/api/v1/planner/${date}/items/${slot}/${itemId}/cooked`,
    {},
  );
  return plan;
}
