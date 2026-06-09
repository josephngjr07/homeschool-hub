import { prisma } from "@/lib/prisma";

// The parent's "why" — their own reason for homeschooling, surfaced gently on
// the home page. Owner-scoped; empty saves as null so the home page falls back
// to encouragement.

export async function getMission(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mission: true },
  });
  return user?.mission ?? null;
}

export async function setMission(userId: string, mission: string | null) {
  const cleaned = mission?.trim().slice(0, 280) || null;
  await prisma.user.update({
    where: { id: userId },
    data: { mission: cleaned },
  });
  return cleaned;
}
