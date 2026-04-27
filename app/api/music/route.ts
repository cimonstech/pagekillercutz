import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type MusicRow = Database["public"]["Tables"]["music"]["Row"];
type MusicInsert = Database["public"]["Tables"]["music"]["Insert"];
type TrackWithDuration = { duration?: number };

const MUSIC_QUERY_TIMEOUT_MS = 6000;
const MUSIC_QUERY_MAX_ATTEMPTS = 3;

function resolveDuration(row: MusicRow): number | null {
  if (typeof row.duration === "number" && row.duration > 0) return row.duration;
  const tracks = Array.isArray(row.tracks) ? (row.tracks as TrackWithDuration[]) : [];
  const firstWithDuration = tracks.find(
    (t) => typeof t.duration === "number" && Number.isFinite(t.duration) && t.duration > 0,
  );
  return firstWithDuration?.duration ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientQueryError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("fetch failed") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("EAI_AGAIN") ||
    msg.includes("timeout")
  );
}

function queryWithTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`music query timeout after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort");
    const all = searchParams.get("all") === "true";
    const limit = Number(searchParams.get("limit") ?? "50");

    const runQuery = () => {
      let query = supabase.from("music").select("*");
      if (type && (type === "album" || type === "single" || type === "mix")) {
        query = query.eq("type", type);
      }
      if (featured === "true") query = query.eq("featured", true);
      if (featured === "false") query = query.eq("featured", false);

      if (sort === "asc" || sort === "desc") {
        const ascending = sort === "asc";
        query = query.order("release_date", { ascending }).order("created_at", { ascending });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      return query.limit(all ? 2000 : limit);
    };

    let data: MusicRow[] | null = null;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MUSIC_QUERY_MAX_ATTEMPTS; attempt += 1) {
      try {
        const result = await queryWithTimeout(runQuery(), MUSIC_QUERY_TIMEOUT_MS);
        const { data: rows, error } = result as { data: MusicRow[] | null; error: unknown };
        if (error) throw error;
        data = rows ?? [];
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        const isTransient = isTransientQueryError(error);
        logger.warnRaw(
          "route",
          `[api/music] query attempt ${attempt}/${MUSIC_QUERY_MAX_ATTEMPTS} failed (transient=${isTransient}):`,
          error,
        );
        if (!isTransient || attempt === MUSIC_QUERY_MAX_ATTEMPTS) break;
        await sleep(250 * attempt);
      }
    }

    if (lastError) throw lastError;

    const normalized = ((data ?? []) as MusicRow[]).map((row) => ({
      ...row,
      duration: resolveDuration(row),
    }));
    return Response.json({ music: normalized });
  } catch (error) {
    logger.errorRaw("route", "[api/music] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const supabase = getSupabaseAdmin();
    const body = (await request.json()) as MusicInsert;
    if (!body.title || !body.type) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const { data, error } = await supabase.from("music").insert(body).select("*").single();
    if (error) throw error;
    return Response.json({ music: data as MusicRow }, { status: 201 });
  } catch (error) {
    logger.errorRaw("route", "[api/music] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

