import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendEmail } from "@/lib/notify/email";
import { bookingRowToData } from "@/lib/notify/bookingAdapter";
import * as ET from "@/lib/notify/emailTemplates";
import { sendSMS } from "@/lib/notify/sms";
import * as T from "@/lib/notify/templates";
import { getDjSmsRecipients } from "@/lib/notify/djPhones";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://pagekillercutz.com").replace(/\/$/, "");

/** Trigger 2 — admin confirmed booking: client + DJ. */
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

    const d = bookingRowToData(row as BookingRow);
    const { data: paymentSettings } = await supabase.from("payment_settings").select("*").maybeSingle();
    const momoDisplay = paymentSettings?.momo_number
      ? `${paymentSettings?.momo_network ?? "MoMo"} ${paymentSettings.momo_number}`
      : "Payment details on your dashboard";
    const djPhones = getDjSmsRecipients();
    const DJ_EMAIL = process.env.DJ_EMAIL;
    if (!djPhones.length || !DJ_EMAIL) {
      return Response.json({ error: "DJ contact not configured" }, { status: 500 });
    }

    const formattedDate = T.formatBookingDate(d.eventDate);
    const pkg = d.packageName?.trim() || "Signature";

    await Promise.allSettled([
      sendSMS(d.clientPhone, T.sms_bookingConfirmed_client(d)),
      sendEmail({
        to: d.clientEmail,
        subject: `Booking Confirmed — ${d.eventId}`,
        html: ET.bookingConfirmedClient({
          eventId: d.eventId,
          clientName: d.clientName,
          eventType: d.eventType,
          eventDate: formattedDate,
          venue: d.venue,
          packageName: pkg,
          djMomo: momoDisplay,
          portalUrl: d.portalUrl || `${BASE_URL}/sign-in`,
        }),
      }),
      sendSMS(djPhones, T.sms_bookingConfirmed_dj(d)),
      sendEmail({
        to: DJ_EMAIL,
        subject: `[Confirmed] ${d.eventId} — ${d.clientName}`,
        html: ET.bookingConfirmedDj({
          eventId: d.eventId,
          clientName: d.clientName,
          eventType: d.eventType,
          eventDate: formattedDate,
          venue: d.venue,
          adminUrl: `${BASE_URL}/admin`,
        }),
      }),
    ]);

    return Response.json({ success: true });
  } catch (err) {
    logger.errorRaw("route", "[api/notify/booking-confirmed]", err);
    return Response.json({ error: "Notification failed" }, { status: 500 });
  }
}
