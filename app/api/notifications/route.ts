import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Number(searchParams.get("limit") ?? "20");

  const admin = getSupabaseAdmin();
  let query = admin
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    logger.error("notifications", "failed to fetch notifications", error);
    return Response.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
  return Response.json({ notifications: data ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.errorResponse;

  const body = (await request.json()) as { id?: string; status?: string };
  if (!body.id || !body.status) {
    return Response.json({ error: "id and status are required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("notifications").update({ status: body.status }).eq("id", body.id);

  if (error) {
    logger.error("notifications", "failed to update notification", error);
    return Response.json({ error: "Failed to update notification" }, { status: 500 });
  }

  return Response.json({ success: true });
}
