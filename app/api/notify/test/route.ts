import { getDjSmsRecipients } from "@/lib/notify/djPhones";
import { sendSMS } from "@/lib/notify/sms";
import { sendEmail } from "@/lib/notify/email";
import { logger } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/requireAdmin";
import { createServerClient } from "@/lib/supabase/server";

const notifyTestLimiter = rateLimit({ interval: 60 * 60 * 1000, limit: 3 });

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const ip = getClientIp(request);
    const { success: underLimit } = notifyTestLimiter.check(ip);
    if (!underLimit) {
      logger.warn("notify/test", `Rate limit exceeded for IP: ${ip}`);
      return Response.json(
        { error: "Too many test requests. Try again in an hour." },
        { status: 429, headers: { "Retry-After": "3600" } },
      );
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let body: {
      channel?: "sms" | "email";
      type?: "sms" | "email";
      phone?: string;
      to?: string;
      email?: string;
    } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      /* optional body */
    }

    const raw = body.type ?? body.channel ?? "sms";
    const channel = raw === "email" ? "email" : "sms";

    if (channel === "email") {
      const to =
        body.to?.trim() || body.email?.trim() || process.env.DJ_EMAIL || user?.email;
      if (!to) {
        return Response.json({ error: "No email recipient (set DJ_EMAIL or pass to)" }, { status: 400 });
      }
      const result = await sendEmail({
        to,
        subject: "Test email — Page KillerCutz",
        html: "<p>If you received this, outbound email is working.</p>",
        type: "notify_test",
      });
      return Response.json({ email: result });
    }

    const explicit = body.phone?.trim();
    const targets = explicit ? [explicit] : getDjSmsRecipients();
    if (!targets.length) {
      return Response.json(
        {
          error:
            "Provide body.phone, or set DJ_PHONE and optionally DJ_PHONE_2 (or DJ_PHONES for multiple numbers).",
        },
        { status: 400 },
      );
    }

    const smsResult = await sendSMS(
      targets,
      "Test SMS from Page KillerCutz. If you received this, SMS is working!",
      { type: "notify_test" },
    );

    logger.infoRaw("route", "[notify/test] SMS result:", smsResult);

    return Response.json({
      sms: smsResult,
    });
  } catch (error) {
    logger.errorRaw("route", "[api/notify/test] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
