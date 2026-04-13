import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventInsert = Database["public"]["Tables"]["events"]["Insert"];

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort") || "desc";
    const all = searchParams.get("all") === "true";
    const limit = Number(searchParams.get("limit") ?? "50");

    let query = supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: sort === "asc" })
      .limit(all ? 2000 : limit);
    if (type) query = query.eq("event_type", type);
    if (featured === "true") query = query.eq("featured", true);
    if (featured === "false") query = query.eq("featured", false);

    const { data, error } = await query;
    if (error) throw error;
    return Response.json({ events: (data ?? []) as EventRow[] });
  } catch (error) {
    logger.errorRaw("route", "[api/events] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as EventInsert;
    if (!body.title || !body.event_type || !body.event_date) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const { data, error } = await supabase.from("events").insert(body).select("*").single();
    if (error) throw error;
    return Response.json({ event: data as EventRow }, { status: 201 });
  } catch (error) {
    logger.errorRaw("route", "[api/events] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

