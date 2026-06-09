import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { listChildren } from "@/data/children";
import { getTasksForDate } from "@/data/tasks";
import { todayInZone, toDateInputValue, formatLongDate } from "@/lib/date";
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
  const today = todayInZone();

  const [children, tasks] = await Promise.all([
    listChildren(userId),
    getTasksForDate(userId, today, childFilter),
  ]);

  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <main className="px-5 py-8">
      <header>
        <p className="text-sm text-muted">{formatLongDate(today)}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Today
        </h1>
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
          <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
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
              linkUrl={t.url ?? t.resource?.url ?? null}
            />
          ))
        )}
      </section>

      {/* Win-only positive feedback (ADR-0001): celebrate what's done, never
          highlight what's missed. */}
      {doneCount > 0 && (
        <p className="mt-3 text-center text-xs font-medium text-accent-strong">
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
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-foreground text-background"
          : "border border-border bg-card text-muted hover:text-foreground"
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
