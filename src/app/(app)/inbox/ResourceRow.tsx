"use client";

import { useState } from "react";
import {
  updateResourceAction,
  deleteResourceAction,
  planResourceAction,
} from "./actions";
import { TimeRangeInputs } from "@/components/TimeRangeInputs";
import { toLinkHref } from "@/lib/url";
import { addDays, formatShortDate, toDateInputValue } from "@/lib/date";

type ChildOption = { id: string; name: string; color: string };
type Resource = {
  id: string;
  url: string | null;
  title: string | null;
  note: string | null;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS = [0, 1, 2, 3, 4]; // Mon–Fri
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

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
  // Which week to plan into. Starts at the current week (the prop); the parent
  // can step forward to plan ahead. Never earlier than this week — planning into
  // the past makes no sense. ISO YYYY-MM-DD strings compare lexicographically.
  const [planWeek, setPlanWeek] = useState(weekStart);
  const planWeekDate = new Date(planWeek);
  const atCurrentWeek = planWeek <= weekStart;
  const isThisWeek = planWeek === weekStart;
  const stepWeek = (delta: number) =>
    setPlanWeek((w) => toDateInputValue(addDays(new Date(w), delta * 7)));

  const heading = resource.title || resource.url || "Untitled";
  const link = toLinkHref(resource.url);

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
          setPlanWeek(weekStart);
        }}
        className="space-y-3 rounded-2xl border border-border bg-card p-4"
      >
        <input type="hidden" name="id" value={resource.id} />
        <input type="hidden" name="weekStart" value={planWeek} />
        <input
          name="title"
          defaultValue={heading}
          required
          maxLength={120}
          className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
        />
        <TimeRangeInputs />

        {/* Which week to plan into — step forward to plan ahead. */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted">Week of</span>
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => stepWeek(-1)}
              disabled={atCurrentWeek}
              aria-label="Previous week"
              className="rounded px-1.5 py-0.5 text-muted hover:text-foreground disabled:opacity-30"
            >
              ←
            </button>
            <span className="min-w-[7.5rem] text-center font-medium text-foreground">
              {isThisWeek
                ? "This week"
                : `${formatShortDate(planWeekDate)} – ${formatShortDate(
                    addDays(planWeekDate, 6),
                  )}`}
            </span>
            <button
              type="button"
              onClick={() => stepWeek(1)}
              aria-label="Next week"
              className="rounded px-1.5 py-0.5 text-muted hover:text-foreground"
            >
              →
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
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
            onClick={() => {
              setMode("view");
              setPlanWeek(weekStart);
            }}
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
        {link ? (
          <a
            href={link}
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
