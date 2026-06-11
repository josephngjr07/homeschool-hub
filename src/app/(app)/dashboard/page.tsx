import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { listChildren } from "@/data/children";
import { getTasksForDate, countCompletedInRange } from "@/data/tasks";
import { getMission } from "@/data/profile";
import {
  todayInZone,
  formatLongDate,
  startOfWeek,
  addDays,
} from "@/lib/date";
import { encouragementForWeek } from "@/lib/encouragement";
import { MissionCard } from "./MissionCard";

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
  const weekStart = startOfWeek(today);
  const [children, tasks, weekWins, mission] = await Promise.all([
    listChildren(userId),
    getTasksForDate(userId, today),
    countCompletedInRange(userId, weekStart, addDays(weekStart, 6)),
    getMission(userId),
  ]);
  const doneCount = tasks.filter((t) => t.completed).length;
  const firstName = session.user?.name?.split(" ")[0] ?? "there";
  // Fri/Sat/Sun: nudge the week's wrap-up a little more warmly (UTC-midnight
  // day, so getUTCDay is the family's local weekday). 0=Sun, 5=Fri, 6=Sat.
  const dow = today.getUTCDay();
  const weekClosing = dow === 5 || dow === 6 || dow === 0;

  return (
    <main className="px-5 py-8">
      <header>
        <p className="text-sm text-muted">{formatLongDate(today)}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          {greeting()}, {firstName}
        </h1>
      </header>

      {/* The parent's "why" (or a gentle encouragement until she writes one). */}
      <MissionCard
        mission={mission}
        encouragement={encouragementForWeek(weekStart)}
      />

      {/* Weekly recap entry — win-only (ADR-0001). Shows only when there's
          something to celebrate; a quiet week is never scored, shamed, or shown
          as 0. Leads into the full recap; warms up as the week closes. */}
      {weekWins > 0 && (
        <Link
          href="/recap"
          className="mt-6 block rounded-3xl border border-accent/30 bg-accent/10 px-5 py-4 transition hover:border-accent"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">
              {weekClosing ? "🎉 " : ""}You did{" "}
              <span className="font-semibold text-accent-strong">
                {weekWins} {weekWins === 1 ? "thing" : "things"}
              </span>{" "}
              with the kids this week 💛
            </p>
            <span aria-hidden className="text-accent-strong">
              →
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {weekClosing ? "See your week's recap" : "See the recap so far"}
          </p>
        </Link>
      )}

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
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-background active:scale-[0.99]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Sign out
        </button>
      </form>
    </main>
  );
}
