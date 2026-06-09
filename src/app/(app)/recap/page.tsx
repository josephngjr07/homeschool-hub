import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { weeklyRecap } from "@/data/tasks";
import {
  todayInZone,
  startOfWeek,
  addDays,
  toDateInputValue,
  formatShortDate,
  isSameDay,
} from "@/lib/date";
import { encouragementForWeek } from "@/lib/encouragement";

// The weekly recap — a calm end-of-week celebration. Win-only by construction
// (see weeklyRecap): it shows what got done and who did it, never what was
// missed, ranked, or scored (ADR-0001). A quiet week is met with warmth, never
// a zero or a guilt nudge.
export default async function RecapPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/");

  const { start } = await searchParams;
  const today = todayInZone();
  const weekStart = start ? startOfWeek(new Date(start)) : startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const isThisWeek = isSameDay(weekStart, startOfWeek(today));

  const recap = await weeklyRecap(userId, weekStart, weekEnd);
  const message = encouragementForWeek(weekStart);

  const prevStart = toDateInputValue(addDays(weekStart, -7));
  const nextStart = toDateInputValue(addDays(weekStart, 7));

  return (
    <main className="px-5 py-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Recap
      </h1>

      <div className="mt-2 flex items-center justify-between text-sm">
        <Link
          href={`/recap?start=${prevStart}`}
          className="text-muted hover:text-foreground"
        >
          ← Prev
        </Link>
        <span className="text-muted">
          {formatShortDate(weekStart)} – {formatShortDate(weekEnd)}
        </span>
        <Link
          href={`/recap?start=${nextStart}`}
          className="text-muted hover:text-foreground"
        >
          Next →
        </Link>
      </div>

      {recap.total === 0 ? (
        <section className="mt-10 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-4xl" aria-hidden>
            🌱
          </p>
          <p className="mt-3 text-sm text-muted">
            {isThisWeek
              ? "A fresh week, ready when you are. Whatever you do together will show up here 💛"
              : "A quiet week — and that's okay. Every season has its own rhythm 💛"}
          </p>
        </section>
      ) : (
        <section className="mt-8 rounded-3xl border border-accent/30 bg-accent/10 p-8 text-center shadow-sm">
          <p className="text-4xl" aria-hidden>
            🎉
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold">
            What a week!
          </h2>
          <p className="mt-2 text-base text-foreground">
            You did{" "}
            <span className="font-semibold text-accent-strong">
              {recap.total} {recap.total === 1 ? "thing" : "things"}
            </span>{" "}
            with the kids this week 💛
          </p>

          {(recap.perChild.length > 0 || recap.together > 0) && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {recap.perChild.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-medium shadow-sm"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name} · {c.count}
                </span>
              ))}
              {recap.together > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-medium shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                  Together · {recap.together}
                </span>
              )}
            </div>
          )}

          <p className="mt-6 font-display text-lg italic text-muted">
            &ldquo;{message}&rdquo;
          </p>
        </section>
      )}

      {!isThisWeek && (
        <Link
          href="/recap"
          className="mt-4 block text-center text-xs text-accent-strong hover:underline"
        >
          Back to this week
        </Link>
      )}
    </main>
  );
}
