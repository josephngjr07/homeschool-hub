import { handlers } from "@/auth";

// Exposes the Auth.js endpoints (sign-in, callback, sign-out, etc.) at
// /api/auth/*. The Google callback URL we registered in the Google console
// (/api/auth/callback/google) is handled here.
export const { GET, POST } = handlers;
