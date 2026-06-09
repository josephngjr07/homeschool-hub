// Dates are stored as @db.Date (no time, no zone). We represent each calendar
// day as a Date at UTC midnight, so what we save and what we query always line
// up. "Today" is resolved in the family's local timezone (not the server's
// UTC), so the app shows the right day for a GMT+8 user even when UTC has
// already rolled over.
//
// (Single timezone is fine for this family app; make it per-user later.)
export const APP_TIME_ZONE = "Asia/Singapore"; // GMT+8

// en-CA formats as YYYY-MM-DD, which `new Date(...)` reads as UTC midnight.
function ymdInZone(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// The current calendar day in the family's timezone, as a UTC-midnight Date.
export function todayInZone(timeZone = APP_TIME_ZONE): Date {
  return new Date(ymdInZone(new Date(), timeZone));
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// Monday as the start of the week. Returns the Monday on/just before `date`.
export function startOfWeek(date: Date): Date {
  const dow = date.getUTCDay(); // 0=Sun … 6=Sat
  const daysSinceMonday = (dow + 6) % 7;
  return addDays(date, -daysSinceMonday);
}

// The seven UTC-midnight Dates Mon…Sun for the week containing `start`'s Monday.
export function weekDates(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime(); // both UTC-midnight
}

export function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

// A YYYY-MM-DD string suitable for <input type="date"> and for new Date(...).
export function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Format an "HH:MM" 24h time string as a friendly 12h label, e.g. "9:00 AM".
// Returns null for empty/invalid input so callers can simply skip rendering.
export function formatTime(time: string | null | undefined): string | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
