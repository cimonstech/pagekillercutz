import { createHash } from "crypto";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { uploadToR2 } from "@/lib/r2";
import { buildContractText, buildContractHtml, generateContractPDF } from "@/lib/generateContract";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { bookingId } = (await request.json()) as { bookingId?: string };
    if (!bookingId) return Response.json({ error: "bookingId required" }, { status: 400 });

    const admin = getSupabaseAdmin();

    const { data: booking, error: bookingErr } = await admin.from("bookings").select("*").eq("id", bookingId).single();
    if (bookingErr || !booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    const { data: existing } = await admin
      .from("contracts")
      .select("id, status, pdf_url")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.pdf_url) {
      return Response.json({ success: true, pdfUrl: existing.pdf_url, contractId: existing.id, alreadyExisted: true });
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

    const pdfKey = `contracts/${booking.event_id}-unsigned.pdf`;
    const pdfUrl = await uploadToR2(Buffer.from(pdfBytes), pdfKey, "application/pdf");

    const { data: newContract, error: insertErr } = await admin
      .from("contracts")
      .insert({
        booking_id: booking.id,
        event_id: booking.event_id,
        contract_settings_version: settings.version,
        contract_html: contractHtml,
        contract_text: contractText,
        contract_hash: contractHash,
        status: "pre-signed",
        pdf_url: pdfUrl,
      })
      .select("id")
      .single();
    if (insertErr) throw insertErr;

    return Response.json({ success: true, pdfUrl, contractId: newContract?.id ?? null, alreadyExisted: false });
  } catch (error) {
    logger.errorRaw("route", "[api/contracts/generate] POST:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

