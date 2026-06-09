import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, makeUser } from "@/test/db";
import { createChild } from "@/data/children";
import {
  createTask,
  getTasksInRange,
  updateTask,
  deleteTask,
} from "@/data/tasks";

beforeEach(resetDb);

const D = (s: string) => new Date(s);

describe("weekly plan data access (S4)", () => {
  it("getTasksInRange returns tasks within [start, end], date-ordered", async () => {
    const userId = await makeUser();
    await createTask(userId, { title: "before", date: D("2026-06-07") });
    await createTask(userId, { title: "mon", date: D("2026-06-08") });
    await createTask(userId, { title: "wed", date: D("2026-06-10") });
    await createTask(userId, { title: "after", date: D("2026-06-15") });

    const week = await getTasksInRange(userId, D("2026-06-08"), D("2026-06-14"));

    expect(week.map((t) => t.title)).toEqual(["mon", "wed"]);
  });

  it("getTasksInRange can filter to one child", async () => {
    const userId = await makeUser();
    const mia = await createChild(userId, { name: "Mia", color: "#ef4444" });
    const theo = await createChild(userId, { name: "Theo", color: "#3b82f6" });
    await createTask(userId, {
      title: "mia",
      date: D("2026-06-09"),
      childIds: [mia.id],
    });
    await createTask(userId, {
      title: "theo",
      date: D("2026-06-09"),
      childIds: [theo.id],
    });

    const miaWeek = await getTasksInRange(
      userId,
      D("2026-06-08"),
      D("2026-06-14"),
      mia.id,
    );

    expect(miaWeek.map((t) => t.title)).toEqual(["mia"]);
  });

  it("updateTask edits title and description", async () => {
    const userId = await makeUser();
    const task = await createTask(userId, { title: "old", date: D("2026-06-09") });

    const updated = await updateTask(userId, task.id, {
      title: "new",
      description: "with notes",
    });

    expect(updated).toMatchObject({ title: "new", description: "with notes" });
  });

  it("updateTask moves a task to another day", async () => {
    const userId = await makeUser();
    const task = await createTask(userId, { title: "x", date: D("2026-06-09") });

    const moved = await updateTask(userId, task.id, { date: D("2026-06-11") });

    expect(moved?.date.toISOString().slice(0, 10)).toBe("2026-06-11");
  });

  it("updateTask reassigns children, only ones the parent owns", async () => {
    const alice = await makeUser();
    const bob = await makeUser();
    const mia = await createChild(alice, { name: "Mia", color: "#ef4444" });
    const bobsKid = await createChild(bob, { name: "T", color: "#3b82f6" });
    const task = await createTask(alice, { title: "x", date: D("2026-06-09") });

    const updated = await updateTask(alice, task.id, {
      childIds: [mia.id, bobsKid.id],
    });

    expect(updated?.children.map((c) => c.id)).toEqual([mia.id]);
  });

  it("rescue: moving an unfinished past task to today keeps it unfinished", async () => {
    const userId = await makeUser();
    const missed = await createTask(userId, {
      title: "missed",
      date: D("2026-06-01"),
    });

    const rescued = await updateTask(userId, missed.id, { date: D("2026-06-09") });

    expect(rescued?.date.toISOString().slice(0, 10)).toBe("2026-06-09");
    expect(rescued?.completed).toBe(false);
  });

  it("cannot update or delete another parent's task", async () => {
    const alice = await makeUser();
    const bob = await makeUser();
    const task = await createTask(alice, { title: "x", date: D("2026-06-09") });

    expect(await updateTask(bob, task.id, { title: "hacked" })).toBeNull();
    expect(await deleteTask(bob, task.id)).toBe(false);
    expect(await deleteTask(alice, task.id)).toBe(true);
  });
});
