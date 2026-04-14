import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import type { Database } from "@/lib/database.types";

type MusicRow = Database["public"]["Tables"]["music"]["Row"];
type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_MUSIC_PATCH_FIELDS = new Set([
  "title",
  "type",
  "artist",
  "release_date",
  "featured",
  "cover_url",
  "audio_url",
  "tracks",
  "duration",
  "description",
  "genres",
]);

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("music").select("*").eq("id", id).single();
    if (error || !data) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ music: data as MusicRow });
  } catch (error) {
    logger.errorRaw("api/music/[id]", "Error:", error);
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
      if (ALLOWED_MUSIC_PATCH_FIELDS.has(key)) {
        safeUpdate[key] = raw[key];
      }
    }

    if (Object.keys(safeUpdate).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("music")
      .update(safeUpdate)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ music: data as MusicRow });
  } catch (error) {
    logger.errorRaw("api/music/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("music").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    logger.errorRaw("api/music/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
