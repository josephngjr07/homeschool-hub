import { setTaskCompletedAction } from "./actions";

// One Task row on Today. The whole row is a submit button (big tap target)
// that toggles completion via a Server Action. Completed tasks dim + strike
// through; there is intentionally no "overdue" / red state (ADR-0001).
export function TaskItem({
  id,
  title,
  description,
  completed,
  assignedTo,
}: {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  assignedTo: { id: string; name: string; color: string }[];
}) {
  return (
    <form action={setTaskCompletedAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="completed" value={(!completed).toString()} />
      <button
        type="submit"
        className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm transition hover:border-accent"
      >
        <span
          aria-hidden
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
            completed
              ? "border-accent bg-accent text-accent-foreground"
              : "border-foreground/25"
          }`}
        >
          {completed ? "✓" : ""}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-medium ${
              completed ? "text-muted line-through" : "text-foreground"
            }`}
          >
            {title}
          </span>
          {description ? (
            <span className="mt-0.5 block text-xs text-muted">
              {description}
            </span>
          ) : null}
        </span>

        {assignedTo.length > 0 ? (
          <span className="mt-1 flex shrink-0 -space-x-1">
            {assignedTo.map((c) => (
              <span
                key={c.id}
                className="h-2.5 w-2.5 rounded-full ring-2 ring-card"
                style={{ backgroundColor: c.color }}
                title={c.name}
              />
            ))}
          </span>
        ) : null}
      </button>
    </form>
  );
}
