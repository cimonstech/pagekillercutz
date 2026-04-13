import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];
type PlaylistInsert = Database["public"]["Tables"]["playlists"]["Insert"];

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "500"), 2000);

    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return Response.json({ playlists: (data ?? []) as PlaylistRow[] });
  } catch (error) {
    logger.errorRaw("route", "[api/playlists] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

type PlaylistSaveBody = {
  event_id?: string;
  genres?: string[];
  vibe?: string | null;
  must_play?: PlaylistRow["must_play"];
  do_not_play?: PlaylistRow["do_not_play"];
  timeline?: PlaylistRow["timeline"];
  extra_notes?: string | null;
};

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as PlaylistSaveBody;
    if (!body.event_id) {
      return Response.json({ error: "Missing event_id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("playlists")
      .insert({
        event_id: body.event_id,
        genres: body.genres ?? [],
        vibe: body.vibe ?? null,
        must_play: body.must_play ?? [],
        do_not_play: body.do_not_play ?? [],
        timeline: body.timeline ?? [],
        extra_notes: body.extra_notes ?? null,
        locked: false,
      } satisfies PlaylistInsert)
      .select("*")
      .single();

    if (error) throw error;
    return Response.json({ playlist: data as PlaylistRow }, { status: 201 });
  } catch (error) {
    logger.errorRaw("route", "[api/playlists] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

