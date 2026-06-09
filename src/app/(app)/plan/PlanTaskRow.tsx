"use client";

import { useState } from "react";
import { updateTaskAction, deleteTaskAction, rescueTaskAction } from "./actions";

type ChildOption = { id: string; name: string; color: string };
type PlanTask = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  date: string; // YYYY-MM-DD
  completed: boolean;
  childIds: string[];
  childColors: string[];
};

// A task on the weekly plan. Collapsed: a compact row (with a "Rescue" action
// for past unfinished tasks — opt-in, ADR-0001). Expanded: an inline editor to
// rename, move to another day, reassign children, or delete.
export function PlanTaskRow({
  task,
  childOptions,
  isPast,
}: {
  task: PlanTask;
  childOptions: ChildOption[];
  isPast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(task.childIds);

  if (!open) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <span
          aria-hidden
          className={`h-2 w-2 shrink-0 rounded-full ${
            task.completed ? "bg-accent" : "border border-foreground/30"
          }`}
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-1 truncate text-left text-sm text-foreground"
        >
          <span className={task.completed ? "text-muted line-through" : ""}>
            {task.title}
          </span>
        </button>
        <span className="flex shrink-0 -space-x-1">
          {task.childColors.map((c, i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full ring-1 ring-card"
              style={{ backgroundColor: c }}
            />
          ))}
        </span>
        {task.url && (
          <a
            href={task.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open link"
            className="shrink-0 text-xs font-medium text-accent-strong hover:underline"
          >
            ↗
          </a>
        )}
        {isPast && !task.completed && (
          <form action={rescueTaskAction} className="shrink-0">
            <input type="hidden" name="id" value={task.id} />
            <button
              type="submit"
              title="Move this missed task to today"
              className="shrink-0 whitespace-nowrap rounded-full border border-accent/40 px-2 py-0.5 text-xs font-medium text-accent-strong hover:bg-accent/10"
            >
              Move to today
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        selected.forEach((id) => formData.append("childIds", id));
        await updateTaskAction(formData);
        setOpen(false);
      }}
      className="space-y-2 rounded-xl border border-border bg-card p-3"
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

      <div className="flex items-center justify-between gap-2">
        <input
          type="date"
          name="date"
          defaultValue={task.date}
          aria-label="Move to date"
          className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs text-muted"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
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

      {/* formAction overrides the form's action for this button; deleteTaskAction
          only reads the id. No nested <form> (which would be invalid HTML). */}
      <button
        type="submit"
        formAction={deleteTaskAction}
        className="text-xs text-red-700/70 hover:text-red-700"
      >
        Delete task
      </button>
    </form>
  );
}
