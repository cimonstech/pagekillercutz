import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const showAll = searchParams.get("all") === "true";
    const limitRaw = searchParams.get("limit");
    const limitParsed =
      limitRaw != null && limitRaw !== ""
        ? Math.min(200, Math.max(1, Number(limitRaw)))
        : null;

    let query = supabase.from("products").select("*").order("created_at", { ascending: false });
    if (limitParsed != null) query = query.limit(limitParsed);

    if (!showAll) query = query.eq("active", true);
    if (category) query = query.eq("category", category);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    const products = (data ?? []) as ProductRow[];
    return Response.json({ products, count: products.length });
  } catch (error) {
    logger.errorRaw("api/products", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as ProductInsert;
    if (!body.name || body.price === undefined) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const { data, error } = await supabase.from("products").insert(body).select("*").single();
    if (error) throw error;
    return Response.json({ product: data as ProductRow }, { status: 201 });
  } catch (error) {
    logger.errorRaw("api/products", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
