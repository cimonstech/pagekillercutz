import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type MusicRow = Database["public"]["Tables"]["music"]["Row"];
type MusicInsert = Database["public"]["Tables"]["music"]["Insert"];
type TrackWithDuration = { duration?: number };

function resolveDuration(row: MusicRow): number | null {
  if (typeof row.duration === "number" && row.duration > 0) return row.duration;
  const tracks = Array.isArray(row.tracks) ? (row.tracks as TrackWithDuration[]) : [];
  const firstWithDuration = tracks.find(
    (t) => typeof t.duration === "number" && Number.isFinite(t.duration) && t.duration > 0,
  );
  return firstWithDuration?.duration ?? null;
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort");
    const all = searchParams.get("all") === "true";
    const limit = Number(searchParams.get("limit") ?? "50");

    let query = supabase.from("music").select("*");
    if (type && (type === "album" || type === "single" || type === "mix")) {
      query = query.eq("type", type);
    }
    if (featured === "true") query = query.eq("featured", true);
    if (featured === "false") query = query.eq("featured", false);

    if (sort === "asc" || sort === "desc") {
      const ascending = sort === "asc";
      query = query.order("release_date", { ascending }).order("created_at", { ascending });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.limit(all ? 2000 : limit);

    const { data, error } = await query;
    if (error) throw error;
    const normalized = ((data ?? []) as MusicRow[]).map((row) => ({
      ...row,
      duration: resolveDuration(row),
    }));
    return Response.json({ music: normalized });
  } catch (error) {
    logger.errorRaw("route", "[api/music] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

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

