import { createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export async function POST() {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = getSupabaseAdmin();
    const now = new Date().toISOString();
    const by = user?.email || "unknown";

    const { error } = await admin
      .from("audit_logs")
      .update({
        archived: true,
        archived_at: now,
        archived_by: by,
      })
      .eq("archived", false);

    if (error) throw error;

    const { error: insError } = await admin.from("audit_logs").insert({
      actor: by,
      actor_role: "super_admin",
      action_type: "system",
      description: `Audit logs archived by ${by}`,
      target_id: null,
      ip_address: null,
      archived: false,
    });
    if (insError) throw insError;

    return Response.json({ success: true });
  } catch (error) {
    logger.errorRaw("route", "[api/audit-logs/clear] Error:", error);
    return Response.json({ error: "Failed to archive audit logs" }, { status: 500 });
  }
}

/** @deprecated Use POST — soft-archive */
export async function DELETE() {
  return POST();
}
