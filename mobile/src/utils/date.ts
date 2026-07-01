/** Date helpers. The diary keys on the user's LOCAL calendar day. */

/** Today's local date as YYYY-MM-DD. */
export function todayLocal(): string {
  const d = new Date();
  return toLocalISODate(d);
}

export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday (week start) of the week containing `iso`, as YYYY-MM-DD. */
export function mondayOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dow = (date.getDay() + 6) % 7; // 0 = Monday
  date.setDate(date.getDate() - dow);
  return toLocalISODate(date);
}

/** Short weekday + day-of-month, e.g. { dow: "Mon", day: "24" }. */
export function dayParts(iso: string): { dow: string; day: string } {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    dow: date.toLocaleDateString(undefined, { weekday: "short" }),
    day: String(d),
  };
}

/** Human-friendly label like "Mon, Oct 24". */
export function friendlyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
