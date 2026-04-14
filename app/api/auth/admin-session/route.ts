import { cookies } from "next/headers";
import { encryptAdminSessionPayload } from "@/lib/adminCookie";
import { logger } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient as createServerSupabaseClient } from "@/lib/supabase/server";

const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "";
const adminSessionLimiter = rateLimit({ interval: 15 * 60 * 1000, limit: 10 });

/** Current staff role from session + admins table (for UI routing — not a substitute for middleware). */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.errorResponse;
  return Response.json({ role: auth.role, email: auth.email });
}

export async function POST(request: Request) {
  try {
    if (!ADMIN_SESSION_SECRET) {
      return Response.json(
        { error: "Missing ADMIN_SESSION_SECRET" },
        { status: 500 },
      );
    }

    const ip = getClientIp(request);
    const { success: underLimit } = adminSessionLimiter.check(ip);
    if (!underLimit) {
      logger.warn("admin-session", `Rate limit exceeded for IP: ${ip}`);
      return Response.json(
        { error: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": "900" } },
      );
    }

    const body = (await request.json()) as { email?: string; role?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || user.email.toLowerCase() !== email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: adminRecord, error } = await admin
      .from("admins")
      .select("role, status, email")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      logger.error("admin-session", "admins lookup failed", error);
      return Response.json({ error: "Admin verification failed" }, { status: 500 });
    }

    if (
      !adminRecord ||
      adminRecord.status !== "active" ||
      (adminRecord.role !== "admin" && adminRecord.role !== "super_admin")
    ) {
      return Response.json({ error: "Not an active admin" }, { status: 403 });
    }

    const payload = JSON.stringify({
      email,
      role: adminRecord.role,
      iat: Date.now(),
    });
    const cookieValue = await encryptAdminSessionPayload(payload, ADMIN_SESSION_SECRET);

    const cookieStore = await cookies();
    cookieStore.set("admin_session", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return Response.json({ success: true, role: adminRecord.role });
  } catch (err) {
    logger.errorRaw("admin-session", "[api/auth/admin-session] POST", err);
    return Response.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    return Response.json({ success: true });
  } catch (err) {
    logger.errorRaw("admin-session", "[api/auth/admin-session] DELETE", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
