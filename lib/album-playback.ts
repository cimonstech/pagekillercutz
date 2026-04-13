import type { AlbumTrack, Database } from "@/lib/database.types";
import type { PlayerTrack } from "@/lib/store/playerStore";

type MusicRow = Database["public"]["Tables"]["music"]["Row"];
type AlbumTrackExt = AlbumTrack & { duration_seconds?: number | null };

const ARTIST = "Page KillerCutz";

/** First track in the album that has an `audio_url` (for fallback when a row has no file). */
export function firstAlbumTrackAudioUrl(tracks: AlbumTrack[] | null | undefined): string | null {
  if (!tracks?.length) return null;
  const hit = tracks.find((t) => Boolean(t.audio_url));
  return hit?.audio_url ?? null;
}

/**
 * Resolve playable URL for album track `trackIndex`:
 * 1) that track's audio → 2) album-level mix → 3) first track in the album that has audio.
 */
export function resolveAlbumTrackAudioUrl(
  release: Pick<MusicRow, "audio_url" | "tracks" | "type">,
  trackIndex: number,
): string | null {
  const tracks = (release.tracks ?? []) as AlbumTrackExt[];
  const t = tracks[trackIndex];
  if (t?.audio_url) return t.audio_url;
  if (release.audio_url) return release.audio_url;
  return firstAlbumTrackAudioUrl(tracks);
}

function trackDurationSec(t: AlbumTrackExt, fallback: number | undefined): number | undefined {
  const ds = t.duration_seconds;
  if (typeof ds === "number" && ds > 0) return ds;
  if (t.duration > 0) return t.duration;
  return fallback;
}

/** One PlayerTrack per album row; singles/mixes become a single-item queue. */
export function buildAlbumPlayerQueue(release: MusicRow): PlayerTrack[] {
  if (release.type !== "album" || !release.tracks?.length) {
    let audioUrl = release.audio_url;
    if (!audioUrl && release.tracks?.length) {
      audioUrl = firstAlbumTrackAudioUrl(release.tracks as AlbumTrack[]);
    }
    const d = typeof release.duration === "number" && release.duration > 0 ? release.duration : undefined;
    return [
      {
        id: release.id,
        musicId: release.id,
        title: release.title,
        artist: ARTIST,
        coverUrl: release.cover_url,
        audioUrl,
        type: release.type,
        duration: d,
        durationSec: d,
        releaseType: release.type,
      },
    ];
  }

  const tracks = release.tracks as AlbumTrackExt[];
  const fallbackDur = typeof release.duration === "number" && release.duration > 0 ? release.duration : undefined;

  return tracks.map((t, idx) => {
    const audioUrl = resolveAlbumTrackAudioUrl(release, idx);
    const sec = trackDurationSec(t, fallbackDur);
    return {
      id: `${release.id}::tr::${idx}`,
      musicId: release.id,
      title: t.title,
      artist: ARTIST,
      coverUrl: release.cover_url,
      audioUrl,
      type: release.type,
      duration: sec,
      durationSec: sec,
      releaseType: release.type,
    };
  });
}
