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

type FishAfricaMessageItem = { reference?: string; status?: string };

type FishAfricaResponse = {
  success?: boolean;
  status?: string;
  message?: string;
  data?: FishAfricaMessageItem[];
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

function parseResponse(raw: string): { data: FishAfricaResponse; items: FishAfricaMessageItem[] } {
  const parsed = raw ? JSON.parse(raw) : {};
  // Fish Africa may return an array directly or { success, data: [...] }
  if (Array.isArray(parsed)) {
    return { data: { success: true, data: parsed }, items: parsed };
  }
  const obj = parsed as FishAfricaResponse;
  return { data: obj, items: obj.data ?? [] };
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
    const [appId, appSecret] = apiKey.split(".");
    if (!appId || !appSecret) {
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

    const res = await fetch("https://api.letsfish.africa/v1/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender_id: senderId,
        message,
        recipients,
      }),
    });

    const contentType = res.headers.get("content-type") ?? "unknown";
    const raw = await res.text();

    // Cloudflare / upstream edge blocks often return HTML or text, not JSON.
    if (!contentType.toLowerCase().includes("application/json")) {
      const rawPreview = raw.slice(0, 280);
      const msg = "SMS blocked by Cloudflare. Deploy to VPS to resolve.";
      logger.error(
        "sms",
        `Cloudflare block (${res.status}) non-JSON response. content-type=${contentType}. preview=${rawPreview}`,
      );
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

    let data: FishAfricaResponse = {};
    let items: FishAfricaMessageItem[] = [];
    try {
      ({ data, items } = parseResponse(raw));
    } catch {
      const rawPreview = raw.slice(0, 280);
      logger.error(
        "sms",
        `Invalid JSON response from Fish Africa (status=${res.status}, content-type=${contentType})`,
        rawPreview,
      );
      const msg = `Invalid response (status=${res.status}, content-type=${contentType})`;
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

    if (!res.ok || data.status === "error" || data.success === false) {
      const baseMsg = errorMessageFromResponse(data) || `HTTP ${res.status}`;
      const lower = baseMsg.toLowerCase();
      let hint = "";
      if (lower.includes("sender")) {
        hint = " (Sender ID may not be approved)";
      } else if (lower.includes("credit") || lower.includes("balance")) {
        hint = " (Check account balance)";
      } else if (lower.includes("fulfill")) {
        hint = " (Temporary Fish Africa issue — retry later)";
      }
      const msg = `${baseMsg}${hint}`;
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
      logger.error("sms", `Fish Africa error (status=${res.status}): ${baseMsg}`);
      return { success: false, error: msg };
    }

    const firstResult = items[0];
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
      `Sent successfully. Reference: ${firstResult?.reference ?? "—"} Status: ${firstResult?.status ?? "—"}`,
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
