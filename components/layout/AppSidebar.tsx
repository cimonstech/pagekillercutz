"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useThemeStore } from "@/lib/store/themeStore";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/music", icon: "music_note", label: "Music" },
  { href: "/events", icon: "event", label: "Events" },
  { href: "/merch", icon: "shopping_bag", label: "Merch" },
  { href: "/booking", icon: "door_open", label: "Booking" },
  { href: "/client/dashboard", icon: "grid_view", label: "Portal" },
  { href: "/admin", icon: "admin_panel_settings", label: "Admin" },
];

export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggle } = useThemeStore();
  const supabase = createClient();

  const onLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("adminRole");
    router.push("/sign-in");
  };

  return (
    <aside
      className="fixed left-4 top-1/2 z-50 flex w-[72px] -translate-y-1/2 flex-col items-center gap-5 rounded-[20px] border border-white/[0.12] py-5 shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
      }}
      aria-label="App navigation"
    >
      <Link
        href="/"
        className="relative size-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 transition-all hover:ring-[#00BFFF]/50"
        aria-label="Home"
      >
        <Image src="/pageicon-white.png" alt="Page KillerCutz" width={40} height={40} className="object-contain" priority />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-5" aria-label="Primary">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const portalActive = href === "/client/dashboard" && pathname.startsWith("/client");
          const active =
            portalActive ||
            (href !== "/client/dashboard" &&
              (pathname === href || (href !== "/" && pathname.startsWith(href))));
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={[
                "relative flex items-center justify-center p-3 transition-all duration-300 active:scale-90",
                active
                  ? "rounded-sm bg-white/[0.08] text-[#00BFFF] shadow-[0_0_20px_rgba(0,191,255,0.25)] before:absolute before:left-0 before:top-1/2 before:h-6 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-[#FFD700] before:content-['']"
                  : "text-[#bcc8d1] opacity-70 hover:text-[#00BFFF] hover:opacity-100",
              ].join(" ")}
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {icon}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-5 pb-1">
        <button
          aria-label="Toggle theme"
          className="text-[#bcc8d1] opacity-70 transition-all hover:text-[#00BFFF] hover:opacity-100"
          type="button"
          onClick={toggle}
        >
          <span className="material-symbols-outlined">{isDark ? "dark_mode" : "light_mode"}</span>
        </button>
        <div className="size-8 overflow-hidden rounded-sm bg-surface-container">
          <Image
            alt=""
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3c943Wv-IWCIZUNh862-cYwYrCg15v2DeStz2vsRy0B9En4Wymlf9-IYP5AOH9QzOK_5d9Fq0TH2Cog_wi0U7dBt56F0wwOYLafYBLVaSmhnXC7y177K6oww0Qiw24X24Jsq_1B-WrP8JMtYdyKkTiT0WuF0nDo8fu1SoEHt73K2j0PWdK4ebrFp3tejQq5Cx3I-SSxqonabWZkbHWdO0tRiWGy6N7m0-vrMCVlP_tQqgJul0T7enpqFyualaV4B6f0caEVSOebrA"
            width={32}
            height={32}
            className="size-full object-cover"
            unoptimized
          />
        </div>
        <button
          aria-label="Sign out"
          className="text-[#bcc8d1] opacity-70 transition-all hover:text-error hover:opacity-100"
          type="button"
          onClick={onLogout}
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </aside>
  );
}
