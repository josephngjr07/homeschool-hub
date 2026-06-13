import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Dev helper: wipe one parent's plan back to brand-new for testing onboarding.
// Deletes their Tasks, Resources, and Children, and clears onboardedAt — but
// keeps the User + auth so you stay signed in. The next page load then runs
// onboarding again. Operates on whatever DATABASE_URL points at (the shared
// Neon DB in this project), so it's intentionally explicit: pass the email.
//
// Usage (local dev DB):  npm run reset:account -- you@example.com
// Usage (LIVE Neon DB):  npm run reset:prod   -- you@example.com
// (reset:prod loads .env.production.local first so it targets production —
//  double-check the email so you only ever reset your OWN account.)

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run reset:account -- <email>");
  process.exit(1);
}

const prisma = new PrismaClient();

const user = await prisma.user.findUnique({
  where: { email },
  select: { id: true },
});
if (!user) {
  console.error(`No user found for ${email}`);
  await prisma.$disconnect();
  process.exit(1);
}

const [tasks, resources, children] = await Promise.all([
  prisma.task.deleteMany({ where: { userId: user.id } }),
  prisma.resource.deleteMany({ where: { userId: user.id } }),
  prisma.child.deleteMany({ where: { userId: user.id } }),
]);
await prisma.user.update({
  where: { id: user.id },
  data: { onboardedAt: null },
});

console.log(
  `Reset ${email}: removed ${tasks.count} tasks, ${resources.count} resources, ${children.count} children; cleared onboardedAt.`,
);
console.log("Refresh the app — onboarding will run again.");

await prisma.$disconnect();
