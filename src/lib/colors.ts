// The fixed palette a parent picks a Child's color from. Kept small and
// distinct so chips stay glanceable — a Child is "primarily a colored
// tag/filter on Tasks", per CONTEXT.md.
export const CHILD_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // amber
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
] as const;

export const DEFAULT_CHILD_COLOR = CHILD_COLORS[5];
