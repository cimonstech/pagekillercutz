import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import type { Database } from "@/lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_ORDER_PATCH_FIELDS = new Set([
  "fulfillment_status",
  "payment_status",
  "tracking_number",
  "admin_notes",
]);

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
    if (error) throw error;
    return Response.json({ order: data as OrderRow });
  } catch (error) {
    logger.errorRaw("api/orders/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const raw = (await request.json()) as Record<string, unknown>;

    const safeUpdate: Record<string, unknown> = {};
    for (const key of Object.keys(raw)) {
      if (ALLOWED_ORDER_PATCH_FIELDS.has(key)) {
        safeUpdate[key] = raw[key];
      }
    }

    if (Object.keys(safeUpdate).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    if (safeUpdate.fulfillment_status === "shipped" || safeUpdate.fulfillment_status === "delivered") {
      logger.infoRaw("api/orders/[id]", "Fulfillment changed:", safeUpdate.fulfillment_status);
    }

    const { data, error } = await supabase
      .from("orders")
      .update(safeUpdate)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ order: data as OrderRow });
  } catch (error) {
    logger.errorRaw("api/orders/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
