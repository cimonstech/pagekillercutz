"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Calendar, DoorOpen, Home, Layers, Music, ShoppingBag, Tag } from "lucide-react";
import { gsap } from "@/lib/gsap";

const NAV = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/music", icon: Music, label: "Music" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/merch", icon: ShoppingBag, label: "Merch" },
  { href: "/booking", icon: DoorOpen, label: "Booking" },
  { href: "/pricing", icon: Tag, label: "Pricing" },
  { href: "/sign-in", icon: Layers, label: "Portal" },
] as const;

export default function PublicSidebar() {
  const pathname = usePathname();
  const suppressActive = pathname === "/about" || pathname.startsWith("/about/");
  const sidebarRef = useRef<HTMLElement>(null);

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

  return (
    <aside
      ref={sidebarRef}
      className="hidden sm:block fixed left-4 top-1/2 z-50 w-[72px] -translate-y-1/2 rounded-[20px] border border-white/[0.12] py-5 shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
      }}
      aria-label="Public navigation"
    >
      <nav className="flex flex-col items-center gap-5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = suppressActive
            ? false
            : href === "/sign-in"
              ? pathname === "/sign-in"
              : pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={[
                "group flex items-center justify-center rounded-lg p-2.5 sm:p-1.5 transition-all duration-200 ease-out",
                active
                  ? "bg-[rgba(0,191,255,0.12)] shadow-[0_0_18px_rgba(0,191,255,0.35)] ring-1 ring-[#00BFFF]/35"
                  : "",
              ].join(" ")}
            >
              <Icon
                className={[
                  "size-5 transition-all duration-200 ease-out group-hover:scale-[1.15]",
                  active ? "text-[#00BFFF] drop-shadow-[0_0_8px_rgba(0,191,255,0.65)]" : "text-white/55 group-hover:text-white",
                ].join(" ")}
                strokeWidth={active ? 2.25 : 1.75}
              />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
