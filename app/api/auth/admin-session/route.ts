import { logger } from "@/lib/logger";

/** Optional hook after client-side signOut; clears any server-side session bookkeeping if added later. */
export async function DELETE() {
  try {
    return Response.json({ ok: true });
  } catch (err) {
    logger.errorRaw("route", "[api/auth/admin-session] DELETE", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
