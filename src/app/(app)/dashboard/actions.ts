"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { setMission } from "@/data/profile";

// Save (or clear) the parent's "why" from the home page.
export async function updateMissionAction(formData: FormData) {
  const userId = await requireUserId();
  const mission = String(formData.get("mission") ?? "");
  await setMission(userId, mission);
  revalidatePath("/dashboard");
}
