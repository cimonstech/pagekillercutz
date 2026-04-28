import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_BOOKING_PATCH_FIELDS = new Set([
  "status",
  "payment_status",
  "deposit_paid",
  "deposit_paid_at",
  "event_date",
  "venue",
  "event_type",
  "event_name",
  "guest_count",
  "notes",
  "package_name",
  "genres",
  "admin_notes",
  "booking_type",
]);

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("bookings").select("*").eq("id", id).single();
    if (error) throw error;
    return Response.json({ booking: data as BookingRow });
  } catch (error) {
    logger.errorRaw("api/bookings/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const raw = (await request.json()) as Record<string, unknown>;

    const safeUpdate: Record<string, unknown> = {};
    for (const key of Object.keys(raw)) {
      if (ALLOWED_BOOKING_PATCH_FIELDS.has(key)) {
        safeUpdate[key] = raw[key];
      }
    }

    if (Object.keys(safeUpdate).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(safeUpdate)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return Response.json({ booking: data as BookingRow });
  } catch (error) {
    logger.errorRaw("api/bookings/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ booking: data as BookingRow });
  } catch (error) {
    logger.errorRaw("api/bookings/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
