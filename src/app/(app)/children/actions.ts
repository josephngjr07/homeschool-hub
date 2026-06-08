"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { createChild, updateChild, deleteChild } from "@/data/children";

// Server Actions for managing Children. Each re-checks auth (actions are
// reachable by direct POST) and scopes the mutation to the signed-in parent
// via the data layer, then refreshes the /children view.

export async function createChildAction(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "");
  if (!name || !color) return;
  await createChild(userId, { name, color });
  revalidatePath("/children");
}

export async function updateChildAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "");
  if (!id || !name || !color) return;
  await updateChild(userId, id, { name, color });
  revalidatePath("/children");
}

export async function deleteChildAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteChild(userId, id);
  revalidatePath("/children");
}
