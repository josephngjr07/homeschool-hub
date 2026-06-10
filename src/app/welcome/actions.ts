"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import {
  completeOnboarding,
  skipOnboarding,
  type DraftItem,
} from "@/data/onboarding";
import { CHILD_COLORS, DEFAULT_CHILD_COLOR } from "@/lib/colors";

// Finish the two-step setup: create the children, seed the Starter week, stamp
// onboardedAt. Children arrive as parallel name/color arrays; the subjects-with-
// days come as a JSON blob (custom subject names can contain any characters, so
// JSON is safer than delimited fields). Everything is re-validated server-side
// since the action is reachable by direct POST.
export async function completeOnboardingAction(formData: FormData) {
  const userId = await requireUserId();

  const children = parseChildren(formData);
  const items = parseItems(formData.get("items"));

  // Need at least one child and one subject-with-days to seed a real week.
  if (children.length === 0 || items.length === 0) return;

  await completeOnboarding(userId, { children, items });

  revalidatePath("/plan");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  redirect("/plan");
}

// Skip the Starter week: mark setup done and go straight to the home page with
// an empty planner — but keep any children the parent already added in step 1,
// so their names aren't thrown away. They can add tasks whenever they like.
export async function skipOnboardingAction(formData: FormData) {
  const userId = await requireUserId();
  await skipOnboarding(userId, parseChildren(formData));
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// Children arrive as parallel name/color arrays. Trim/cap names, validate each
// color against the palette (falling back to the default), and drop the blanks.
function parseChildren(formData: FormData) {
  const names = formData.getAll("childName").map((v) => String(v).trim());
  const colors = formData.getAll("childColor").map(String);
  return names
    .map((name, i) => ({
      name: name.slice(0, 40),
      color: (CHILD_COLORS as readonly string[]).includes(colors[i])
        ? colors[i]
        : DEFAULT_CHILD_COLOR,
    }))
    .filter((c) => c.name.length > 0);
}

// Defensively turn the submitted JSON into clean DraftItems: trim/cap subject
// names, keep only valid unique weekdays (0–6), keep child indexes as
// non-negative ints (empty = everyone), drop empties, and cap the total.
function parseItems(raw: FormDataEntryValue | null): DraftItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw ?? "[]"));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((it) => {
      const subject = String((it as { subject?: unknown })?.subject ?? "")
        .trim()
        .slice(0, 40);
      const rawDays = (it as { weekdays?: unknown })?.weekdays;
      const weekdays = Array.isArray(rawDays)
        ? [
            ...new Set(
              rawDays
                .map(Number)
                .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
            ),
          ].sort((a, b) => a - b)
        : [];
      const rawKids = (it as { childIndexes?: unknown })?.childIndexes;
      const childIndexes = Array.isArray(rawKids)
        ? [
            ...new Set(
              rawKids
                .map(Number)
                .filter((n) => Number.isInteger(n) && n >= 0 && n < 50),
            ),
          ]
        : [];
      return { subject, weekdays, childIndexes };
    })
    .filter((it) => it.subject.length > 0 && it.weekdays.length > 0)
    .slice(0, 20);
}
