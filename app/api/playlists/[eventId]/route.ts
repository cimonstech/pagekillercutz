import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";
import { getPrimaryDjPhone } from "@/lib/notify/djPhones";
import { notifyPlaylistLocked } from "@/lib/notify/dispatch";

type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];
type PlaylistUpdate = Database["public"]["Tables"]["playlists"]["Update"];
type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { eventId } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("event_id", eventId)
      .single();
    if (error) throw error;
    return Response.json({ playlist: data as PlaylistRow });
  } catch (error) {
    logger.errorRaw("api/playlists/[eventId]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { eventId } = await params;
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as PlaylistUpdate;
    const lockChangedToTrue = body.locked === true;

    const payload: PlaylistUpdate = {
      updated_at: new Date().toISOString(),
    };
    if (body.genres !== undefined) payload.genres = body.genres;
    if (body.vibe !== undefined) payload.vibe = body.vibe;
    if (body.must_play !== undefined) payload.must_play = body.must_play;
    if (body.do_not_play !== undefined) payload.do_not_play = body.do_not_play;
    if (body.timeline !== undefined) payload.timeline = body.timeline;
    if (body.extra_notes !== undefined) payload.extra_notes = body.extra_notes;
    if (typeof body.locked === "boolean") payload.locked = body.locked;

    const { data, error } = await supabase
      .from("playlists")
      .update(payload)
      .eq("event_id", eventId)
      .select("*")
      .single();
    if (error) throw error;

    if (lockChangedToTrue) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("*")
                    .eq("event_id", eventId)
        .single();
      if (booking) {
        void notifyPlaylistLocked({
          eventId: booking.event_id,
          clientName: booking.client_name,
          clientEmail: booking.client_email,
          clientPhone: booking.client_phone,
          eventType: booking.event_type,
          eventDate: booking.event_date,
          venue: booking.venue,
          djPhone: getPrimaryDjPhone(),
          djEmail: process.env.DJ_EMAIL!,
          portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/sign-in`,
        });
      }
    }

    return Response.json({ playlist: data as PlaylistRow });
  } catch (error) {
    logger.errorRaw("api/playlists/[eventId]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const { eventId } = await params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("playlists").delete().eq("event_id", eventId);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    logger.errorRaw("api/playlists/[eventId]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
