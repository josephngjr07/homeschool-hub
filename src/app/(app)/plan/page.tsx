import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { listChildren } from "@/data/children";
import { getTasksInRange } from "@/data/tasks";
import {
  todayInZone,
  startOfWeek,
  addDays,
  weekDates,
  toDateInputValue,
  formatShortDate,
  isSameDay,
  isBefore,
} from "@/lib/date";
import { PlanAddForm } from "./PlanAddForm";
import { TaskRow } from "@/components/TaskRow";
import { ConfirmClearButton } from "@/components/ConfirmClearButton";
import {
  copyWeekAction,
  clearWeekAction,
  updateTaskAction,
  deleteTaskAction,
  setTaskCompletedAction,
  rescueTaskAction,
} from "./actions";

// The weekly plan — seven days, each with its tasks. Edit / move / delete /
// rescue happen inline per task; add-to-weekdays and copy-last-week sit on top.
export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/");

  const { start } = await searchParams;
  const today = todayInZone();
  const weekStart = start ? startOfWeek(new Date(start)) : startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const days = weekDates(weekStart);

  const [children, tasks] = await Promise.all([
    listChildren(userId),
    getTasksInRange(userId, weekStart, weekEnd),
  ]);

  const tasksByDay = new Map<string, typeof tasks>();
  for (const d of days) tasksByDay.set(toDateInputValue(d), []);
  for (const t of tasks) tasksByDay.get(toDateInputValue(t.date))?.push(t);

  const prevStart = toDateInputValue(addDays(weekStart, -7));
  const nextStart = toDateInputValue(addDays(weekStart, 7));
  const isThisWeek = isSameDay(weekStart, startOfWeek(today));

  return (
    <main className="px-5 py-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Plan</h1>

      <div className="mt-2 flex items-center justify-between text-sm">
        <Link
          href={`/plan?start=${prevStart}`}
          className="text-muted hover:text-foreground"
        >
          ← Prev
        </Link>
        <span className="text-muted">
          {formatShortDate(weekStart)} – {formatShortDate(weekEnd)}
        </span>
        <Link
          href={`/plan?start=${nextStart}`}
          className="text-muted hover:text-foreground"
        >
          Next →
        </Link>
      </div>
      {!isThisWeek && (
        <Link
          href="/plan"
          className="mt-1 block text-center text-xs text-accent-strong hover:underline"
        >
          Jump to this week
        </Link>
      )}

      <div className="mt-5">
        <PlanAddForm
          childOptions={children}
          weekStart={toDateInputValue(weekStart)}
        />
      </div>

      <form action={copyWeekAction} className="mt-3">
        <input
          type="hidden"
          name="toWeekStart"
          value={toDateInputValue(weekStart)}
        />
        <button
          type="submit"
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted hover:text-foreground"
        >
          ↻ Copy last week into this week
        </button>
      </form>

      {/* Reset: clear every task in the viewed week. */}
      {tasks.length > 0 && (
        <div className="mt-3 text-center">
          <ConfirmClearButton
            action={clearWeekAction}
            fields={{ weekStart: toDateInputValue(weekStart) }}
            label="Clear this week"
            count={tasks.length}
          />
        </div>
      )}

      <div className="mt-6 space-y-5">
        {days.map((d) => {
          const key = toDateInputValue(d);
          const dayTasks = tasksByDay.get(key) ?? [];
          const isToday = isSameDay(d, today);
          const isPast = isBefore(d, today);
          return (
            <section key={key}>
              <h2
                className={`text-sm font-semibold ${
                  isToday ? "text-accent-strong" : "text-foreground"
                }`}
              >
                {formatShortDate(d)}
                {isToday ? " · Today" : ""}
              </h2>
              <div className="mt-2 space-y-2">
                {dayTasks.length === 0 ? (
                  <p className="text-xs text-muted/60">—</p>
                ) : (
                  dayTasks.map((t) => (
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
                      variant="plan"
                      isPast={isPast}
                      actions={{
                        setCompleted: setTaskCompletedAction,
                        update: updateTaskAction,
                        remove: deleteTaskAction,
                        rescue: rescueTaskAction,
                      }}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
