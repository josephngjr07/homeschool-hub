import type { DefaultSession } from "next-auth";

// Tell TypeScript that our session carries the user's id (set in the session
// callback in src/auth.ts). Without this, `session.user.id` would be a type error.
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}
