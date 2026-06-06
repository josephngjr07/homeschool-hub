# Authentication via Auth.js (NextAuth) with Google sign-in

**Context.** The original plan called for hand-rolled JWT auth. For a one-week
MVP storing a real family's data, hand-rolling auth (password hashing, sessions,
reset flows, attack surface) is slow, risky, and not the product. We also want an
industry-standard approach with transferable learning value, on a Next.js stack.

**Decision.** Use **Auth.js (NextAuth)** as the auth layer with **Google** as the
sign-in provider (OAuth/OIDC). Google sign-in means no passwords to create,
store, reset, or email — deleting an entire category of work and risk.

**Why it's recorded.** This reverses the documented JWT plan, and the auth layer
is expensive to swap later (it touches sessions, route protection, and the data
layer's user records). Auth.js was chosen over Clerk/Auth0 for being the free,
no-lock-in standard in the Next.js ecosystem; the underlying OAuth/OIDC + JWT
concepts transfer to any provider if we move. JWTs are still used — under the
hood, by Auth.js — they were never an alternative to managed auth, just a
building block of it.
