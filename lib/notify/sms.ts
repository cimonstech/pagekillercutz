import { logger } from "../logger";
export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233")) return `+${digits}`;
  if (digits.startsWith("0")) return `+233${digits.slice(1)}`;
  return `+${digits}`;
}

export async function sendSMS(
  to: string | string[],
  message: string,
): Promise<SMSResult> {
  const apiKey = process.env.FISH_AFRICA_API_KEY;
  if (!apiKey) {
    logger.errorRaw("sms", "[SMS] FISH_AFRICA_API_KEY not set");
    return { success: false, error: "API key not configured" };
  }

  const recipients = (Array.isArray(to) ? to : [to]).map(normalisePhone);

  try {
    const res = await fetch("https://api.letsfish.africa/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: recipients,
        message,
        sender_id: process.env.FISH_AFRICA_SENDER_ID || "Page KillerCutz",
      }),
    });

    const data = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      logger.errorRaw("sms", "[SMS] Fish Africa error:", data);
      return {
        success: false,
        error: (data?.message as string) || "SMS failed",
      };
    }

    logger.infoRaw("sms", `[SMS] Sent to ${recipients.join(", ")}`);
    return {
      success: true,
      messageId: (data?.message_id as string) || (data?.id as string),
    };
  } catch (err) {
    logger.errorRaw("sms", "[SMS] Network error:", err);
    return { success: false, error: String(err) };
  }
}

