import { auth } from "@/auth";

// Read the signed-in parent's id. Returns null when nobody is signed in —
// pages use this to redirect, server actions use requireUserId() to hard-fail.
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// For server actions: every action is reachable by direct POST, so each one
// must independently confirm there's a signed-in user before touching data.
export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
