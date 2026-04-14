import { logger } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { orderSchema } from "@/lib/validation/schemas";
import { validate } from "@/lib/validation/validate";

const orderPostLimiter = rateLimit({ interval: 60 * 60 * 1000, limit: 10 });

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];

export async function GET(request: Request) {
  try {
    const userSupabase = await createServerClient();
    const {
      data: { user },
    } = await userSupabase.auth.getUser();

    const adminClient = getSupabaseAdmin();

    let isAdmin = false;
    if (user?.email) {
      const { data: adminRecord } = await adminClient
        .from("admins")
        .select("role, status")
        .ilike("email", user.email)
        .maybeSingle();
      isAdmin = !!(adminRecord && adminRecord.status === "active");
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 200);
    const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);

    if (!isAdmin) {
      if (!user?.email) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const forcedEmail = user.email.trim();

      let query = adminClient
        .from("orders")
        .select("*", { count: "exact" })
        .ilike("customer_email", forcedEmail)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const status = searchParams.get("status");
      const paymentStatus = searchParams.get("payment_status");
      const orderNumber = searchParams.get("orderNumber");
      const search = searchParams.get("search");

      if (status) {
        query = query.eq("fulfillment_status", status as OrderRow["fulfillment_status"]);
      }
      if (paymentStatus) {
        query = query.eq("payment_status", paymentStatus as OrderRow["payment_status"]);
      }
      if (orderNumber) query = query.eq("order_number", orderNumber);
      if (search) {
        const term = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
        query = query.or(
          `order_number.ilike.${term},customer_name.ilike.${term}`,
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return Response.json({ orders: (data ?? []) as OrderRow[], count: count ?? 0 });
    }

    const emailParam = searchParams.get("email");
    let query = adminClient
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (emailParam?.trim()) {
      query = query.ilike("customer_email", emailParam.trim());
    }

    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("payment_status");
    const search = searchParams.get("search");
    const orderNumber = searchParams.get("orderNumber");

    if (status) {
      query = query.eq("fulfillment_status", status as OrderRow["fulfillment_status"]);
    }
    if (paymentStatus) {
      query = query.eq("payment_status", paymentStatus as OrderRow["payment_status"]);
    }
    if (orderNumber) query = query.eq("order_number", orderNumber);
    if (search) {
      const term = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
      query = query.or(
        `order_number.ilike.${term},customer_name.ilike.${term},customer_email.ilike.${term}`,
      );
    }

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
    const ip = getClientIp(request);
    const { success: underLimit } = orderPostLimiter.check(ip);
    if (!underLimit) {
      logger.warn("orders", `Rate limit exceeded for IP: ${ip}`);
      return Response.json(
        { error: "Too many order attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": "3600", "X-RateLimit-Remaining": "0" },
        },
      );
    }

    const supabase = getSupabaseAdmin();
    const json = (await request.json()) as unknown;
    const raw = json as IncomingOrderBody & Partial<OrderInsert>;
    const normalized = {
      customerName: raw.customerName ?? raw.customer_name,
      customerEmail: raw.customerEmail ?? raw.customer_email,
      customerPhone: raw.customerPhone ?? raw.customer_phone ?? "",
      deliveryAddress: raw.deliveryAddress ?? raw.delivery_address ?? "",
      region: raw.region ?? "",
      notes: raw.notes ?? null,
      items: raw.items,
      total: raw.total,
    };

    const validation = validate(orderSchema, normalized);
    if (!validation.success) {
      return Response.json({ error: validation.error, details: validation.details }, { status: 400 });
    }
    const o = validation.data;

    // Verify all item prices against the database — never trust client-submitted prices
    const productIds = o.items.map((i) => i.product_id);
    const { data: dbProducts, error: productsErr } = await supabase
      .from("products")
      .select("id, price, active")
      .in("id", productIds);

    if (productsErr) {
      logger.errorRaw("route", "[api/orders] Products lookup error:", productsErr);
      return Response.json({ error: "Failed to verify product prices" }, { status: 500 });
    }

    const priceMap = new Map((dbProducts ?? []).map((p) => [p.id, { price: p.price, active: p.active }]));

    for (const item of o.items) {
      const product = priceMap.get(item.product_id);
      if (!product) {
        return Response.json({ error: `Product not found: ${item.product_id}` }, { status: 400 });
      }
      if (!product.active) {
        return Response.json({ error: `Product is no longer available` }, { status: 400 });
      }
    }

    // Rebuild items and total using server-side prices
    const verifiedItems = o.items.map((item) => ({
      ...item,
      price: priceMap.get(item.product_id)!.price,
    }));
    const verifiedTotal = verifiedItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    let delivery = o.deliveryAddress.trim();
    if (o.notes?.trim()) {
      delivery = delivery ? `${delivery}\n\nNotes: ${o.notes.trim()}` : `Notes: ${o.notes.trim()}`;
    }

    const order_number = `ORD-${Date.now().toString(36).slice(-4).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const payload: OrderInsert = {
      order_number,
      customer_name: o.customerName.trim(),
      customer_email: o.customerEmail.trim(),
      customer_phone: o.customerPhone.trim(),
      delivery_address: delivery,
      region: o.region.trim() || "Greater Accra",
      items: verifiedItems as OrderRow["items"],
      total: verifiedTotal,
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
