import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];
type AuditLogInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get("action_type");
    const actor = searchParams.get("actor");
    const limit = Number(searchParams.get("limit") ?? "20");
    const offset = Number(searchParams.get("offset") ?? "0");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (actionType) query = query.eq("action_type", actionType);
    if (actor) query = query.ilike("actor", `%${actor}%`);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);

    const { data, error, count } = await query;
    if (error) throw error;
    return Response.json({ logs: (data ?? []) as AuditLogRow[], count: count ?? 0 });
  } catch (error) {
    logger.errorRaw("route", "[api/audit-logs] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as AuditLogInsert;
    const insertPayload = body as unknown as never;
    if (!body.actor || !body.actor_role || !body.action_type || !body.description) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const { data, error } = await supabase.from("audit_logs").insert(insertPayload).select("*").single();
    if (error) throw error;
    return Response.json({ log: data as AuditLogRow }, { status: 201 });
  } catch (error) {
    logger.errorRaw("route", "[api/audit-logs] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

