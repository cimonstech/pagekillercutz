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

let playTimer: ReturnType<typeof setTimeout> | null = null;
let playStartTime: number | null = null;

export function startTrackingPlay(track: {
  musicId?: string;
  trackTitle: string;
  artist?: string;
  releaseType?: string;
  source?: string;
}) {
  stopTrackingPlay();
  playStartTime = Date.now();

  playTimer = setTimeout(() => {
    const durationPlayed = Math.round(
      (Date.now() - (playStartTime ?? Date.now())) / 1000,
    );

    void fetch("/api/plays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musicId: track.musicId,
        trackTitle: track.trackTitle,
        artist: track.artist ?? "Page KillerCutz",
        releaseType: track.releaseType,
        durationPlayed,
        source: track.source ?? "music_page",
        sessionId: getSessionId(),
      }),
    }).catch((err) => console.error("[trackPlay] Failed:", err));
  }, 30000);
}

export function stopTrackingPlay() {
  if (playTimer) {
    clearTimeout(playTimer);
    playTimer = null;
  }
  playStartTime = null;
}
