import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type PackageRow = Database["public"]["Tables"]["packages"]["Row"];
type PackageInsert = Database["public"]["Tables"]["packages"]["Insert"];

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const name = searchParams.get("name")?.trim();

    if (name) {
      let q = supabase.from("packages").select("*").eq("name", name);
      if (!all) q = q.eq("active", true);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return Response.json({ packages: data ? ([data] as PackageRow[]) : [] });
    }

    let query = supabase.from("packages").select("*").order("display_order", { ascending: true });
    if (!all) query = query.eq("active", true);

    const { data, error } = await query;
    if (error) throw error;
    return Response.json({ packages: (data ?? []) as PackageRow[] });
  } catch (error) {
    logger.errorRaw("route", "[api/packages] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as PackageInsert;
    if (!body.name || body.price === undefined) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const { data, error } = await supabase.from("packages").insert(body).select("*").single();
    if (error) throw error;
    return Response.json({ package: data as PackageRow }, { status: 201 });
  } catch (error) {
    logger.errorRaw("route", "[api/packages] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
