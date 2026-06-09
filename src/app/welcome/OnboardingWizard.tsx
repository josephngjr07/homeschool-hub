"use client";

import { useMemo, useState } from "react";
import { CHILD_COLORS, DEFAULT_CHILD_COLOR } from "@/lib/colors";
import { completeOnboardingAction } from "./actions";

type DraftChild = { id: string; name: string; color: string };
type SubjectOption = { name: string; hint?: string };

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKDAYS = [0, 1, 2, 3, 4];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// The two-step setup. Step 1: add the kids. Step 2: build the week — pick which
// days each subject happens on and who it's for. Nothing is pre-selected (the
// parent chooses everything, with no nudge toward, say, daily Bible reading),
// and a subject is only included if it has a day. Then a Server Action seeds the
// Starter week. Deliberately two steps — no multi-screen flow.
export function OnboardingWizard({
  subjects,
}: {
  subjects: readonly SubjectOption[];
}) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [children, setChildren] = useState<DraftChild[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_CHILD_COLOR);

  // Step 2 state: subject rows (preset + custom), the days chosen per subject,
  // and who each subject is for (child ids; empty = everyone). All start blank.
  const [rows, setRows] = useState<SubjectOption[]>([...subjects]);
  const [days, setDays] = useState<Record<string, number[]>>({});
  const [assign, setAssign] = useState<Record<string, string[]>>({});
  const [custom, setCustom] = useState("");

  function addChild() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setChildren((cs) => [...cs, { id: newId(), name: trimmed, color }]);
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
      const same =
        current.length === preset.length &&
        preset.every((x) => current.includes(x));
      return { ...d, [subject]: same ? [] : preset };
    });
  }

  function setEveryone(subject: string) {
    setAssign((a) => ({ ...a, [subject]: [] }));
  }

  function toggleChild(subject: string, childId: string) {
    setAssign((a) => {
      const current = a[subject] ?? [];
      const next = current.includes(childId)
        ? current.filter((x) => x !== childId)
        : [...current, childId];
      return { ...a, [subject]: next };
    });
  }

  function addCustom() {
    const trimmed = custom.trim().slice(0, 40);
    if (!trimmed) return;
    if (rows.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) {
      setCustom("");
      return;
    }
    setRows((r) => [...r, { name: trimmed }]);
    setCustom("");
  }

  // The submit payload + live count: only subjects with at least one day. Child
  // ids are resolved to indexes into the current children array (empty =
  // everyone), so removing a child can't mis-target a task.
  const items = useMemo(
    () =>
      rows
        .map((r) => {
          const weekdays = days[r.name] ?? [];
          const childIndexes = (assign[r.name] ?? [])
            .map((id) => children.findIndex((c) => c.id === id))
            .filter((i) => i >= 0);
          return { subject: r.name, weekdays, childIndexes };
        })
        .filter((it) => it.weekdays.length > 0),
    [rows, days, assign, children],
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
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
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
              {children.map((c) => (
                <li
                  key={c.id}
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
                      setChildren((cs) => cs.filter((x) => x.id !== c.id))
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
          {/* Carry the step-1 draft + the computed week along with the submit.
              Children render in order so the action's indexes line up. */}
          {children.map((c) => (
            <span key={c.id}>
              <input type="hidden" name="childName" value={c.name} />
              <input type="hidden" name="childColor" value={c.color} />
            </span>
          ))}
          <input type="hidden" name="items" value={JSON.stringify(items)} />

          <p className="text-sm text-muted">
            Tap the days you&apos;ll do each thing, and who it&apos;s for. Leave
            one blank to skip it — you can change everything later.
          </p>

          <div className="space-y-2">
            {rows.map((row) => {
              const chosen = days[row.name] ?? [];
              const forChildren = assign[row.name] ?? [];
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

                  {/* Who it's for — only meaningful with 2+ kids, and only once
                      the subject is actually in the week. */}
                  {chosen.length > 0 && children.length > 1 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEveryone(row.name)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                          forChildren.length === 0
                            ? "bg-foreground text-background"
                            : "border border-border text-muted"
                        }`}
                      >
                        Everyone
                      </button>
                      {children.map((c) => {
                        const on = forChildren.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleChild(row.name, c.id)}
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition ${
                              on ? "text-white" : "border border-border text-muted"
                            }`}
                            style={on ? { backgroundColor: c.color } : undefined}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: on ? "white" : c.color }}
                            />
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
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
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
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
