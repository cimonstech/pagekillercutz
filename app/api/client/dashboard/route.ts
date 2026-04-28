import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

type PlaylistMapRow = Pick<
  Database["public"]["Tables"]["playlists"]["Row"],
  "event_id" | "locked" | "must_play" | "do_not_play" | "timeline"
>;

type RecentUpdate = {
  id: string;
  icon: "notifications";
  tone: "primary" | "secondary";
  message: string;
  time: string;
};

function phoneDigits(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\D/g, "");
}

function relativeTimeFromIso(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "just now";
  const diffMs = Math.max(0, now - t);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function toUpdateMessage(n: NotificationRow): string {
  const eventRef = n.booking_id ? ` for ${n.booking_id}` : "";
  if (n.status === "failed") {
    return `${n.channel.toUpperCase()} update failed${eventRef}.`;
  }
  const t = n.type.toLowerCase();
  if (t.includes("booking_confirmed")) return "Your booking was confirmed by Page KillerCutz.";
  if (t.includes("payment_confirmed")) return "Payment confirmation was sent.";
  if (t.includes("playlist_locked")) return "Your playlist lock update was sent.";
  if (t.includes("reminder7day")) return "7-day reminder was sent.";
  if (t.includes("reminder1day")) return "1-day reminder was sent.";
  if (t.includes("morning_of")) return "Event day reminder was sent.";
  return `${n.channel.toUpperCase()} notification ${n.status}.`;
}

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
      return ed >= today && !["cancelled", "declined"].includes(b.status);
    });

    const pastBookings = allBookings.filter((b) => {
      const ed = eventDateOnly(b.event_date);
      return ed < today || ["cancelled", "declined"].includes(b.status);
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

    const { data: contractSettings } = await admin
      .from("contract_settings")
      .select("deposit_percentage")
      .eq("is_current", true)
      .maybeSingle();

    const { data: contract } = await admin
      .from("contracts")
      .select("id, status, signing_token, client_signed_at, pdf_url, contract_text")
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

    const phones = [...new Set(allBookings.map((b) => phoneDigits(b.client_phone)).filter(Boolean))];
    const [emailNotifRes, phoneNotifRes] = await Promise.all([
      admin
        .from("notifications")
        .select("*")
        .ilike("recipient_email", user.email ?? "")
        .order("created_at", { ascending: false })
        .limit(8),
      phones.length > 0
        ? admin
            .from("notifications")
            .select("*")
            .in("recipient_phone", phones)
            .order("created_at", { ascending: false })
            .limit(8)
        : Promise.resolve({ data: [], error: null } as { data: NotificationRow[]; error: null }),
    ]);

    const mergedMap = new Map<string, NotificationRow>();
    for (const n of ([...(emailNotifRes.data ?? []), ...(phoneNotifRes.data ?? [])] as NotificationRow[])) {
      if (!mergedMap.has(n.id)) mergedMap.set(n.id, n);
    }
    const recentNotifications = Array.from(mergedMap.values())
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 6)
      .map((n) => ({
        id: n.id,
        icon: "notifications" as const,
        tone: n.status === "failed" ? ("secondary" as const) : ("primary" as const),
        message: toUpdateMessage(n),
        time: relativeTimeFromIso(n.created_at),
      }));

    const eventDate = eventDateOnly(primaryBooking.event_date);
    const diffTime = eventDate.getTime() - today.getTime();
    const daysUntilEvent = Number.isNaN(diffTime) ? 0 : Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const b = primaryBooking as BookingRow & { event_name?: string | null };

    return Response.json({
      booking: b,
      playlist: playlist ?? null,
      contract: contract ?? null,
      contractSettings: contractSettings ?? null,
      package: packageData ?? null,
      daysUntilEvent,
      eventData: eventData ?? null,
      eventDataMap,
      upcomingBookings,
      pastBookings,
      playlistMap,
      recentOrders: (recentOrders ?? []) as OrderRow[],
      recentNotifications,
    });
  } catch (error) {
    logger.errorRaw("route", "[api/client/dashboard]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
