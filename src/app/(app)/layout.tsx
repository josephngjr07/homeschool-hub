import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { BottomNav } from "./BottomNav";

// Shell for every signed-in screen: guards auth once, centers a mobile-width
// column, and pins the bottom tab bar. Inner pages render into the padded area
// above the nav.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex-1 pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
