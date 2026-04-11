import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type MusicRow = Database["public"]["Tables"]["music"]["Row"];
type MusicInsert = Database["public"]["Tables"]["music"]["Insert"];

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const featured = searchParams.get("featured");
    const limit = Number(searchParams.get("limit") ?? "50");

    let query = supabase.from("music").select("*").order("created_at", { ascending: false }).limit(limit);
    if (type) query = query.eq("type", type);
    if (featured === "true") query = query.eq("featured", true);
    if (featured === "false") query = query.eq("featured", false);

    const { data, error } = await query;
    if (error) throw error;
    return Response.json({ music: (data ?? []) as MusicRow[] });
  } catch (error) {
    logger.errorRaw("route", "[api/music] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as MusicInsert;
    if (!body.title || !body.type) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const { data, error } = await supabase.from("music").insert(body).select("*").single();
    if (error) throw error;
    return Response.json({ music: data as MusicRow }, { status: 201 });
  } catch (error) {
    logger.errorRaw("route", "[api/music] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

