import { beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDb, makeUser } from "@/test/db";
import {
  createChild,
  listChildren,
  updateChild,
  deleteChild,
} from "@/data/children";

beforeEach(resetDb);

describe("children data access", () => {
  it("creates a child with a name and color, owned by the user", async () => {
    const userId = await makeUser();

    const child = await createChild(userId, { name: "Mia", color: "#ef4444" });

    expect(child).toMatchObject({ name: "Mia", color: "#ef4444", userId });
    const list = await listChildren(userId);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(child.id);
  });

  it("only lists the owner's children", async () => {
    const alice = await makeUser();
    const bob = await makeUser();
    await createChild(alice, { name: "Mia", color: "#ef4444" });
    await createChild(bob, { name: "Theo", color: "#3b82f6" });

    const aliceChildren = await listChildren(alice);
    expect(aliceChildren).toHaveLength(1);
    expect(aliceChildren[0].name).toBe("Mia");
  });

  it("edits a child's name and color", async () => {
    const userId = await makeUser();
    const child = await createChild(userId, { name: "Mia", color: "#ef4444" });

    const updated = await updateChild(userId, child.id, {
      name: "Mia Rose",
      color: "#10b981",
    });

    expect(updated).toMatchObject({ name: "Mia Rose", color: "#10b981" });
  });

  it("cannot edit another user's child", async () => {
    const alice = await makeUser();
    const bob = await makeUser();
    const child = await createChild(alice, { name: "Mia", color: "#ef4444" });

    const result = await updateChild(bob, child.id, { name: "Hacked" });

    expect(result).toBeNull();
    const [unchanged] = await listChildren(alice);
    expect(unchanged.name).toBe("Mia");
  });

  it("deletes a child", async () => {
    const userId = await makeUser();
    const child = await createChild(userId, { name: "Mia", color: "#ef4444" });

    const ok = await deleteChild(userId, child.id);

    expect(ok).toBe(true);
    expect(await listChildren(userId)).toHaveLength(0);
  });

  it("cannot delete another user's child", async () => {
    const alice = await makeUser();
    const bob = await makeUser();
    const child = await createChild(alice, { name: "Mia", color: "#ef4444" });

    const ok = await deleteChild(bob, child.id);

    expect(ok).toBe(false);
    expect(await prisma.child.findUnique({ where: { id: child.id } })).not.toBeNull();
  });
});
