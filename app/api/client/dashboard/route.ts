import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

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
    const eventIdFilter = searchParams.get("eventId");

    const admin = getSupabaseAdmin();

    let bookingQuery = admin
      .from("bookings")
      .select("*")
      .eq("client_email", user.email);

    if (eventIdFilter) {
      bookingQuery = bookingQuery.eq("event_id", eventIdFilter);
    }

    const { data: booking, error: bookingError } = await bookingQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bookingError) {
      logger.errorRaw("route", "[api/client/dashboard] booking:", bookingError);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!booking) {
      return Response.json({ error: "No booking found" }, { status: 404 });
    }

    const b = booking as BookingRow & { event_name?: string | null };

    const { data: playlist } = await admin
      .from("playlists")
      .select("*")
      .eq("event_id", b.event_id)
      .maybeSingle();

    const packageName = b.package_name?.trim() ?? "";
    const { data: packageData } = packageName
      ? await admin.from("packages").select("*").eq("name", packageName).maybeSingle()
      : { data: null };

    const { data: eventData } = await admin
      .from("events")
      .select("media_urls, title, event_type")
      .eq("event_type", b.event_type)
      .limit(1)
      .maybeSingle();

    const { data: recentOrders } = await admin
      .from("orders")
      .select("*")
      .ilike("customer_email", user.email ?? "")
      .order("created_at", { ascending: false })
      .limit(3);

    const eventDate = new Date(b.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const daysUntilEvent = Number.isNaN(diffTime)
      ? 0
      : Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Response.json({
      booking: b,
      playlist: playlist ?? null,
      package: packageData ?? null,
      daysUntilEvent,
      eventData: eventData ?? null,
      recentOrders: (recentOrders ?? []) as OrderRow[],
    });
  } catch (error) {
    logger.errorRaw("route", "[api/client/dashboard]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
