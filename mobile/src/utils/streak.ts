/**
 * Client-side streak liveness. The server stores the raw streak; we decide
 * whether it's still "alive" relative to the viewer's local today (mirrors the
 * backend's liveCurrent). A streak whose last cook day isn't today or yesterday
 * is shown as 0.
 */
import { FriendStreak } from "../types/domain";
import { todayLocal } from "./date";

function previousDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function liveStreak(
  streak: FriendStreak | null | undefined,
  today: string = todayLocal(),
): number {
  if (!streak || !streak.lastCookedDate) return 0;
  if (
    streak.lastCookedDate === today ||
    streak.lastCookedDate === previousDay(today)
  ) {
    return streak.current;
  }
  return 0;
}
