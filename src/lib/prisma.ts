import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across hot-reloads in development. Without this,
// Next.js's dev hot-reload would create a new client (and a new DB connection
// pool) on every change, quickly exhausting the database's connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
