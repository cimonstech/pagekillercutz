import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/notify/email";
import * as ET from "@/lib/notify/emailTemplates";
import { sendSMS } from "@/lib/notify/sms";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://pagekillercutz.com").replace(/\/$/, "");

export async function POST(request: Request) {
  try {
    const { orderId } = (await request.json()) as { orderId?: string };
    if (!orderId) {
      return Response.json({ error: "orderId required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
    if (error || !row) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const o = row as OrderRow;
    const trackUrl = `${BASE}/client/orders`;
    const sms = `Hi ${o.customer_name}, order ${o.order_number} has shipped. Track: ${trackUrl}`;

    await Promise.allSettled([
      sendSMS(o.customer_phone, sms),
      sendEmail({
        to: o.customer_email,
        subject: `Your order is on its way — ${o.order_number}`,
        html: ET.orderShippedClient({
          orderNumber: o.order_number,
          customerName: o.customer_name,
          trackUrl,
        }),
      }),
    ]);

    return Response.json({ success: true });
  } catch (err) {
    logger.errorRaw("route", "[api/notify/order-shipped]", err);
    return Response.json({ error: "Notification failed" }, { status: 500 });
  }
}
