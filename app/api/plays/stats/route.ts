import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ totalPlays: 0, mostPlayedTrack: null });
    }

    const admin = getSupabaseAdmin();

    const { count: totalPlays } = await admin
      .from("play_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { data: topTrack } = await admin
      .from("play_events")
      .select("track_title, artist, music_id")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(100);

    const trackCounts: Record<string, number> = {};
    topTrack?.forEach((p) => {
      trackCounts[p.track_title] = (trackCounts[p.track_title] ?? 0) + 1;
    });

    const mostPlayed = Object.entries(trackCounts).sort((a, b) => b[1] - a[1])[0];

    return Response.json({
      totalPlays: totalPlays ?? 0,
      mostPlayedTrack: mostPlayed ? mostPlayed[0] : null,
    });
  } catch (err) {
    logger.error("plays/stats", "Error", err);
    return Response.json({ totalPlays: 0, mostPlayedTrack: null });
  }
}
