"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/store/adminStore";
import { useThemeStore } from "@/lib/store/themeStore";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  tab: "overview" | "bookings" | "playlists" | "orders" | "music" | "events" | "packages" | "accounts" | "audit-log";
  icon: string;
  label: string;
  superOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { tab: "overview", icon: "dashboard", label: "Overview" },
  { tab: "bookings", icon: "calendar_today", label: "Bookings" },
  { tab: "playlists", icon: "queue_music", label: "Playlists" },
  { tab: "orders", icon: "shopping_cart", label: "Orders" },
  { tab: "music", icon: "audiotrack", label: "Music" },
  { tab: "events", icon: "confirmation_number", label: "Events" },
  { tab: "packages", icon: "inventory_2", label: "Packages" },
  { tab: "accounts", icon: "group", label: "Accounts", superOnly: true },
  { tab: "audit-log", icon: "history_edu", label: "Audit Log", superOnly: true },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeTab, setActiveTab, role } = useAdminStore();
  const { isDark, toggle } = useThemeStore();
  const supabase = createClient();

  const onLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("adminRole");
    router.push("/admin/login");
  };

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[200px] z-[60] flex flex-col h-full py-6"
      style={{ background: "rgba(8,8,15,0.8)", backdropFilter: "blur(20px)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}
    >
      <div className="px-6 mb-10">
        <h1 className="text-lg font-display font-extrabold uppercase tracking-widest text-[#00BFFF]">
          KillerCutz
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 mt-1 font-mono">
          Admin Console
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto custom-scrollbar" aria-label="Admin navigation">
        {NAV_ITEMS.map(({ tab, icon, label, superOnly }) => {
          if (superOnly && role !== "super_admin") return null;
          const isActive = activeTab === tab && pathname.startsWith("/admin");
          const superTint = superOnly ? "text-[#c084fc]" : "";
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all active:translate-x-1 duration-150",
                isActive
                  ? superOnly
                    ? "bg-white/10 text-[#c084fc] border-l-2 border-[#c084fc]"
                    : "bg-white/10 text-[#00BFFF] border-l-2 border-[#FFD700]"
                  : `text-[#bcc8d1] opacity-70 hover:bg-white/5 hover:opacity-100 ${superTint}`,
              ].join(" ")}
            >
              <span className="material-symbols-outlined text-xl">{icon}</span>
              <span className="font-medium text-sm">{label}</span>
              {superOnly && <span className="material-symbols-outlined text-sm ml-auto">lock</span>}
            </button>
          );
        })}

        {role === "super_admin" ? (
          <Link
            href="/admin/settings"
            className={[
              "flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all active:translate-x-1 duration-150",
              pathname === "/admin/settings"
                ? "bg-white/10 text-[#c084fc] border-l-2 border-[#c084fc]"
                : "text-[#c084fc] opacity-70 hover:bg-white/5 hover:opacity-100",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            <span className="font-medium text-sm">Settings</span>
            <span className="material-symbols-outlined text-sm ml-auto">lock</span>
          </Link>
        ) : null}
      </nav>

      <div className="mt-auto px-3 border-t border-white/5 pt-6">
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-[#bcc8d1] opacity-70 hover:bg-white/5 hover:opacity-100 transition-all duration-150"
          onClick={toggle}
        >
          <span className="material-symbols-outlined text-xl">{isDark ? "dark_mode" : "light_mode"}</span>
          <span className="font-medium text-sm">{isDark ? "Dark Mode" : "Light Mode"}</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-error opacity-70 hover:bg-error/10 hover:opacity-100 transition-all duration-150" onClick={onLogout}>
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
