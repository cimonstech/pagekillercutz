import { createHash, randomBytes } from "crypto";
import { logger } from "@/lib/logger";
import { createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { uploadToR2 } from "@/lib/r2";
import { buildContractHtml, buildContractText, generateContractPDF } from "@/lib/generateContract";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = (await request.json()) as { eventId?: string };
    if (!eventId?.trim()) return Response.json({ error: "eventId required" }, { status: 400 });

    const admin = getSupabaseAdmin();

    const { data: booking } = await admin
      .from("bookings")
      .select("*")
      .eq("event_id", eventId.trim())
      .ilike("client_email", user.email)
      .maybeSingle();

    if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });
    if (booking.status !== "confirmed") {
      return Response.json({ error: "Booking not confirmed" }, { status: 409 });
    }

    const { data: existing } = await admin.from("contracts").select("*").eq("event_id", eventId.trim()).maybeSingle();
    if (existing) {
      if (existing.signing_token && existing.token_expires_at) {
        return Response.json({ success: true, contract: existing });
      }
      const tokenExpires = new Date();
      tokenExpires.setDate(tokenExpires.getDate() + 7);
      const signingToken = randomBytes(32).toString("hex");
      const { data: updated, error: updErr } = await admin
        .from("contracts")
        .update({
          signing_token: signingToken,
          token_expires_at: tokenExpires.toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (updErr) throw updErr;
      return Response.json({ success: true, contract: updated });
    }

    const { data: settings } = await admin.from("contract_settings").select("*").eq("is_current", true).single();
    if (!settings) return Response.json({ error: "No contract settings configured" }, { status: 500 });
    const { data: paymentSettings } = await admin.from("payment_settings").select("*").maybeSingle();

    const contractText = buildContractText(booking, settings as never);
    const contractHtml = buildContractHtml(contractText);
    const contractHash = createHash("sha256").update(contractText).digest("hex");

    const pdfBytes = await generateContractPDF(
      booking,
      settings,
      { contract_hash: contractHash, status: "pre-signed" },
      paymentSettings,
    );
    const pdfKey = `contracts/${eventId.trim()}-unsigned.pdf`;
    const pdfUrl = await uploadToR2(Buffer.from(pdfBytes), pdfKey, "application/pdf");

    const tokenExpires = new Date();
    tokenExpires.setDate(tokenExpires.getDate() + 7);
    const signingToken = randomBytes(32).toString("hex");

    const { data: newContract, error: insertErr } = await admin
      .from("contracts")
      .insert({
        booking_id: booking.id,
        event_id: eventId.trim(),
        contract_settings_version: settings.version,
        contract_html: contractHtml,
        contract_text: contractText,
        contract_hash: contractHash,
        status: "pre-signed",
        signing_token: signingToken,
        token_expires_at: tokenExpires.toISOString(),
        pdf_url: pdfUrl,
      })
      .select("*")
      .single();
    if (insertErr) throw insertErr;

    return Response.json({ success: true, contract: newContract });
  } catch (error) {
    logger.errorRaw("route", "[api/contracts/generate-client] POST:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

