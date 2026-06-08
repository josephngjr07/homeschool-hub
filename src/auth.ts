import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// The one place auth is configured. NextAuth returns helpers we use everywhere:
//  - handlers: the GET/POST routes that run the OAuth flow
//  - auth:     reads the current session (use in Server Components / actions)
//  - signIn / signOut: trigger login / logout from server actions
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Store users & sessions in Postgres via Prisma.
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // Database sessions: `user` is the Postgres row. Expose its id on the
    // session so the rest of the app can scope every query to this parent.
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
