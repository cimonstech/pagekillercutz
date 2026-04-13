"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowRight, Calendar, Home, Mic, Music, ShoppingBag, Tag, User as UserIcon } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useAuth } from "@/hooks/useAuth";
import { getDisplayName, getInitials } from "@/lib/user-display";

const PILL_STYLE: CSSProperties = {
  position: "fixed",
  left: 16,
  top: "50%",
  transform: "translateY(-50%)",
  width: 56,
  height: "auto",
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 20,
  boxShadow: "0 8px 40px rgba(0,0,0,0.50)",
  zIndex: 50,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "16px 8px",
  gap: 4,
  overflow: "visible",
};

const NAV = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/music", label: "Music", Icon: Music },
  { href: "/events", label: "Events", Icon: Calendar },
  { href: "/merch", label: "Merch", Icon: ShoppingBag },
  { href: "/pricing", label: "Pricing", Icon: Tag },
  { href: "/booking", label: "Book", Icon: Mic },
] as const;

function isPublicNavActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/booking") return pathname === "/booking" || pathname.startsWith("/booking/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PublicSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const suppressActive = pathname === "/about" || pathname.startsWith("/about/");
  const sidebarRef = useRef<HTMLElement>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(sidebarRef.current, {
        opacity: 0,
        x: -24,
        duration: 0.65,
        ease: "power3.out",
        delay: 0.2,
      });
    });
    return () => ctx.revert();
  }, []);

  const portalActive = user != null && pathname.startsWith("/client");
  const signInActive = !suppressActive && pathname === "/sign-in";

  return (
    <aside
      ref={sidebarRef}
      className="hidden sm:flex"
      style={PILL_STYLE}
      aria-label="Public navigation"
    >
      <nav className="flex flex-col items-center" style={{ gap: 4 }} aria-label="Primary">
        {NAV.map(({ href, label, Icon }) => {
          const active = !suppressActive && isPublicNavActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              className={[
                "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] transition-all duration-150 ease-in-out",
                active
                  ? "bg-[rgba(0,191,255,0.12)] text-[#00BFFF]"
                  : "bg-transparent text-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.80)]",
              ].join(" ")}
            >
              <Icon size={18} className="shrink-0" strokeWidth={active ? 2.25 : 2} aria-hidden />
            </Link>
          );
        })}
      </nav>

      <div
        className="shrink-0"
        style={{
          width: 32,
          height: 1,
          background: "rgba(255,255,255,0.08)",
          margin: "4px 0",
        }}
        aria-hidden
      />

      {loading ? (
        <div
          className="size-8 shrink-0 rounded-full bg-white/[0.06]"
          aria-hidden
        />
      ) : user ? (
        <Link
          href="/client/dashboard"
          aria-label="Client dashboard"
          title={getDisplayName(user)}
          className={[
            "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full font-headline text-[11px] font-bold uppercase text-white transition-all duration-150 ease-in-out",
            "bg-[#00BFFF] ring-2 ring-[#00BFFF] ring-offset-2 ring-offset-[#08080F]",
            portalActive ? "opacity-100" : "opacity-90 hover:opacity-100",
          ].join(" ")}
        >
          {getInitials(user)}
        </Link>
      ) : (
        <button
          type="button"
          aria-label="Sign in"
          title="Sign In"
          onClick={() => router.push("/sign-in")}
          className={[
            "flex size-9 shrink-0 cursor-pointer items-center justify-center gap-0.5 rounded-[10px] transition-all duration-150 ease-in-out",
            signInActive
              ? "bg-[rgba(0,191,255,0.12)] text-[#00BFFF]"
              : "bg-transparent text-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.80)]",
          ].join(" ")}
        >
          <UserIcon className="size-[15px] shrink-0" strokeWidth={signInActive ? 2.25 : 2} aria-hidden />
          <ArrowRight className="size-[15px] shrink-0" strokeWidth={signInActive ? 2.25 : 2} aria-hidden />
        </button>
      )}
    </aside>
  );
}
