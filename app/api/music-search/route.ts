import { normalizeCoverUrl } from "@/lib/coverUrl";
import { logger } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

const searchLimiter = rateLimit({ interval: 60 * 1000, limit: 30 });

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { success } = searchLimiter.check(ip);
  if (!success) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return Response.json({ results: [] });
  }

  try {
    const url = new URL("https://api.deezer.com/search");
    url.searchParams.set("q", q.trim());
    url.searchParams.set("limit", "8");
    url.searchParams.set("output", "json");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      logger.errorRaw("route", "[music-search] Deezer error:", res.status);
      return Response.json({ results: [] });
    }

    const data = (await res.json()) as {
      data?: Array<{
        id: number;
        title: string;
        artist: { name: string };
        album: {
          title: string;
          cover_small: string;
          cover_medium: string;
        };
        duration: number;
        preview: string;
      }>;
      error?: unknown;
    };

    if (!data.data || data.error) {
      return Response.json({ results: [] });
    }

    const results = data.data.map((track) => ({
      id: String(track.id),
      title: track.title,
      artist: track.artist?.name ?? "Unknown",
      album: track.album?.title ?? "",
      coverUrl: normalizeCoverUrl(track.album?.cover_small ?? "") ?? "",
      duration: track.duration ?? 0,
      previewUrl: track.preview ?? "",
    }));

    return Response.json({ results });
  } catch (err) {
    logger.errorRaw("route", "[music-search] Error:", err);
    return Response.json({ results: [] });
  }
}
