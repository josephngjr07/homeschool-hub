import { prisma } from "@/lib/prisma";
import { createChild } from "@/data/children";
import { createTask } from "@/data/tasks";
import { todayInZone, startOfWeek, addDays } from "@/lib/date";

// Onboarding → Starter week (S7). A two-step setup (kids → subjects) seeds a
// pre-filled week so a brand-new parent never faces an empty planner. The
// Starter week is just ordinary Task rows (materialized, independent) — fully
// editable and clearable, so it becomes the parent's own. No template entity,
// no recurrence rule (CONTEXT.md).

// A short, gentle menu of common homeschool subjects to seed from. The parent
// picks a few; each becomes a daily Task for the school week.
export const STARTER_SUBJECTS = [
  "Bible",
  "Reading",
  "Math",
  "Writing",
  "Science",
  "History",
  "Art",
  "Music",
  "Nature walk",
  "Read-aloud",
] as const;

// How many weekdays the Starter week fills: Monday–Friday (offsets 0–4).
const SCHOOL_DAYS = [0, 1, 2, 3, 4];

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

// The testable core: given chosen subjects + the parent's children, insert one
// independent Task per subject per school day, assigned to everyone (all the
// given children). Returns the created Tasks.
export async function generateStarterWeek(
  userId: string,
  input: { subjects: string[]; weekStart: Date; childIds: string[] },
) {
  const created = [];
  for (const subject of input.subjects) {
    for (const offset of SCHOOL_DAYS) {
      created.push(
        await createTask(userId, {
          title: subject,
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
    subjects: string[];
  },
) {
  if (await hasOnboarded(userId)) return null;

  const children = [];
  for (const c of input.children) {
    children.push(await createChild(userId, c));
  }

  const weekStart = startOfWeek(todayInZone());
  const tasks = await generateStarterWeek(userId, {
    subjects: input.subjects,
    weekStart,
    childIds: children.map((c) => c.id),
  });

  await prisma.user.update({
    where: { id: userId },
    data: { onboardedAt: new Date() },
  });

  return { children, tasks };
}
