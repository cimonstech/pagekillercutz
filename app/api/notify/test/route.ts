import { logger } from "@/lib/logger";
type TestPayload = {
  phone: string;
  email: string;
};

import { sendSMS } from "@/lib/notify/sms";
import { sendEmail } from "@/lib/notify/email";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-admin-secret") !== process.env.ADMIN_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = (await request.json()) as TestPayload;
    if (!body.phone || !body.email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const [smsRes, emailRes] = await Promise.all([
      sendSMS(body.phone, "Page KillerCutz test SMS successful."),
      sendEmail({
        to: body.email,
        subject: "Page KillerCutz test email",
        html: "<p>Test email delivery successful.</p>",
      }),
    ]);
    logger.infoRaw("route", "[notify/test] SMS:", smsRes, "Email:", emailRes);
    return Response.json({ success: true, message: "Test notifications queued" });
  } catch (error) {
    logger.errorRaw("route", "[api/notify/test] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

