import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { listChildren } from "@/data/children";
import { getTasksForDate } from "@/data/tasks";
import {
  todayInZone,
  toDateInputValue,
  formatLongDate,
  nowMinutesInZone,
} from "@/lib/date";
import { AddTaskForm } from "./AddTaskForm";
import { ScheduleView } from "./ScheduleView";
import { TaskRow } from "@/components/TaskRow";
import {
  setTaskCompletedAction,
  updateTaskAction,
  deleteTaskAction,
} from "./actions";

// The Today view — the single calm "what are we doing today?" screen. Shows the
// whole family's Tasks for the current day, optionally filtered to one child
// via ?child=<id>. ?view=schedule swaps the list for an hourly grid (same
// tasks, arranged on the clock).
export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string; view?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/");

  const { child: childFilter, view } = await searchParams;
  const schedule = view === "schedule";
  const today = todayInZone();

  const [children, tasks] = await Promise.all([
    listChildren(userId),
    getTasksForDate(userId, today, childFilter),
  ]);

  const doneCount = tasks.filter((t) => t.completed).length;
  // Build a /today URL that keeps whichever of child/view we want set, so the
  // toggle and the child chips never clobber each other's query param.
  const todayHref = (opts: { child?: string; view?: string }) => {
    const qs = new URLSearchParams();
    if (opts.child) qs.set("child", opts.child);
    if (opts.view) qs.set("view", opts.view);
    const s = qs.toString();
    return s ? `/today?${s}` : "/today";
  };

  return (
    <main className="px-5 py-8">
      <header>
        <p className="text-sm text-muted">{formatLongDate(today)}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Today
        </h1>
      </header>

      {/* List ↔ Schedule. Same tasks, two ways to read the day. */}
      <nav className="mt-4 inline-flex rounded-full border border-border bg-card p-0.5 text-xs font-medium">
        <ViewTab
          href={todayHref({ child: childFilter })}
          active={!schedule}
          label="List"
        />
        <ViewTab
          href={todayHref({ child: childFilter, view: "schedule" })}
          active={schedule}
          label="Schedule"
        />
      </nav>

      {children.length > 0 && (
        <nav className="mt-3 flex flex-wrap gap-1.5">
          <FilterChip
            href={todayHref({ view: schedule ? "schedule" : undefined })}
            active={!childFilter}
            label="All"
          />
          {children.map((c) => (
            <FilterChip
              key={c.id}
              href={todayHref({
                child: c.id,
                view: schedule ? "schedule" : undefined,
              })}
              active={childFilter === c.id}
              label={c.name}
              color={c.color}
            />
          ))}
        </nav>
      )}

      {schedule ? (
        <section className="mt-5">
          {tasks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
              Nothing planned today yet. Add tasks below, then slot them in.
            </p>
          ) : (
            <ScheduleView
              nowMinutes={nowMinutesInZone()}
              tasks={tasks.map((t) => ({
                id: t.id,
                title: t.title,
                time: t.time,
                endTime: t.endTime,
                completed: t.completed,
                assignedTo: t.children,
              }))}
            />
          )}
        </section>
      ) : (
        <section className="mt-5 space-y-2">
          {tasks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
              Nothing planned today. Add something below.
            </p>
          ) : (
            tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={{
                  id: t.id,
                  title: t.title,
                  description: t.description,
                  url: t.url,
                  linkUrl: t.url ?? t.resource?.url ?? null,
                  time: t.time,
                  endTime: t.endTime,
                  date: toDateInputValue(t.date),
                  completed: t.completed,
                  assignedTo: t.children,
                }}
                childOptions={children}
                variant="today"
                actions={{
                  setCompleted: setTaskCompletedAction,
                  update: updateTaskAction,
                  remove: deleteTaskAction,
                }}
              />
            ))
          )}
        </section>
      )}

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

function ViewTab({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-1.5 transition ${
        active
          ? "bg-foreground text-background"
          : "text-muted hover:text-foreground"
      }`}
    >
      {label}
    </Link>
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
