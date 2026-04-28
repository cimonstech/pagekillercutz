import { requireAdmin } from "@/lib/requireAdmin";
import { buildContractText, generateContractPDF } from "@/lib/generateContract";
import type { ContractSettings } from "@/lib/generateContract";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  const settings = (await request.json()) as ContractSettings;

  const sampleBooking = {
    event_id: "EVT-SAMPLE",
    client_name: "Ama Mensah",
    client_email: "ama@example.com",
    client_phone: "+233244000000",
    event_type: "Wedding",
    event_date: "2026-12-25",
    event_start_time_input: "18:00",
    event_duration_hours: 5,
    venue: "Kempinski Hotel Gold Coast, Accra",
    package_name: "Signature",
    is_company: false,
    company_name: null,
    rep_title: null,
    package_price: 20000,
    deposit_amount: 6000,
  };

  const contractText = buildContractText(sampleBooking, settings);
  const admin = getSupabaseAdmin();
  const { data: paymentSettings } = await admin.from("payment_settings").select("*").maybeSingle();
  const pdfBytes = await generateContractPDF(
    sampleBooking,
    settings,
    { status: "pre-signed", contract_hash: "preview" },
    paymentSettings,
  );

  return Response.json({ contractText, pdfPreviewBase64: Buffer.from(pdfBytes).toString("base64") });
}
