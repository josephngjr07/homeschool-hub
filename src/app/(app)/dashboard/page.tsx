import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { listChildren } from "@/data/children";
import { getTasksForDate } from "@/data/tasks";
import { todayInZone, formatLongDate } from "@/lib/date";

function greeting(): string {
  const hour = new Date().getUTCHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// The home dashboard after login — a calm overview that points into Today and
// Children. Snapshot only; the real work happens on each screen.
export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/");

  const today = todayInZone();
  const [children, tasks] = await Promise.all([
    listChildren(userId),
    getTasksForDate(userId, today),
  ]);
  const doneCount = tasks.filter((t) => t.completed).length;
  const firstName = session.user?.name?.split(" ")[0] ?? "there";

  return (
    <main className="px-5 py-8">
      <header>
        <p className="text-sm text-muted">{formatLongDate(today)}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          {greeting()}, {firstName}
        </h1>
      </header>

      <Link
        href="/today"
        className="mt-6 block rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:border-accent"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Today</h2>
          <span aria-hidden className="text-muted">
            →
          </span>
        </div>
        {tasks.length === 0 ? (
          <p className="mt-1 text-sm text-muted">
            Nothing planned yet — tap to plan your day.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            {doneCount > 0 ? (
              <span className="font-medium text-accent-strong">
                {" "}
                · ✓ {doneCount} done
              </span>
            ) : null}
          </p>
        )}
      </Link>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Children</h2>
          <Link
            href="/children"
            className="text-sm font-medium text-accent-strong hover:underline"
          >
            Manage
          </Link>
        </div>
        {children.length === 0 ? (
          <Link
            href="/children"
            className="mt-3 block rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted hover:border-accent"
          >
            Add your children to start planning →
          </Link>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {children.map((c) => (
              <li
                key={c.id}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {c.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        action={async () => {
          "use server";
          await signOut();
        }}
        className="mt-12"
      >
        <button
          type="submit"
          className="text-sm text-muted hover:text-foreground"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
