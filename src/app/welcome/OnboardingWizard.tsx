"use client";

import { useState } from "react";
import { CHILD_COLORS, DEFAULT_CHILD_COLOR } from "@/lib/colors";
import { completeOnboardingAction } from "./actions";

type DraftChild = { name: string; color: string };

// The two-step setup. Step 1: add the kids (name + color). Step 2: pick a few
// subjects. Then we hand the draft to a Server Action that seeds the Starter
// week. Kept deliberately to two steps — no multi-screen flow.
export function OnboardingWizard({ subjects }: { subjects: readonly string[] }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [children, setChildren] = useState<DraftChild[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_CHILD_COLOR);
  const [picked, setPicked] = useState<string[]>([]);

  function addChild() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setChildren((cs) => [...cs, { name: trimmed, color }]);
    setName("");
    // Advance the default colour so siblings differ at a glance.
    const next = CHILD_COLORS[(CHILD_COLORS.indexOf(color as never) + 1) % CHILD_COLORS.length];
    setColor(next);
  }

  function toggleSubject(s: string) {
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  }

  return (
    <div className="w-full max-w-md">
      <header className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Welcome 👋
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Two quick steps and we&apos;ll fill in your first week — something to
          edit, never a blank page.
        </p>
      </header>

      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
        <span className={step === 1 ? "font-semibold text-foreground" : ""}>
          1 · Children
        </span>
        <span aria-hidden>—</span>
        <span className={step === 2 ? "font-semibold text-foreground" : ""}>
          2 · Subjects
        </span>
      </div>

      {step === 1 ? (
        <section className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChild();
                  }
                }}
                maxLength={40}
                placeholder="Child's name"
                className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
              />
              <span className="flex items-center gap-1.5">
                {CHILD_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Use color ${c}`}
                    aria-pressed={color === c}
                    onClick={() => setColor(c)}
                    className="h-5 w-5 rounded-full transition"
                    style={{
                      backgroundColor: c,
                      outline: color === c ? "2px solid currentColor" : "none",
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </span>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={addChild}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                Add child
              </button>
            </div>
          </div>

          {children.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {children.map((c, i) => (
                <li
                  key={i}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                  <button
                    type="button"
                    aria-label={`Remove ${c.name}`}
                    onClick={() =>
                      setChildren((cs) => cs.filter((_, j) => j !== i))
                    }
                    className="text-muted hover:text-foreground"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            disabled={children.length === 0}
            onClick={() => setStep(2)}
            className="w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
          >
            Next: pick subjects
          </button>
        </section>
      ) : (
        <form action={completeOnboardingAction} className="mt-6 space-y-4">
          {/* Carry the step-1 draft along with the submit. */}
          {children.map((c, i) => (
            <span key={i}>
              <input type="hidden" name="childName" value={c.name} />
              <input type="hidden" name="childColor" value={c.color} />
            </span>
          ))}

          <p className="text-sm text-muted">
            Pick the subjects you want this week. Each becomes a daily task for
            the school week — tweak or delete any of it later.
          </p>

          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => {
              const on = picked.includes(s);
              return (
                <label
                  key={s}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    on
                      ? "bg-foreground text-background"
                      : "border border-border text-muted hover:text-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="subject"
                    value={s}
                    checked={on}
                    onChange={() => toggleSubject(s)}
                    className="sr-only"
                  />
                  {s}
                </label>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-muted hover:text-foreground"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={picked.length === 0}
              className="flex-1 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
            >
              Create my week
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
