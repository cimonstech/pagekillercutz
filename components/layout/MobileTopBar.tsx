"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PAGE_ICON_URL } from "@/lib/constants";

interface MobileTopBarProps {
  onAvatarTap: () => void;
}

export default function MobileTopBar({ onAvatarTap }: MobileTopBarProps) {
  const { user, loading } = useAuth();

  const getInitials = (): string => {
    if (!user) return "";
    const meta = user.user_metadata || {};
    if (meta.full_name) {
      const parts = meta.full_name
        .trim()
        .split(" ")
        .filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (user.email || "").slice(0, 2).toUpperCase();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "56px",
        background: "rgba(8,8,16,0.94)",
        backdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 200,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
          minWidth: 0,
          flex: 1,
        }}
      >
        <Image
          src={PAGE_ICON_URL}
          alt="Page KillerCutz"
          width={26}
          height={26}
          style={{ borderRadius: "6px" }}
          unoptimized
        />
        <span
          style={{
            fontFamily: "Space Grotesk",
            fontWeight: 700,
            fontSize: "13px",
            color: "white",
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          PAGE <span style={{ color: "#00BFFF" }}>KILLER</span>CUTZ
        </span>
      </Link>

      <div style={{ marginLeft: "12px", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
        {loading ? (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
            }}
          />
        ) : user ? (
          <button
            onClick={onAvatarTap}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#00BFFF",
              border: "2px solid rgba(0,191,255,0.50)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Space Grotesk",
              fontWeight: 700,
              fontSize: "13px",
              color: "#000",
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: "0 0 12px rgba(0,191,255,0.30)",
            }}
          >
            {getInitials()}
          </button>
        ) : (
          <Link
            href="/sign-in"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "7px 14px",
              borderRadius: "999px",
              background: "rgba(0,191,255,0.12)",
              border: "1px solid rgba(0,191,255,0.30)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontFamily: "Space Grotesk",
                fontWeight: 600,
                fontSize: "12px",
                color: "#00BFFF",
              }}
            >
              Sign In
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
