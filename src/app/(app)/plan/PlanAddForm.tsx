"use client";

import { useRef, useState } from "react";
import { createTasksForWeekdaysAction } from "./actions";

type ChildOption = { id: string; name: string; color: string };

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Add a task to one or more weekdays at once (S5 recurrence). Each selected day
// becomes an independent Task. Assignment defaults to everyone.
export function PlanAddForm({
  childOptions,
  weekStart,
}: {
  childOptions: ChildOption[];
  weekStart: string;
}) {
  const allIds = childOptions.map((c) => c.id);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [selected, setSelected] = useState<string[]>(allIds);
  const formRef = useRef<HTMLFormElement>(null);

  const toggleDay = (i: number) =>
    setWeekdays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  const toggleChild = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        weekdays.forEach((d) => formData.append("weekdays", String(d)));
        (selected.length ? selected : allIds).forEach((id) =>
          formData.append("childIds", id),
        );
        await createTasksForWeekdaysAction(formData);
        formRef.current?.reset();
        setWeekdays([]);
        setSelected(allIds);
      }}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <input type="hidden" name="weekStart" value={weekStart} />
      <input
        name="title"
        required
        maxLength={120}
        placeholder="Add a task to the week…"
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
      />

      <div className="mt-3 flex flex-wrap gap-1.5">
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
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
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

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Add to selected days
        </button>
      </div>
    </form>
  );
}
