import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserId } from "@/lib/session";
import { listChildren } from "@/data/children";
import { getTasksForDate } from "@/data/tasks";
import { todayUTC, toDateInputValue, formatLongDate } from "@/lib/date";
import { AddTaskForm } from "./AddTaskForm";
import { TaskItem } from "./TaskItem";

// The Today view — the single calm "what are we doing today?" screen. Shows the
// whole family's Tasks for the current day, optionally filtered to one child
// via ?child=<id>.
export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/");

  const { child: childFilter } = await searchParams;
  const today = todayUTC();

  const [children, tasks] = await Promise.all([
    listChildren(userId),
    getTasksForDate(userId, today, childFilter),
  ]);

  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <main className="mx-auto w-full max-w-md px-5 py-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-black/40 hover:text-black/70">
          ← Home
        </Link>
        <Link
          href="/children"
          className="text-sm text-black/40 hover:text-black/70"
        >
          Children
        </Link>
      </div>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="text-sm text-black/50">{formatLongDate(today)}</p>
      </header>

      {children.length > 0 && (
        <nav className="mt-4 flex flex-wrap gap-1.5">
          <FilterChip href="/today" active={!childFilter} label="All" />
          {children.map((c) => (
            <FilterChip
              key={c.id}
              href={`/today?child=${c.id}`}
              active={childFilter === c.id}
              label={c.name}
              color={c.color}
            />
          ))}
        </nav>
      )}

      <section className="mt-5 space-y-2">
        {tasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-black/40">
            Nothing planned today. Add something below.
          </p>
        ) : (
          tasks.map((t) => (
            <TaskItem
              key={t.id}
              id={t.id}
              title={t.title}
              description={t.description}
              completed={t.completed}
              assignedTo={t.children}
            />
          ))
        )}
      </section>

      {/* Win-only positive feedback (ADR-0001): celebrate what's done, never
          highlight what's missed. */}
      {doneCount > 0 && (
        <p className="mt-3 text-center text-xs font-medium text-emerald-600">
          ✓ {doneCount} done today
        </p>
      )}

      <div className="mt-6">
        <AddTaskForm childOptions={children} today={toDateInputValue(today)} />
      </div>
    </main>
  );
}

function FilterChip({
  href,
  active,
  label,
  color,
}: {
  href: string;
  active: boolean;
  label: string;
  color?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? "bg-black text-white"
          : "bg-black/5 text-black/60 hover:bg-black/10"
      }`}
    >
      {color ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : null}
      {label}
    </Link>
  );
}
