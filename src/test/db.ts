import { prisma } from "@/lib/prisma";

// Shared helpers for integration tests. `prisma` here is already pointed at the
// local test database (see src/lib/prisma.ts: it honours VITEST).

// Wipe every table between tests so each starts from a clean slate. CASCADE
// also clears the implicit Child<->Task join table. RESTART IDENTITY is a
// no-op for cuid ids but keeps any future serial columns tidy.
export async function resetDb() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "Task", "Child", "Session", "Account", "VerificationToken", "User" RESTART IDENTITY CASCADE;`,
  );
}

// Most domain rows require an owning User. Create one and return its id.
export async function makeUser(email = `u${Math.random().toString(36).slice(2)}@test.dev`) {
  const user = await prisma.user.create({ data: { email } });
  return user.id;
}

export { prisma };
