// lib/guards.ts
import type { Session } from "next-auth";

/** Assert: после вызова у session точно есть user */
export function ensureUser(session: Session | null): asserts session is Session {
  if (!session?.user?.id) throw new Error("Unauthorized");
}