import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type RouteContext = { params: Promise<{ id: string }> };

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
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as ProductUpdate;
    const { data, error } = await supabase
      .from("products")
      .update({ ...body })
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
