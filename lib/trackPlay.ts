import { v4 as uuidv4 } from "uuid";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = sessionStorage.getItem("kc_session_id");
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem("kc_session_id", sessionId);
  }
  return sessionId;
}

/** Seconds listened for the active track (resets when track id changes). */
let listenedSec = 0;
let activeTrackId: string | null = null;
/** Prevents duplicate POSTs for the same track while it remains the current track. */
let postedForActiveTrack = false;

export function syncPlaybackTrack(trackId: string | null) {
  if (trackId !== activeTrackId) {
    activeTrackId = trackId;
    listenedSec = 0;
    postedForActiveTrack = false;
  }
}

export function tickPlaybackWhilePlaying(track: {
  musicId?: string;
  trackTitle: string;
  artist?: string;
  releaseType?: string;
  source?: string;
}) {
  if (!activeTrackId) return;
  listenedSec += 1;
  if (listenedSec < 12 || postedForActiveTrack) return;
  postedForActiveTrack = true;

  void fetch("/api/plays", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      musicId: track.musicId,
      trackTitle: track.trackTitle,
      artist: track.artist ?? "Page KillerCutz",
      releaseType: track.releaseType,
      durationPlayed: listenedSec,
      source: track.source ?? "music_page",
      sessionId: getSessionId(),
    }),
  }).catch((err) => console.error("[trackPlay] Failed:", err));
}

/** @deprecated — kept for any stray imports; no-op */
export function startTrackingPlay() {
  /* replaced by syncPlaybackTrack + tickPlaybackWhilePlaying */
}

/** @deprecated */
export function stopTrackingPlay() {
  /* pause no longer cancels counting toward the 12s threshold */
}
