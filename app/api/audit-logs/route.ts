import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];
type AuditLogInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get("action_type");
    const actor = searchParams.get("actor");
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "20"), 1), 500);
    const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const includeArchived = searchParams.get("include_archived") === "true";

    if (includeArchived && auth.role !== "super_admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeArchived) {
      query = query.eq("archived", false);
    }

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
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as Partial<AuditLogInsert>;
    if (!body.action_type || !body.description) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const row: AuditLogInsert = {
      actor: auth.email,
      actor_role: auth.role,
      action_type: body.action_type,
      description: body.description,
      target_id: body.target_id ?? null,
      ip_address: body.ip_address ?? null,
    };
    const { data, error } = await supabase.from("audit_logs").insert(row).select("*").single();
    if (error) throw error;
    return Response.json({ log: data as AuditLogRow }, { status: 201 });
  } catch (error) {
    logger.errorRaw("route", "[api/audit-logs] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
