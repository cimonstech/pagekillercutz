import { logger } from "@/lib/logger";

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
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

export async function sendSMS(to: string | string[], message: string): Promise<SMSResult> {
  const apiKey = process.env.FISH_AFRICA_API_KEY;
  const senderId = process.env.FISH_AFRICA_SENDER_ID || "PAGEMrMusic";

  if (!apiKey) {
    logger.error("sms", "FISH_AFRICA_API_KEY not set");
    return {
      success: false,
      error: "API key not configured",
    };
  }

  if (!apiKey.includes(".")) {
    logger.error("sms", "FISH_AFRICA_API_KEY format invalid. Must be app_id.app_secret");
    return {
      success: false,
      error: "Invalid API key format",
    };
  }

  const recipients = (Array.isArray(to) ? to : [to]).map(normalisePhone);

  logger.info("sms", `Sending to ${recipients.join(", ")}...`);

  try {
    const res = await fetch("https://api.letsfish.africa/v1/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sender_id: senderId,
        message,
        recipients,
      }),
    });

    let data: FishAfricaResponse = {};
    try {
      data = (await res.json()) as FishAfricaResponse;
    } catch {
      logger.error("sms", "Invalid JSON response from Fish Africa");
      return { success: false, error: "Invalid response" };
    }

    if (!res.ok || !data.success) {
      logger.error("sms", "Fish Africa error: " + JSON.stringify(data));
      return {
        success: false,
        error: errorMessageFromResponse(data),
      };
    }

    const firstResult = data.data?.[0];
    logger.info(
      "sms",
      `Sent successfully. Reference: ${firstResult?.reference ?? "—"} Status: ${firstResult?.status ?? "—"}`,
    );

    return {
      success: true,
      messageId: firstResult?.reference,
    };
  } catch (err) {
    logger.error("sms", "Network error", err);
    return {
      success: false,
      error: String(err),
    };
  }
}

/** Send the same message to multiple numbers in one API call. */
export async function sendSMSBulk(recipients: string[], message: string): Promise<SMSResult> {
  return sendSMS(recipients, message);
}
