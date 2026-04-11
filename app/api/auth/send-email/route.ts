import { Webhook } from "standardwebhooks";
import { NextResponse } from "next/server";
import { buildAuthActionEmail } from "@/lib/auth/auth-email-html";
import { sendEmail } from "@/lib/notify/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type HookBody = {
  user?: { email?: string };
  email_data?: {
    token_hash: string;
    token?: string;
    redirect_to?: string;
    email_action_type?: string;
    site_url?: string;
    /** Some Supabase versions send a full URL */
    confirmation_url?: string;
  };
};

function getWebhook(): Webhook | null {
  const raw = process.env.SUPABASE_AUTH_HOOK_SECRET?.trim();
  if (!raw) return null;
  const secret = raw.startsWith("v1,") ? raw.slice(3) : raw;
  return new Webhook(secret);
}

function buildConfirmationUrl(data: NonNullable<HookBody["email_data"]>): string | null {
  if (data.confirmation_url) return data.confirmation_url;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const token = data.token_hash || data.token;
  const type = data.email_action_type;
  const redirect = data.redirect_to ?? `${getSiteFallback()}/`;

  if (!supabaseUrl || !token || !type) return null;

  const u = new URL(`${supabaseUrl}/auth/v1/verify`);
  u.searchParams.set("token", token);
  u.searchParams.set("type", type);
  u.searchParams.set("redirect_to", redirect);
  return u.toString();
}

function getSiteFallback(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const wh = getWebhook();
  if (!wh) {
    logger.errorRaw("auth-hook", "[send-email] SUPABASE_AUTH_HOOK_SECRET not set");
    return NextResponse.json({ error: "Hook not configured" }, { status: 503 });
  }

  let body: HookBody;
  try {
    const headers: Record<string, string> = {};
    request.headers.forEach((v, k) => {
      headers[k] = v;
    });
    body = wh.verify(rawBody, headers) as HookBody;
  } catch (e) {
    logger.errorRaw("auth-hook", "[send-email] Verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const email = body.user?.email;
  const emailData = body.email_data;
  if (!email || !emailData?.email_action_type) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const confirmationUrl = buildConfirmationUrl(emailData);
  if (!confirmationUrl) {
    logger.errorRaw("auth-hook", "[send-email] Could not build confirmation URL", emailData);
    return NextResponse.json({ error: "Bad email_data" }, { status: 400 });
  }

  const { subject, html } = buildAuthActionEmail({
    action: emailData.email_action_type,
    confirmationUrl,
  });

  const result = await sendEmail({ to: email, subject, html });
  if (!result.success) {
    logger.errorRaw("auth-hook", "[send-email] Resend failed:", result.error);
    return NextResponse.json({ error: result.error ?? "send failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
