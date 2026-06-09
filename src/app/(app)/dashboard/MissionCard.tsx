"use client";

import { useState } from "react";
import { updateMissionAction } from "./actions";

// The "why" card on home. When the parent has written her reason for
// homeschooling, it shows in her own words (a calm reminder on a hard morning).
// Until then it shows a gentle, rotating encouragement line and invites her to
// add her why. Tapping ✎ (or the invite) opens a small inline editor.
export function MissionCard({
  mission,
  encouragement,
}: {
  mission: string | null;
  encouragement: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateMissionAction(formData);
          setEditing(false);
        }}
        className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm"
      >
        <label className="text-xs font-medium text-muted">
          Why we homeschool
        </label>
        <textarea
          name="mission"
          defaultValue={mission ?? ""}
          maxLength={280}
          rows={3}
          autoFocus
          placeholder="To raise kind, curious kids who love to learn…"
          className="mt-1 w-full resize-none bg-transparent font-display text-lg italic text-foreground outline-none placeholder:text-muted/60"
        />
        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setEditing(false)}
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
      </form>
    );
  }

  if (!mission) {
    return (
      <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <p className="font-display text-lg italic text-muted">
          &ldquo;{encouragement}&rdquo;
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 text-xs font-medium text-accent-strong hover:underline"
        >
          ＋ Add your why
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-3xl border border-accent/30 bg-accent/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-accent-strong">
          Why we homeschool
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit your why"
          className="shrink-0 text-muted hover:text-foreground"
        >
          ✎
        </button>
      </div>
      <p className="mt-1 font-display text-lg italic text-foreground">
        {mission}
      </p>
    </div>
  );
}
