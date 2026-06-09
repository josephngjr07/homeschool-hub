"use client";

import { useState } from "react";
import {
  updateResourceAction,
  deleteResourceAction,
  planResourceAction,
} from "./actions";

type ChildOption = { id: string; name: string; color: string };
type Resource = {
  id: string;
  url: string | null;
  title: string | null;
  note: string | null;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// One Inbox Resource. Three modes: view (the captured idea, with Plan / Edit),
// plan (choose day(s) + who, turning it into Task rows), and edit (fix the
// captured fields, or delete). Planning drains it out of the Inbox.
export function ResourceRow({
  resource,
  childOptions,
  weekStart,
}: {
  resource: Resource;
  childOptions: ChildOption[];
  weekStart: string;
}) {
  const allIds = childOptions.map((c) => c.id);
  const [mode, setMode] = useState<"view" | "plan" | "edit">("view");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [selected, setSelected] = useState<string[]>(allIds);

  const heading = resource.title || resource.url || "Untitled";

  const toggleDay = (i: number) =>
    setWeekdays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  const toggleChild = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  if (mode === "edit") {
    return (
      <form
        action={async (formData) => {
          await updateResourceAction(formData);
          setMode("view");
        }}
        className="space-y-2 rounded-2xl border border-border bg-card p-4"
      >
        <input type="hidden" name="id" value={resource.id} />
        <input
          name="title"
          defaultValue={resource.title ?? ""}
          maxLength={120}
          placeholder="Title (optional)"
          className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted"
        />
        <input
          name="url"
          defaultValue={resource.url ?? ""}
          maxLength={2000}
          placeholder="Link (optional)"
          className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted"
        />
        <input
          name="note"
          defaultValue={resource.note ?? ""}
          maxLength={300}
          placeholder="Note (optional)"
          className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted"
        />
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="submit"
            formAction={deleteResourceAction}
            className="text-xs text-red-700/70 hover:text-red-700"
          >
            Delete
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMode("view")}
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

  if (mode === "plan") {
    return (
      <form
        action={async (formData) => {
          weekdays.forEach((d) => formData.append("weekdays", String(d)));
          (selected.length ? selected : allIds).forEach((id) =>
            formData.append("childIds", id),
          );
          await planResourceAction(formData);
          // On success the resource drains out of the Inbox and this row
          // unmounts; resetting state is just tidiness if it lingers.
          setMode("view");
        }}
        className="space-y-3 rounded-2xl border border-border bg-card p-4"
      >
        <input type="hidden" name="id" value={resource.id} />
        <input type="hidden" name="weekStart" value={weekStart} />
        <input
          name="title"
          defaultValue={heading}
          required
          maxLength={120}
          className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
        />
        <input
          type="time"
          name="time"
          aria-label="Time (optional)"
          className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs text-muted"
        />

        <div className="flex flex-wrap gap-1.5">
          {DAY_LABELS.map((label, i) => {
            const on = weekdays.includes(i);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(i)}
                aria-pressed={on}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  on
                    ? "bg-foreground text-background"
                    : "border border-border text-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {childOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {childOptions.map((c) => {
              const on = selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleChild(c.id)}
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

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setMode("view")}
            className="text-xs text-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={weekdays.length === 0}
            className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-40"
          >
            Add to plan
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-sm font-medium text-foreground">{heading}</p>
      {resource.note ? (
        <p className="mt-0.5 text-xs text-muted">{resource.note}</p>
      ) : null}
      <div className="mt-2 flex items-center gap-4 text-xs">
        {resource.url ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent-strong hover:underline"
          >
            Open ↗
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => setMode("plan")}
          className="font-medium text-accent-strong hover:underline"
        >
          Plan it
        </button>
        <button
          type="button"
          onClick={() => setMode("edit")}
          className="text-muted hover:text-foreground"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
