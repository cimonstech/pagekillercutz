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
  "/admin-login",
] as const;

function isAuthShellPath(pathname: string) {
  return NO_PLAYER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Admin app mounts its own BottomPlayerBar in app/admin/layout.tsx (with padded main). */
function isAdminAppPath(pathname: string) {
  return pathname.startsWith("/admin");
}

export default function GlobalPlayerMount() {
  const pathname = usePathname();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const barVisible = usePlayerStore((s) => s.isVisible);
  const isMinimized = usePlayerStore((s) => s.isMinimized);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      document.documentElement.style.setProperty("--player-bottom", mq.matches ? "88px" : "0px");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [pathname]);

  useEffect(() => {
    const show = Boolean(barVisible && currentTrack);
    if (!show) {
      document.documentElement.style.setProperty("--player-offset", "0px");
      return;
    }

    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      const mobile = mq.matches;
      const pb = mobile ? 88 : 0;

      if (mobile) {
        if (isMinimized) {
          document.documentElement.style.setProperty("--player-offset", `${64 + pb}px`);
        } else {
          document.documentElement.style.setProperty("--player-offset", `${pb}px`);
        }
      } else {
        const offset = isMinimized ? "5rem" : "6.25rem";
        document.documentElement.style.setProperty("--player-offset", offset);
      }
    };

    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
    };
  }, [barVisible, currentTrack, isMinimized, pathname]);

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
