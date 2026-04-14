import { logger } from "@/lib/logger";
import { emailsMatch, isActiveStaffAdmin } from "@/lib/playlistAccess";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { requireAdmin } from "@/lib/requireAdmin";
import { playlistCreateSchema } from "@/lib/validation/schemas";
import { validate } from "@/lib/validation/validate";

type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];
type PlaylistInsert = Database["public"]["Tables"]["playlists"]["Insert"];

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

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

export async function POST(request: Request) {
  try {
    const supabaseUser = await createServerClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = validate(playlistCreateSchema, raw);
    if (!parsed.success) {
      return Response.json({ error: parsed.error, details: parsed.details }, { status: 400 });
    }
    const body = parsed.data;

    const adminClient = getSupabaseAdmin();
    const { data: booking } = await adminClient
      .from("bookings")
      .select("client_email")
      .eq("event_id", body.event_id)
      .maybeSingle();

    if (!booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    const isAdmin = await isActiveStaffAdmin(user.email);
    const isOwner = emailsMatch(booking.client_email, user.email);

    if (!isAdmin && !isOwner) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await adminClient
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
