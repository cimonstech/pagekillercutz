"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import BottomPlayerBar from "@/components/layout/BottomPlayerBar";
import PlayerAudioEngine from "@/components/layout/PlayerAudioEngine";
import { usePlayerStore } from "@/lib/store/playerStore";

const NO_PLAYER_PREFIXES = [
  "/sign-in",
  "/register",
  "/verify-email",
  "/reset-password",
  "/admin/login",
] as const;

function isAuthShellPath(pathname: string) {
  return NO_PLAYER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function GlobalPlayerMount() {
  const pathname = usePathname();
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const barVisible = Boolean(current && isPlaying);

  useEffect(() => {
    document.documentElement.style.setProperty("--player-offset", barVisible ? "6.25rem" : "0px");
    return () => {
      document.documentElement.style.setProperty("--player-offset", "0px");
    };
  }, [barVisible]);

  if (isAuthShellPath(pathname)) {
    return null;
  }

  return (
    <>
      {current ? <PlayerAudioEngine /> : null}
      {barVisible ? <BottomPlayerBar /> : null}
    </>
  );
}
