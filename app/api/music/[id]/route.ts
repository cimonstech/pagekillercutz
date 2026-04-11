import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";

type MusicRow = Database["public"]["Tables"]["music"]["Row"];
type MusicUpdate = Database["public"]["Tables"]["music"]["Update"];
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("music").select("*").eq("id", id).single();
    if (error) throw error;
    return Response.json({ music: data as MusicRow });
  } catch (error) {
    logger.errorRaw("api/music/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as MusicUpdate;
    const { data, error } = await supabase
      .from("music")
      .update({ ...body })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ music: data as MusicRow });
  } catch (error) {
    logger.errorRaw("api/music/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("music").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    logger.errorRaw("api/music/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
