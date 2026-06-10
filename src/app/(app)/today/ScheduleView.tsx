"use client";

import { useState, useTransition } from "react";
import { formatTime } from "@/lib/date";
import { setTaskCompletedAction, setTaskTimeAction } from "./actions";

type ChildOption = { id: string; name: string; color: string };
type GridTask = {
  id: string;
  title: string;
  time: string | null; // "HH:MM" or null = Anytime
  completed: boolean;
  assignedTo: ChildOption[];
};

// The default visible window: 7am–7pm. Calm by design — we don't show the
// whole 24h day (that just makes the morning feel "late"). The window quietly
// stretches to fit any task a mom has slotted earlier or later.
const DEFAULT_START = 7;
const DEFAULT_END = 19; // last hour row shown (7pm)

const hourOf = (time: string) => Number(time.slice(0, 2));
const pad = (n: number) => String(n).padStart(2, "0");

function hourLabel(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${period}`;
}

// The Schedule grid — an hourly ruler for today. Timed Tasks sit on their hour;
// untimed ones wait calmly in the "Anytime" tray and are never forced onto the
// clock. Tap an empty slot to drop an Anytime task into that hour; tap a Task to
// nudge its time or send it back to Anytime. No drag, no overdue, no red.
export function ScheduleView({
  tasks,
  nowMinutes,
}: {
  tasks: GridTask[];
  nowMinutes: number;
}) {
  const [addingHour, setAddingHour] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const untimed = tasks.filter((t) => !t.time);
  const timed = tasks.filter((t) => t.time);

  function setTime(id: string, time: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("time", time);
    startTransition(async () => {
      await setTaskTimeAction(fd);
    });
    setAddingHour(null);
    setEditingId(null);
  }

  function toggleComplete(id: string, completed: boolean) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("completed", String(!completed));
    startTransition(async () => {
      await setTaskCompletedAction(fd);
    });
  }

  // Stretch the window to include anything slotted outside 7am–7pm.
  const hours = timed.map((t) => hourOf(t.time!));
  const startHour = Math.min(DEFAULT_START, ...hours);
  const endHour = Math.max(DEFAULT_END, ...hours);
  const rows = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i,
  );
  const nowHour = Math.floor(nowMinutes / 60);

  return (
    <div className={pending ? "opacity-60 transition-opacity" : undefined}>
      {/* Anytime tray — first-class, never on the clock. */}
      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-3">
        <p className="mb-2 text-xs font-medium text-muted">Anytime</p>
        {untimed.length === 0 ? (
          <p className="text-xs text-muted/70">
            Everything has a time — tap a task below to loosen it.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {untimed.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setEditingId(editingId === t.id ? null : t.id)}
                className={`flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium transition hover:border-accent ${
                  t.completed ? "text-muted line-through" : "text-foreground"
                }`}
              >
                {t.assignedTo.slice(0, 3).map((c) => (
                  <span
                    key={c.id}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                ))}
                {t.title}
              </button>
            ))}
          </div>
        )}
        {/* Inline time editor for an Anytime task being slotted. */}
        {editingId && untimed.some((t) => t.id === editingId) && (
          <TimeEditor
            time=""
            onPick={(time) => setTime(editingId, time)}
            onClear={() => setEditingId(null)}
            clearLabel="Cancel"
          />
        )}
      </div>

      {/* Hourly ruler. */}
      <div className="mt-3">
        {rows.map((h) => {
          const here = timed.filter((t) => hourOf(t.time!) === h);
          const isNow = h === nowHour;
          return (
            <div key={h} className="flex gap-3">
              <div
                className={`w-12 shrink-0 pt-1.5 text-right text-xs ${
                  isNow ? "font-semibold text-accent-strong" : "text-muted"
                }`}
              >
                {hourLabel(h)}
              </div>
              <div
                className={`min-h-12 flex-1 space-y-1.5 border-t py-1.5 ${
                  isNow ? "border-accent/40" : "border-border"
                }`}
              >
                {here.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-border bg-card px-3 py-2 shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        aria-label={t.completed ? "Mark not done" : "Mark done"}
                        aria-pressed={t.completed}
                        onClick={() => toggleComplete(t.id, t.completed)}
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] transition ${
                          t.completed
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-foreground/30 hover:border-accent"
                        }`}
                      >
                        {t.completed ? "✓" : ""}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingId(editingId === t.id ? null : t.id)
                        }
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="flex items-baseline gap-1.5">
                          <span className="shrink-0 text-xs font-medium text-muted">
                            {formatTime(t.time)}
                          </span>
                          <span
                            className={`truncate text-sm font-medium ${
                              t.completed
                                ? "text-muted line-through"
                                : "text-foreground"
                            }`}
                          >
                            {t.title}
                          </span>
                        </span>
                      </button>
                      {t.assignedTo.length > 0 && (
                        <span className="mt-1 flex shrink-0 -space-x-1">
                          {t.assignedTo.map((c) => (
                            <span
                              key={c.id}
                              className="h-2.5 w-2.5 rounded-full ring-2 ring-card"
                              style={{ backgroundColor: c.color }}
                              title={c.name}
                            />
                          ))}
                        </span>
                      )}
                    </div>
                    {editingId === t.id && (
                      <TimeEditor
                        time={t.time ?? ""}
                        onPick={(time) => setTime(t.id, time)}
                        onClear={() => setTime(t.id, "")}
                        clearLabel="Back to Anytime"
                      />
                    )}
                  </div>
                ))}

                {/* Tap an empty hour to drop an Anytime task in. */}
                {addingHour === h ? (
                  <div className="rounded-xl border border-border bg-card p-2">
                    {untimed.length === 0 ? (
                      <p className="px-1 py-1 text-xs text-muted">
                        Nothing waiting in Anytime.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {untimed.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTime(t.id, `${pad(h)}:00`)}
                            className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-accent"
                          >
                            {t.title}
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setAddingHour(null)}
                      className="mt-1.5 px-1 text-xs text-muted hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingHour(h)}
                    className="w-full rounded-lg py-1 text-left text-xs text-muted/40 transition hover:text-accent-strong"
                  >
                    + add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// A tiny time control reused by both the Anytime tray and the on-grid cards: a
// native time picker plus a "loosen"/cancel escape hatch.
function TimeEditor({
  time,
  onPick,
  onClear,
  clearLabel,
}: {
  time: string;
  onPick: (time: string) => void;
  onClear: () => void;
  clearLabel: string;
}) {
  return (
    <div className="mt-2 flex items-center gap-3 border-t border-border pt-2">
      <input
        type="time"
        defaultValue={time}
        aria-label="Set time"
        onChange={(e) => {
          if (e.target.value) onPick(e.target.value);
        }}
        className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs text-foreground"
      />
      <button
        type="button"
        onClick={onClear}
        className="text-xs text-muted hover:text-foreground"
      >
        {clearLabel}
      </button>
    </div>
  );
}
