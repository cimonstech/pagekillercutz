import { sendSMS } from "@/lib/notify/sms";
import { sendEmail } from "@/lib/notify/email";
import { logger } from "@/lib/logger";
import { createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

async function isActiveAdminEmail(email: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("admins")
    .select("role, status")
    .ilike("email", email)
    .maybeSingle();
  const row = data as { role: string; status: string } | null;
  return !!(
    row &&
    row.status === "active" &&
    (row.role === "admin" || row.role === "super_admin")
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let authorized = false;
    if (user?.email && (await isActiveAdminEmail(user.email))) {
      authorized = true;
    }

    if (!authorized) {
      const adminSecret = request.headers.get("x-admin-secret");
      const secretOk =
        adminSecret &&
        (adminSecret === process.env.ADMIN_SECRET ||
          adminSecret === process.env.NEXT_PUBLIC_ADMIN_SECRET);
      if (!secretOk) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

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
      });
      return Response.json({ email: result });
    }

    const target = body.phone?.trim() || process.env.DJ_PHONE;
    if (!target) {
      return Response.json(
        { error: "Provide body.phone or set DJ_PHONE in the environment." },
        { status: 400 },
      );
    }

    const smsResult = await sendSMS(target, "Test SMS from Page KillerCutz. If you received this, SMS is working!");

    logger.infoRaw("route", "[notify/test] SMS result:", smsResult);

    return Response.json({
      sms: smsResult,
    });
  } catch (error) {
    logger.errorRaw("route", "[api/notify/test] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
