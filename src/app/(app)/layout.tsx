import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { hasOnboarded } from "@/data/onboarding";
import { BottomNav } from "./BottomNav";

// Shell for every signed-in screen: guards auth once, sends brand-new parents
// through Onboarding so they never hit an empty planner, centers a mobile-width
// column, and pins the bottom tab bar. Inner pages render into the padded area
// above the nav.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/");
  if (!(await hasOnboarded(userId))) redirect("/welcome");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex-1 pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
