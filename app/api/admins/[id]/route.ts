import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";

type AdminRow = Database["public"]["Tables"]["admins"]["Row"];
type AdminUpdate = Database["public"]["Tables"]["admins"]["Update"];
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as AdminUpdate;
    const updatePayload = { ...body } as unknown as never;
    const { data, error } = await supabase
      .from("admins")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ admin: data as AdminRow });
  } catch (error) {
    logger.errorRaw("api/admins/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("admins").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    logger.errorRaw("api/admins/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
