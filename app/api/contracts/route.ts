import { randomBytes } from "crypto";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendEmail } from "@/lib/notify/email";
import { sendSMS } from "@/lib/notify/sms";
import { contractSigningEmail } from "@/lib/notify/emailTemplates";
import { generateContract } from "@/lib/generateContract";
import { getSupabaseAdmin } from "@/lib/supabase";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://pagekillercutz.com").replace(/\/$/, "");

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");
    const eventIdSingle = searchParams.get("eventId");
    const eventIds = (searchParams.get("eventIds") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const supabase = getSupabaseAdmin();

    let query = supabase.from("contracts").select("*").order("created_at", { ascending: false }).limit(300);
    if (bookingId) query = query.eq("booking_id", bookingId);
    if (eventIdSingle) query = query.eq("event_id", eventIdSingle);
    if (eventIds.length) query = query.in("event_id", eventIds);
    const { data, error } = await query;
    if (error) throw error;
    return Response.json({ contracts: data ?? [] });
  } catch (error) {
    logger.errorRaw("route", "[api/contracts] GET:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;
    const { bookingId, resendOnly } = (await request.json()) as { bookingId?: string; resendOnly?: boolean };
    if (!bookingId) return Response.json({ error: "bookingId required" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: booking, error: bookingErr } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
    if (bookingErr || !booking) return Response.json({ error: "Booking not found" }, { status: 404 });

    let contract = (await supabase
      .from("contracts")
      .select("*")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()).data;

    if (!contract || (!resendOnly && contract.status !== "pending")) {
      const { data: settings } = await supabase
        .from("contract_settings")
        .select("*")
        .eq("is_current", true)
        .single();
      if (!settings) return Response.json({ error: "No contract settings configured" }, { status: 500 });
      const built = await generateContract(booking, settings as never);
      const signingToken = randomBytes(32).toString("hex");
      const tokenExpires = new Date();
      tokenExpires.setDate(tokenExpires.getDate() + 7);
      const { data: inserted, error: insertErr } = await supabase
        .from("contracts")
        .insert({
          booking_id: booking.id,
          event_id: booking.event_id,
          contract_settings_version: settings.version,
          contract_html: built.contractHtml,
          contract_text: built.contractText,
          contract_hash: built.contractHash,
          status: "pending",
          signing_token: signingToken,
          token_expires_at: tokenExpires.toISOString(),
        })
        .select("*")
        .single();
      if (insertErr) throw insertErr;
      contract = inserted;
    }

    const dashboardUrl = `${BASE_URL}/client/dashboard`;
    const eventDate = new Date(`${booking.event_date}T00:00:00`).toLocaleDateString("en-GH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    await sendEmail({
      to: booking.client_email,
      subject: "Please sign your service agreement",
      html: contractSigningEmail({
        clientName: booking.client_name,
        eventId: booking.event_id,
        eventDate,
        dashboardUrl,
      }),
      type: "contract_signing_link",
      bookingId: booking.id,
    });
    await sendSMS(
      booking.client_phone,
      `Hi ${booking.client_name}, your booking ${booking.event_id} is confirmed. Please sign your agreement from your dashboard: ${dashboardUrl} — Page KillerCutz`,
      { type: "contract_signing_link_sms", bookingId: booking.id },
    );

    return Response.json({ success: true, dashboardUrl, contractId: contract.id });
  } catch (error) {
    logger.errorRaw("route", "[api/contracts] POST:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
