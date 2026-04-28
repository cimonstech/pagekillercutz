import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/notify/email";
import { bookingRequestDeclinedClient } from "@/lib/notify/emailTemplates";
import { sendSMS } from "@/lib/notify/sms";
import * as T from "@/lib/notify/templates";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { bookingId } = (await request.json()) as { bookingId?: string };
    if (!bookingId) {
      return Response.json({ error: "bookingId required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
    if (error || !row) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    const b = row as BookingRow;
    const formattedDate = T.formatBookingDate(b.event_date);

    await Promise.allSettled([
      sendSMS(
        b.client_phone,
        `Hi ${b.client_name}, we cannot accommodate your request for ${b.event_id}. Check your email for details. — Page KillerCutz`,
        { type: "booking_request_declined", bookingId: b.id },
      ),
      sendEmail({
        to: b.client_email,
        subject: `Update on your booking request — ${b.event_id}`,
        html: bookingRequestDeclinedClient({
          clientName: b.client_name,
          eventId: b.event_id,
          eventDate: formattedDate,
        }),
        type: "booking_request_declined_email",
        bookingId: b.id,
      }),
    ]);

    return Response.json({ success: true });
  } catch (err) {
    logger.errorRaw("route", "[api/notify/booking-request-declined]", err);
    return Response.json({ error: "Notification failed" }, { status: 500 });
  }
}
