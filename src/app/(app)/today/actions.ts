"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import {
  createTask,
  setTaskCompleted,
  updateTask,
  deleteTask,
} from "@/data/tasks";

// Server Actions for the Today loop. Each re-checks auth and scopes to the
// parent. Completing/editing a task also shows up on the Plan and the
// Dashboard recap, so refresh those too.
function revalidateToday() {
  revalidatePath("/today");
  revalidatePath("/plan");
  revalidatePath("/dashboard");
}

export async function createTaskAction(formData: FormData) {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  const childIds = formData
    .getAll("childIds")
    .map(String)
    .filter(Boolean);

  if (!title || !dateStr) return;

  await createTask(userId, {
    title,
    description: description || null,
    url: url || null,
    time: time || null,
    // An end with no start is meaningless — drop it if there's no time.
    endTime: time ? endTime || null : null,
    date: new Date(dateStr),
    childIds,
  });
  revalidateToday();
}

export async function setTaskCompletedAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const completed = String(formData.get("completed") ?? "") === "true";
  if (!id) return;

  await setTaskCompleted(userId, id, completed);
  revalidateToday();
}

export async function updateTaskAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  const childIds = formData.getAll("childIds").map(String).filter(Boolean);

  await updateTask(userId, id, {
    ...(title ? { title } : {}),
    description: description || null,
    url: url || null,
    time: time || null,
    endTime: time ? endTime || null : null,
    ...(dateStr ? { date: new Date(dateStr) } : {}),
    childIds,
  });
  revalidateToday();
}

// Slot a task into (or out of) a time, from the Schedule grid. Only touches the
// start/end time — leaving title/notes/link/children/date untouched (updateTask
// does a partial update). Empty start = back to "Anytime" (untimed is a
// first-class, no-pressure state, ADR-0001), which also clears any end.
export async function setTaskTimesAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const time = String(formData.get("time") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();

  await updateTask(userId, id, {
    time: time || null,
    endTime: time ? endTime || null : null,
  });
  revalidateToday();
}

export async function deleteTaskAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteTask(userId, id);
  revalidateToday();
}
