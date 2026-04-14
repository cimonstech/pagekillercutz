"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { PAGE_ICON_URL } from "@/lib/constants";
import Image from "next/image";
import {
  Calendar,
  ChevronRight,
  Info,
  LayoutDashboard,
  ListMusic,
  LogIn,
  LogOut,
  Package,
  Phone,
  Tag,
  User,
} from "lucide-react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scrollToAccount?: boolean;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  scrollToAccount = false,
}: MobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && scrollToAccount && accountRef.current) {
      setTimeout(() => {
        accountRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 350);
    }
  }, [isOpen, scrollToAccount]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.push("/");
    router.refresh();
  };

  const getFirstName = (): string => {
    if (!user) return "";
    const meta = user.user_metadata || {};
    if (meta.full_name) {
      return meta.full_name.split(" ")[0];
    }
    const email = user.email || "";
    const username = email.split("@")[0];
    const cleaned = username.replace(/[._-]/g, " ").split(" ")[0];
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  };

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

  const exploreItems = [
    {
      href: "/events",
      label: "Events",
      icon: Calendar,
      description: "Past & upcoming shows",
    },
    {
      href: "/pricing",
      label: "Pricing",
      icon: Tag,
      description: "DJ packages from GHS 1,500",
    },
    {
      href: "/about",
      label: "About",
      icon: Info,
      description: "Ghana's premier scratch DJ",
    },
    {
      href: "/contact",
      label: "Contact",
      icon: Phone,
      description: "Get in touch",
    },
  ];

  const accountItems = [
    {
      href: "/client/dashboard",
      label: "My Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/client/playlist",
      label: "My Playlist",
      icon: ListMusic,
    },
    {
      href: "/client/orders",
      label: "My Orders",
      icon: Package,
    },
    {
      href: "/client/profile",
      label: "My Profile",
      icon: User,
    },
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 300,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 300ms ease",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "290px",
          maxWidth: "82vw",
          height: "100vh",
          background: "rgba(8,8,16,0.98)",
          backdropFilter: "blur(32px) saturate(180%)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          zIndex: 400,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 320ms cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "20px 20px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <Image
            src={PAGE_ICON_URL}
            alt="Page KillerCutz"
            width={30}
            height={30}
            style={{ borderRadius: "7px" }}
            unoptimized
          />
          <div>
            <div
              style={{
                fontFamily: "Space Grotesk",
                fontWeight: 700,
                fontSize: "13px",
                color: "white",
                letterSpacing: "0.04em",
              }}
            >
              PAGE <span style={{ color: "#00BFFF" }}>KILLER</span>CUTZ
            </div>
            <div
              style={{
                fontFamily: "Inter",
                fontSize: "10px",
                color: "#5A6080",
                marginTop: "1px",
              }}
            >
              Ghana&apos;s Premier Scratch DJ
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 12px 8px" }}>
          <div
            style={{
              fontFamily: "Space Mono",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#5A6080",
              textTransform: "uppercase",
              padding: "0 8px",
              marginBottom: "6px",
            }}
          >
            Explore
          </div>

          {exploreItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "11px 12px",
                  borderRadius: "12px",
                  marginBottom: "2px",
                  textDecoration: "none",
                  background: isActive ? "rgba(0,191,255,0.08)" : "transparent",
                  borderLeft: isActive ? "3px solid #00BFFF" : "3px solid transparent",
                  transition: "background 150ms",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: isActive ? "rgba(0,191,255,0.12)" : "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={isActive ? "#00BFFF" : "rgba(255,255,255,0.50)"} />
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "Space Grotesk",
                      fontWeight: isActive ? 600 : 500,
                      fontSize: "14px",
                      color: isActive ? "white" : "rgba(255,255,255,0.80)",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter",
                      fontSize: "11px",
                      color: "#5A6080",
                      marginTop: "2px",
                    }}
                  >
                    {item.description}
                  </div>
                </div>

                <ChevronRight size={14} color="rgba(255,255,255,0.20)" />
              </Link>
            );
          })}
        </div>

        {user ? (
          <div
            ref={accountRef}
            style={{
              padding: "8px 12px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                fontFamily: "Space Mono",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "#5A6080",
                textTransform: "uppercase",
                padding: "8px 8px 6px",
              }}
            >
              My Account
            </div>

            {accountItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    marginBottom: "2px",
                    textDecoration: "none",
                    background: isActive ? "rgba(0,191,255,0.08)" : "transparent",
                    borderLeft: isActive ? "3px solid #00BFFF" : "3px solid transparent",
                  }}
                >
                  <Icon size={18} color={isActive ? "#00BFFF" : "rgba(255,255,255,0.45)"} />
                  <span
                    style={{
                      fontFamily: "Space Grotesk",
                      fontWeight: isActive ? 600 : 400,
                      fontSize: "14px",
                      color: isActive ? "white" : "rgba(255,255,255,0.70)",
                      flex: 1,
                    }}
                  >
                    {item.label}
                  </span>
                  <ChevronRight size={14} color="rgba(255,255,255,0.20)" />
                </Link>
              );
            })}
          </div>
        ) : null}

        <div style={{ flex: 1 }} />

        <div
          style={{
            padding: "12px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              marginBottom: "10px",
            }}
          >
            <Link
              href="/privacy"
              style={{
                fontFamily: "Inter",
                fontSize: "11px",
                color: "rgba(255,255,255,0.58)",
                textDecoration: "none",
              }}
            >
              Privacy
            </Link>
            <span style={{ color: "rgba(255,255,255,0.24)" }}>·</span>
            <Link
              href="/terms"
              style={{
                fontFamily: "Inter",
                fontSize: "11px",
                color: "rgba(255,255,255,0.58)",
                textDecoration: "none",
              }}
            >
              Terms
            </Link>
          </div>

          {user ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "#00BFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Space Grotesk",
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "#000",
                    flexShrink: 0,
                    border: "2px solid rgba(0,191,255,0.35)",
                  }}
                >
                  {getInitials()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "Space Grotesk",
                      fontWeight: 600,
                      fontSize: "14px",
                      color: "white",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {getFirstName()}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter",
                      fontSize: "11px",
                      color: "#5A6080",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginTop: "1px",
                    }}
                  >
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "rgba(255,69,96,0.08)",
                  border: "1px solid rgba(255,69,96,0.20)",
                  cursor: "pointer",
                  transition: "background 150ms ease",
                }}
              >
                <LogOut size={16} color="#FF4560" />
                <span
                  style={{
                    fontFamily: "Space Grotesk",
                    fontWeight: 600,
                    fontSize: "14px",
                    color: "#FF4560",
                  }}
                >
                  Sign Out
                </span>
              </button>
            </>
          ) : (
            <Link
              href="/sign-in"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "14px",
                borderRadius: "14px",
                background: "#00BFFF",
                textDecoration: "none",
              }}
            >
              <LogIn size={18} color="#000" />
              <span
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "#000",
                }}
              >
                Sign In
              </span>
            </Link>
          )}

          <div
            style={{
              marginTop: "10px",
              textAlign: "center",
              fontFamily: "Inter",
              fontSize: "10px",
              color: "rgba(255,255,255,0.42)",
            }}
          >
            Powered by Motivo Limited
          </div>
        </div>
      </div>
    </>
  );
}
