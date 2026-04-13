import { createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";

async function requireSuperAdmin(): Promise<{ email: string } | Response> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("admins").select("role").ilike("email", user.email).maybeSingle();
  if (error) {
    logger.errorRaw("route", "[api/audit-logs/clear] admin lookup:", error);
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const row = data as { role: string } | null;
  if (row?.role !== "super_admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return { email: user.email };
}

export async function DELETE() {
  try {
    const auth = await requireSuperAdmin();
    if (auth instanceof Response) return auth;

    const admin = getSupabaseAdmin();

    const { error: delError } = await admin.from("audit_logs").delete().gte("created_at", "1970-01-01T00:00:00Z");
    if (delError) throw delError;

    const { error: insError } = await admin.from("audit_logs").insert({
      actor: auth.email,
      actor_role: "super_admin",
      action_type: "system",
      description: `Audit logs cleared by ${auth.email}`,
      target_id: null,
      ip_address: null,
    });
    if (insError) throw insError;

    return Response.json({ success: true });
  } catch (error) {
    logger.errorRaw("route", "[api/audit-logs/clear] Error:", error);
    return Response.json({ error: "Failed to clear audit logs" }, { status: 500 });
  }
}
