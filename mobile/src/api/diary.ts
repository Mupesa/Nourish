import { api } from "./client";
import { DiaryDaySummary, MealSlot, MealSource, Macros } from "../types/domain";

export interface LogMealBody {
  slot: MealSlot;
  name: string;
  kcal: number;
  macros?: Macros;
  source?: MealSource;
  sourceId?: string | null;
  imageUrl?: string | null;
}

/** Get the day summary (entry + remaining budget + targets). */
export function fetchDay(date: string) {
  return api.get<DiaryDaySummary>(`/api/v1/diary/${date}`);
}

/** Log a meal into a given day. */
export function logMeal(date: string, body: LogMealBody) {
  return api.post<DiaryDaySummary>(`/api/v1/diary/${date}/meals`, body);
}

/** Remove a logged meal. */
export function deleteMeal(date: string, mealId: string) {
  return api.del<DiaryDaySummary>(`/api/v1/diary/${date}/meals/${mealId}`);
}

/** Set or adjust water intake for the day. */
export function setWater(date: string, body: { setMl?: number; addMl?: number }) {
  return api.put<DiaryDaySummary>(`/api/v1/diary/${date}/water`, body);
}
