import { requireAdmin } from "@/lib/requireAdmin";
import { sendEmail } from "@/lib/notify/email";
import { orderPlacedClient } from "@/lib/notify/emailTemplates";
import { getDjSmsRecipients } from "@/lib/notify/djPhones";
import { sendSMS } from "@/lib/notify/sms";
import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";

type Body = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: {
    product_id: string;
    name: string;
    size: string;
    colour: string;
    qty: number;
    price: number;
  }[];
  total: number;
};

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const body = (await request.json()) as Body;
    const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://pagekillercutz.com").replace(/\/$/, "");
    const djPhones = getDjSmsRecipients();
    const admin = getSupabaseAdmin();
    const { data: paymentSettings } = await admin.from("payment_settings").select("*").maybeSingle();
    const momoDisplay = paymentSettings?.momo_number
      ? `${paymentSettings?.momo_network ?? "MoMo"} ${paymentSettings.momo_number}`
      : "Payment details in confirmation";

    if (!body.orderNumber || !body.customerPhone) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const customerSMS =
      `Hi ${body.customerName}, your ` +
      `Page KillerCutz order has been placed!\n` +
      `Order ID: ${body.orderNumber}\n` +
      `Total: GH₵${body.total.toLocaleString("en-GH")}\n` +
      `Send payment via MoMo to ${momoDisplay}\n` +
      `Use ${body.orderNumber} as reference.\n` +
      `Track: ${BASE_URL}/track-order\n` +
      `— Page KillerCutz`;

    await sendSMS(body.customerPhone, customerSMS);

    await sendEmail({
      to: body.customerEmail,
      subject: `Order Placed — ${body.orderNumber}`,
      html: orderPlacedClient({
        orderNumber: body.orderNumber,
        customerName: body.customerName,
        items: body.items.map((i) => ({
          name: i.name,
          size: i.size,
          colour: i.colour,
          qty: i.qty,
          price: i.price,
        })),
        total: body.total,
        djMomo: momoDisplay,
        trackUrl: `${BASE_URL}/track-order`,
      }),
    });

    if (djPhones.length) {
      const djSMS =
        `[New Order] ${body.orderNumber} — ` +
        `${body.customerName}. ` +
        `GH₵${body.total.toLocaleString("en-GH")}. ` +
        `Admin: ${BASE_URL}/admin`;
      await sendSMS(djPhones, djSMS);
    }

    return Response.json({ success: true });
  } catch (err) {
    logger.errorRaw("route", "[notify/order-placed]", err);
    return Response.json({ error: "Notification failed" }, { status: 500 });
  }
}
