import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/notify/email";
import { baseTemplate } from "@/lib/notify/emailTemplates";
import { uploadToR2 } from "@/lib/r2";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { generateContractPDF } from "@/lib/generateContract";
import { z } from "zod";

const signSchema = z.object({
  signatureType: z.enum(["drawn", "typed", "draw", "type"]),
  signatureData: z.string().min(2).max(200000),
});

type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];
type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { token } = await params;
    const body = signSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("signing_token", token)
      .maybeSingle();
    if (error) throw error;
    const contract = data as ContractRow | null;
    if (!contract) return Response.json({ error: "Contract not found" }, { status: 404 });
    if (contract.status === "signed") return Response.json({ success: true, pdfUrl: contract.pdf_url });
    if (!contract.token_expires_at || new Date(contract.token_expires_at).getTime() < Date.now()) {
      return Response.json({ error: "Signing link expired" }, { status: 410 });
    }

    if (!contract.booking_id) {
      return Response.json({ error: "Booking reference missing on contract" }, { status: 400 });
    }
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", contract.booking_id)
      .single();
    if (bookingError || !booking) {
      return Response.json({ error: "Booking not found for contract" }, { status: 404 });
    }
    const nowIso = new Date().toISOString();
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const clientUserAgent = request.headers.get("user-agent") || "";
    const normalizedSigType =
      body.signatureType === "draw" ? "drawn" : body.signatureType === "type" ? "typed" : body.signatureType;

    const { data: settingsByVersion } = contract.contract_settings_version
      ? await supabase.from("contract_settings").select("*").eq("version", contract.contract_settings_version).maybeSingle()
      : { data: null };
    const { data: currentSettings } = await supabase
      .from("contract_settings")
      .select("*")
      .eq("is_current", true)
      .maybeSingle();
    const { data: paymentSettings } = await supabase.from("payment_settings").select("*").maybeSingle();
    const settings = settingsByVersion ?? currentSettings;
    if (!settings) return Response.json({ error: "No contract settings configured" }, { status: 500 });

    const signedContractRecord: ContractRow = {
      ...contract,
      status: "signed",
      client_signed_at: nowIso,
      client_ip: clientIp,
      client_user_agent: clientUserAgent,
      client_signature_type: normalizedSigType,
      client_signature_data: body.signatureData,
    };

    const pdfBytes = await generateContractPDF(booking, settings, {
      ...signedContractRecord,
    }, paymentSettings);
    const pdfKey = `contracts/${booking.event_id}-signed.pdf`;
    const pdfUrl = await uploadToR2(Buffer.from(pdfBytes), pdfKey, "application/pdf");
    await supabase
      .from("contracts")
      .update({
        status: "signed",
        client_signed_at: nowIso,
        client_ip: clientIp,
        client_user_agent: clientUserAgent,
        client_signature_type: normalizedSigType,
        client_signature_data: body.signatureData,
        pdf_url: pdfUrl,
      })
      .eq("signing_token", token);

    try {
      await sendEmail({
        to: booking.client_email,
        subject: `Signed Contract — ${booking.event_id}`,
        html: baseTemplate(
          `Signed Contract — ${booking.event_id}`,
          `<div class="card"><h1>Contract Signed</h1><p>Your contract has been signed successfully.</p><p><a class="btn" href="${pdfUrl}">Download your copy →</a></p></div>`,
        ),
        type: "contract_signed_client",
        bookingId: booking.id,
      });
    } catch (emailError) {
      logger.errorRaw("route", "[api/contracts/[token]/sign] client email failed", emailError);
    }

    const djEmail = process.env.DJ_EMAIL;
    if (djEmail) {
      try {
        await sendEmail({
          to: djEmail,
          subject: `Contract Signed — ${booking.event_id}`,
          html: baseTemplate(
            `Contract Signed — ${booking.event_id}`,
            `<div class="card"><h1>Contract Signed</h1><p>${booking.client_name} signed ${booking.event_id}.</p><p><a class="btn" href="${pdfUrl}">View PDF →</a></p></div>`,
          ),
          type: "contract_signed_admin",
          bookingId: booking.id,
        });
      } catch (adminEmailError) {
        logger.errorRaw("route", "[api/contracts/[token]/sign] admin email failed", adminEmailError);
      }
    }

    try {
      await supabase.from("audit_logs").insert({
        actor: "system",
        actor_role: "system",
        action_type: "contract",
        description: `Contract signed by ${booking.client_name} for ${booking.event_id}`,
        target_id: booking.event_id,
        ip_address: null,
      });
    } catch (auditError) {
      logger.errorRaw("route", "[api/contracts/[token]/sign] audit log insert failed", auditError);
    }

    return Response.json({ success: true, pdfUrl });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    logger.errorRaw("route", "[api/contracts/[token]/sign] POST:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
