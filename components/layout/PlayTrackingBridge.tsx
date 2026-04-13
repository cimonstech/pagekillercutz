"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { startTrackingPlay, stopTrackingPlay } from "@/lib/trackPlay";
import type { PlayerTrack } from "@/lib/store/playerStore";
import { usePlayerStore } from "@/lib/store/playerStore";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveMusicId(track: PlayerTrack): string | undefined {
  for (const c of [track.musicId, track.id]) {
    if (typeof c === "string" && UUID_RE.test(c)) return c;
  }
  return undefined;
}

const NO_TRACK_PREFIXES = ["/sign-in", "/register", "/verify-email", "/reset-password", "/admin/login"] as const;

function isAuthShellPath(pathname: string) {
  return NO_TRACK_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function PlayTrackingBridge() {
  const pathname = usePathname();
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    if (isAuthShellPath(pathname) || pathname === "/merch" || pathname.startsWith("/merch/")) {
      stopTrackingPlay();
      return;
    }

    if (!current || !isPlaying) {
      stopTrackingPlay();
      return;
    }

    startTrackingPlay({
      musicId: resolveMusicId(current),
      trackTitle: current.title,
      artist: current.artist,
      releaseType: current.releaseType,
      source: "player_bar",
    });

    return () => {
      stopTrackingPlay();
    };
  }, [
    pathname,
    current?.id,
    current?.musicId,
    current?.title,
    current?.artist,
    current?.releaseType,
    isPlaying,
  ]);

  return null;
}
