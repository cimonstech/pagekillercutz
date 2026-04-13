import { logger } from "@/lib/logger";
import { bookingRowToData } from "@/lib/notify/bookingAdapter";
import * as ET from "@/lib/notify/emailTemplates";
import { sendEmail } from "@/lib/notify/email";
import { sendSMS } from "@/lib/notify/sms";
import * as T from "@/lib/notify/templates";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://pagekillercutz.com").replace(/\/$/, "");

/** Trigger 3 — payment marked paid: client only. */
export async function POST(request: Request) {
  try {
    const { bookingId } = (await request.json()) as { bookingId?: string };
    if (!bookingId) {
      return Response.json({ error: "bookingId required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
    if (error || !row) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    const d = bookingRowToData(row as BookingRow);
    const formattedDate = T.formatBookingDate(d.eventDate);
    const pkg = d.packageName?.trim() || "Signature";

    await Promise.allSettled([
      sendSMS(d.clientPhone, T.sms_paymentConfirmed_client(d)),
      sendEmail({
        to: d.clientEmail,
        subject: `Payment Confirmed — ${d.eventId}`,
        html: ET.paymentConfirmedClient({
          eventId: d.eventId,
          clientName: d.clientName,
          eventDate: formattedDate,
          venue: d.venue,
          packageName: pkg,
          portalUrl: d.portalUrl || `${BASE_URL}/sign-in`,
        }),
      }),
    ]);

    return Response.json({ success: true });
  } catch (err) {
    logger.errorRaw("route", "[api/notify/payment-confirmed]", err);
    return Response.json({ error: "Notification failed" }, { status: 500 });
  }
}
