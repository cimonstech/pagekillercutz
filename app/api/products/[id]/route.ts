import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import type { Database } from "@/lib/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_PRODUCT_PATCH_FIELDS = new Set([
  "name",
  "description",
  "price",
  "category",
  "active",
  "stock_count",
  "image_url",
  "sizes",
  "colors",
]);

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
    if (error) throw error;
    return Response.json({ product: data as ProductRow });
  } catch (error) {
    logger.errorRaw("api/products/[id]", "Error:", error);
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
    for (const key of Object.keys(raw)) {
      if (ALLOWED_PRODUCT_PATCH_FIELDS.has(key)) {
        safeUpdate[key] = raw[key];
      }
    }

    if (Object.keys(safeUpdate).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("products")
      .update(safeUpdate)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ product: data as ProductRow });
  } catch (error) {
    logger.errorRaw("api/products/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true, id });
  } catch (error) {
    logger.errorRaw("api/products/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
