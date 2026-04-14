"use client";

import { useCallback, useState } from "react";
import MobileTopBar from "./MobileTopBar";
import MobileDrawer from "./MobileDrawer";
import MobileTabBar from "./MobileTabBar";
import { usePlayerStore } from "@/lib/store/playerStore";

interface MobileLayoutProps {
  children: React.ReactNode;
  showTabBar?: boolean;
}

export default function MobileLayout({
  children,
  showTabBar = true,
}: MobileLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [scrollToAccount, setScrollToAccount] = useState(false);
  const playerVisible = usePlayerStore((s) => s.isVisible);

  const openDrawer = useCallback((toAccount = false) => {
    setScrollToAccount(toAccount);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setScrollToAccount(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    if (isDrawerOpen) {
      closeDrawer();
    } else {
      openDrawer(false);
    }
  }, [closeDrawer, isDrawerOpen, openDrawer]);

  const baseBottom = showTabBar ? 88 : 0;
  const playerPadding = showTabBar && playerVisible ? 88 : 0;

  return (
    <>
      <MobileTopBar onAvatarTap={() => openDrawer(true)} />

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        scrollToAccount={scrollToAccount}
      />

      <div
        style={{
          paddingTop: "56px",
          paddingBottom: `${baseBottom + playerPadding}px`,
          minHeight: "100vh",
        }}
      >
        {children}
      </div>

      {showTabBar ? (
        <MobileTabBar
          isDrawerOpen={isDrawerOpen}
          onMoreTap={toggleDrawer}
        />
      ) : null}
    </>
  );
}
