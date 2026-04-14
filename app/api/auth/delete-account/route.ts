import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export async function DELETE() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    logger.error("auth/delete-account", "Failed", err);
    return Response.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
