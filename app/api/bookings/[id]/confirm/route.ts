import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type RouteContext = { params: Promise<{ id: string }> };

function dateOnlyIso(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

export async function POST(_: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const admin = getSupabaseAdmin();

    const { data: booking, error: bookingErr } = await admin.from("bookings").select("*").eq("id", id).single();
    if (bookingErr || !booking) return Response.json({ error: "Booking not found" }, { status: 404 });

    const { data: settings } = await admin.from("contract_settings").select("*").eq("is_current", true).single();
    if (!settings) return Response.json({ error: "No contract settings configured" }, { status: 500 });

    const confirmationDate = new Date();
    const depositDue = new Date(confirmationDate);
    depositDue.setDate(depositDue.getDate() + 3);

    const eventDate = new Date(`${booking.event_date}T00:00:00`);
    const balanceDue = new Date(eventDate);
    balanceDue.setDate(balanceDue.getDate() - 7);

    const packagePrice = Number(booking.package_price ?? 0);
    const depositPct = Number(settings.deposit_percentage ?? 30);
    const depositAmount = Math.round((packagePrice * depositPct) / 100);
    const balanceAmount = Math.max(0, packagePrice - depositAmount);

    const update: Partial<BookingRow> & Record<string, unknown> = {
      status: "confirmed",
      deposit_due_date: dateOnlyIso(depositDue),
      balance_due_date: dateOnlyIso(balanceDue),
      deposit_amount: depositAmount,
      balance_amount: balanceAmount,
    };

    const { data: updated, error: updateErr } = await admin
      .from("bookings")
      .update(update)
      .eq("id", booking.id)
      .select("*")
      .single();
    if (updateErr) throw updateErr;

    return Response.json({ booking: updated as BookingRow });
  } catch (error) {
    logger.errorRaw("route", "[api/bookings/[id]/confirm] POST:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

