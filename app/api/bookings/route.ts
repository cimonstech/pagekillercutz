import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = Number(searchParams.get("limit") ?? "20");
    const offset = Number(searchParams.get("offset") ?? "0");

    let query = supabase
      .from("bookings")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (search) query = query.or(`client_name.ilike.%${search}%,client_email.ilike.%${search}%,event_id.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    return Response.json({ bookings: (data ?? []) as BookingRow[], count: count ?? 0 });
  } catch (error) {
    logger.errorRaw("route", "[api/bookings] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as BookingInsert;

    if (!body.client_name || !body.client_email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const eventId = `EVT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const payload: Omit<BookingRow, "id" | "created_at"> = {
      ...body,
      event_id: eventId,
    };

    const { data, error } = await supabase.from("bookings").insert(payload).select("*").single();
    if (error) throw error;

    return Response.json({ booking: data as BookingRow, eventId }, { status: 201 });
  } catch (error) {
    logger.errorRaw("route", "[api/bookings] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

