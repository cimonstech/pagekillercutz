import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailFilter = searchParams.get("email");

    if (emailFilter?.trim()) {
      const userSupabase = await createServerClient();
      const {
        data: { user },
      } = await userSupabase.auth.getUser();
      if (!user?.email) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (user.email.toLowerCase().trim() !== emailFilter.toLowerCase().trim()) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const supabase = getSupabaseAdmin();
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

    if (emailFilter?.trim()) {
      query = query.ilike("customer_email", emailFilter.trim());
    }

    if (status) {
      query = query.eq(
        "fulfillment_status",
        status as OrderRow["fulfillment_status"],
      );
    }
    if (paymentStatus) {
      query = query.eq(
        "payment_status",
        paymentStatus as OrderRow["payment_status"],
      );
    }
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

type IncomingOrderBody = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  region?: string;
  notes?: string | null;
  items?: OrderRow["items"];
  total?: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  delivery_address?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const raw = (await request.json()) as IncomingOrderBody & Partial<OrderInsert>;

    const customer_name = raw.customerName ?? raw.customer_name;
    const customer_email = raw.customerEmail ?? raw.customer_email;
    const customer_phone = raw.customerPhone ?? raw.customer_phone ?? "";
    const delivery_address = raw.deliveryAddress ?? raw.delivery_address ?? "";
    const region = raw.region ?? "";
    const items = raw.items;
    const total = raw.total;

    if (!customer_name?.trim() || !customer_email?.trim()) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!items?.length || total == null || Number.isNaN(Number(total))) {
      return Response.json({ error: "Invalid order items or total" }, { status: 400 });
    }

    let delivery = delivery_address.trim();
    if (raw.notes?.trim()) {
      delivery = delivery ? `${delivery}\n\nNotes: ${raw.notes.trim()}` : `Notes: ${raw.notes.trim()}`;
    }

    const order_number = `ORD-${Date.now().toString(36).slice(-4).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const payload: OrderInsert = {
      order_number,
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim(),
      customer_phone: customer_phone.trim(),
      delivery_address: delivery,
      region: region.trim() || "Greater Accra",
      items,
      total: Number(total),
      payment_status: "unpaid",
      fulfillment_status: "processing",
    };

    const { data, error } = await supabase.from("orders").insert(payload).select("*").single();
    if (error) throw error;
    const row = data as OrderRow;
    return Response.json(
      { order: row, orderNumber: row.order_number },
      { status: 201 },
    );
  } catch (error) {
    logger.errorRaw("route", "[api/orders] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

