import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import type { Database } from "@/lib/database.types";

type PackageRow = Database["public"]["Tables"]["packages"]["Row"];
type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_PACKAGE_PATCH_FIELDS = new Set([
  "name",
  "description",
  "price",
  "active",
  "display_order",
  "inclusions",
]);

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("packages").select("*").eq("id", id).single();
    if (error) throw error;
    return Response.json({ package: data as PackageRow });
  } catch (error) {
    logger.errorRaw("api/packages/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const raw = (await request.json()) as Record<string, unknown>;

    const safeUpdate: Record<string, unknown> = {};
    // Backward compatibility: older clients may still send `features`.
    if (Array.isArray(raw.features) && !("inclusions" in raw)) {
      safeUpdate.inclusions = raw.features;
    }
    for (const key of Object.keys(raw)) {
      if (ALLOWED_PACKAGE_PATCH_FIELDS.has(key)) {
        safeUpdate[key] = raw[key];
      }
    }

    if (Object.keys(safeUpdate).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("packages")
      .update(safeUpdate)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ package: data as PackageRow });
  } catch (error) {
    logger.errorRaw("api/packages/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    logger.errorRaw("api/packages/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
