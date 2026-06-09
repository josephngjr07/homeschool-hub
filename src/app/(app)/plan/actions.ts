"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import {
  updateTask,
  deleteTask,
  createTasksForWeekdays,
  copyWeek,
} from "@/data/tasks";
import { todayInZone, addDays } from "@/lib/date";

// All plan mutations touch the same task data the Today and Dashboard views
// read, so refresh those too.
function revalidatePlan() {
  revalidatePath("/plan");
  revalidatePath("/today");
  revalidatePath("/dashboard");
}

export async function updateTaskAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  const childIds = formData.getAll("childIds").map(String).filter(Boolean);

  await updateTask(userId, id, {
    ...(title ? { title } : {}),
    description: description || null,
    ...(dateStr ? { date: new Date(dateStr) } : {}),
    childIds,
  });
  revalidatePlan();
}

export async function deleteTaskAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteTask(userId, id);
  revalidatePlan();
}

// Rescue (ADR-0001): an opt-in, one-tap move of a missed task to today.
export async function rescueTaskAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await updateTask(userId, id, { date: todayInZone() });
  revalidatePlan();
}

export async function createTasksForWeekdaysAction(formData: FormData) {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const weekStartStr = String(formData.get("weekStart") ?? "");
  const weekdays = formData
    .getAll("weekdays")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  const childIds = formData.getAll("childIds").map(String).filter(Boolean);

  if (!title || !weekStartStr || weekdays.length === 0) return;

  await createTasksForWeekdays(userId, {
    title,
    description: description || null,
    weekStart: new Date(weekStartStr),
    weekdays,
    childIds,
  });
  revalidatePlan();
}

export async function copyWeekAction(formData: FormData) {
  const userId = await requireUserId();
  const toStr = String(formData.get("toWeekStart") ?? "");
  if (!toStr) return;
  const to = new Date(toStr);
  await copyWeek(userId, addDays(to, -7), to);
  revalidatePlan();
}
