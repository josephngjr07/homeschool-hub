"use client";

import { useRef } from "react";
import { addMinutesToTime } from "@/lib/date";

// A start + end time pair for the task-creating forms. Uncontrolled (so a parent
// form's reset() clears it), but picking a start auto-fills the end to start+1h
// the first time, and clearing the start clears/disables the end. Posts `time`
// and `endTime`. Both optional — a task with no time is a first-class "Anytime"
// state (ADR-0001).
export function TimeRangeInputs({
  defaultStart = "",
  defaultEnd = "",
}: {
  defaultStart?: string;
  defaultEnd?: string;
}) {
  const endRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <input
        type="time"
        name="time"
        defaultValue={defaultStart}
        aria-label="Start time (optional)"
        onChange={(e) => {
          const v = e.target.value;
          const end = endRef.current;
          if (!end) return;
          if (!v) end.value = "";
          else if (!end.value) end.value = addMinutesToTime(v, 60);
          end.disabled = !v;
        }}
        className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs text-muted"
      />
      <span className="text-xs text-muted">–</span>
      <input
        ref={endRef}
        type="time"
        name="endTime"
        defaultValue={defaultEnd}
        disabled={!defaultStart}
        aria-label="End time (optional)"
        className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs text-muted disabled:opacity-40"
      />
    </div>
  );
}
