import { setTaskCompletedAction } from "./actions";

// One Task row on Today. The toggle is a big tap target that flips completion
// via a Server Action. Completed tasks dim + strike through; there is
// intentionally no "overdue" / red state (ADR-0001). When the Task has a link
// (added directly or inherited from the Inbox Resource it came from), a footer
// strip opens it so the parent can launch the activity immediately (it lives
// outside the toggle button — an <a> can't nest inside a <button>).
export function TaskItem({
  id,
  title,
  description,
  completed,
  assignedTo,
  linkUrl,
}: {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  assignedTo: { id: string; name: string; color: string }[];
  linkUrl?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-accent">
      <form action={setTaskCompletedAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="completed" value={(!completed).toString()} />
        <button
          type="submit"
          className="flex w-full items-start gap-3 px-4 py-3 text-left"
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

      {linkUrl ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-t border-border px-4 py-2 text-xs font-medium text-accent-strong hover:underline"
        >
          Open link ↗
        </a>
      ) : null}
    </div>
  );
}
