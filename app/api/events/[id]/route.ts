import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
    if (error) throw error;
    return Response.json({ event: data as EventRow });
  } catch (error) {
    logger.errorRaw("api/events/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as EventUpdate;
    const { data, error } = await supabase
      .from("events")
      .update({ ...body })
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
