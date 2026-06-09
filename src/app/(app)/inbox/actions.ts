"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import {
  createResource,
  updateResource,
  deleteResource,
  planResource,
  hasContent,
} from "@/data/resources";

// Server Actions for the Inbox. Each re-checks auth and scopes to the parent.

function revalidateInbox() {
  revalidatePath("/inbox");
}

// Planning a Resource creates Tasks, so the Plan / Today / Dashboard views that
// read tasks need refreshing too.
function revalidateAfterPlan() {
  revalidatePath("/inbox");
  revalidatePath("/plan");
  revalidatePath("/today");
  revalidatePath("/dashboard");
}

export async function createResourceAction(formData: FormData) {
  const userId = await requireUserId();
  const url = String(formData.get("url") ?? "");
  const title = String(formData.get("title") ?? "");
  const note = String(formData.get("note") ?? "");

  // Forgiving capture, but never an empty row.
  if (!hasContent({ url, title, note })) return;

  await createResource(userId, { url, title, note });
  revalidateInbox();
}

export async function updateResourceAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await updateResource(userId, id, {
    url: String(formData.get("url") ?? ""),
    title: String(formData.get("title") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  revalidateInbox();
}

export async function deleteResourceAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteResource(userId, id);
  revalidateInbox();
}

export async function planResourceAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const weekStartStr = String(formData.get("weekStart") ?? "");
  const weekdays = formData
    .getAll("weekdays")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  const childIds = formData.getAll("childIds").map(String).filter(Boolean);

  if (!id || !title || !weekStartStr || weekdays.length === 0) return;

  await planResource(userId, id, {
    title,
    description: description || null,
    weekStart: new Date(weekStartStr),
    weekdays,
    childIds,
  });
  revalidateAfterPlan();
}
