// Warm, win-only encouragement for the weekly recap. Every line celebrates the
// doing — none of them reference what was missed, ranked, or scored (ADR-0001).
// Kept gentle and family-oriented to match the calm tone of the app.
export const ENCOURAGEMENTS = [
  "Small, steady, faithful.",
  "Every one of these mattered.",
  "Look what you built together.",
  "Showing up is the whole thing.",
  "A good week's work, done with love.",
  "You kept the rhythm going.",
  "These little moments add up to a childhood.",
  "Learning happened here this week.",
  "You gave them your time — that's everything.",
  "One calm week at a time.",
] as const;

// Pick a line deterministically from the week itself, so it stays the same all
// week (no flicker on reload) but changes from one week to the next. weekStart
// is a UTC-midnight Date; its day-count makes a stable per-week index.
export function encouragementForWeek(weekStart: Date): string {
  const weekIndex = Math.floor(weekStart.getTime() / 86_400_000 / 7);
  const i = ((weekIndex % ENCOURAGEMENTS.length) + ENCOURAGEMENTS.length) %
    ENCOURAGEMENTS.length;
  return ENCOURAGEMENTS[i];
}
