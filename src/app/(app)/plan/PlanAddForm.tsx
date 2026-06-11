"use client";

import { useRef, useState } from "react";
import { createTasksForWeekdaysAction } from "./actions";
import { TimeRangeInputs } from "@/components/TimeRangeInputs";

type ChildOption = { id: string; name: string; color: string };

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS = [0, 1, 2, 3, 4]; // Mon–Fri
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

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
  // Quick-select a preset (Mon–Fri or every day), matching the starter-week
  // setup. Tapping the active preset again clears it back to no days.
  const setPreset = (preset: number[]) =>
    setWeekdays((d) => {
      const same =
        d.length === preset.length && preset.every((x) => d.includes(x));
      return same ? [] : preset;
    });
  const isWeekdays =
    weekdays.length === 5 && WEEKDAYS.every((x) => weekdays.includes(x));
  const isDaily = weekdays.length === 7;
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
      <input
        name="url"
        inputMode="url"
        maxLength={2000}
        placeholder="Link (optional)"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="mt-2 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted/70"
      />
      <div className="mt-2">
        <TimeRangeInputs />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted">Repeat on</span>
        <div className="flex gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => setPreset(WEEKDAYS)}
            className={`rounded px-1.5 py-0.5 font-medium transition ${
              isWeekdays
                ? "bg-accent/15 text-accent-strong"
                : "text-muted hover:text-foreground"
            }`}
          >
            Weekdays
          </button>
          <button
            type="button"
            onClick={() => setPreset(ALL_DAYS)}
            className={`rounded px-1.5 py-0.5 font-medium transition ${
              isDaily
                ? "bg-accent/15 text-accent-strong"
                : "text-muted hover:text-foreground"
            }`}
          >
            Daily
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
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
