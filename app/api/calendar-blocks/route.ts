import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { z } from "zod";

const postSchema = z.object({
  block_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  block_type: z.enum(["full_day", "time_range"]),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  reason: z.string().max(500).nullable().optional(),
});

type BlockRow = Database["public"]["Tables"]["calendar_blocks"]["Row"];

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) {
      return Response.json({ error: "from and to query params required (YYYY-MM-DD)" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("calendar_blocks")
      .select("*")
      .gte("block_date", from)
      .lte("block_date", to)
      .order("block_date", { ascending: true });

    if (error) throw error;
    return Response.json({ blocks: (data ?? []) as BlockRow[] });
  } catch (error) {
    logger.errorRaw("route", "[api/calendar-blocks GET]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const raw = await request.json();
    const parsed = postSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    if (body.block_type === "time_range") {
      if (!body.start_time?.trim() || !body.end_time?.trim()) {
        return Response.json({ error: "start_time and end_time required for time_range" }, { status: 400 });
      }
    }

    const supabase = getSupabaseAdmin();
    const insert: Database["public"]["Tables"]["calendar_blocks"]["Insert"] = {
      block_date: body.block_date,
      block_type: body.block_type,
      start_time: body.block_type === "time_range" ? normalizeTime(body.start_time) : null,
      end_time: body.block_type === "time_range" ? normalizeTime(body.end_time) : null,
      reason: body.reason?.trim() || null,
      created_by: auth.email ?? null,
    };

    const { data, error } = await supabase.from("calendar_blocks").insert(insert).select("*").single();
    if (error) throw error;
    return Response.json({ block: data as BlockRow }, { status: 201 });
  } catch (error) {
    logger.errorRaw("route", "[api/calendar-blocks POST]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

function normalizeTime(s: string | null | undefined): string | null {
  if (!s?.trim()) return null;
  const m = s.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = m[1]!.padStart(2, "0");
  const min = m[2]!.padStart(2, "0");
  return `${h}:${min}:00`;
}
