import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, makeUser } from "@/test/db";
import { createChild } from "@/data/children";
import {
  createTask,
  getTasksInRange,
  createTasksForWeekdays,
  copyWeek,
} from "@/data/tasks";

beforeEach(resetDb);

const D = (s: string) => new Date(s);
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const MON = D("2026-06-08"); // a Monday

describe("recurrence data access (S5)", () => {
  it("createTasksForWeekdays makes one independent Task per selected weekday", async () => {
    const userId = await makeUser();
    const mia = await createChild(userId, { name: "Mia", color: "#ef4444" });

    // weekdays index: 0=Mon … 6=Sun. Pick Mon, Wed, Fri.
    const tasks = await createTasksForWeekdays(userId, {
      title: "Spelling",
      weekStart: MON,
      weekdays: [0, 2, 4],
      childIds: [mia.id],
    });

    expect(tasks).toHaveLength(3);
    const week = await getTasksInRange(userId, MON, D("2026-06-14"));
    expect(week.map((t) => ymd(t.date))).toEqual([
      "2026-06-08",
      "2026-06-10",
      "2026-06-12",
    ]);
    // Independent rows, each carrying the assignment.
    expect(week.every((t) => t.title === "Spelling")).toBe(true);
    expect(week.every((t) => t.children[0]?.id === mia.id)).toBe(true);
  });

  it("copyWeek duplicates last week's tasks into this week, reset to unfinished", async () => {
    const userId = await makeUser();
    const mia = await createChild(userId, { name: "Mia", color: "#ef4444" });
    const lastMon = D("2026-06-01");
    const done = await createTask(userId, {
      title: "Reading",
      date: lastMon, // Monday last week
      childIds: [mia.id],
    });
    await createTask(userId, { title: "Walk", date: D("2026-06-03") }); // Wed
    // mark one complete to prove copies come back unfinished
    const { setTaskCompleted } = await import("@/data/tasks");
    await setTaskCompleted(userId, done.id, true);

    const count = await copyWeek(userId, lastMon, MON);

    expect(count).toBe(2);
    const thisWeek = await getTasksInRange(userId, MON, D("2026-06-14"));
    expect(thisWeek.map((t) => `${t.title}@${ymd(t.date)}`)).toEqual([
      "Reading@2026-06-08", // same weekday (Mon), shifted +7 days
      "Walk@2026-06-10", // Wed
    ]);
    expect(thisWeek.every((t) => t.completed === false)).toBe(true);
    expect(thisWeek[0].children[0]?.id).toBe(mia.id); // assignment preserved
  });
});
