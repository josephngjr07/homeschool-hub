import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across hot-reloads in development. Without this,
// Next.js's dev hot-reload would create a new client (and a new DB connection
// pool) on every change, quickly exhausting the database's connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Under Vitest, talk to the local throwaway test database instead of Neon, so
// integration tests can freely create/wipe rows without ever touching real
// (dev/prod) data. Everywhere else this is just the default DATABASE_URL.
const datasourceUrl = process.env.VITEST
  ? process.env.TEST_DATABASE_URL
  : undefined;

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
