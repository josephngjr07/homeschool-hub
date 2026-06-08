import { prisma } from "@/lib/prisma";

// Data-access for Children. Every function is scoped by userId so a parent can
// only ever touch their own children — ownership is enforced here, in the one
// place all reads/writes funnel through, not in the UI.

export function createChild(
  userId: string,
  data: { name: string; color: string },
) {
  return prisma.child.create({ data: { ...data, userId } });
}

export function listChildren(userId: string) {
  return prisma.child.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

// Update only if the child belongs to userId. Returns the updated child, or
// null if it didn't exist / wasn't theirs (so callers can't edit across owners).
export async function updateChild(
  userId: string,
  id: string,
  data: { name?: string; color?: string },
) {
  const { count } = await prisma.child.updateMany({
    where: { id, userId },
    data,
  });
  if (count === 0) return null;
  return prisma.child.findUnique({ where: { id } });
}

// Delete only if owned. Returns true if a row was removed, false otherwise.
export async function deleteChild(userId: string, id: string) {
  const { count } = await prisma.child.deleteMany({ where: { id, userId } });
  return count > 0;
}
