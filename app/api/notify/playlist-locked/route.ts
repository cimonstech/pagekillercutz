import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { bookingRowToData } from "@/lib/notify/bookingAdapter";
import { notifyPlaylistLocked } from "@/lib/notify/dispatch";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

/** Optional explicit notify when lock is toggled outside PATCH (e.g. retries). */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { eventId } = (await request.json()) as { eventId?: string };
    if (!eventId) {
      return Response.json({ error: "eventId required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase.from("bookings").select("*").eq("event_id", eventId).single();
    if (error || !row) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    await notifyPlaylistLocked(bookingRowToData(row as BookingRow));

    return Response.json({ success: true });
  } catch (err) {
    logger.errorRaw("route", "[api/notify/playlist-locked]", err);
    return Response.json({ error: "Notification failed" }, { status: 500 });
  }
}
