"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { syncPlaybackTrack, tickPlaybackWhilePlaying } from "@/lib/trackPlay";
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
  const current = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    syncPlaybackTrack(current?.id ?? null);
  }, [current?.id]);

  useEffect(() => {
    if (isAuthShellPath(pathname)) {
      return;
    }

    if (!current || !isPlaying) {
      return;
    }

    const payload = {
      musicId: resolveMusicId(current),
      trackTitle: current.title,
      artist: current.artist,
      releaseType: current.releaseType,
      source: "player_bar" as const,
    };

    const iv = window.setInterval(() => {
      tickPlaybackWhilePlaying(payload);
    }, 1000);

    return () => {
      window.clearInterval(iv);
    };
  }, [
    pathname,
    current?.id,
    current?.title,
    current?.artist,
    current?.releaseType,
    current?.musicId,
    isPlaying,
  ]);

  return null;
}
