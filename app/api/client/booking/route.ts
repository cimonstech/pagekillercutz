import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

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
    const eventId = searchParams.get("eventId");
    if (!eventId?.trim()) {
      return Response.json({ error: "Missing eventId" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: row, error } = await admin
      .from("bookings")
      .select("*")
      .eq("event_id", eventId.trim())
      .ilike("client_email", user.email)
      .maybeSingle();

    if (error) {
      logger.errorRaw("route", "[api/client/booking]", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!row) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    return Response.json({ booking: row as BookingRow });
  } catch (error) {
    logger.errorRaw("route", "[api/client/booking]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
