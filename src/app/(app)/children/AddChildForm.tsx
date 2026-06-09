"use client";

import { useRef } from "react";
import { createChildAction } from "./actions";
import { ColorPicker } from "./ColorPicker";
import { DEFAULT_CHILD_COLOR } from "@/lib/colors";

// Add-a-child form. Wraps the server action so we can clear the name field
// after a successful add (the color stays selected, which is convenient when
// adding siblings one after another).
export function AddChildForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createChildAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <input
        name="name"
        required
        maxLength={40}
        placeholder="Child's name"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
      />
      <ColorPicker defaultValue={DEFAULT_CHILD_COLOR} />
      <button
        type="submit"
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
      >
        Add child
      </button>
    </form>
  );
}
