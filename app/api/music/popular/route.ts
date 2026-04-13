import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type MusicRow = Database["public"]["Tables"]["music"]["Row"];
type TrackWithDuration = { duration?: number };

/** Rows from `music_play_stats` view (not in generated Database typings). */
type MusicPlayStatRow = {
  music_id: string;
  play_count: number | string | null;
};

const POPULAR_LIMIT = 6;

function resolveDuration(row: MusicRow): number | null {
  if (typeof row.duration === "number" && row.duration > 0) return row.duration;
  const tracks = Array.isArray(row.tracks) ? (row.tracks as TrackWithDuration[]) : [];
  const firstWithDuration = tracks.find(
    (t) => typeof t.duration === "number" && Number.isFinite(t.duration) && t.duration > 0,
  );
  return firstWithDuration?.duration ?? null;
}

/** music_id -> total plays from play_events (falls back if view is missing). */
async function loadPlayCountMap(): Promise<Map<string, number>> {
  const admin = getSupabaseAdmin();
  const map = new Map<string, number>();

  const { data: fromViewRaw, error: viewError } = await admin
    .from("music_play_stats")
    .select("music_id, play_count");
  const fromView = fromViewRaw as MusicPlayStatRow[] | null;

  if (!viewError) {
    for (const row of fromView ?? []) {
      if (row.music_id) map.set(String(row.music_id), Number(row.play_count) || 0);
    }
    return map;
  }

  logger.errorRaw("route", "[api/music/popular] music_play_stats unavailable, aggregating play_events:", viewError);

  const { data: events, error: evError } = await admin.from("play_events").select("music_id").not("music_id", "is", null);
  if (evError) {
    logger.errorRaw("route", "[api/music/popular] play_events aggregate failed:", evError);
    return map;
  }
  for (const e of events ?? []) {
    if (e.music_id) map.set(String(e.music_id), (map.get(String(e.music_id)) ?? 0) + 1);
  }
  return map;
}

function sortFeaturedByPlaysThenDate(rows: MusicRow[], playCounts: Map<string, number>): MusicRow[] {
  return [...rows].sort((a, b) => {
    const ca = playCounts.get(a.id) ?? 0;
    const cb = playCounts.get(b.id) ?? 0;
    if (cb !== ca) return cb - ca;
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return tb - ta;
  });
}

/**
 * Homepage "Popular":
 * 1) Featured releases (admin star), ordered by global play count desc, then newest.
 * 2) If fewer than 6, fill with remaining catalog rows by play count desc (excluding already listed).
 * 3) If still short (no stats / new site), fill with newest releases.
 */
export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const playCounts = await loadPlayCountMap();

    const { data: featuredRaw, error: featError } = await admin
      .from("music")
      .select("*")
      .eq("featured", true);

    if (featError) throw featError;

    const featuredSorted = sortFeaturedByPlaysThenDate((featuredRaw ?? []) as MusicRow[], playCounts);
    const result: MusicRow[] = [];
    const used = new Set<string>();

    for (const row of featuredSorted) {
      if (result.length >= POPULAR_LIMIT) break;
      result.push(row);
      used.add(row.id);
    }

    if (result.length < POPULAR_LIMIT) {
      const byPlayDesc = [...playCounts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
      const candidateIds: string[] = [];
      for (const id of byPlayDesc) {
        if (used.has(id)) continue;
        candidateIds.push(id);
        if (candidateIds.length >= POPULAR_LIMIT - result.length) break;
      }
      if (candidateIds.length) {
        const { data: playedRows, error: playErr } = await admin.from("music").select("*").in("id", candidateIds);
        if (playErr) throw playErr;
        const byId = new Map((playedRows as MusicRow[]).map((m) => [m.id, m]));
        for (const id of candidateIds) {
          const m = byId.get(id);
          if (m) {
            result.push(m);
            used.add(id);
          }
        }
      }
    }

    if (result.length < POPULAR_LIMIT) {
      const { data: recent, error: recentErr } = await admin
        .from("music")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(24);
      if (recentErr) throw recentErr;
      for (const m of (recent ?? []) as MusicRow[]) {
        if (result.length >= POPULAR_LIMIT) break;
        if (used.has(m.id)) continue;
        result.push(m);
        used.add(m.id);
      }
    }

    const normalized = result.slice(0, POPULAR_LIMIT).map((row) => ({
      ...row,
      duration: resolveDuration(row),
    }));

    return Response.json({ music: normalized });
  } catch (error) {
    logger.errorRaw("route", "[api/music/popular] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
