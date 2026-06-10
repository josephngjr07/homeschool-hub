import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, makeUser, prisma } from "@/test/db";
import { createChild } from "@/data/children";
import { getTasksInRange } from "@/data/tasks";
import { startOfWeek, addDays, todayInZone } from "@/lib/date";
import {
  generateStarterWeek,
  completeOnboarding,
  skipOnboarding,
  hasOnboarded,
} from "@/data/onboarding";

beforeEach(resetDb);

const D = (s: string) => new Date(s);

describe("skip onboarding", () => {
  it("stamps onboardedAt without creating children or tasks", async () => {
    const userId = await makeUser();
    expect(await hasOnboarded(userId)).toBe(false);

    await skipOnboarding(userId);

    expect(await hasOnboarded(userId)).toBe(true);
    expect(await prisma.child.count({ where: { userId } })).toBe(0);
    expect(await prisma.task.count({ where: { userId } })).toBe(0);
  });

  it("keeps children added in step 1, but seeds no tasks", async () => {
    const userId = await makeUser();

    const result = await skipOnboarding(userId, [
      { name: "Mia", color: "#ef4444" },
      { name: "Theo", color: "#3b82f6" },
    ]);

    expect(result?.children.map((c) => c.name)).toEqual(["Mia", "Theo"]);
    expect(await prisma.child.count({ where: { userId } })).toBe(2);
    expect(await prisma.task.count({ where: { userId } })).toBe(0);
    expect(await hasOnboarded(userId)).toBe(true);
  });

  it("does nothing if already onboarded", async () => {
    const userId = await makeUser();
    await skipOnboarding(userId);
    expect(await skipOnboarding(userId)).toBeNull();
  });
});

describe("onboarding → starter week (S7)", () => {
  it("generateStarterWeek makes one Task per (subject, chosen day), honoring per-subject days", async () => {
    const userId = await makeUser();
    const mia = await createChild(userId, { name: "Mia", color: "#ef4444" });
    const theo = await createChild(userId, { name: "Theo", color: "#3b82f6" });

    const tasks = await generateStarterWeek(userId, {
      items: [
        {
          subject: "Bible reading",
          weekdays: [0, 1, 2, 3, 4], // Mon–Fri
          childIds: [mia.id, theo.id],
        },
        {
          subject: "Art & craft",
          weekdays: [1, 3], // Tue + Thu only
          childIds: [mia.id, theo.id],
        },
      ],
      weekStart: D("2026-06-08"), // a Monday
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
      items: [{ subject: "Reading", weekdays: [0, 1, 2, 3, 4], childIndexes: [] }],
    });

    expect(await hasOnboarded(userId)).toBe(true);
  });

  it("completeOnboarding resolves per-subject child assignment (empty = everyone)", async () => {
    const userId = await makeUser();

    const result = await completeOnboarding(userId, {
      children: [
        { name: "Mia", color: "#ef4444" }, // index 0
        { name: "Theo", color: "#3b82f6" }, // index 1
      ],
      items: [
        { subject: "Bible reading", weekdays: [0], childIndexes: [] }, // everyone
        { subject: "Piano", weekdays: [0], childIndexes: [1] }, // Theo only
      ],
    });

    const bible = result!.tasks.find((t) => t.title === "Bible reading");
    const piano = result!.tasks.find((t) => t.title === "Piano");

    expect(bible!.children.map((c) => c.name).sort()).toEqual(["Mia", "Theo"]);
    expect(piano!.children.map((c) => c.name)).toEqual(["Theo"]);
  });

  it("completeOnboarding seeds children + a filled current week, then stamps onboardedAt", async () => {
    const userId = await makeUser();

    const result = await completeOnboarding(userId, {
      children: [
        { name: "Mia", color: "#ef4444" },
        { name: "Theo", color: "#3b82f6" },
      ],
      items: [
        { subject: "Bible reading", weekdays: [0, 1, 2, 3, 4], childIndexes: [] }, // 5
        { subject: "Math", weekdays: [0, 2, 4], childIndexes: [] }, // 3
        { subject: "Nature walk", weekdays: [5], childIndexes: [] }, // 1 (Sat)
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
      items: [{ subject: "Reading", weekdays: [0, 1, 2, 3, 4], childIndexes: [] }],
    });

    // Simulate the parent clearing their Starter week.
    await prisma.task.deleteMany({ where: { userId } });

    const second = await completeOnboarding(userId, {
      children: [{ name: "Duplicate", color: "#22c55e" }],
      items: [{ subject: "Math", weekdays: [0, 1, 2, 3, 4], childIndexes: [] }],
    });

    expect(second).toBeNull();
    // No new children or tasks were created the second time.
    expect(await prisma.child.count({ where: { userId } })).toBe(1);
    expect(await prisma.task.count({ where: { userId } })).toBe(0);
  });
});
