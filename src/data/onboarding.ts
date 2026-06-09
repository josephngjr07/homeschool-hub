import { prisma } from "@/lib/prisma";
import { createChild } from "@/data/children";
import { createTask } from "@/data/tasks";
import { todayInZone, startOfWeek, addDays } from "@/lib/date";

// Onboarding → Starter week (S7). A two-step setup (kids → subjects) seeds a
// pre-filled week so a brand-new parent never faces an empty planner. The
// Starter week is just ordinary Task rows (materialized, independent) — fully
// editable and clearable, so it becomes the parent's own. No template entity,
// no recurrence rule (CONTEXT.md).

// A gentle menu of common homeschool subjects to seed from, each with a plain
// example so a brand-new parent knows what it means. She picks which days each
// one happens — nothing is forced across the whole week. She can also add her
// own subjects beyond this list.
export const STARTER_SUBJECTS = [
  { name: "Bible reading", hint: "a story + a verse" },
  { name: "Reading", hint: "phonics or a book" },
  { name: "Math", hint: "counting & numbers" },
  { name: "Handwriting", hint: "letters & words" },
  { name: "Read-aloud", hint: "you read, they listen" },
  { name: "Science", hint: "an experiment or nature" },
  { name: "History", hint: "a story from the past" },
  { name: "Art & craft", hint: "draw, paint, make" },
  { name: "Music", hint: "sing or an instrument" },
  { name: "Nature walk", hint: "outside together" },
] as const;

// The day Bible reading is pre-lit on by default (Mon–Fri), so onboarding is
// never a blank page but never floods the week either.
export const DEFAULT_SUBJECT = "Bible reading";
export const WEEKDAYS = [0, 1, 2, 3, 4];

// Has this parent finished setup? Drives the redirect into Onboarding. A parent
// is "onboarded" once they've completed setup (onboardedAt) — or if they
// already have children or tasks, which grandfathers in users who predate
// Onboarding so they're never bounced back through it.
export async function hasOnboarded(userId: string): Promise<boolean> {
  const [user, childCount, taskCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { onboardedAt: true },
    }),
    prisma.child.count({ where: { userId } }),
    prisma.task.count({ where: { userId } }),
  ]);
  return Boolean(user?.onboardedAt) || childCount > 0 || taskCount > 0;
}

// One subject and the weekdays it happens on (0=Mon … 6=Sun). Each (subject,
// day) pair becomes one independent Task — so "Bible every weekday, Art twice"
// is just different-length day lists, never a flood across the whole week.
export type StarterItem = { subject: string; weekdays: number[] };

// The testable core: given the parent's chosen subjects-with-days + her
// children, insert one independent Task per (subject, day), assigned to everyone
// (all the given children). Returns the created Tasks.
export async function generateStarterWeek(
  userId: string,
  input: { items: StarterItem[]; weekStart: Date; childIds: string[] },
) {
  const created = [];
  for (const item of input.items) {
    for (const offset of item.weekdays) {
      created.push(
        await createTask(userId, {
          title: item.subject,
          date: addDays(input.weekStart, offset),
          childIds: input.childIds,
        }),
      );
    }
  }
  return created;
}

// The orchestration the wizard calls: create the children, seed this week's
// Starter week assigned to all of them, and stamp onboardedAt so setup never
// runs again. Idempotent-ish: if already onboarded, do nothing.
export async function completeOnboarding(
  userId: string,
  input: {
    children: { name: string; color: string }[];
    items: StarterItem[];
  },
) {
  if (await hasOnboarded(userId)) return null;

  const children = [];
  for (const c of input.children) {
    children.push(await createChild(userId, c));
  }

  const weekStart = startOfWeek(todayInZone());
  const tasks = await generateStarterWeek(userId, {
    items: input.items,
    weekStart,
    childIds: children.map((c) => c.id),
  });

  await prisma.user.update({
    where: { id: userId },
    data: { onboardedAt: new Date() },
  });

  return { children, tasks };
}
