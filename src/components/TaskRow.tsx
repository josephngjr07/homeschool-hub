"use client";

import { useState } from "react";
import { formatTime, formatShortDate } from "@/lib/date";
import { TimeRangeInputs } from "@/components/TimeRangeInputs";

export type ChildOption = { id: string; name: string; color: string };

export type TaskRowData = {
  id: string;
  title: string;
  description: string | null;
  url: string | null; // the task's own link (editable here)
  linkUrl: string | null; // url ?? resource.url — what "Open link" points at
  time: string | null; // "HH:MM" start, null = Anytime
  endTime: string | null; // "HH:MM" end, only meaningful with a start
  date: string; // YYYY-MM-DD
  completed: boolean;
  assignedTo: ChildOption[];
};

// The Today and Plan actions live in different files (different revalidation),
// so the page passes its own in. `rescue` is Plan-only.
export type TaskRowActions = {
  setCompleted: (formData: FormData) => Promise<void>;
  update: (formData: FormData) => Promise<void>;
  remove: (formData: FormData) => Promise<void>;
  rescue?: (formData: FormData) => Promise<void>;
};

// The single Task row used by both Today and Plan. Three states:
//   • collapsed — circle + time-start + title (Today also shows notes)
//   • expanded  — read-only: adds start→end, notes, link (Plan also adds date)
//   • edit      — the inline editor (✎), the only place with a Save button
// Tapping the task body toggles collapsed⇄expanded; only the circle completes
// (ADR-0001: no overdue, no pressure). Today vs Plan differ only by whether
// notes show collapsed and whether the date shows when expanded.
export function TaskRow({
  task,
  childOptions,
  variant,
  isPast = false,
  actions,
}: {
  task: TaskRowData;
  childOptions: ChildOption[];
  variant: "today" | "plan";
  isPast?: boolean;
  actions: TaskRowActions;
}) {
  const [mode, setMode] = useState<"collapsed" | "expanded" | "edit">(
    "collapsed",
  );
  const [selected, setSelected] = useState<string[]>(
    task.assignedTo.map((c) => c.id),
  );

  if (mode === "edit") {
    return (
      <form
        action={async (formData) => {
          selected.forEach((cid) => formData.append("childIds", cid));
          await actions.update(formData);
          setMode("collapsed");
        }}
        className="space-y-2 rounded-2xl border border-border bg-card p-3 shadow-sm"
      >
        <input type="hidden" name="id" value={task.id} />
        <input
          name="title"
          defaultValue={task.title}
          required
          maxLength={120}
          className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
        />
        <input
          name="description"
          defaultValue={task.description ?? ""}
          maxLength={200}
          placeholder="Notes (optional)"
          className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted"
        />
        <input
          name="url"
          defaultValue={task.url ?? ""}
          inputMode="url"
          maxLength={2000}
          placeholder="Link (optional)"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted"
        />

        {childOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {childOptions.map((c) => {
              const on = selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setSelected((s) =>
                      s.includes(c.id)
                        ? s.filter((x) => x !== c.id)
                        : [...s, c.id],
                    )
                  }
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition ${
                    on ? "text-white" : "border border-border text-muted"
                  }`}
                  style={on ? { backgroundColor: c.color } : undefined}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: on ? "white" : c.color }}
                  />
                  {c.name}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={task.date}
            aria-label="Move to date"
            className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs text-muted"
          />
          {/* Uncontrolled (defaultValue) so the native time picker isn't fought
              mid-keystroke; picking a start defaults the end to +1h. */}
          <TimeRangeInputs
            defaultStart={task.time ?? ""}
            defaultEnd={task.endTime ?? ""}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* formAction overrides the form's action for this button; remove only
              reads the id. No nested <form> (which would be invalid HTML). */}
          <button
            type="submit"
            formAction={actions.remove}
            className="text-xs text-red-700/70 hover:text-red-700"
          >
            Delete task
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMode("collapsed")}
              className="text-xs text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    );
  }

  const expanded = mode === "expanded";
  const showNotes = (variant === "today" || expanded) && task.description;
  const timeLabel =
    expanded && task.time && task.endTime
      ? `${formatTime(task.time)}–${formatTime(task.endTime)}`
      : formatTime(task.time);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-start gap-3 px-4 py-3">
        {/* The circle is the ONLY way to complete (tapping the body expands). */}
        <form action={actions.setCompleted} className="contents">
          <input type="hidden" name="id" value={task.id} />
          <input
            type="hidden"
            name="completed"
            value={(!task.completed).toString()}
          />
          <button
            type="submit"
            aria-label={task.completed ? "Mark not done" : "Mark done"}
            aria-pressed={task.completed}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] transition ${
              task.completed
                ? "border-accent bg-accent text-accent-foreground"
                : "border-foreground/30 hover:border-accent"
            }`}
          >
            {task.completed ? "✓" : ""}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(expanded ? "collapsed" : "expanded")}
          aria-expanded={expanded}
          className="min-w-0 flex-1 text-left"
        >
          <span className="flex items-baseline gap-1.5">
            {timeLabel && (
              <span className="shrink-0 text-xs font-medium text-muted">
                {timeLabel}
              </span>
            )}
            <span
              className={`truncate text-sm font-medium ${
                task.completed ? "text-muted line-through" : "text-foreground"
              }`}
            >
              {task.title}
            </span>
          </span>
          {showNotes ? (
            <span className="mt-0.5 block text-xs text-muted">
              {task.description}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setMode("edit")}
          aria-label="Edit task"
          className="mt-0.5 shrink-0 text-muted hover:text-foreground"
        >
          ✎
        </button>

        {task.assignedTo.length > 0 ? (
          <span className="mt-1 flex shrink-0 -space-x-1">
            {task.assignedTo.map((c) => (
              <span
                key={c.id}
                className="h-2.5 w-2.5 rounded-full ring-2 ring-card"
                style={{ backgroundColor: c.color }}
                title={c.name}
              />
            ))}
          </span>
        ) : null}
      </div>

      {/* Expanded detail: link, and (Plan only) the date — start→end already
          rides in the time chip above. */}
      {expanded && (task.linkUrl || variant === "plan") ? (
        <div className="space-y-1 border-t border-border px-4 py-2 text-xs">
          {variant === "plan" ? (
            <p className="text-muted">{formatShortDate(new Date(task.date))}</p>
          ) : null}
          {task.linkUrl ? (
            <a
              href={task.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-medium text-accent-strong hover:underline"
            >
              Open link ↗
            </a>
          ) : null}
        </div>
      ) : null}

      {/* Plan-only opt-in rescue for a past, unfinished task (ADR-0001). */}
      {variant === "plan" && isPast && !task.completed && actions.rescue ? (
        <form action={actions.rescue} className="border-t border-border px-4 py-2">
          <input type="hidden" name="id" value={task.id} />
          <button
            type="submit"
            title="Move this missed task to today"
            className="rounded-full border border-accent/40 px-2 py-0.5 text-xs font-medium text-accent-strong hover:bg-accent/10"
          >
            Move to today
          </button>
        </form>
      ) : null}
    </div>
  );
}
