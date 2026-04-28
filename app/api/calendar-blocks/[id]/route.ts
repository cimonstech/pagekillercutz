import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("calendar_blocks").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    logger.errorRaw("route", "[api/calendar-blocks/[id] DELETE]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
