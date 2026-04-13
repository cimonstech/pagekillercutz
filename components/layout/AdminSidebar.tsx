"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type LucideIcon,
  Calendar,
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
  ListMusic,
  Lock,
  LogOut,
  Music,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";
import { useAdminStore } from "@/lib/store/adminStore";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  href: string;
  label: string;
  superOnly?: boolean;
  Icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/overview", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", Icon: CalendarCheck },
  { href: "/admin/playlists", label: "Playlists", Icon: ListMusic },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingCart },
  { href: "/admin/packages", label: "Packages", Icon: Tag },
  { href: "/admin/music", label: "Music", Icon: Music },
  { href: "/admin/merch", label: "Merch", Icon: ShoppingBag },
  { href: "/admin/events", label: "Events", Icon: Calendar },
  { href: "/admin/accounts", label: "Accounts", superOnly: true, Icon: Users },
  { href: "/admin/audit-log", label: "Audit Log", superOnly: true, Icon: ClipboardList },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const role = useAdminStore((s) => s.role);
  const supabase = createClient();

  const onLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminRole");
      localStorage.removeItem("adminEmail");
    }
    router.push("/admin/login");
  };

  return (
    <aside
      className="flex flex-col py-6"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: 200,
        height: "100vh",
        zIndex: 50,
        background: "rgba(8,8,15,0.8)",
        backdropFilter: "blur(20px)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      <div className="px-6 mb-10">
        <h1 className="text-lg font-display font-extrabold uppercase tracking-widest text-[#00BFFF]">KillerCutz</h1>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 mt-1 font-mono">Admin Console</p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto custom-scrollbar" aria-label="Admin navigation">
        {NAV_ITEMS.map(({ href, label, superOnly, Icon }) => {
          if (superOnly && role !== "super_admin") return null;
          const isActive = pathname === href;
          const isSuper = Boolean(superOnly);
          const activeClass = isActive
            ? isSuper
              ? "bg-[rgba(167,139,250,0.12)] text-[#a78bfa] border-l-[3px] border-[#a78bfa]"
              : "bg-[rgba(0,191,255,0.08)] text-[#00BFFF] border-l-[3px] border-[#00BFFF]"
            : "border-l-[3px] border-transparent text-[#bcc8d1] opacity-80 hover:bg-white/5 hover:opacity-100";
          const idleTint = !isActive && isSuper ? "text-[#a78bfa]/80" : "";

          return (
            <Link
              key={href}
              href={href}
              className={[
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-150",
                activeClass,
                idleTint,
              ].join(" ")}
            >
              <Icon className="shrink-0" size={18} strokeWidth={isActive ? 2.25 : 2} aria-hidden />
              <span className="font-medium text-sm flex-1 text-left">{label}</span>
              {isSuper ? <Lock className="shrink-0 opacity-70" size={12} aria-hidden /> : null}
            </Link>
          );
        })}

        {role === "super_admin" ? (
          <Link
            href="/admin/settings"
            className={[
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-150 mt-0.5",
              pathname === "/admin/settings"
                ? "bg-[rgba(167,139,250,0.12)] text-[#a78bfa] border-l-[3px] border-[#a78bfa]"
                : "border-l-[3px] border-transparent text-[#a78bfa]/80 hover:bg-white/5",
            ].join(" ")}
          >
            <Settings className="shrink-0" size={18} strokeWidth={pathname === "/admin/settings" ? 2.25 : 2} aria-hidden />
            <span className="font-medium text-sm flex-1 text-left">Settings</span>
            <Lock className="shrink-0 opacity-70" size={12} aria-hidden />
          </Link>
        ) : null}
      </nav>

      <div className="mt-auto px-3 border-t border-white/5 pt-6">
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-error opacity-70 hover:bg-error/10 hover:opacity-100 transition-all duration-150"
          onClick={onLogout}
        >
          <LogOut size={18} strokeWidth={2} aria-hidden />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
