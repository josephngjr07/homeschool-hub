import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, makeUser, prisma } from "@/test/db";
import { createChild } from "@/data/children";
import { getTasksInRange } from "@/data/tasks";
import { startOfWeek, addDays, todayInZone } from "@/lib/date";
import {
  generateStarterWeek,
  completeOnboarding,
  hasOnboarded,
} from "@/data/onboarding";

beforeEach(resetDb);

const D = (s: string) => new Date(s);

describe("onboarding → starter week (S7)", () => {
  it("generateStarterWeek makes one Task per (subject, chosen day), honoring per-subject days", async () => {
    const userId = await makeUser();
    const mia = await createChild(userId, { name: "Mia", color: "#ef4444" });
    const theo = await createChild(userId, { name: "Theo", color: "#3b82f6" });

    const tasks = await generateStarterWeek(userId, {
      items: [
        { subject: "Bible reading", weekdays: [0, 1, 2, 3, 4] }, // Mon–Fri
        { subject: "Art & craft", weekdays: [1, 3] }, // Tue + Thu only
      ],
      weekStart: D("2026-06-08"), // a Monday
      childIds: [mia.id, theo.id],
    });

    // 5 Bible + 2 Art = 7 tasks, not a flood.
    expect(tasks).toHaveLength(7);

    // Each is assigned to everyone (all given children).
    expect(tasks.every((t) => t.children.length === 2)).toBe(true);

    // Art lands only on Tue (06-09) and Thu (06-11).
    const artDays = tasks
      .filter((t) => t.title === "Art & craft")
      .map((t) => t.date.toISOString().slice(0, 10))
      .sort();
    expect(artDays).toEqual(["2026-06-09", "2026-06-11"]);
  });

  it("hasOnboarded reflects setup state", async () => {
    const userId = await makeUser();
    expect(await hasOnboarded(userId)).toBe(false);

    await completeOnboarding(userId, {
      children: [{ name: "Mia", color: "#ef4444" }],
      items: [{ subject: "Reading", weekdays: [0, 1, 2, 3, 4] }],
    });

    expect(await hasOnboarded(userId)).toBe(true);
  });

  it("completeOnboarding seeds children + a filled current week, then stamps onboardedAt", async () => {
    const userId = await makeUser();

    const result = await completeOnboarding(userId, {
      children: [
        { name: "Mia", color: "#ef4444" },
        { name: "Theo", color: "#3b82f6" },
      ],
      items: [
        { subject: "Bible reading", weekdays: [0, 1, 2, 3, 4] }, // 5
        { subject: "Math", weekdays: [0, 2, 4] }, // 3
        { subject: "Nature walk", weekdays: [5] }, // 1 (Saturday)
      ],
    });

    expect(result?.children).toHaveLength(2);
    // 5 + 3 + 1 = 9 tasks.
    expect(result?.tasks).toHaveLength(9);

    // The new parent lands in a filled-in *current* week.
    const weekStart = startOfWeek(todayInZone());
    const thisWeek = await getTasksInRange(
      userId,
      weekStart,
      addDays(weekStart, 6),
    );
    expect(thisWeek).toHaveLength(9);
  });

  it("completeOnboarding never runs twice (clearing the week doesn't re-trigger it)", async () => {
    const userId = await makeUser();

    await completeOnboarding(userId, {
      children: [{ name: "Mia", color: "#ef4444" }],
      items: [{ subject: "Reading", weekdays: [0, 1, 2, 3, 4] }],
    });

    // Simulate the parent clearing their Starter week.
    await prisma.task.deleteMany({ where: { userId } });

    const second = await completeOnboarding(userId, {
      children: [{ name: "Duplicate", color: "#22c55e" }],
      items: [{ subject: "Math", weekdays: [0, 1, 2, 3, 4] }],
    });

    expect(second).toBeNull();
    // No new children or tasks were created the second time.
    expect(await prisma.child.count({ where: { userId } })).toBe(1);
    expect(await prisma.task.count({ where: { userId } })).toBe(0);
  });
});
