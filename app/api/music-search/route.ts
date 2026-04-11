import { logger } from "@/lib/logger";
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return Response.json({ results: [] });
  }

  try {
    const url = new URL("https://musicbrainz.org/ws/2/recording/");
    url.searchParams.set("query", q);
    url.searchParams.set("fmt", "json");
    url.searchParams.set("limit", "10");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Page KillerCutz/1.0 (contact@pagekillercutz.com)",
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      return Response.json({ results: [] });
    }

    const data = (await res.json()) as { recordings?: Record<string, unknown>[] };
    const results = (data.recordings || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.title,
      artist: (r["artist-credit"] as Array<{ artist: { name: string } }>)?.[0]?.artist?.name || "Unknown Artist",
      duration: r.length ? Math.round((r.length as number) / 1000) : null,
    }));

    return Response.json({ results });
  } catch (err) {
    logger.errorRaw("route", "[music-search] Error:", err);
    return Response.json({ results: [] });
  }
}

