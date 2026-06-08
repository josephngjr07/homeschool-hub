import { execSync } from "node:child_process";
import { config } from "dotenv";

// Runs once before the whole suite: bring the throwaway test database's schema
// up to date by applying the committed migrations to it. We point BOTH Prisma
// urls at TEST_DATABASE_URL (local Postgres has no separate pooled/direct host)
// and hard-fail if it looks like a remote/Neon DB — tests must never run there.
export default function setup() {
  config();
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set");
  if (url.includes("neon.tech") || url.includes("-pooler")) {
    throw new Error("Refusing to run tests against a remote database");
  }
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}
