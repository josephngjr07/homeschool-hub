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
  it("generateStarterWeek makes one Task per subject per school day (Mon–Fri)", async () => {
    const userId = await makeUser();
    const mia = await createChild(userId, { name: "Mia", color: "#ef4444" });
    const theo = await createChild(userId, { name: "Theo", color: "#3b82f6" });

    const tasks = await generateStarterWeek(userId, {
      subjects: ["Bible", "Math"],
      weekStart: D("2026-06-08"), // a Monday
      childIds: [mia.id, theo.id],
    });

    // 2 subjects × 5 school days.
    expect(tasks).toHaveLength(10);

    // Each is assigned to everyone (all given children).
    expect(
      tasks.every(
        (t) => t.children.length === 2,
      ),
    ).toBe(true);

    // Tasks land Mon–Fri only — never the weekend.
    const days = new Set(tasks.map((t) => t.date.toISOString().slice(0, 10)));
    expect([...days].sort()).toEqual([
      "2026-06-08",
      "2026-06-09",
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
    ]);
  });

  it("hasOnboarded reflects setup state", async () => {
    const userId = await makeUser();
    expect(await hasOnboarded(userId)).toBe(false);

    await completeOnboarding(userId, {
      children: [{ name: "Mia", color: "#ef4444" }],
      subjects: ["Reading"],
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
      subjects: ["Bible", "Math", "Reading"],
    });

    expect(result?.children).toHaveLength(2);
    // 3 subjects × 5 school days.
    expect(result?.tasks).toHaveLength(15);

    // The new parent lands in a filled-in *current* week.
    const weekStart = startOfWeek(todayInZone());
    const thisWeek = await getTasksInRange(
      userId,
      weekStart,
      addDays(weekStart, 6),
    );
    expect(thisWeek).toHaveLength(15);
  });

  it("completeOnboarding never runs twice (clearing the week doesn't re-trigger it)", async () => {
    const userId = await makeUser();

    await completeOnboarding(userId, {
      children: [{ name: "Mia", color: "#ef4444" }],
      subjects: ["Reading"],
    });

    // Simulate the parent clearing their Starter week.
    await prisma.task.deleteMany({ where: { userId } });

    const second = await completeOnboarding(userId, {
      children: [{ name: "Duplicate", color: "#22c55e" }],
      subjects: ["Math"],
    });

    expect(second).toBeNull();
    // No new children or tasks were created the second time.
    expect(await prisma.child.count({ where: { userId } })).toBe(1);
    expect(await prisma.task.count({ where: { userId } })).toBe(0);
  });
});
