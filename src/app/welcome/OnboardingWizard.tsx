"use client";

import { useMemo, useState } from "react";
import { CHILD_COLORS, DEFAULT_CHILD_COLOR } from "@/lib/colors";
import { completeOnboardingAction } from "./actions";

type DraftChild = { name: string; color: string };
type SubjectOption = { name: string; hint?: string };

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKDAYS = [0, 1, 2, 3, 4];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

// The two-step setup. Step 1: add the kids. Step 2: build the week — pick which
// days each subject happens on (a subject is only included if it has a day), so
// the parent builds up a calm week instead of deleting down from a flood. She
// can add her own subjects and see a live task count. Then a Server Action
// seeds the Starter week. Deliberately two steps — no multi-screen flow.
export function OnboardingWizard({
  subjects,
  defaultSubject,
}: {
  subjects: readonly SubjectOption[];
  defaultSubject: string;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [children, setChildren] = useState<DraftChild[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_CHILD_COLOR);

  // Step 2 state: the subject rows (preset + any custom), and the days chosen
  // per subject (keyed by name). Bible reading starts pre-lit on weekdays.
  const [rows, setRows] = useState<SubjectOption[]>([...subjects]);
  const [days, setDays] = useState<Record<string, number[]>>({
    [defaultSubject]: WEEKDAYS,
  });
  const [custom, setCustom] = useState("");

  function addChild() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setChildren((cs) => [...cs, { name: trimmed, color }]);
    setName("");
    const next =
      CHILD_COLORS[
        (CHILD_COLORS.indexOf(color as never) + 1) % CHILD_COLORS.length
      ];
    setColor(next);
  }

  function toggleDay(subject: string, day: number) {
    setDays((d) => {
      const current = d[subject] ?? [];
      const nextDays = current.includes(day)
        ? current.filter((x) => x !== day)
        : [...current, day].sort((a, b) => a - b);
      return { ...d, [subject]: nextDays };
    });
  }

  function setRowDays(subject: string, preset: number[]) {
    setDays((d) => {
      const current = d[subject] ?? [];
      // Tapping a preset toggles it: if it's already exactly that, clear it.
      const same =
        current.length === preset.length &&
        preset.every((x) => current.includes(x));
      return { ...d, [subject]: same ? [] : preset };
    });
  }

  function addCustom() {
    const trimmed = custom.trim().slice(0, 40);
    if (!trimmed) return;
    // Skip duplicates (case-insensitive).
    if (rows.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) {
      setCustom("");
      return;
    }
    setRows((r) => [...r, { name: trimmed }]);
    setDays((d) => ({ ...d, [trimmed]: WEEKDAYS }));
    setCustom("");
  }

  // The submit payload + the live count: only subjects with at least one day.
  const items = useMemo(
    () =>
      rows
        .map((r) => ({ subject: r.name, weekdays: days[r.name] ?? [] }))
        .filter((it) => it.weekdays.length > 0),
    [rows, days],
  );
  const taskCount = items.reduce((sum, it) => sum + it.weekdays.length, 0);

  return (
    <div className="w-full max-w-md">
      <header className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Welcome 👋
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Two quick steps and we&apos;ll set up your first week — something to
          edit, never a blank page.
        </p>
      </header>

      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
        <span className={step === 1 ? "font-semibold text-foreground" : ""}>
          1 · Children
        </span>
        <span aria-hidden>—</span>
        <span className={step === 2 ? "font-semibold text-foreground" : ""}>
          2 · Your week
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
            Next: build your week
          </button>
        </section>
      ) : (
        <form action={completeOnboardingAction} className="mt-6 space-y-4">
          {/* Carry the step-1 draft + the computed week along with the submit. */}
          {children.map((c, i) => (
            <span key={i}>
              <input type="hidden" name="childName" value={c.name} />
              <input type="hidden" name="childColor" value={c.color} />
            </span>
          ))}
          <input type="hidden" name="items" value={JSON.stringify(items)} />

          <p className="text-sm text-muted">
            Tap the days you&apos;ll do each thing. Leave one blank to skip it —
            you can change everything later.
          </p>

          <div className="space-y-2">
            {rows.map((row) => {
              const chosen = days[row.name] ?? [];
              const isWeekdays =
                chosen.length === 5 && WEEKDAYS.every((x) => chosen.includes(x));
              const isDaily = chosen.length === 7;
              return (
                <div
                  key={row.name}
                  className={`rounded-2xl border bg-card p-3 transition ${
                    chosen.length > 0 ? "border-accent/40" : "border-border"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {row.name}
                      </p>
                      {row.hint ? (
                        <p className="truncate text-xs text-muted/80">
                          {row.hint}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setRowDays(row.name, WEEKDAYS)}
                        className={`rounded px-1.5 py-0.5 font-medium transition ${
                          isWeekdays
                            ? "bg-accent/15 text-accent-strong"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        M–F
                      </button>
                      <button
                        type="button"
                        onClick={() => setRowDays(row.name, ALL_DAYS)}
                        className={`rounded px-1.5 py-0.5 font-medium transition ${
                          isDaily
                            ? "bg-accent/15 text-accent-strong"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        Daily
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex gap-1">
                    {DAY_LABELS.map((label, i) => {
                      const on = chosen.includes(i);
                      return (
                        <button
                          key={i}
                          type="button"
                          aria-label={`${row.name} day ${i + 1}`}
                          aria-pressed={on}
                          onClick={() => toggleDay(row.name, i)}
                          className={`h-8 flex-1 rounded-lg text-xs font-medium transition ${
                            on
                              ? "bg-foreground text-background"
                              : "border border-border text-muted hover:text-foreground"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              maxLength={40}
              placeholder="Add your own (piano, co-op…)"
              className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
            />
            <button
              type="button"
              onClick={addCustom}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
            >
              Add
            </button>
          </div>

          <p className="text-center text-xs text-muted">
            {taskCount === 0
              ? "Pick a few days to start your week"
              : `${taskCount} ${taskCount === 1 ? "task" : "tasks"} this week`}
          </p>

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
              disabled={items.length === 0}
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
