import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];
type PlaylistInsert = Database["public"]["Tables"]["playlists"]["Insert"];

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("playlists").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return Response.json({ playlists: (data ?? []) as PlaylistRow[] });
  } catch (error) {
    logger.errorRaw("route", "[api/playlists] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as PlaylistInsert;
    if (!body.event_id) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const { data, error } = await supabase.from("playlists").insert(body).select("*").single();
    if (error) throw error;
    return Response.json({ playlist: data as PlaylistRow }, { status: 201 });
  } catch (error) {
    logger.errorRaw("route", "[api/playlists] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

