import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: RouteContext) {
  try {
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
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as OrderUpdate;

    // TODO: trigger SMS/email notification (Phase 7)
    if (body.fulfillment_status === "shipped" || body.fulfillment_status === "delivered") {
      logger.infoRaw("api/orders/[id]", "Fulfillment changed:", body.fulfillment_status);
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ ...body })
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
