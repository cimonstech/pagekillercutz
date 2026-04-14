import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendEmail } from "@/lib/notify/email";
import { sendSMS } from "@/lib/notify/sms";
import { getSupabaseAdmin } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.errorResponse;

  const { id } = await params;
  const admin = getSupabaseAdmin();

  const { data: row, error: fetchErr } = await admin.from("notifications").select("*").eq("id", id).maybeSingle();
  if (fetchErr) {
    logger.error("notifications-retry", "fetch failed", fetchErr);
    return Response.json({ error: "Failed to load notification" }, { status: 500 });
  }
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  if (row.status !== "failed") {
    return Response.json({ error: "Only failed notifications can be retried" }, { status: 400 });
  }

  const nextRetry = (row.retry_count ?? 0) + 1;
  await admin.from("notifications").update({ retry_count: nextRetry }).eq("id", id);

  if (row.channel === "email") {
    const to = row.recipient_email;
    const html = row.body;
    const subject = row.subject ?? "Notification";
    if (!to || !html) {
      return Response.json({ error: "Missing email recipient or body on record" }, { status: 400 });
    }
    const result = await sendEmail({
      to,
      subject,
      html,
      type: row.type,
      bookingId: row.booking_id ?? undefined,
      orderId: row.order_id ?? undefined,
      reuseNotificationId: id,
    });
    return Response.json({ success: result.success, error: result.error });
  }

  if (row.channel === "sms") {
    const phone = row.recipient_phone;
    const message = row.body;
    if (!phone || !message) {
      return Response.json({ error: "Missing phone or message body on record" }, { status: 400 });
    }
    const result = await sendSMS(phone, message, {
      type: row.type,
      bookingId: row.booking_id ?? undefined,
      orderId: row.order_id ?? undefined,
      reuseNotificationId: id,
    });
    return Response.json({ success: result.success, error: result.error });
  }

  return Response.json({ error: "Unknown channel" }, { status: 400 });
}
