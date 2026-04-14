import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { requireAdmin, requireSuperAdmin } from "@/lib/requireAdmin";
import type { Database } from "@/lib/database.types";

type AdminRow = Database["public"]["Tables"]["admins"]["Row"];
type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_ADMIN_PATCH_FIELDS = new Set([
  "last_login",
  "status",
  "role",
]);

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const raw = (await request.json()) as Record<string, unknown>;

    // Only super_admin can change role or status; regular admins can only update last_login
    const hasSensitiveFields = raw.role !== undefined || raw.status !== undefined;
    const auth = hasSensitiveFields ? await requireSuperAdmin() : await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const safeUpdate: Record<string, unknown> = {};
    for (const key of Object.keys(raw)) {
      if (ALLOWED_ADMIN_PATCH_FIELDS.has(key)) {
        safeUpdate[key] = raw[key];
      }
    }

    if (Object.keys(safeUpdate).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("admins")
      .update(safeUpdate as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ admin: data as AdminRow });
  } catch (error) {
    logger.errorRaw("api/admins/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("admins").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    logger.errorRaw("api/admins/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
