import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

type PlaylistMapRow = Pick<
  Database["public"]["Tables"]["playlists"]["Row"],
  "event_id" | "locked" | "must_play" | "do_not_play" | "timeline"
>;

function startOfToday(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function eventDateOnly(iso: string): Date {
  const d = new Date(`${iso.trim()}T00:00:00`);
  return d;
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventIdFilter = searchParams.get("eventId")?.trim() ?? "";

    const admin = getSupabaseAdmin();

    const { data: allBookingsRaw, error: bookingsError } = await admin
      .from("bookings")
      .select("*")
      .ilike("client_email", user.email)
      .order("event_date", { ascending: true });

    if (bookingsError) {
      logger.errorRaw("route", "[api/client/dashboard] bookings:", bookingsError);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    const allBookings = (allBookingsRaw ?? []) as BookingRow[];

    if (!allBookings.length) {
      return Response.json({ error: "No booking found" }, { status: 404 });
    }

    const today = startOfToday();

    const upcomingBookings = allBookings.filter((b) => {
      const ed = eventDateOnly(b.event_date);
      return ed >= today && b.status !== "cancelled";
    });

    const pastBookings = allBookings.filter((b) => {
      const ed = eventDateOnly(b.event_date);
      return ed < today || b.status === "cancelled";
    });

    const pastNewestFirst = [...pastBookings].sort(
      (a, b) => eventDateOnly(b.event_date).getTime() - eventDateOnly(a.event_date).getTime(),
    );

    let primaryBooking: BookingRow =
      upcomingBookings[0] ?? pastNewestFirst[0] ?? allBookings[allBookings.length - 1]!;

    if (eventIdFilter) {
      const match = allBookings.find((b) => b.event_id === eventIdFilter);
      if (!match) {
        return Response.json({ error: "No booking found" }, { status: 404 });
      }
      primaryBooking = match;
    }

    const eventIds = allBookings.map((b) => b.event_id);

    const { data: allPlaylists } = await admin
      .from("playlists")
      .select("event_id, locked, must_play, do_not_play, timeline")
      .in("event_id", eventIds);

    const playlistMap = (allPlaylists ?? []).reduce(
      (acc, p) => {
        acc[p.event_id] = p as PlaylistMapRow;
        return acc;
      },
      {} as Record<string, PlaylistMapRow>,
    );

    const { data: playlist } = await admin
      .from("playlists")
      .select("*")
      .eq("event_id", primaryBooking.event_id)
      .maybeSingle();

    const packageName = primaryBooking.package_name?.trim() ?? "";
    const { data: packageData } = packageName
      ? await admin.from("packages").select("*").eq("name", packageName).maybeSingle()
      : { data: null };

    const uniqueTypes = [...new Set(allBookings.map((b) => b.event_type))];
    const { data: eventRows } =
      uniqueTypes.length > 0
        ? await admin.from("events").select("media_urls, title, event_type").in("event_type", uniqueTypes)
        : { data: null };

    const eventDataMap = (eventRows ?? []).reduce(
      (acc, row) => {
        if (!acc[row.event_type]) acc[row.event_type] = row;
        return acc;
      },
      {} as Record<
        string,
        { media_urls: string[]; title: string; event_type: string }
      >,
    );

    const eventData = eventDataMap[primaryBooking.event_type] ?? null;

    const { data: recentOrders } = await admin
      .from("orders")
      .select("*")
      .ilike("customer_email", user.email ?? "")
      .order("created_at", { ascending: false })
      .limit(3);

    const eventDate = eventDateOnly(primaryBooking.event_date);
    const diffTime = eventDate.getTime() - today.getTime();
    const daysUntilEvent = Number.isNaN(diffTime) ? 0 : Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const b = primaryBooking as BookingRow & { event_name?: string | null };

    return Response.json({
      booking: b,
      playlist: playlist ?? null,
      package: packageData ?? null,
      daysUntilEvent,
      eventData: eventData ?? null,
      eventDataMap,
      upcomingBookings,
      pastBookings,
      playlistMap,
      recentOrders: (recentOrders ?? []) as OrderRow[],
    });
  } catch (error) {
    logger.errorRaw("route", "[api/client/dashboard]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
