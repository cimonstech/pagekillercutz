import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("contract_settings")
      .select("*")
      .eq("is_current", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return Response.json({ settings: data });
  } catch (error) {
    logger.errorRaw("route", "[api/contract-settings] GET:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as Record<string, unknown>;

    await supabase.from("contract_settings").update({ is_current: false }).eq("is_current", true);
    const { data: previous } = await supabase
      .from("contract_settings")
      .select("version")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (previous?.version ?? 0) + 1;
    const { data, error } = await supabase
      .from("contract_settings")
      .insert({
        ...body,
        version: nextVersion,
        is_current: true,
        updated_by: auth.email,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;

    await supabase.from("audit_logs").insert({
      actor: auth.email,
      actor_role: auth.role,
      action_type: "system",
      description: `Contract settings updated by ${auth.email}`,
      target_id: "contract_settings",
      ip_address: null,
    });

    return Response.json({ settings: data });
  } catch (error) {
    logger.errorRaw("route", "[api/contract-settings] PATCH:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
