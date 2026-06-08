import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

// Landing / sign-in. Once signed in, home is the dashboard.
export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Homeschool Hub
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted">
          A calm place to plan the week, see today, and check it off — together.
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button
          type="submit"
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
        >
          Continue with Google
        </button>
      </form>
    </main>
  );
}
