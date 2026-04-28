import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { token } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("signing_token", token)
      .maybeSingle();
    if (error) throw error;
    const contract = data as ContractRow | null;
    if (!contract) return Response.json({ error: "Contract not found" }, { status: 404 });
    if (!contract.token_expires_at || new Date(contract.token_expires_at).getTime() < Date.now()) {
      return Response.json({ error: "This signing link has expired. Contact Page KillerCutz." }, { status: 410 });
    }

    const booking = contract.booking_id
      ? (
          await supabase
            .from("bookings")
            .select("client_name,client_email,event_date,event_type,is_company,company_name,rep_title,event_id")
            .eq("id", contract.booking_id)
            .maybeSingle()
        ).data
      : null;

    return Response.json({
      contract: {
        id: contract.id,
        status: contract.status,
        eventId: contract.event_id,
        contractHtml: contract.contract_html,
        contractText: contract.contract_text,
        pdfUrl: contract.pdf_url,
        booking,
      },
    });
  } catch (error) {
    logger.errorRaw("route", "[api/contracts/[token]] GET:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
