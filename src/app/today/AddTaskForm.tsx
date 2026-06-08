"use client";

import { useRef, useState } from "react";
import { createTaskAction } from "./actions";

type ChildOption = { id: string; name: string; color: string };

// Add-a-task form. Assignment starts as "everyone" (all children selected);
// the parent can narrow it to specific kids. Empty selection is treated as
// everyone so a task is never accidentally assigned to nobody.
export function AddTaskForm({
  childOptions,
  today,
}: {
  childOptions: ChildOption[];
  today: string;
}) {
  const allIds = childOptions.map((c) => c.id);
  const [selected, setSelected] = useState<string[]>(allIds);
  const formRef = useRef<HTMLFormElement>(null);

  const everyone =
    childOptions.length > 0 && selected.length === childOptions.length;

  function toggle(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        const ids = selected.length ? selected : allIds;
        ids.forEach((id) => formData.append("childIds", id));
        await createTaskAction(formData);
        formRef.current?.reset();
        setSelected(allIds);
      }}
      className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
    >
      <input
        name="title"
        required
        maxLength={120}
        placeholder="Add a task…"
        className="w-full text-sm outline-none placeholder:text-black/40"
      />
      <input
        name="description"
        maxLength={200}
        placeholder="Notes (optional)"
        className="mt-2 w-full text-xs outline-none placeholder:text-black/30"
      />

      {childOptions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelected(allIds)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              everyone ? "bg-black text-white" : "bg-black/5 text-black/60"
            }`}
          >
            Everyone
          </button>
          {childOptions.map((c) => {
            const on = selected.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  on ? "text-white" : "bg-black/5 text-black/60"
                }`}
                style={on ? { backgroundColor: c.color } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: on ? "white" : c.color }}
                />
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <input
          type="date"
          name="date"
          defaultValue={today}
          aria-label="Task date"
          className="rounded-lg border border-black/10 px-2 py-1 text-xs text-black/60"
        />
        <button
          type="submit"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Add
        </button>
      </div>
    </form>
  );
}
