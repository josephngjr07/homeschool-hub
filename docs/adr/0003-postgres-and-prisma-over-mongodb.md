# PostgreSQL + Prisma over MongoDB + Mongoose

**Context.** The original plan called for MongoDB + Mongoose. But the data is
relational: a Task belongs to many Children (many-to-many), "copy last week" is a
date-range query, and Today filters/joins tasks to children. MongoDB is built for
self-contained documents, so this data would mean hand-rolling joins it does not
do natively. The builder also wants industry-standard, transferable skills and
already has some PostgreSQL familiarity.

**Decision.** Use **PostgreSQL** (hosted on Neon or Supabase) with **Prisma** as
the ORM. Prisma gives type-safe, end-to-end models that chain with TypeScript and
Auth.js (first-class Prisma adapter).

**Why it's recorded.** This reverses the documented database choice, and the
data layer is expensive to swap once models, queries, and the auth adapter depend
on it. Postgres fits the relational shape, SQL is the more transferable skill,
and Prisma keeps a one-week build feasible without deep SQL up front (it can
still emit raw SQL for learning later). MySQL was considered and rejected only
because the builder already knows some Postgres and the ecosystem (Vercel/Neon/
Supabase) is Postgres-first — functionally either would work.
