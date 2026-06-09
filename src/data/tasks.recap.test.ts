import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, makeUser } from "@/test/db";
import { createTask, setTaskCompleted, countCompletedInRange } from "@/data/tasks";

beforeEach(resetDb);

const D = (s: string) => new Date(s);

// The week under test: Mon 2026-06-08 … Sun 2026-06-14.
const WEEK_START = D("2026-06-08");
const WEEK_END = D("2026-06-14");

describe("weekly recap data access (S8)", () => {
  it("counts only completed tasks in the week, ignoring incompletes", async () => {
    const userId = await makeUser();

    const a = await createTask(userId, { title: "done-mon", date: D("2026-06-08") });
    const b = await createTask(userId, { title: "done-wed", date: D("2026-06-10") });
    await createTask(userId, { title: "missed-tue", date: D("2026-06-09") });
    await createTask(userId, { title: "missed-fri", date: D("2026-06-12") });

    await setTaskCompleted(userId, a.id, true);
    await setTaskCompleted(userId, b.id, true);

    // Two completed, two left undone — the recap only ever sees the wins.
    expect(await countCompletedInRange(userId, WEEK_START, WEEK_END)).toBe(2);
  });

  it("ignores completed tasks outside the week", async () => {
    const userId = await makeUser();

    const lastWeek = await createTask(userId, {
      title: "last-week",
      date: D("2026-06-01"),
    });
    const thisWeek = await createTask(userId, {
      title: "this-week",
      date: D("2026-06-09"),
    });
    await setTaskCompleted(userId, lastWeek.id, true);
    await setTaskCompleted(userId, thisWeek.id, true);

    expect(await countCompletedInRange(userId, WEEK_START, WEEK_END)).toBe(1);
  });

  it("is owner-scoped: another parent's completions don't count", async () => {
    const alice = await makeUser();
    const bob = await makeUser();

    const bobsTask = await createTask(bob, { title: "bob", date: D("2026-06-09") });
    await setTaskCompleted(bob, bobsTask.id, true);

    expect(await countCompletedInRange(alice, WEEK_START, WEEK_END)).toBe(0);
  });

  it("an all-unfinished week recaps as zero, never a negative or guilt signal", async () => {
    const userId = await makeUser();
    await createTask(userId, { title: "a", date: D("2026-06-08") });
    await createTask(userId, { title: "b", date: D("2026-06-09") });

    expect(await countCompletedInRange(userId, WEEK_START, WEEK_END)).toBe(0);
  });
});
