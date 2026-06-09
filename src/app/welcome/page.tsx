import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { hasOnboarded, STARTER_SUBJECTS } from "@/data/onboarding";
import { OnboardingWizard } from "./OnboardingWizard";

// First-run setup. Lives outside the (app) shell (no bottom nav) so the wizard
// is a focused, full-screen moment. Already-onboarded parents are sent home.
export default async function WelcomePage() {
  const userId = await getUserId();
  if (!userId) redirect("/");
  if (await hasOnboarded(userId)) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 py-10">
      <OnboardingWizard subjects={STARTER_SUBJECTS} />
    </main>
  );
}
