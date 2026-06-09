"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { completeOnboarding, STARTER_SUBJECTS } from "@/data/onboarding";
import { CHILD_COLORS, DEFAULT_CHILD_COLOR } from "@/lib/colors";

// Finish the two-step setup: create the children, seed the Starter week, stamp
// onboardedAt. Children arrive as parallel name/color arrays; subjects as a
// repeated field. We validate against the known palette + subject menu so a
// hand-crafted POST can't inject arbitrary values.
export async function completeOnboardingAction(formData: FormData) {
  const userId = await requireUserId();

  const names = formData.getAll("childName").map((v) => String(v).trim());
  const colors = formData.getAll("childColor").map(String);
  const children = names
    .map((name, i) => ({
      name,
      color: (CHILD_COLORS as readonly string[]).includes(colors[i])
        ? colors[i]
        : DEFAULT_CHILD_COLOR,
    }))
    .filter((c) => c.name.length > 0);

  const allowed = new Set<string>(STARTER_SUBJECTS);
  const subjects = formData
    .getAll("subject")
    .map(String)
    .filter((s) => allowed.has(s));

  // Need at least one child and one subject to seed a meaningful week.
  if (children.length === 0 || subjects.length === 0) return;

  await completeOnboarding(userId, { children, subjects });

  revalidatePath("/plan");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  redirect("/plan");
}
