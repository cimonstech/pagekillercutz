import { createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/requireAdmin";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("payment_settings").select("*").single();
    if (error || !data) {
      return Response.json({ error: "Settings not found" }, { status: 404 });
    }
    return Response.json({ settings: data });
  } catch (error) {
    logger.errorRaw("route", "[api/payment-settings] GET:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = (await request.json()) as Partial<{
      momo_enabled: boolean;
      momo_network: string;
      momo_number: string;
      momo_account_name: string;
      bank_enabled: boolean;
      bank_name: string;
      bank_account_number: string;
      bank_account_name: string;
      bank_branch: string;
      preferred_method: string;
      payment_instructions: string;
    }>;
    if (body.momo_enabled && !String(body.momo_number ?? "").trim()) {
      return Response.json({ error: "MoMo number required" }, { status: 400 });
    }
    if (
      body.bank_enabled &&
      (!String(body.bank_name ?? "").trim() || !String(body.bank_account_number ?? "").trim())
    ) {
      return Response.json({ error: "Bank name and account number required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: current } = await admin.from("payment_settings").select("id").limit(1).maybeSingle();
    if (!current?.id) return Response.json({ error: "Settings not found" }, { status: 404 });

    const { data, error } = await admin
      .from("payment_settings")
      .update({
        momo_enabled: Boolean(body.momo_enabled),
        momo_network: body.momo_network ?? "MTN",
        momo_number: body.momo_number ?? null,
        momo_account_name: body.momo_account_name ?? null,
        bank_enabled: Boolean(body.bank_enabled),
        bank_name: body.bank_name ?? null,
        bank_account_number: body.bank_account_number ?? null,
        bank_account_name: body.bank_account_name ?? null,
        bank_branch: body.bank_branch ?? null,
        preferred_method: body.preferred_method ?? "momo",
        payment_instructions: body.payment_instructions ?? null,
        updated_by: user?.email ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id)
      .select("*")
      .single();
    if (error) throw error;

    await admin.from("audit_logs").insert({
      actor: user?.email ?? "system",
      actor_role: "admin",
      action_type: "settings",
      description: `Payment settings updated by ${user?.email ?? "unknown"}`,
      target_id: current.id,
      ip_address: null,
    });

    return Response.json({ success: true, settings: data });
  } catch (error) {
    logger.errorRaw("route", "[api/payment-settings] PATCH:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

