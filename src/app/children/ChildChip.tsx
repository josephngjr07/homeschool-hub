"use client";

import { useState } from "react";
import { updateChildAction, deleteChildAction } from "./actions";
import { ColorPicker } from "./ColorPicker";

// A single Child as a colored chip. Tapping the pencil flips it into an inline
// edit form (rename + recolor); the ✕ deletes it. We use a color dot + dark
// text rather than a fully color-filled chip so every palette color stays
// readable (accessible contrast).
export function ChildChip({
  id,
  name,
  color,
}: {
  id: string;
  name: string;
  color: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateChildAction(formData);
          setEditing(false);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-black/15 px-3 py-1.5"
      >
        <input type="hidden" name="id" value={id} readOnly />
        <input
          name="name"
          defaultValue={name}
          required
          maxLength={40}
          className="w-24 bg-transparent text-sm outline-none"
          aria-label="Child's name"
        />
        <ColorPicker name="color" defaultValue={color} />
        <button
          type="submit"
          className="text-xs font-semibold text-black/70 hover:text-black"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-black/40 hover:text-black/70"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-sm font-medium text-black/80">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span>{name}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${name}`}
        className="text-black/30 hover:text-black/70"
      >
        ✎
      </button>
      <form action={deleteChildAction} className="flex">
        <input type="hidden" name="id" value={id} readOnly />
        <button
          type="submit"
          aria-label={`Delete ${name}`}
          className="text-black/30 hover:text-black/70"
        >
          ✕
        </button>
      </form>
    </span>
  );
}
