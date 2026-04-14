import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import type { Database } from "@/lib/database.types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_EVENT_PATCH_FIELDS = new Set([
  "title",
  "event_type",
  "event_date",
  "venue",
  "description",
  "featured",
  "media_urls",
  "cover_image_url",
]);

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
    if (error) {
      logger.errorRaw("api/events/[id]", "GET:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
    if (!data) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }
    return Response.json({ event: data as EventRow });
  } catch (error) {
    logger.errorRaw("api/events/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const raw = (await request.json()) as Record<string, unknown>;

    const safeUpdate: Record<string, unknown> = {};
    for (const key of Object.keys(raw)) {
      if (ALLOWED_EVENT_PATCH_FIELDS.has(key)) {
        safeUpdate[key] = raw[key];
      }
    }

    if (Object.keys(safeUpdate).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("events")
      .update(safeUpdate)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ event: data as EventRow });
  } catch (error) {
    logger.errorRaw("api/events/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    logger.errorRaw("api/events/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
