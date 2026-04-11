import { getSupabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";

type PackageRow = Database["public"]["Tables"]["packages"]["Row"];
type PackageUpdate = Database["public"]["Tables"]["packages"]["Update"];
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("packages").select("*").eq("id", id).single();
    if (error) throw error;
    return Response.json({ package: data as PackageRow });
  } catch (error) {
    logger.errorRaw("api/packages/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as PackageUpdate;
    const { data, error } = await supabase
      .from("packages")
      .update({ ...body })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ package: data as PackageRow });
  } catch (error) {
    logger.errorRaw("api/packages/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    logger.errorRaw("api/packages/[id]", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
