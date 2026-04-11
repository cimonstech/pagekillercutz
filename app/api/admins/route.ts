import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type AdminRow = Database["public"]["Tables"]["admins"]["Row"];
type AdminInsert = Database["public"]["Tables"]["admins"]["Insert"];

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("admins").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ admins: (data ?? []) as AdminRow[] });
  } catch (error) {
    logger.errorRaw("route", "[api/admins] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as AdminInsert;
    const insertPayload = body as unknown as never;
    if (!body.email || !body.role) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const { data, error } = await supabase.from("admins").insert(insertPayload).select("*").single();
    if (error) throw error;
    return Response.json({ admin: data as AdminRow }, { status: 201 });
  } catch (error) {
    logger.errorRaw("route", "[api/admins] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

