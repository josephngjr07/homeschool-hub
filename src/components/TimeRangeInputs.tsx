"use client";

import { useRef, useState } from "react";
import { addMinutesToTime } from "@/lib/date";

const DEFAULT_START = "09:00"; // a calm school-morning default when adding a time

// A start + end time pair for the task-creating/editing forms.
//
// Untimed tasks show a quiet "+ Add a time" button instead of empty time fields
// — native <input type="time"> renders the *current* time as a grey placeholder
// that looks identical to a real value, so an empty field invites half-filled
// input ("invalid value"). Tapping the button reveals start/end already filled
// with complete, valid values (9:00–10:00) to tweak, and keeps "Anytime" as a
// real, deliberate state (ADR-0001) rather than something you lose by accident.
//
// Editing the start pushes the end to start+1h, UNLESS you've changed the end
// yourself — then your duration sticks (e.g. drag end to 10:30 and it stays).
// Uncontrolled (defaultValue + refs) so the native picker is never fought.
export function TimeRangeInputs({
  defaultStart = "",
  defaultEnd = "",
}: {
  defaultStart?: string;
  defaultEnd?: string;
}) {
  const [showTime, setShowTime] = useState(Boolean(defaultStart));
  const endRef = useRef<HTMLInputElement>(null);
  // Treat a task that already has an explicit end as "manually set", so changing
  // its start later doesn't silently clobber the saved duration.
  const endTouched = useRef(Boolean(defaultEnd));

  if (!showTime) {
    return (
      <button
        type="button"
        onClick={() => setShowTime(true)}
        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted transition hover:border-accent hover:text-foreground"
      >
        + Add a time
      </button>
    );
  }

  const start0 = defaultStart || DEFAULT_START;
  const end0 = defaultEnd || addMinutesToTime(start0, 60);

  return (
    <div className="flex items-center gap-2">
      <input
        type="time"
        name="time"
        defaultValue={start0}
        aria-label="Start time"
        onChange={(e) => {
          const v = e.target.value;
          const end = endRef.current;
          if (!v || !end) return;
          if (!endTouched.current) end.value = addMinutesToTime(v, 60);
        }}
        className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs text-foreground"
      />
      <span className="text-xs text-muted">–</span>
      <input
        ref={endRef}
        type="time"
        name="endTime"
        defaultValue={end0}
        aria-label="End time"
        onChange={() => {
          endTouched.current = true;
        }}
        className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs text-foreground"
      />
      <button
        type="button"
        aria-label="Remove time (back to Anytime)"
        onClick={() => {
          endTouched.current = false;
          setShowTime(false);
        }}
        className="text-sm text-muted hover:text-foreground"
      >
        ×
      </button>
    </div>
  );
}
