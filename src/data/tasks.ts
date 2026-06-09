import { prisma } from "@/lib/prisma";
import { addDays } from "@/lib/date";

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
  // Link back to the Inbox Resource this Task was planned from (S6). Only
  // honoured if the Resource belongs to this parent.
  resourceId?: string | null;
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

  // Same distrust for the resource link: only connect a Resource the parent
  // actually owns, otherwise leave the Task unlinked.
  const resourceId = input.resourceId
    ? (
        await prisma.resource.findFirst({
          where: { id: input.resourceId, userId },
          select: { id: true },
        })
      )?.id ?? null
    : null;

  return prisma.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      date: input.date,
      resourceId,
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
    // Pull the linked Resource so Today can offer to open its source.
    include: { children: true, resource: true },
    orderBy: { createdAt: "asc" },
  });
}

// Tasks across a date range [start, end] inclusive — the weekly plan view.
// Optionally filtered to one child. Ordered by day, then creation.
export function getTasksInRange(
  userId: string,
  start: Date,
  end: Date,
  childId?: string,
) {
  return prisma.task.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
      ...(childId ? { children: { some: { id: childId } } } : {}),
    },
    include: { children: true },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
}

// Edit a Task: change its title/description, move it to another day (date),
// and/or reassign its children — only if it belongs to the parent. "Rescue"
// (moving a missed task to today) is just a date update. Returns the updated
// Task, or null if it wasn't theirs.
export async function updateTask(
  userId: string,
  id: string,
  data: {
    title?: string;
    description?: string | null;
    date?: Date;
    childIds?: string[];
  },
) {
  const owns = await prisma.task.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!owns) return null;

  // If reassigning, keep only children this parent owns.
  let children;
  if (data.childIds) {
    const owned = await prisma.child.findMany({
      where: { userId, id: { in: data.childIds } },
      select: { id: true },
    });
    children = { set: owned.map((c) => ({ id: c.id })) };
  }

  return prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.date !== undefined ? { date: data.date } : {}),
      ...(children ? { children } : {}),
    },
    include: { children: true },
  });
}

// Delete a Task, only if owned. Returns true if a row was removed.
export async function deleteTask(userId: string, id: string) {
  const { count } = await prisma.task.deleteMany({ where: { id, userId } });
  return count > 0;
}

// --- Recurrence (S5) ------------------------------------------------------
// Repeats are many INDEPENDENT Tasks, never a recurrence rule (per CONTEXT.md),
// so these just fan out createTask. weekdays index: 0=Mon … 6=Sun, matching the
// order of weekDates(weekStart).

export async function createTasksForWeekdays(
  userId: string,
  input: {
    title: string;
    description?: string | null;
    weekStart: Date;
    weekdays: number[];
    childIds?: string[];
  },
) {
  const created = [];
  for (const offset of input.weekdays) {
    created.push(
      await createTask(userId, {
        title: input.title,
        description: input.description ?? null,
        date: addDays(input.weekStart, offset),
        childIds: input.childIds,
      }),
    );
  }
  return created;
}

// Duplicate every Task from the week starting fromWeekStart into the week
// starting toWeekStart, preserving weekday + child assignment and resetting
// completion. Returns how many tasks were copied.
export async function copyWeek(
  userId: string,
  fromWeekStart: Date,
  toWeekStart: Date,
) {
  const source = await getTasksInRange(
    userId,
    fromWeekStart,
    addDays(fromWeekStart, 6),
  );
  const offsetDays = Math.round(
    (toWeekStart.getTime() - fromWeekStart.getTime()) / 86_400_000,
  );

  for (const task of source) {
    await createTask(userId, {
      title: task.title,
      description: task.description,
      date: addDays(task.date, offsetDays),
      childIds: task.children.map((c) => c.id),
    });
  }
  return source.length;
}

// --- Weekly recap (S8) ----------------------------------------------------
// Win-only by construction: this counts ONLY completed Tasks in [start, end].
// There is deliberately no companion "incomplete count" here — the recap can
// only ever surface what got done, never what was missed (ADR-0001).
export function countCompletedInRange(userId: string, start: Date, end: Date) {
  return prisma.task.count({
    where: {
      userId,
      completed: true,
      date: { gte: start, lte: end },
    },
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
