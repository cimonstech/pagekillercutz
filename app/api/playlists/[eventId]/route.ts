import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { emailsMatch, isActiveStaffAdmin } from "@/lib/playlistAccess";
import { requireAdmin } from "@/lib/requireAdmin";
import type { Database } from "@/lib/database.types";
import { playlistPatchSchema } from "@/lib/validation/schemas";
import { validate } from "@/lib/validation/validate";
import { getPrimaryDjPhone } from "@/lib/notify/djPhones";
import { notifyPlaylistLocked } from "@/lib/notify/dispatch";

type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];
type PlaylistUpdate = Database["public"]["Tables"]["playlists"]["Update"];
type RouteContext = { params: Promise<{ eventId: string }> };

async function assertPlaylistAccess(eventId: string, userEmail: string | undefined) {
  if (!userEmail) {
    return { ok: false as const, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const adminClient = getSupabaseAdmin();
  const { data: booking } = await adminClient
    .from("bookings")
    .select("client_email")
    .eq("event_id", eventId)
    .maybeSingle();

  const isAdmin = await isActiveStaffAdmin(userEmail);
  const isOwner = booking ? emailsMatch(booking.client_email, userEmail) : false;

  if (!isAdmin && !isOwner) {
    return { ok: false as const, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, isAdmin };
}

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const supabaseUser = await createServerClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const supabase = getSupabaseAdmin();

    const { data: playlist, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) throw error;
    if (!playlist) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const access = await assertPlaylistAccess(eventId, user.email);
    if (!access.ok) return access.response;

    return Response.json({ playlist: playlist as PlaylistRow });
  } catch (error) {
    logger.errorRaw("api/playlists/[eventId]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const supabaseUser = await createServerClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const supabase = getSupabaseAdmin();

    const { data: existing, error: existingErr } = await supabase
      .from("playlists")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();
    if (existingErr) throw existingErr;
    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const access = await assertPlaylistAccess(eventId, user.email);
    if (!access.ok) return access.response;

    const isAdmin = access.isAdmin;
    if (!isAdmin && existing.locked) {
      return Response.json({ error: "Playlist is locked." }, { status: 403 });
    }

    const raw = await request.json();
    const parsed = validate(playlistPatchSchema, raw);
    if (!parsed.success) {
      return Response.json({ error: parsed.error, details: parsed.details }, { status: 400 });
    }
    const body = parsed.data;
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
      const { data: booking } = await supabase.from("bookings").select("*").eq("event_id", eventId).single();
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
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

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
