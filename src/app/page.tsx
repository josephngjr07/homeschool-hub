import { auth, signIn, signOut } from "@/auth";

// A React Server Component: it runs on the server, so it can read the session
// (which hits the database) directly — no client-side fetch, no API call.
export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      {session?.user ? (
        <>
          <h1 className="text-2xl font-semibold">
            Hello, {session.user.name ?? "friend"} 👋
          </h1>
          {/* Server Action: runs on the server when the form is submitted. */}
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="rounded-full border px-5 py-2 text-sm hover:bg-black/5"
            >
              Sign out
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">Homeschool Hub</h1>
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button
              type="submit"
              className="rounded-full bg-black px-5 py-2 text-sm text-white hover:opacity-90"
            >
              Continue with Google
            </button>
          </form>
        </>
      )}
    </main>
  );
}
