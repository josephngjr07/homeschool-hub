"use client";

import { useState } from "react";
import { CHILD_COLORS } from "@/lib/colors";

// A row of color swatches backed by a hidden input, so the chosen color rides
// along in the form's FormData without any extra wiring in the action.
export function ColorPicker({
  name = "color",
  defaultValue = CHILD_COLORS[0],
}: {
  name?: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <span className="flex items-center gap-1.5">
      <input type="hidden" name={name} value={value} readOnly />
      {CHILD_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Use color ${c}`}
          aria-pressed={value === c}
          onClick={() => setValue(c)}
          className="h-5 w-5 rounded-full transition"
          style={{
            backgroundColor: c,
            outline: value === c ? "2px solid currentColor" : "none",
            outlineOffset: 2,
          }}
        />
      ))}
    </span>
  );
}
