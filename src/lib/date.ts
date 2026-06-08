// Dates are stored as @db.Date (no time, no zone). We work in UTC-midnight
// Dates so what's saved and what's queried always line up.
//
// NOTE (known limitation): "today" is computed in UTC, so near midnight a
// parent in another timezone could briefly see the adjacent day. Fine for the
// MVP; revisit with the parent's timezone when we polish.

export function todayUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
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
