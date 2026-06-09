import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { listChildren } from "@/data/children";
import { listInbox } from "@/data/resources";
import { todayInZone, startOfWeek, toDateInputValue } from "@/lib/date";
import { QuickAddForm } from "./QuickAddForm";
import { ResourceRow } from "./ResourceRow";

// The Inbox — forgiving capture at the top, then a short list of Resources
// waiting to be planned. It reads as "stuff to plan," meant to drain into the
// week, not a growing library (CONTEXT.md).
export default async function InboxPage() {
  const userId = await getUserId();
  if (!userId) redirect("/");

  const weekStart = startOfWeek(todayInZone());
  const [children, inbox] = await Promise.all([
    listChildren(userId),
    listInbox(userId),
  ]);

  return (
    <main className="px-5 py-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Inbox
      </h1>
      <p className="mt-1 text-sm text-muted">
        Capture a link or an idea now — plan it into the week later.
      </p>

      <div className="mt-5">
        <QuickAddForm />
      </div>

      <section className="mt-6 space-y-2">
        {inbox.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
            Inbox empty — nothing waiting to be planned.
          </p>
        ) : (
          inbox.map((r) => (
            <ResourceRow
              key={r.id}
              resource={{
                id: r.id,
                url: r.url,
                title: r.title,
                note: r.note,
              }}
              childOptions={children}
              weekStart={toDateInputValue(weekStart)}
            />
          ))
        )}
      </section>
    </main>
  );
}
