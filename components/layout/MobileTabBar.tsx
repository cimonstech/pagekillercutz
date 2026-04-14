"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCartStore } from "@/lib/store/cartStore"
import {
  Home, Music, ShoppingBag
} from "lucide-react"

interface MobileTabBarProps {
  isDrawerOpen: boolean
  onMoreTap: () => void
}

export default function MobileTabBar({
  isDrawerOpen,
  onMoreTap,
}: MobileTabBarProps) {
  const pathname = usePathname()
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.qty, 0))

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href)

  const iconColor = (href: string) =>
    isActive(href)
      ? "#00BFFF"
      : "rgba(255,255,255,0.40)"

  const labelColor = (href: string) =>
    isActive(href)
      ? "#00BFFF"
      : "rgba(255,255,255,0.40)"

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      // Safe area for iPhone home bar
      paddingBottom:
        "env(safe-area-inset-bottom, 0px)",
    }}>
      {/*
        The Book button floats above.
        We use a wrapper that is taller
        than the visible bar to contain
        the floating circle.
      */}
      <div style={{
        position: "relative",
        height: "88px", // 64px bar + 24px overflow
      }}>

        {/* ── FLOATING BOOK BUTTON ── */}
        <Link
          href="/booking"
          style={{
            position: "absolute",
            top: 0,               // sits at the very top of wrapper
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            textDecoration: "none",
            zIndex: 10,
          }}
        >
          {/* Circle */}
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "#00BFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // Border matches the bar background
            // to create the "cut out" illusion
            border: "4px solid #080810",
            boxShadow:
              "0 4px 20px rgba(0,191,255,0.45)," +
              "0 0 0 1px rgba(0,191,255,0.20)",
          }}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000000"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Microphone icon */}
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
          </div>

          {/* Label below the circle */}
          <span style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "10px",
            fontWeight:
              isActive("/booking") ? 600 : 500,
            color: isActive("/booking")
              ? "#00BFFF"
              : "rgba(255,255,255,0.70)",
            letterSpacing: "0.01em",
            lineHeight: 1,
          }}>
            Book
          </span>
        </Link>

        {/* ── TAB BAR BACKGROUND ── */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "64px",
          background: "rgba(8,8,16,0.97)",
          backdropFilter:
            "blur(24px) saturate(180%)",
          borderTop:
            "1px solid rgba(255,255,255,0.08)",
          // Rounded top corners for premium feel
          borderRadius: "16px 16px 0 0",
          display: "flex",
          alignItems: "center",
        }}>

          {/* LEFT SIDE — Home + Music */}
          <div style={{
            flex: 1,
            display: "flex",
          }}>
            {/* Home */}
            <Link
              href="/"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                textDecoration: "none",
                padding: "8px 4px",
                borderTop: isActive("/")
                  ? "2px solid #00BFFF"
                  : "2px solid transparent",
                transition: "all 150ms ease",
              }}
            >
              <Home
                size={21}
                color={iconColor("/")}
                strokeWidth={1.8}
              />
              <span style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: isActive("/")
                  ? 600 : 400,
                color: labelColor("/"),
                letterSpacing: "0.01em",
              }}>
                Home
              </span>
            </Link>

            {/* Music */}
            <Link
              href="/music"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                textDecoration: "none",
                padding: "8px 4px",
                borderTop: isActive("/music")
                  ? "2px solid #00BFFF"
                  : "2px solid transparent",
                transition: "all 150ms ease",
              }}
            >
              <Music
                size={21}
                color={iconColor("/music")}
                strokeWidth={1.8}
              />
              <span style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: isActive("/music")
                  ? 600 : 400,
                color: labelColor("/music"),
                letterSpacing: "0.01em",
              }}>
                Music
              </span>
            </Link>
          </div>

          {/* CENTRE GAP — space for floating button */}
          <div style={{ width: "72px" }} />

          {/* RIGHT SIDE — Merch + More */}
          <div style={{
            flex: 1,
            display: "flex",
          }}>
            {/* Merch */}
            <Link
              href="/merch"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                textDecoration: "none",
                padding: "8px 4px",
                borderTop: isActive("/merch")
                  ? "2px solid #00BFFF"
                  : "2px solid transparent",
                transition: "all 150ms ease",
                position: "relative",
              }}
            >
              <ShoppingBag
                size={21}
                color={iconColor("/merch")}
                strokeWidth={1.8}
              />
              {cartCount > 0 ? (
                <span
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "calc(50% - 18px)",
                    minWidth: "16px",
                    height: "16px",
                    padding: "0 4px",
                    borderRadius: "999px",
                    background: "#00BFFF",
                    color: "#000",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "10px",
                    fontWeight: 700,
                    lineHeight: "16px",
                    textAlign: "center",
                  }}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
              <span style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: isActive("/merch")
                  ? 600 : 400,
                color: labelColor("/merch"),
                letterSpacing: "0.01em",
              }}>
                Merch
              </span>
            </Link>

            {/* More — drawer trigger */}
            <button
              onClick={onMoreTap}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                background: "transparent",
                border: "none",
                borderTop: isDrawerOpen
                  ? "2px solid rgba(255,255,255,0.30)"
                  : "2px solid transparent",
                cursor: "pointer",
                padding: "8px 4px",
                transition: "all 150ms ease",
              }}
            >
              {/* Animated hamburger → X */}
              <div style={{
                width: "21px",
                height: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "flex-start",
                position: "relative",
              }}>
                <span style={{
                  display: "block",
                  height: "2px",
                  width: "18px",
                  background: isDrawerOpen
                    ? "white"
                    : "rgba(255,255,255,0.40)",
                  borderRadius: "2px",
                  transformOrigin: "center",
                  transition:
                    "transform 280ms cubic-bezier(0.4,0,0.2,1)," +
                    "opacity 280ms ease," +
                    "background 150ms ease",
                  transform: isDrawerOpen
                    ? "translateY(7px) rotate(45deg)"
                    : "none",
                }} />
                <span style={{
                  display: "block",
                  height: "2px",
                  width: "18px",
                  background: isDrawerOpen
                    ? "white"
                    : "rgba(255,255,255,0.40)",
                  borderRadius: "2px",
                  transition:
                    "transform 280ms ease," +
                    "opacity 280ms ease," +
                    "background 150ms ease",
                  transform: isDrawerOpen
                    ? "scaleX(0)"
                    : "scaleX(1)",
                  opacity: isDrawerOpen ? 0 : 1,
                }} />
                <span style={{
                  display: "block",
                  height: "2px",
                  width: isDrawerOpen
                    ? "18px" : "12px",
                  background: isDrawerOpen
                    ? "white"
                    : "rgba(255,255,255,0.40)",
                  borderRadius: "2px",
                  transformOrigin: "center",
                  transition:
                    "transform 280ms cubic-bezier(0.4,0,0.2,1)," +
                    "width 280ms ease," +
                    "background 150ms ease",
                  transform: isDrawerOpen
                    ? "translateY(-7px) rotate(-45deg)"
                    : "none",
                }} />
              </div>

              <span style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: 400,
                color: isDrawerOpen
                  ? "white"
                  : "rgba(255,255,255,0.40)",
                letterSpacing: "0.01em",
                transition: "color 150ms ease",
              }}>
                {isDrawerOpen ? "Close" : "More"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
