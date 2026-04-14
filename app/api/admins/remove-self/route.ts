import { createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";

type AdminRow = Database["public"]["Tables"]["admins"]["Row"];

export async function DELETE() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const email = user.email.trim();

    const { data: adminRecord, error: fetchErr } = await admin
      .from("admins")
      .select("role, status")
      .ilike("email", email)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    const row = adminRecord as Pick<AdminRow, "role" | "status"> | null;
    if (!row) {
      return Response.json({ error: "Not an admin" }, { status: 403 });
    }

    if (row.role === "super_admin") {
      const { count, error: countErr } = await admin
        .from("admins")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin")
        .eq("status", "active");
      if (countErr) throw countErr;
      if ((count ?? 0) <= 1) {
        return Response.json(
          { error: "Cannot remove the only super admin account." },
          { status: 400 },
        );
      }
    }

    const { error: delErr } = await admin.from("admins").delete().ilike("email", email);
    if (delErr) throw delErr;

    const { error: auditErr } = await admin.from("audit_logs").insert({
      actor: email,
      actor_role: row.role,
      action_type: "account",
      description: `Admin removed own account: ${email}`,
      target_id: null,
      ip_address: null,
    });
    if (auditErr) {
      logger.errorRaw("route", "[api/admins/remove-self] audit insert:", auditErr);
    }

    return Response.json({ success: true });
  } catch (err) {
    logger.errorRaw("route", "[api/admins/remove-self]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
