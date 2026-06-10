"use client";

import { useState, useTransition } from "react";
import { formatTime } from "@/lib/date";
import { setTaskCompletedAction, setTaskTimesAction } from "./actions";
import { TimeRangeInputs } from "@/components/TimeRangeInputs";

type ChildOption = { id: string; name: string; color: string };
type GridTask = {
  id: string;
  title: string;
  time: string | null; // "HH:MM" start, null = Anytime
  endTime: string | null; // "HH:MM" end
  completed: boolean;
  assignedTo: ChildOption[];
};

// Calm default window: 7am–7pm. It quietly stretches to fit anything slotted
// earlier/later so the morning never feels "late". One hour = HOUR_PX tall, so
// a 90-min task draws 1.5× a 60-min one (a real calendar block).
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 19;
const HOUR_PX = 56;
const MIN_BLOCK_PX = 24; // keep very short tasks tappable
const MAX_COLS = 2; // overlaps beyond this fold into a "+N" chip

const parseMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

function hourLabel(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${period}`;
}

type Laid = {
  task: GridTask;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
};

// The Schedule grid — a proportional day timeline for today. Timed tasks are
// blocks spanning start→end; untimed ones wait in the "Anytime" tray and are
// never forced onto the clock (ADR-0001). Tap a block or an Anytime chip to open
// the editor and set/adjust its time; no drag. Overlaps sit side-by-side (max
// two columns); a third+ folds into a "+N" chip.
export function ScheduleView({
  tasks,
  nowMinutes,
}: {
  tasks: GridTask[];
  nowMinutes: number;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const untimed = tasks.filter((t) => !t.time);
  const timed = tasks.filter((t) => t.time);

  function saveTimes(id: string, start: string, end: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("time", start);
    fd.set("endTime", end);
    startTransition(async () => {
      await setTaskTimesAction(fd);
    });
    setEditingId(null);
  }

  function clearTime(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("time", "");
    startTransition(async () => {
      await setTaskTimesAction(fd);
    });
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

  // --- Window ---------------------------------------------------------------
  const starts = timed.map((t) => parseMin(t.time!));
  const ends = timed.map((t) =>
    t.endTime ? parseMin(t.endTime) : parseMin(t.time!) + 60,
  );
  const startHour = Math.max(
    0,
    Math.min(DEFAULT_START_HOUR, ...starts.map((s) => Math.floor(s / 60))),
  );
  const endHour = Math.min(
    24,
    Math.max(DEFAULT_END_HOUR, ...ends.map((e) => Math.ceil(e / 60))),
  );
  const windowStartMin = startHour * 60;
  const hourLines = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i,
  );
  const gridHeight = (endHour - startHour) * HOUR_PX;

  // --- Lay out blocks into overlap clusters / columns -----------------------
  const sorted = [...timed]
    .map((t) => {
      const s = parseMin(t.time!);
      const e = Math.max(t.endTime ? parseMin(t.endTime) : s + 60, s + 15);
      return { task: t, s, e };
    })
    .sort((a, b) => a.s - b.s || a.e - b.e);

  const laid: Laid[] = [];
  const overflow: { top: number; count: number }[] = [];
  let cluster: typeof sorted = [];
  let clusterEnd = -1;

  const flush = () => {
    if (!cluster.length) return;
    const lanes: number[] = []; // lane -> last end minute
    const placed = cluster.map((item) => {
      let lane = lanes.findIndex((end) => end <= item.s);
      if (lane === -1) {
        lanes.push(item.e);
        lane = lanes.length - 1;
      } else {
        lanes[lane] = item.e;
      }
      return { item, lane };
    });
    const cols = Math.min(lanes.length, MAX_COLS);
    let overflowCount = 0;
    for (const { item, lane } of placed) {
      if (lane >= MAX_COLS) {
        overflowCount += 1;
        continue;
      }
      laid.push({
        task: item.task,
        top: ((item.s - windowStartMin) / 60) * HOUR_PX,
        height: Math.max(((item.e - item.s) / 60) * HOUR_PX, MIN_BLOCK_PX),
        leftPct: (lane * 100) / cols,
        widthPct: 100 / cols,
      });
    }
    if (overflowCount > 0) {
      overflow.push({
        top: ((cluster[0].s - windowStartMin) / 60) * HOUR_PX,
        count: overflowCount,
      });
    }
    cluster = [];
  };

  for (const item of sorted) {
    if (cluster.length && item.s >= clusterEnd) flush();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.e);
  }
  flush();

  const nowInWindow = nowMinutes >= windowStartMin && nowMinutes <= endHour * 60;
  const nowTop = ((nowMinutes - windowStartMin) / 60) * HOUR_PX;

  return (
    <div className={pending ? "opacity-60 transition-opacity" : undefined}>
      {/* Anytime tray — first-class, never on the clock. */}
      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-3">
        <p className="mb-2 text-xs font-medium text-muted">Anytime</p>
        {untimed.length === 0 ? (
          <p className="text-xs text-muted/70">
            Everything has a time — tap a block to loosen it.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {untimed.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setEditingId(t.id)}
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
      </div>

      {/* Editor panel — appears when a block or Anytime chip is tapped. Uses an
          uncontrolled time pair (TimeRangeInputs) so the native picker isn't
          fought mid-keystroke; `key` resets defaults when a different task is
          opened. */}
      {editingId &&
        (() => {
          const t = tasks.find((x) => x.id === editingId);
          if (!t) return null;
          return (
            <form
              key={editingId}
              action={(fd) => {
                const s = String(fd.get("time") ?? "");
                const e = String(fd.get("endTime") ?? "");
                if (s) saveTimes(t.id, s, e);
                else clearTime(t.id);
              }}
              className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={t.completed ? "Mark not done" : "Mark done"}
                  aria-pressed={t.completed}
                  onClick={() => toggleComplete(t.id, t.completed)}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] transition ${
                    t.completed
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-foreground/30 hover:border-accent"
                  }`}
                >
                  {t.completed ? "✓" : ""}
                </button>
                <p
                  className={`text-sm font-medium ${
                    t.completed ? "text-muted line-through" : "text-foreground"
                  }`}
                >
                  {t.title}
                </p>
              </div>

              <TimeRangeInputs
                defaultStart={t.time ?? "09:00"}
                defaultEnd={t.endTime ?? ""}
              />

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => clearTime(t.id)}
                  className="text-xs text-muted hover:text-foreground"
                >
                  Back to Anytime
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-xs text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
                  >
                    Save time
                  </button>
                </div>
              </div>
            </form>
          );
        })()}

      {/* The proportional timeline. */}
      <div className="mt-3 flex">
        <div className="w-12 shrink-0">
          {hourLines.map((h, i) => (
            <div
              key={h}
              style={{ height: i === hourLines.length - 1 ? 0 : HOUR_PX }}
              className={`pr-2 text-right text-[11px] ${
                Math.floor(nowMinutes / 60) === h
                  ? "font-semibold text-accent-strong"
                  : "text-muted"
              }`}
            >
              {hourLabel(h)}
            </div>
          ))}
        </div>

        <div className="relative flex-1" style={{ height: gridHeight }}>
          {/* hour lines */}
          {hourLines.map((h, i) => (
            <div
              key={h}
              className="absolute inset-x-0 border-t border-border"
              style={{ top: i * HOUR_PX }}
            />
          ))}

          {/* gentle "now" marker */}
          {nowInWindow && (
            <div
              className="absolute inset-x-0 z-10 border-t border-accent/50"
              style={{ top: nowTop }}
            >
              <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-accent" />
            </div>
          )}

          {/* task blocks */}
          {laid.map(({ task: t, top, height, leftPct, widthPct }) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setEditingId(t.id)}
              style={{
                top,
                height,
                left: `calc(${leftPct}% + 2px)`,
                width: `calc(${widthPct}% - 4px)`,
              }}
              className={`absolute overflow-hidden rounded-lg border px-2 py-1 text-left shadow-sm transition ${
                t.completed
                  ? "border-border bg-card/70"
                  : "border-accent/30 bg-accent/10 hover:border-accent"
              }`}
            >
              <span className="flex items-center gap-1">
                {t.assignedTo.slice(0, 3).map((c) => (
                  <span
                    key={c.id}
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                ))}
                <span
                  className={`truncate text-xs font-medium ${
                    t.completed ? "text-muted line-through" : "text-foreground"
                  }`}
                >
                  {t.title}
                </span>
              </span>
              <span className="block truncate text-[10px] text-muted">
                {formatTime(t.time)}
                {t.endTime ? `–${formatTime(t.endTime)}` : ""}
              </span>
            </button>
          ))}

          {/* overflow chips for 3rd+ overlapping tasks */}
          {overflow.map((o, i) => (
            <span
              key={i}
              style={{ top: o.top + 2 }}
              className="absolute right-0.5 z-10 rounded-full border border-border bg-card px-1.5 text-[10px] font-medium text-muted"
            >
              +{o.count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
