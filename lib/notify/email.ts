import { logger } from "../logger";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"];

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not set");
    _resend = new Resend(key);
  }
  return _resend;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  type?: string;
  bookingId?: string;
  orderId?: string;
  /** When set, skip insert and update this row (retry flow). */
  reuseNotificationId?: string;
}

const FROM = process.env.EMAIL_FROM || "Page KillerCutz <noreply@pagekillercutz.com>";

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const admin = getSupabaseAdmin();
  const recipient = Array.isArray(payload.to) ? payload.to[0] : payload.to;
  let notificationId: string | null = payload.reuseNotificationId ?? null;

  if (!notificationId) {
    try {
      const row: NotificationInsert = {
        type: payload.type ?? "email",
        channel: "email",
        recipient_email: recipient,
        subject: payload.subject,
        body: payload.html,
        status: "pending",
        booking_id: payload.bookingId ?? null,
        order_id: payload.orderId ?? null,
      };
      const { data: notif, error } = await admin.from("notifications").insert(row).select("id").single();
      if (error) throw error;
      notificationId = notif?.id ?? null;
    } catch (err) {
      logger.warnRaw("email", "[Email] Failed to create notification row:", err);
    }
  } else {
    await admin
      .from("notifications")
      .update({
        status: "pending",
        error_message: null,
        failed_at: null,
        sent_at: null,
        body: payload.html,
        subject: payload.subject,
      } satisfies NotificationUpdate)
      .eq("id", notificationId);
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
    });

    if (error) {
      if (notificationId) {
        await admin
          .from("notifications")
          .update({
            status: "failed",
            error_message: error.message,
            failed_at: new Date().toISOString(),
          } satisfies NotificationUpdate)
          .eq("id", notificationId);
      }
      logger.errorRaw("email", "[Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    if (notificationId) {
      await admin
        .from("notifications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        } satisfies NotificationUpdate)
        .eq("id", notificationId);
    }

    logger.infoRaw("email", "[Email] Sent:", data?.id, "→", payload.to);
    return { success: true, id: data?.id };
  } catch (err) {
    if (notificationId) {
      await admin
        .from("notifications")
        .update({
          status: "failed",
          error_message: String(err),
          failed_at: new Date().toISOString(),
        } satisfies NotificationUpdate)
        .eq("id", notificationId);
    }
    logger.errorRaw("email", "[Email] Error:", err);
    return { success: false, error: String(err) };
  }
}
