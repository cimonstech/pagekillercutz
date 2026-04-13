"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, ListMusic, LogOut } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAdmin } from "@/hooks/useStaffAdmin";
import { getDisplayName, getInitials } from "@/lib/user-display";
import { createClient } from "@/lib/supabase/client";
import { PAGE_ICON_URL } from "@/lib/constants";

const CENTER_LINKS = [
  { href: "/", label: "Home", match: "home" },
  { href: "/music", label: "Mixes", match: "mixes" },
  { href: "/music?view=charts", label: "Charts", match: "charts" },
  { href: "/events", label: "Live", match: "live" },
  { href: "/about", label: "About", match: "about" },
] as const;

function DesktopUserAuth({
  user,
  loading,
  showClientPlaylist,
}: {
  user: User | null;
  loading: boolean;
  /** Client playlist portal — hidden for admin / super_admin staff accounts. */
  showClientPlaylist: boolean;
}) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div
        className="hidden shrink-0 rounded-pill md:block"
        style={{
          width: 80,
          height: 32,
          background: "rgba(255,255,255,0.06)",
        }}
        aria-hidden
      />
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => router.push("/sign-in")}
        className="hidden shrink-0 rounded-pill border border-[#00BFFF] bg-transparent px-5 py-2 font-headline text-[13px] font-semibold text-[#00BFFF] transition-colors hover:bg-[#00BFFF]/10 md:inline-flex md:items-center md:justify-center"
      >
        Sign In
      </button>
    );
  }

  const headerTitle =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user.email ||
    "Account";
  const headerEmail = user.email ?? "";

  return (
    <div ref={dropdownRef} className="relative hidden shrink-0 md:block">
      <button
        type="button"
        onClick={() => setDropdownOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 rounded-pill border border-white/[0.10] bg-white/[0.06] py-1 pl-1 pr-3.5 transition-all duration-150 ease-in-out hover:border-white/[0.16] hover:bg-white/[0.10]"
        aria-expanded={dropdownOpen}
        aria-haspopup="menu"
      >
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#00BFFF] font-headline text-[11px] font-bold text-black uppercase"
          aria-hidden
        >
          {getInitials(user)}
        </span>
        <span className="max-w-[140px] truncate font-headline text-[13px] font-medium text-white">
          {getDisplayName(user)}
        </span>
        <ChevronDown
          className={[
            "size-[14px] shrink-0 text-white/40 transition-transform duration-150",
            dropdownOpen ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>

      {dropdownOpen ? (
        <div
          className="absolute right-0 z-[100] overflow-hidden rounded-[14px] border border-white/[0.10] p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.60)]"
          style={{
            top: "calc(100% + 8px)",
            width: 200,
            background: "rgba(15,15,25,0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          role="menu"
        >
          <div className="mb-1 border-b border-white/[0.06] px-3 pb-2 pt-2.5">
            <p className="max-w-[160px] truncate font-headline text-[13px] font-semibold text-white">{headerTitle}</p>
            <p className="mt-0.5 max-w-[160px] truncate font-body text-[11px] text-[#5A6080]">{headerEmail}</p>
          </div>

          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
            onClick={() => {
              setDropdownOpen(false);
              router.push("/client/dashboard");
            }}
          >
            <LayoutDashboard className="size-[15px] shrink-0 text-white/40" aria-hidden />
            <span className="font-body text-[13px] text-white">My Dashboard</span>
          </button>
          {showClientPlaylist ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
              onClick={() => {
                setDropdownOpen(false);
                router.push("/client/playlist");
              }}
            >
              <ListMusic className="size-[15px] shrink-0 text-white/40" aria-hidden />
              <span className="font-body text-[13px] text-white">My Playlist</span>
            </button>
          ) : null}

          <div className="my-1 h-px bg-white/[0.06]" />

          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[#FF4560] transition-colors hover:bg-white/[0.06]"
            onClick={() => {
              void (async () => {
                setDropdownOpen(false);
                const supabase = createClient();
                await supabase.auth.signOut();
                localStorage.removeItem("adminRole");
                router.push("/");
              })();
            }}
          >
            <LogOut className="size-[15px] shrink-0 text-[#FF4560]" aria-hidden />
            <span className="font-body text-[13px] font-medium text-[#FF4560]">Sign Out</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PublicTopBarInner({
  mobileOpen,
  onToggle,
  user,
  loading,
  showClientPlaylist,
}: {
  mobileOpen: boolean;
  onToggle: () => void;
  user: User | null;
  loading: boolean;
  showClientPlaylist: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chartsView = pathname === "/music" && searchParams.get("view") === "charts";

  const isActive = (match: (typeof CENTER_LINKS)[number]["match"]) => {
    if (match === "home") return pathname === "/";
    if (match === "mixes") return pathname === "/music" && !chartsView;
    if (match === "charts") return chartsView;
    if (match === "live") return pathname === "/events" || pathname.startsWith("/events/");
    if (match === "about") return pathname === "/about";
    return false;
  };

  return (
    <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-10">
      <Link href="/" className="flex shrink-0 items-center gap-2.5">
        <Image
          src={PAGE_ICON_URL}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-[8px] object-contain"
          unoptimized
          priority
        />
        <span className="font-headline text-[15px] font-bold tracking-[-0.04em] text-white">
          PAGE KILLERCUTZ
        </span>
      </Link>

      <nav
        className="hidden md:flex flex-1 items-center justify-center gap-8 lg:gap-10"
        aria-label="Primary"
      >
        {CENTER_LINKS.map(({ href, label, match }) => {
          const active = isActive(match);
          return (
            <Link
              key={match}
              href={href}
              className={[
                "font-headline text-sm font-medium transition-colors",
                active ? "text-[#00BFFF]" : "text-white hover:text-white/90",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <DesktopUserAuth user={user} loading={loading} showClientPlaylist={showClientPlaylist} />

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors hover:text-white md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={onToggle}
        >
          <span className="material-symbols-outlined text-[22px]">
            {mobileOpen ? "close" : "menu"}
          </span>
        </button>
      </div>
    </div>
  );
}

function MobileNavDrawer({
  open,
  onClose,
  user,
  loading,
  showClientPlaylist,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  loading: boolean;
  showClientPlaylist: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chartsView = pathname === "/music" && searchParams.get("view") === "charts";

  const isActive = (match: (typeof CENTER_LINKS)[number]["match"]) => {
    if (match === "home") return pathname === "/";
    if (match === "mixes") return pathname === "/music" && !chartsView;
    if (match === "charts") return chartsView;
    if (match === "live") return pathname === "/events" || pathname.startsWith("/events/");
    if (match === "about") return pathname === "/about";
    return false;
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="kc-mobile-drawer absolute inset-y-0 right-0 flex w-[min(100%,320px)] flex-col border-l border-white/10 bg-[rgba(8,8,15,0.98)] shadow-[-8px_0_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex items-center justify-end px-3 pt-3 pb-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors hover:text-white"
            aria-label="Close menu"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        <nav className="flex flex-1 flex-col px-4 pb-6" aria-label="Mobile navigation">
          {CENTER_LINKS.map(({ href, label, match }) => {
            const active = isActive(match);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={[
                  "border-b border-white/[0.06] py-3.5 font-headline text-sm font-medium transition-colors last:border-0",
                  active ? "text-[#00BFFF]" : "text-white hover:text-[#00BFFF]",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}

          <div className="mt-4 border-t border-white/[0.06] pt-4">
            {loading ? (
              <div
                className="rounded-pill"
                style={{ width: 80, height: 32, background: "rgba(255,255,255,0.06)" }}
                aria-hidden
              />
            ) : !user ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/sign-in");
                }}
                className="flex w-full items-center justify-center rounded-pill border border-[#00BFFF] px-6 py-2.5 font-headline text-[13px] font-semibold text-[#00BFFF] transition-colors hover:bg-[#00BFFF]/10"
              >
                Sign In
              </button>
            ) : (
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push("/client/dashboard");
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left font-headline text-sm text-white transition-colors hover:bg-white/[0.06]"
                >
                  <LayoutDashboard className="size-[15px] text-white/40" />
                  My Dashboard
                </button>
                {showClientPlaylist ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push("/client/playlist");
                    }}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left font-headline text-sm text-white transition-colors hover:bg-white/[0.06]"
                  >
                    <ListMusic className="size-[15px] text-white/40" />
                    My Playlist
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      onClose();
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      localStorage.removeItem("adminRole");
                      router.push("/");
                    })();
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left font-headline text-sm text-[#FF4560] transition-colors hover:bg-white/[0.06]"
                >
                  <LogOut className="size-[15px]" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}

function PublicTopBarFallback({
  mobileOpen,
  onToggle,
  loading,
}: {
  mobileOpen: boolean;
  onToggle: () => void;
  loading: boolean;
}) {
  return (
    <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-10">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded bg-white/10" />
        <span className="font-headline text-[15px] font-bold tracking-[-0.04em] text-white">
          PAGE KILLERCUTZ
        </span>
      </div>
      <div className="hidden md:flex flex-1" />
      <div className="ml-auto flex items-center gap-3">
        {loading ? (
          <div
            className="hidden rounded-pill md:block"
            style={{ width: 80, height: 32, background: "rgba(255,255,255,0.06)" }}
            aria-hidden
          />
        ) : (
          <div className="hidden h-10 w-[100px] rounded-full border border-[#00BFFF]/40 md:block" />
        )}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 md:hidden"
          onClick={onToggle}
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>
      </div>
    </div>
  );
}

export default function PublicTopBar() {
  const { user, loading } = useAuth();
  const staffAdmin = useStaffAdmin(user);
  const showClientPlaylist = !staffAdmin;
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = () => setMobileOpen((v) => !v);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.05,
      });
    });
    return () => ctx.revert();
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(8,8,15,0.92)] backdrop-blur-xl">
      <Suspense
        fallback={<PublicTopBarFallback mobileOpen={mobileOpen} onToggle={toggle} loading={loading} />}
      >
        <PublicTopBarInner
          mobileOpen={mobileOpen}
          onToggle={toggle}
          user={user}
          loading={loading}
          showClientPlaylist={showClientPlaylist}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MobileNavDrawer
          open={mobileOpen}
          onClose={closeMobile}
          user={user}
          loading={loading}
          showClientPlaylist={showClientPlaylist}
        />
      </Suspense>
    </header>
  );
}
