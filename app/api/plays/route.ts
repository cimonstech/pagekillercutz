import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseUuid(s: unknown): string | null {
  if (typeof s !== "string" || !UUID_RE.test(s)) return null;
  return s;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      musicId?: string;
      trackTitle?: string;
      artist?: string;
      releaseType?: string;
      durationPlayed?: number;
      source?: string;
      sessionId?: string;
    };

    if (!body.trackTitle || typeof body.trackTitle !== "string") {
      return Response.json({ error: "trackTitle required" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = getSupabaseAdmin();

    const { error } = await admin.from("play_events").insert({
      user_id: user?.id ?? null,
      music_id: parseUuid(body.musicId),
      track_title: body.trackTitle,
      artist: body.artist ?? "Page KillerCutz",
      release_type: body.releaseType ?? null,
      duration_played: body.durationPlayed ?? 0,
      source: body.source ?? "music_page",
      session_id: body.sessionId ?? null,
    });

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    console.error("[api/plays]", err);
    return Response.json({ error: "Failed to track play" }, { status: 500 });
  }
}
