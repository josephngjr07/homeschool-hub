import { prisma } from "@/lib/prisma";

// Data-access for Tasks. Owner-scoped throughout. "Everyone" isn't a special
// flag — the caller links the Task to all of the parent's children, so a
// single Task row covers the whole family and still shows under each child's
// filter. There is deliberately no overdue/roll-forward logic here: an
// unfinished Task simply keeps its date (ADR-0001).

type CreateTaskInput = {
  title: string;
  description?: string | null;
  date: Date;
  childIds?: string[];
};

export async function createTask(userId: string, input: CreateTaskInput) {
  const childIds = input.childIds ?? [];

  // Only ever link children that belong to this parent — actions are reachable
  // by direct POST, so we can't trust the incoming ids.
  const owned = childIds.length
    ? await prisma.child.findMany({
        where: { userId, id: { in: childIds } },
        select: { id: true },
      })
    : [];

  return prisma.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      date: input.date,
      children: { connect: owned.map((c) => ({ id: c.id })) },
    },
    include: { children: true },
  });
}

// Tasks for a single day. Pass childId to filter Today to one child; tasks
// linked to that child (including whole-family ones) come back.
export function getTasksForDate(userId: string, date: Date, childId?: string) {
  return prisma.task.findMany({
    where: {
      userId,
      date,
      ...(childId ? { children: { some: { id: childId } } } : {}),
    },
    include: { children: true },
    orderBy: { createdAt: "asc" },
  });
}

// Set completion, only if the Task belongs to the parent. Returns the updated
// Task, or null if it wasn't theirs.
export async function setTaskCompleted(
  userId: string,
  taskId: string,
  completed: boolean,
) {
  const { count } = await prisma.task.updateMany({
    where: { id: taskId, userId },
    data: { completed },
  });
  if (count === 0) return null;
  return prisma.task.findUnique({
    where: { id: taskId },
    include: { children: true },
  });
}
