import { prisma } from "@/lib/prisma";
import { createTask } from "@/data/tasks";
import { addDays } from "@/lib/date";

// Data-access for Resources (the Inbox). Owner-scoped throughout. Capture is
// deliberately forgiving: a Resource needs only one of url / title / note, so a
// parent can drop a bare link mid-scroll. Organising happens later, at planning
// time. The Inbox is the set of Resources not yet `planned` — it is meant to
// drain into the week, not accumulate as a library (see CONTEXT.md).

type ResourceFields = {
  url?: string | null;
  title?: string | null;
  note?: string | null;
};

// True when a capture has at least one piece of content. Empty captures are
// rejected by callers so the Inbox never fills with blank rows.
export function hasContent(input: ResourceFields): boolean {
  return Boolean(input.url?.trim() || input.title?.trim() || input.note?.trim());
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function createResource(userId: string, input: ResourceFields) {
  return prisma.resource.create({
    data: {
      userId,
      url: clean(input.url),
      title: clean(input.title),
      note: clean(input.note),
    },
  });
}

// The Inbox: captured Resources still waiting to be planned. Newest first, so
// the freshest idea is at the top while older ones sink as the list drains.
export function listInbox(userId: string) {
  return prisma.resource.findMany({
    where: { userId, planned: false },
    orderBy: { createdAt: "desc" },
  });
}

// Edit a Resource's fields, only if it belongs to the parent. Returns the
// updated row, or null if it wasn't theirs.
export async function updateResource(
  userId: string,
  id: string,
  input: ResourceFields,
) {
  const { count } = await prisma.resource.updateMany({
    where: { id, userId },
    data: {
      ...(input.url !== undefined ? { url: clean(input.url) } : {}),
      ...(input.title !== undefined ? { title: clean(input.title) } : {}),
      ...(input.note !== undefined ? { note: clean(input.note) } : {}),
    },
  });
  if (count === 0) return null;
  return prisma.resource.findUnique({ where: { id } });
}

// Delete a Resource, only if owned. Any Tasks planned from it keep existing;
// their resourceId is cleared by the schema's onDelete: SetNull.
export async function deleteResource(userId: string, id: string) {
  const { count } = await prisma.resource.deleteMany({ where: { id, userId } });
  return count > 0;
}

// Plan a Resource into the week: create one independent Task per selected
// weekday, each linked back to the Resource, then mark the Resource `planned`
// so it drains out of the Inbox. Repeats are many independent Tasks, never a
// recurrence rule (CONTEXT.md). Returns the created Tasks, or null if the
// Resource wasn't the parent's.
export async function planResource(
  userId: string,
  resourceId: string,
  input: {
    title: string;
    description?: string | null;
    time?: string | null;
    endTime?: string | null;
    weekStart: Date;
    weekdays: number[];
    childIds?: string[];
  },
) {
  const resource = await prisma.resource.findFirst({
    where: { id: resourceId, userId },
    select: { id: true, url: true },
  });
  if (!resource) return null;

  const created = [];
  for (const offset of input.weekdays) {
    created.push(
      await createTask(userId, {
        title: input.title,
        description: input.description ?? null,
        // Copy the captured link onto the Task so it's self-contained — the link
        // shows in the task editor and survives if the Resource is later deleted.
        url: resource.url,
        time: input.time ?? null,
        endTime: input.endTime ?? null,
        date: addDays(input.weekStart, offset),
        childIds: input.childIds,
        resourceId,
      }),
    );
  }

  await prisma.resource.update({
    where: { id: resourceId },
    data: { planned: true },
  });

  return created;
}
