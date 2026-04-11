import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: RouteContext) {
  try {
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
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as BookingUpdate;

    const { data, error } = await supabase
      .from("bookings")
      .update({ ...body })
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
