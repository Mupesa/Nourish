/**
 * Personal cooking-streak engine. Pure functions over a FriendStreak, so the
 * logic is unit-testable and free of Firestore. Dates are user-local calendar
 * strings (YYYY-MM-DD); we compare them lexically (safe at fixed width) and do
 * day arithmetic in UTC to avoid DST drift.
 */
import { FriendStreak } from "./types";

/** The calendar day before `iso` (YYYY-MM-DD). */
export function previousDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Advance a streak when a meal is logged on `date`. Forward-only: logging the
 * same day is a no-op, and backfilling an older day never changes the streak.
 * A consecutive day increments; any gap resets to 1.
 */
export function applyCook(streak: FriendStreak, date: string): FriendStreak {
  const last = streak.lastCookedDate;
  if (last && date <= last) return streak; // same day or backfill → no change
  const current = last && previousDay(date) === last ? streak.current + 1 : 1;
  return {
    current,
    longest: Math.max(streak.longest, current),
    lastCookedDate: date,
  };
}

/**
 * The streak to display relative to `today`: the stored value if the last cook
 * day was today or yesterday, otherwise 0 (the streak has lapsed).
 */
export function liveCurrent(streak: FriendStreak, today: string): number {
  const last = streak.lastCookedDate;
  if (!last) return 0;
  if (last === today || last === previousDay(today)) return streak.current;
  return 0;
}
