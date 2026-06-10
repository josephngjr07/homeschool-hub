// Push committed migrations to the PRODUCTION (Neon) database.
//
// Day-to-day dev uses a local Postgres (see .env), so this is the one command
// that deliberately reaches out to Neon. Run it with:
//
//     npm run migrate:prod
//
// which loads the Neon credentials from .env.production.local (via Node's
// --env-file flag — see package.json) and then applies any unapplied
// migrations. `migrate deploy` only runs existing migration files; it never
// generates new ones or prompts, so it's safe to point at production.
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.error(
    "No DATABASE_URL — is .env.production.local present with the Neon URLs?",
  );
  process.exit(1);
}

const host = process.env.DATABASE_URL.match(/@([^/?]+)/)?.[1] ?? "?";
console.log(`Applying migrations to: ${host}`);
execSync("prisma migrate deploy", { stdio: "inherit" });
