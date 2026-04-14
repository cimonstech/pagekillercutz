import { randomBytes } from "crypto";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/notify/email";
import * as ET from "@/lib/notify/emailTemplates";
import { requireAdmin, requireSuperAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type AdminRow = Database["public"]["Tables"]["admins"]["Row"];

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("admins").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ admins: (data ?? []) as AdminRow[] });
  } catch (error) {
    logger.errorRaw("route", "[api/admins] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

type CreateAdminBody = {
  email?: string;
  role?: "admin" | "super_admin";
  status?: "active" | "suspended";
  temporaryPassword?: string;
};

export async function POST(request: Request) {
  try {
    const superAuth = await requireSuperAdmin();
    if (!superAuth.authorized) return superAuth.errorResponse;

    const body = (await request.json()) as CreateAdminBody;
    const email = body.email?.trim().toLowerCase();
    const role = body.role;
    if (!email || !role) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (role !== "admin" && role !== "super_admin") {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const temporaryPassword =
      body.temporaryPassword?.trim() ||
      randomBytes(12).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 14) ||
      `PKC-${randomBytes(6).toString("hex")}`;

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
    });

    if (authError || !authUser?.user) {
      logger.errorRaw("route", "[api/admins] createUser:", authError);
      return Response.json({ error: "Failed to create auth account" }, { status: 400 });
    }

    const { data: row, error: insertError } = await supabase
      .from("admins")
      .insert({
        email,
        role,
        status: body.status ?? "active",
        last_login: null,
      })
      .select("*")
      .single();

    if (insertError) {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      logger.errorRaw("route", "[api/admins] insert:", insertError);
      return Response.json({ error: "Failed to create admin record" }, { status: 400 });
    }

    const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://pagekillercutz.com").replace(/\/$/, "");
    const loginUrl = `${BASE_URL}/admin/login`;

    await sendEmail({
      to: email,
      subject: "You've been added as an admin — Page KillerCutz",
      html: ET.adminWelcomeEmail({
        email,
        role,
        loginUrl,
        temporaryPassword,
      }),
    }).catch((e) => logger.errorRaw("route", "[api/admins] welcome email:", e));

    return Response.json({ admin: row as AdminRow }, { status: 201 });
  } catch (error) {
    logger.errorRaw("route", "[api/admins] POST Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
