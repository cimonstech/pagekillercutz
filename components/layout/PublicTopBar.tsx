"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

const CENTER_LINKS = [
  { href: "/", label: "Home", match: "home" },
  { href: "/music", label: "Mixes", match: "mixes" },
  { href: "/music?view=charts", label: "Charts", match: "charts" },
  { href: "/events", label: "Live", match: "live" },
  { href: "/about", label: "About", match: "about" },
] as const;

function PublicTopBarInner({
  mobileOpen,
  onToggle,
}: {
  mobileOpen: boolean;
  onToggle: () => void;
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
          src="/favicon/apple-touch-icon.png"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          priority
        />
        <span className="font-headline text-[15px] font-bold tracking-[-0.04em] text-white">
          PAGE KILLERCUTZ
        </span>
      </Link>

      {/* Desktop nav */}
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
        {/* Desktop sign-in */}
        <Link
          href="/sign-in"
          className="hidden md:inline-flex items-center justify-center rounded-full border border-[#00BFFF] px-6 py-2.5 font-headline text-[13px] font-semibold text-[#00BFFF] transition-colors hover:bg-[#00BFFF]/10"
        >
          Sign In
        </Link>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white/70 hover:text-white transition-colors"
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

function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
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
          <Link
            href="/sign-in"
            onClick={onClose}
            className="mt-4 flex items-center justify-center rounded-full border border-[#00BFFF] px-6 py-2.5 font-headline text-[13px] font-semibold text-[#00BFFF] transition-colors hover:bg-[#00BFFF]/10"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </div>
  );
}

function PublicTopBarFallback({
  mobileOpen,
  onToggle,
}: {
  mobileOpen: boolean;
  onToggle: () => void;
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
        <div className="hidden md:block h-10 w-[100px] rounded-full border border-[#00BFFF]/40" />
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white/70"
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
      <Suspense fallback={<PublicTopBarFallback mobileOpen={mobileOpen} onToggle={toggle} />}>
        <PublicTopBarInner mobileOpen={mobileOpen} onToggle={toggle} />
      </Suspense>

      <Suspense fallback={null}>
        <MobileNavDrawer open={mobileOpen} onClose={closeMobile} />
      </Suspense>
    </header>
  );
}
