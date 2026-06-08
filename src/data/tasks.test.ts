import { beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDb, makeUser } from "@/test/db";
import { createChild } from "@/data/children";
import { createTask, getTasksForDate, setTaskCompleted } from "@/data/tasks";

beforeEach(resetDb);

// Helper: YYYY-MM-DD -> a UTC-midnight Date, matching how @db.Date is stored.
const D = (s: string) => new Date(s);

describe("tasks data access", () => {
  it("creates a task with title, description, and date", async () => {
    const userId = await makeUser();

    const task = await createTask(userId, {
      title: "Read chapter 3",
      description: "aloud, on the couch",
      date: D("2026-06-08"),
    });

    expect(task).toMatchObject({
      title: "Read chapter 3",
      description: "aloud, on the couch",
      completed: false,
      userId,
    });
  });

  it("assigns one task to several children — one row, not duplicates", async () => {
    const userId = await makeUser();
    const mia = await createChild(userId, { name: "Mia", color: "#ef4444" });
    const theo = await createChild(userId, { name: "Theo", color: "#3b82f6" });

    const task = await createTask(userId, {
      title: "Nature walk",
      date: D("2026-06-08"),
      childIds: [mia.id, theo.id],
    });

    const rows = await prisma.task.findMany({ where: { userId } });
    expect(rows).toHaveLength(1);
    expect(task.children.map((c) => c.id).sort()).toEqual(
      [mia.id, theo.id].sort(),
    );
  });

  it("only links children the parent actually owns", async () => {
    const alice = await makeUser();
    const bob = await makeUser();
    const bobsKid = await createChild(bob, { name: "Theo", color: "#3b82f6" });

    const task = await createTask(alice, {
      title: "sneaky",
      date: D("2026-06-08"),
      childIds: [bobsKid.id],
    });

    expect(task.children).toHaveLength(0);
  });

  it("Today shows the family's tasks for that day only", async () => {
    const userId = await makeUser();
    await createTask(userId, { title: "today", date: D("2026-06-08") });
    await createTask(userId, { title: "tomorrow", date: D("2026-06-09") });

    const today = await getTasksForDate(userId, D("2026-06-08"));

    expect(today.map((t) => t.title)).toEqual(["today"]);
  });

  it("Today filtered to a child includes that child's solo and everyone tasks", async () => {
    const userId = await makeUser();
    const mia = await createChild(userId, { name: "Mia", color: "#ef4444" });
    const theo = await createChild(userId, { name: "Theo", color: "#3b82f6" });
    await createTask(userId, {
      title: "Mia solo",
      date: D("2026-06-08"),
      childIds: [mia.id],
    });
    await createTask(userId, {
      title: "Everyone",
      date: D("2026-06-08"),
      childIds: [mia.id, theo.id],
    });
    await createTask(userId, {
      title: "Theo solo",
      date: D("2026-06-08"),
      childIds: [theo.id],
    });

    const miaTasks = await getTasksForDate(userId, D("2026-06-08"), mia.id);

    expect(miaTasks.map((t) => t.title).sort()).toEqual(["Everyone", "Mia solo"]);
  });

  it("checks a task off and the completion persists", async () => {
    const userId = await makeUser();
    const task = await createTask(userId, {
      title: "Spelling",
      date: D("2026-06-08"),
    });

    const updated = await setTaskCompleted(userId, task.id, true);

    expect(updated?.completed).toBe(true);
    const [reloaded] = await getTasksForDate(userId, D("2026-06-08"));
    expect(reloaded.completed).toBe(true);
  });

  it("cannot toggle another parent's task", async () => {
    const alice = await makeUser();
    const bob = await makeUser();
    const task = await createTask(alice, {
      title: "Spelling",
      date: D("2026-06-08"),
    });

    const result = await setTaskCompleted(bob, task.id, true);

    expect(result).toBeNull();
  });

  it("unfinished past tasks silently stay on their day — no roll-forward (ADR-0001)", async () => {
    const userId = await makeUser();
    await createTask(userId, { title: "missed", date: D("2026-06-01") });

    const past = await getTasksForDate(userId, D("2026-06-01"));
    expect(past.map((t) => t.title)).toEqual(["missed"]);
    expect(past[0].completed).toBe(false);

    // It is NOT moved or copied to today.
    const today = await getTasksForDate(userId, D("2026-06-08"));
    expect(today).toHaveLength(0);
  });

  it("full loop: create a task, see it on Today, check it off", async () => {
    const userId = await makeUser();
    const mia = await createChild(userId, { name: "Mia", color: "#ef4444" });

    const created = await createTask(userId, {
      title: "Times tables",
      date: D("2026-06-08"),
      childIds: [mia.id],
    });

    const [onToday] = await getTasksForDate(userId, D("2026-06-08"));
    expect(onToday.id).toBe(created.id);
    expect(onToday.completed).toBe(false);

    await setTaskCompleted(userId, created.id, true);
    const [afterCheck] = await getTasksForDate(userId, D("2026-06-08"));
    expect(afterCheck.completed).toBe(true);
  });
});
