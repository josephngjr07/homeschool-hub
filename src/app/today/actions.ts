"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { createTask, setTaskCompleted } from "@/data/tasks";

// Server Actions for the Today loop. Both re-check auth and scope to the parent.

export async function createTaskAction(formData: FormData) {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  const childIds = formData
    .getAll("childIds")
    .map(String)
    .filter(Boolean);

  if (!title || !dateStr) return;

  await createTask(userId, {
    title,
    description: description || null,
    date: new Date(dateStr),
    childIds,
  });
  revalidatePath("/today");
}

export async function setTaskCompletedAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const completed = String(formData.get("completed") ?? "") === "true";
  if (!id) return;

  await setTaskCompleted(userId, id, completed);
  revalidatePath("/today");
}
