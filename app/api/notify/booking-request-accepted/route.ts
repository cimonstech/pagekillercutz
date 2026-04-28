import { getPublicSiteUrl } from "@/lib/auth/site-url";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/notify/email";
import { bookingRequestAcceptedClient } from "@/lib/notify/emailTemplates";
import { sendSMS } from "@/lib/notify/sms";
import * as T from "@/lib/notify/templates";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

/** After admin accepts a blocked-date request: notify client with payment instructions. */
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
    const { data: paymentSettings } = await supabase.from("payment_settings").select("*").maybeSingle();
    const momoDisplay = paymentSettings?.momo_number
      ? `${paymentSettings?.momo_network ?? "MoMo"} ${paymentSettings.momo_number}`
      : "Payment details on your dashboard";
    const portalUrl = `${getPublicSiteUrl().replace(/\/$/, "")}/sign-in`;
    const formattedDate = T.formatBookingDate(b.event_date);
    const pkg = b.package_name?.trim() || "Your package";

    await Promise.allSettled([
      sendSMS(
        b.client_phone,
        `Hi ${b.client_name}, your booking request for ${b.event_id} was accepted. Check your email for payment details. — Page KillerCutz`,
        { type: "booking_request_accepted", bookingId: b.id },
      ),
      sendEmail({
        to: b.client_email,
        subject: `Your booking request was accepted — ${b.event_id}`,
        html: bookingRequestAcceptedClient({
          clientName: b.client_name,
          eventId: b.event_id,
          eventDate: formattedDate,
          venue: b.venue,
          packageName: pkg,
          djMomo: momoDisplay,
          portalUrl,
        }),
        type: "booking_request_accepted_email",
        bookingId: b.id,
      }),
    ]);

    return Response.json({ success: true });
  } catch (err) {
    logger.errorRaw("route", "[api/notify/booking-request-accepted]", err);
    return Response.json({ error: "Notification failed" }, { status: 500 });
  }
}
