import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("payment_status");
    const search = searchParams.get("search");
    const orderNumber = searchParams.get("orderNumber");
    const limit = Number(searchParams.get("limit") ?? "20");
    const offset = Number(searchParams.get("offset") ?? "0");

    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("fulfillment_status", status);
    if (paymentStatus) query = query.eq("payment_status", paymentStatus);
    if (orderNumber) query = query.eq("order_number", orderNumber);
    if (search) query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;
    return Response.json({ orders: (data ?? []) as OrderRow[], count: count ?? 0 });
  } catch (error) {
    logger.errorRaw("route", "[api/orders] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as OrderInsert;
    if (!body.customer_name || !body.customer_email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const payload: Omit<OrderRow, "id" | "created_at"> = {
      ...body,
      order_number: orderNumber,
    };

    const { data, error } = await supabase.from("orders").insert(payload).select("*").single();
    if (error) throw error;
    return Response.json({ order: data as OrderRow, orderNumber }, { status: 201 });
  } catch (error) {
    logger.errorRaw("route", "[api/orders] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

