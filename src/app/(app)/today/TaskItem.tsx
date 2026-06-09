"use client";

import { useState } from "react";
import { formatTime } from "@/lib/date";
import {
  setTaskCompletedAction,
  updateTaskAction,
  deleteTaskAction,
} from "./actions";

type ChildOption = { id: string; name: string; color: string };

// One Task row on Today. Collapsed: tap the circle or the task text to
// check/strike it complete (no "overdue"/red state, ADR-0001); an explicit
// edit (✎) button sits on the right, just left of the assignee dots; an "Open
// link" footer shows when it has one. Expanded: an inline editor to rename,
// add notes/a link/a time, move to another day, reassign children, or delete.
export function TaskItem({
  id,
  title,
  description,
  url,
  linkUrl,
  time,
  date,
  completed,
  assignedTo,
  childOptions,
}: {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  linkUrl: string | null;
  time: string | null;
  date: string; // YYYY-MM-DD
  completed: boolean;
  assignedTo: ChildOption[];
  childOptions: ChildOption[];
}) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>(
    assignedTo.map((c) => c.id),
  );

  if (editing) {
    return (
      <form
        action={async (formData) => {
          selected.forEach((cid) => formData.append("childIds", cid));
          await updateTaskAction(formData);
          setEditing(false);
        }}
        className="space-y-2 rounded-2xl border border-border bg-card p-3 shadow-sm"
      >
        <input type="hidden" name="id" value={id} />
        <input
          name="title"
          defaultValue={title}
          required
          maxLength={120}
          className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
        />
        <input
          name="description"
          defaultValue={description ?? ""}
          maxLength={200}
          placeholder="Notes (optional)"
          className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted"
        />
        <input
          name="url"
          defaultValue={url ?? ""}
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
          <div className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={date}
              aria-label="Move to date"
              className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs text-muted"
            />
            <input
              type="time"
              name="time"
              defaultValue={time ?? ""}
              aria-label="Time (optional)"
              className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs text-muted"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
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

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-start gap-3 px-4 py-3">
        {/* The circle and the task text both toggle completion (one form). */}
        <form action={setTaskCompletedAction} className="contents">
          <input type="hidden" name="id" value={id} />
          <input
            type="hidden"
            name="completed"
            value={(!completed).toString()}
          />
          <button
            type="submit"
            aria-label={completed ? "Mark not done" : "Mark done"}
            aria-pressed={completed}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] transition ${
              completed
                ? "border-accent bg-accent text-accent-foreground"
                : "border-foreground/30 hover:border-accent"
            }`}
          >
            {completed ? "✓" : ""}
          </button>
          <button type="submit" className="min-w-0 flex-1 text-left">
            <span className="flex items-baseline gap-1.5">
              {time && (
                <span className="shrink-0 text-xs font-medium text-muted">
                  {formatTime(time)}
                </span>
              )}
              <span
                className={`truncate text-sm font-medium ${
                  completed ? "text-muted line-through" : "text-foreground"
                }`}
              >
                {title}
              </span>
            </span>
            {description ? (
              <span className="mt-0.5 block text-xs text-muted">
                {description}
              </span>
            ) : null}
          </button>
        </form>

        {/* Explicit edit, to the left of the assignee dots. */}
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit task"
          className="mt-0.5 shrink-0 text-muted hover:text-foreground"
        >
          ✎
        </button>

        {assignedTo.length > 0 ? (
          <span className="mt-1 flex shrink-0 -space-x-1">
            {assignedTo.map((c) => (
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

      {linkUrl ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-t border-border px-4 py-2 text-xs font-medium text-accent-strong hover:underline"
        >
          Open link ↗
        </a>
      ) : null}
    </div>
  );
}
