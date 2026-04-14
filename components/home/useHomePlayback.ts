"use client";

import { useCallback } from "react";
import { buildAlbumPlayerQueue } from "@/lib/album-playback";
import { usePlayerStore } from "@/lib/store/playerStore";
import type { MusicRow } from "./homeShared";

export function usePlayMusicRow() {
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  return useCallback(
    async (m: MusicRow) => {
      const q = buildAlbumPlayerQueue(m);
      const start = q.find((t) => t.audioUrl) ?? q[0];
      if (!start) return;
      if (currentTrack?.musicId === m.id) {
        togglePlay();
        return;
      }
      setQueue(q);
      await setTrack(start);
    },
    [currentTrack?.musicId, setQueue, setTrack, togglePlay],
  );
}
