import { findAuthUserByEmail } from "@/lib/authAdminUsers";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/notify/email";
import { adminInviteEmail } from "@/lib/notify/emailTemplates";
import { requireSuperAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import { adminInviteSchema } from "@/lib/validation/schemas";
import { validate } from "@/lib/validation/validate";

export async function POST(request: Request) {
  try {
    const superAuth = await requireSuperAdmin();
    if (!superAuth.authorized) return superAuth.errorResponse;

    const raw = await request.json();
    const parsed = validate(adminInviteSchema, raw);
    if (!parsed.success) {
      return Response.json({ error: parsed.error, details: parsed.details }, { status: 400 });
    }
    const email = parsed.data.email.trim().toLowerCase();
    const role = parsed.data.role;

    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    const { data: existingAdmin, error: existingErr } = await admin
      .from("admins")
      .select("email")
      .ilike("email", email)
      .maybeSingle();

    if (existingErr) {
      logger.errorRaw("api/admins/invite", "Existing admin check failed:", existingErr);
      return Response.json({ error: "Failed to validate target account." }, { status: 500 });
    }

    if (existingAdmin) {
      return Response.json({ error: "This email is already registered as an admin." }, { status: 409 });
    }

    const existingAuthUser = await findAuthUserByEmail(admin, email);
    if (existingAuthUser && !existingAuthUser.email_confirmed_at) {
      const { error: confirmErr } = await admin.auth.admin.updateUserById(existingAuthUser.id, { email_confirm: true });
      if (confirmErr) logger.errorRaw("api/admins/invite", "Confirm existing user failed:", confirmErr);
    }

    if (!existingAuthUser) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          role,
          invited_by: user.email,
        },
      });

      if (createErr || !created.user) {
        logger.errorRaw("api/admins/invite", "Create auth user failed:", createErr);
        return Response.json({ error: "Failed to create auth account" }, { status: 500 });
      }
    }

    const { error: insertErr } = await admin.from("admins").insert({
      email,
      role,
      status: "active",
      last_login: null,
    });

    if (insertErr) {
      logger.errorRaw("api/admins/invite", "Insert admin row failed:", insertErr);
      return Response.json({ error: "Failed to create admin record" }, { status: 500 });
    }

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://pagekillercutz.com").replace(/\/$/, "");

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${baseUrl}/reset-password?step=3`,
      },
    });

    const setupUrl = linkData?.properties?.action_link;
    if (linkErr || !setupUrl) {
      logger.errorRaw("api/admins/invite", "Generate link failed:", linkErr);
      return Response.json(
        {
          error: `Admin created but invite email failed. Ask them to use 'Forgot Password' at ${baseUrl}/admin/login`,
        },
        { status: 500 },
      );
    }

    const emailResult = await sendEmail({
      to: email,
      subject: "You've been invited to Page KillerCutz Admin",
      html: adminInviteEmail({
        email,
        role,
        invitedBy: user.email || "Super Admin",
        setupUrl,
        loginUrl: `${baseUrl}/admin/login`,
      }),
    });

    if (!emailResult.success) {
      logger.errorRaw("api/admins/invite", "Send email failed:", emailResult.error);
      return Response.json(
        {
          error: `Admin created but invite email failed. Ask them to use 'Forgot Password' at ${baseUrl}/admin/login`,
        },
        { status: 500 },
      );
    }

    return Response.json({ success: true, message: `Invite sent to ${email}` });
  } catch (error) {
    logger.errorRaw("api/admins/invite", "Error:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
