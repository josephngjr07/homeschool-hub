"use client";

import { useState } from "react";

// A two-step destructive "clear" control: a quiet link that, when tapped, arms
// into an inline "Delete N tasks? · Delete · Cancel" confirm before firing the
// bulk-delete action (used to reset Today / a Plan week). Mirrors the confirm
// pattern used for deleting a Child — a mass delete should never be one tap.
export function ConfirmClearButton({
  action,
  fields,
  label,
  count,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: string;
  count: number;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="text-xs font-medium text-red-700/70 hover:text-red-700"
      >
        {label}
      </button>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <span className="text-muted">
        Delete {count} {count === 1 ? "task" : "tasks"}? Can&apos;t be undone.
      </span>
      <button
        type="submit"
        className="font-medium text-red-700 hover:underline"
      >
        Delete
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="text-muted hover:text-foreground"
      >
        Cancel
      </button>
    </form>
  );
}
