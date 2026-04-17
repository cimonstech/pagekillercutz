import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"];

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSMeta {
  type?: string;
  bookingId?: string;
  orderId?: string;
  /** When set, skip insert and update this row (retry flow). */
  reuseNotificationId?: string;
}

function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("233") && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return "233" + digits.slice(1);
  }
  if (digits.length === 9) {
    return "233" + digits;
  }
  return digits;
}

type FishAfricaResponse = {
  success?: boolean;
  message?: string;
  data?: Array<{ reference?: string; status?: string }>;
  error?: string | { detail?: string };
};

function errorMessageFromResponse(data: FishAfricaResponse): string {
  const e = data.error;
  if (e != null && typeof e === "object" && "detail" in e && e.detail) {
    return String(e.detail);
  }
  if (typeof data.message === "string" && data.message) {
    return data.message;
  }
  return "SMS send failed";
}

export async function sendSMS(to: string | string[], message: string, meta?: SMSMeta): Promise<SMSResult> {
  const apiKey = process.env.FISH_AFRICA_API_KEY;
  const senderId = process.env.FISH_AFRICA_SENDER_ID || "PAGEMrMusic";
  const admin = getSupabaseAdmin();

  const recipients = (Array.isArray(to) ? to : [to]).map(normalisePhone);
  let notificationId: string | null = meta?.reuseNotificationId ?? null;

  if (!notificationId) {
    try {
      const row: NotificationInsert = {
        type: meta?.type ?? "sms",
        channel: "sms",
        recipient_phone: recipients[0] ?? null,
        body: message,
        status: "pending",
        booking_id: meta?.bookingId ?? null,
        order_id: meta?.orderId ?? null,
      };
      const { data: notif, error } = await admin.from("notifications").insert(row).select("id").single();
      if (error) throw error;
      notificationId = notif?.id ?? null;
    } catch (err) {
      logger.warn("sms", "failed to create notification row", err);
    }
  } else {
    await admin
      .from("notifications")
      .update({
        status: "pending",
        error_message: null,
        failed_at: null,
        sent_at: null,
        body: message,
      } satisfies NotificationUpdate)
      .eq("id", notificationId);
  }

  if (!apiKey) {
    const msg = "API key not configured";
    if (notificationId) {
      await admin
        .from("notifications")
        .update({
          status: "failed",
          error_message: msg,
          failed_at: new Date().toISOString(),
        } satisfies NotificationUpdate)
        .eq("id", notificationId);
    }
    logger.error("sms", msg);
    return { success: false, error: msg };
  }

  if (!apiKey.includes(".")) {
    const msg = "Invalid API key format";
    if (notificationId) {
      await admin
        .from("notifications")
        .update({
          status: "failed",
          error_message: msg,
          failed_at: new Date().toISOString(),
        } satisfies NotificationUpdate)
        .eq("id", notificationId);
    }
    logger.error("sms", "FISH_AFRICA_API_KEY format invalid. Must be app_id.app_secret");
    return { success: false, error: msg };
  }

  logger.info("sms", `Sending to ${recipients.join(", ")}...`);

  try {
    const endpoint = process.env.FISH_AFRICA_SMS_ENDPOINT || "https://api.letsfish.africa/v1/sms";
    const payload = {
      sender_id: senderId,
      message,
      recipients,
    };

    const sendOnce = (url: string) =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

    let usedEndpoint = endpoint;
    let res = await sendOnce(usedEndpoint);

    // Some gateways enforce trailing slash and may return 405 + HTML without it.
    if (res.status === 405 && !usedEndpoint.endsWith("/")) {
      usedEndpoint = `${usedEndpoint}/`;
      logger.warn("sms", `405 from SMS endpoint, retrying with trailing slash: ${usedEndpoint}`);
      res = await sendOnce(usedEndpoint);
    }

    const contentType = res.headers.get("content-type") ?? "unknown";
    const raw = await res.text();
    let data: FishAfricaResponse = {};
    try {
      data = raw ? (JSON.parse(raw) as FishAfricaResponse) : {};
    } catch {
      const rawPreview = raw.slice(0, 280);
      logger.error(
        "sms",
        `Invalid JSON response from Fish Africa (status=${res.status}, content-type=${contentType}, endpoint=${usedEndpoint})`,
        rawPreview,
      );
      const msg = `Invalid response (status=${res.status}, content-type=${contentType}, endpoint=${usedEndpoint})`;
      if (notificationId) {
        await admin
          .from("notifications")
          .update({
            status: "failed",
            error_message: msg,
            failed_at: new Date().toISOString(),
          } satisfies NotificationUpdate)
          .eq("id", notificationId);
      }
      return { success: false, error: msg };
    }

    if (!res.ok || !data.success) {
      const providerMsg = errorMessageFromResponse(data);
      const msg = `${providerMsg} (status=${res.status}, endpoint=${usedEndpoint})`;
      if (notificationId) {
        await admin
          .from("notifications")
          .update({
            status: "failed",
            error_message: msg,
            failed_at: new Date().toISOString(),
          } satisfies NotificationUpdate)
          .eq("id", notificationId);
      }
      logger.error("sms", "Fish Africa error: " + JSON.stringify({ endpoint: usedEndpoint, data }));
      return { success: false, error: msg };
    }

    const firstResult = data.data?.[0];
    if (notificationId) {
      await admin
        .from("notifications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        } satisfies NotificationUpdate)
        .eq("id", notificationId);
    }
    logger.info(
      "sms",
      `Sent successfully. Reference: ${firstResult?.reference ?? "—"} Status: ${firstResult?.status ?? "—"} Endpoint: ${usedEndpoint}`,
    );

    return {
      success: true,
      messageId: firstResult?.reference,
    };
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
    logger.error("sms", "Network error", err);
    return { success: false, error: String(err) };
  }
}

export async function sendSMSBulk(recipients: string[], message: string): Promise<SMSResult> {
  return sendSMS(recipients, message);
}
