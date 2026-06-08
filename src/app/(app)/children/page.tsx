import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { listChildren } from "@/data/children";
import { AddChildForm } from "./AddChildForm";
import { ChildChip } from "./ChildChip";

// Children management. A signed-in parent adds/edits/removes their children,
// shown as colored chips. Everything is scoped to the owner by getUserId().
export default async function ChildrenPage() {
  const userId = await getUserId();
  if (!userId) redirect("/");

  const children = await listChildren(userId);

  return (
    <main className="px-5 py-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Children
      </h1>
      <p className="mt-1 text-sm text-muted">
        Add each child as a colored chip. You can rename, recolor, or remove
        them anytime.
      </p>

      <div className="mt-6">
        <AddChildForm />
      </div>

      {children.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No children yet — add your first above.
        </p>
      ) : (
        <ul className="mt-8 flex flex-wrap gap-3">
          {children.map((child) => (
            <li key={child.id}>
              <ChildChip id={child.id} name={child.name} color={child.color} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
