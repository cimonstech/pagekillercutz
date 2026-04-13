"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import BottomPlayerBar from "@/components/layout/BottomPlayerBar";
import PlayTrackingBridge from "@/components/layout/PlayTrackingBridge";
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
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const barVisible = usePlayerStore((s) => s.isVisible);

  useEffect(() => {
    document.documentElement.style.setProperty("--player-offset", barVisible ? "6.25rem" : "0px");
    return () => {
      document.documentElement.style.setProperty("--player-offset", "0px");
    };
  }, [barVisible]);

  if (isAuthShellPath(pathname)) {
    return null;
  }

  if (pathname === "/merch" || pathname.startsWith("/merch/")) {
    return null;
  }

  return (
    <>
      <PlayTrackingBridge />
      {barVisible && currentTrack ? <BottomPlayerBar /> : null}
    </>
  );
}
