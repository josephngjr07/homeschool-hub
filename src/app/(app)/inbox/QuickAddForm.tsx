"use client";

import { useRef } from "react";
import { createResourceAction } from "./actions";

// Always-available quick-add. One line is enough — drop a bare link or a
// thought and it lands in the Inbox. Title/note are optional and tucked below,
// for when there's time. Capturing must never feel like filling in a form.
export function QuickAddForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createResourceAction(formData);
        formRef.current?.reset();
      }}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <input
        name="url"
        inputMode="url"
        maxLength={2000}
        placeholder="Paste a link or jot an idea…"
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
      />
      <input
        name="title"
        maxLength={120}
        placeholder="Title (optional)"
        className="mt-2 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted/70"
      />
      <input
        name="note"
        maxLength={300}
        placeholder="Note (optional)"
        className="mt-2 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted/70"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Capture
        </button>
      </div>
    </form>
  );
}
