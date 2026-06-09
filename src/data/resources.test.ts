import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, makeUser, prisma } from "@/test/db";
import { createChild } from "@/data/children";
import {
  createResource,
  listInbox,
  updateResource,
  deleteResource,
  planResource,
  hasContent,
} from "@/data/resources";

beforeEach(resetDb);

const D = (s: string) => new Date(s);

describe("inbox & resources data access (S6)", () => {
  it("forgiving capture: a bare URL with no title/note is valid", async () => {
    const userId = await makeUser();

    const r = await createResource(userId, {
      url: "https://youtu.be/abc",
    });

    expect(r).toMatchObject({ url: "https://youtu.be/abc", planned: false });
    expect(r.title).toBeNull();
    expect(r.note).toBeNull();
  });

  it("hasContent rejects an entirely empty capture", () => {
    expect(hasContent({})).toBe(false);
    expect(hasContent({ url: "  ", title: "", note: "" })).toBe(false);
    expect(hasContent({ note: "remember this" })).toBe(true);
  });

  it("listInbox returns only unplanned resources, newest first", async () => {
    const userId = await makeUser();
    const first = await createResource(userId, { title: "first" });
    // Force a later createdAt so ordering is deterministic.
    await prisma.resource.update({
      where: { id: first.id },
      data: { createdAt: D("2026-06-01T00:00:00Z") },
    });
    const second = await createResource(userId, { title: "second" });
    await prisma.resource.update({
      where: { id: second.id },
      data: { createdAt: D("2026-06-02T00:00:00Z") },
    });

    const inbox = await listInbox(userId);

    expect(inbox.map((r) => r.title)).toEqual(["second", "first"]);
  });

  it("updateResource and deleteResource are owner-scoped", async () => {
    const alice = await makeUser();
    const bob = await makeUser();
    const r = await createResource(alice, { title: "mine" });

    expect(await updateResource(bob, r.id, { title: "hacked" })).toBeNull();
    expect(await deleteResource(bob, r.id)).toBe(false);

    const updated = await updateResource(alice, r.id, { title: "tidied" });
    expect(updated).toMatchObject({ title: "tidied" });
    expect(await deleteResource(alice, r.id)).toBe(true);
  });

  it("planResource links the Task to the Resource and marks it planned", async () => {
    const userId = await makeUser();
    const kid = await createChild(userId, { name: "Mia", color: "#ef4444" });
    const resource = await createResource(userId, {
      url: "https://youtu.be/lesson",
      title: "Counting song",
    });

    const tasks = await planResource(userId, resource.id, {
      title: "Counting song",
      weekStart: D("2026-06-08"),
      weekdays: [0],
      childIds: [kid.id],
    });

    expect(tasks).toHaveLength(1);
    expect(tasks![0]).toMatchObject({ title: "Counting song" });
    expect(tasks![0].resourceId).toBe(resource.id);
    expect(tasks![0].children.map((c) => c.id)).toEqual([kid.id]);

    const after = await prisma.resource.findUnique({
      where: { id: resource.id },
    });
    expect(after?.planned).toBe(true);

    // Planned resources drain out of the Inbox.
    expect(await listInbox(userId)).toHaveLength(0);
  });

  it("planResource fans out one independent Task per weekday", async () => {
    const userId = await makeUser();
    const resource = await createResource(userId, { title: "Math drill" });

    const tasks = await planResource(userId, resource.id, {
      title: "Math drill",
      weekStart: D("2026-06-08"), // Monday
      weekdays: [0, 1, 2, 3, 4], // Mon–Fri
    });

    expect(tasks).toHaveLength(5);
    const dates = tasks!.map((t) => t.date.toISOString().slice(0, 10));
    expect(dates).toEqual([
      "2026-06-08",
      "2026-06-09",
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
    ]);
    // Independent rows: every Task carries the same backlink but is its own row.
    expect(new Set(tasks!.map((t) => t.id)).size).toBe(5);
    expect(tasks!.every((t) => t.resourceId === resource.id)).toBe(true);
  });

  it("planResource refuses a Resource that isn't the parent's", async () => {
    const alice = await makeUser();
    const bob = await makeUser();
    const r = await createResource(alice, { title: "alice's" });

    const result = await planResource(bob, r.id, {
      title: "stolen",
      weekStart: D("2026-06-08"),
      weekdays: [0],
    });

    expect(result).toBeNull();
    const after = await prisma.resource.findUnique({ where: { id: r.id } });
    expect(after?.planned).toBe(false);
  });

  it("deleting a planned Resource clears the Task's backlink but keeps the Task", async () => {
    const userId = await makeUser();
    const resource = await createResource(userId, { title: "temp" });
    const tasks = await planResource(userId, resource.id, {
      title: "temp",
      weekStart: D("2026-06-08"),
      weekdays: [0],
    });

    await deleteResource(userId, resource.id);

    const task = await prisma.task.findUnique({ where: { id: tasks![0].id } });
    expect(task).not.toBeNull();
    expect(task?.resourceId).toBeNull();
  });
});
