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

/** Admin app mounts its own BottomPlayerBar in app/admin/layout.tsx (with padded main). */
function isAdminAppPath(pathname: string) {
  return pathname.startsWith("/admin") && pathname !== "/admin/login";
}

export default function GlobalPlayerMount() {
  const pathname = usePathname();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const barVisible = usePlayerStore((s) => s.isVisible);
  const playerBarMinimized = usePlayerStore((s) => s.playerBarMinimized);

  useEffect(() => {
    const show = Boolean(barVisible && currentTrack);
    if (!show) {
      document.documentElement.style.setProperty("--player-offset", "0px");
      return () => {
        document.documentElement.style.setProperty("--player-offset", "0px");
      };
    }
    const offset = playerBarMinimized ? "5rem" : "6.25rem";
    document.documentElement.style.setProperty("--player-offset", offset);
    return () => {
      document.documentElement.style.setProperty("--player-offset", "0px");
    };
  }, [barVisible, currentTrack, playerBarMinimized]);

  if (isAuthShellPath(pathname)) {
    return null;
  }

  if (pathname === "/merch" || pathname.startsWith("/merch/")) {
    return null;
  }

  if (isAdminAppPath(pathname)) {
    return <PlayTrackingBridge />;
  }

  return (
    <>
      <PlayTrackingBridge />
      {barVisible && currentTrack ? <BottomPlayerBar /> : null}
    </>
  );
}
