import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "20"), 1), 50);
    const adminView = searchParams.get("admin") === "true";

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("reviews")
      .select("*")
      .order("submitted_at", { ascending: false })
      .limit(limit);

    if (adminView) {
      const auth = await requireAdmin();
      if (!auth.authorized) return auth.errorResponse;
    } else {
      query = query.eq("status", "approved");
    }

    const { data, error } = await query;
    if (error) throw error;

    const reviews = ((data ?? []) as ReviewRow[]).map((r) => ({
      id: r.id,
      rating: r.rating ?? 0,
      first_name: r.client_name.trim().split(/\s+/)[0] ?? "Client",
      client_name: r.client_name,
      event_type: r.event_type,
      event_month: r.event_month,
      review_text: r.review_text,
      submitted_at: r.submitted_at,
      status: r.status,
      hidden_reason: r.hidden_reason,
    }));

    return Response.json({ reviews });
  } catch (error) {
    logger.errorRaw("route", "[api/reviews] GET:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
