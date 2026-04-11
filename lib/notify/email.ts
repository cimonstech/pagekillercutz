import { logger } from "../logger";
import { Resend } from "resend";

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
}

const FROM = process.env.EMAIL_FROM || "Page KillerCutz <noreply@pagekillercutz.com>";

export async function sendEmail(
  payload: EmailPayload,
): Promise<EmailResult> {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
    });

    if (error) {
      logger.errorRaw("email", "[Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    logger.infoRaw("email", "[Email] Sent:", data?.id, "→", payload.to);
    return { success: true, id: data?.id };
  } catch (err) {
    logger.errorRaw("email", "[Email] Error:", err);
    return { success: false, error: String(err) };
  }
}

