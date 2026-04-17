import { requireSuperAdmin } from "@/lib/requireAdmin";

function mask(value: string | undefined, visible = 4): string | null {
  if (!value) return null;
  if (value.length <= visible) return "*".repeat(value.length);
  return `${value.slice(0, visible)}${"*".repeat(Math.max(4, value.length - visible))}`;
}

function extractDomain(from: string | undefined): string | null {
  if (!from) return null;
  const match = from.match(/@([^>\s]+)/);
  return match?.[1]?.toLowerCase() ?? null;
}

const DEFAULT_FROM = "Page KillerCutz <noreply@pagekillercutz.com>";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.authorized) return auth.errorResponse;

  const emailFrom = process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
  const resendKey = process.env.RESEND_API_KEY;
  const fishKey = process.env.FISH_AFRICA_API_KEY;
  const hookSecret = process.env.SUPABASE_AUTH_HOOK_SECRET;

  return Response.json({
    env: process.env.NODE_ENV,
    email: {
      from: emailFrom,
      fromDomain: extractDomain(emailFrom),
      resendKeyPresent: Boolean(resendKey),
      resendKeyPreview: mask(resendKey, 6),
    },
    sms: {
      senderId: process.env.FISH_AFRICA_SENDER_ID || "PAGEMrMusic",
      fishKeyPresent: Boolean(fishKey),
      fishKeyPreview: mask(fishKey, 6),
    },
    authHook: {
      secretPresent: Boolean(hookSecret),
      secretPreview: mask(hookSecret, 6),
      endpoint: "/api/auth/send-email",
    },
  });
}

