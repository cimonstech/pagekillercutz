"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  Home,
  LayoutGrid,
  ListMusic,
  LogOut,
  Music,
  Package,
  ShoppingBag,
  ShoppingCart,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";

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

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/client/dashboard") return pathname.startsWith("/client/dashboard");
  if (href === "/client/playlist") return pathname.startsWith("/client/playlist");
  if (href === "/client/orders") return pathname === "/client/orders";
  if (href === "/client/profile") return pathname === "/client/profile";
  return pathname.startsWith(href);
}

export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const itemCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.qty, 0));
  const setCartOpen = useCartStore((s) => s.setIsOpen);
  const [undeliveredOrders, setUndeliveredOrders] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email || cancelled) return;
      const res = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}&limit=200`);
      if (!res.ok || cancelled) return;
      const json = (await res.json()) as {
        orders?: { fulfillment_status: string }[];
      };
      const orders = json.orders ?? [];
      const n = orders.filter((o) => o.fulfillment_status !== "delivered").length;
      setUndeliveredOrders(n);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase.auth]);

  const onLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("adminRole");
    router.push("/sign-in");
  };

  const topLinks = [
    { href: "/", label: "Home", Icon: Home },
    { href: "/music", label: "Music", Icon: Music },
    { href: "/events", label: "Events", Icon: Calendar },
    { href: "/merch", label: "Merch", Icon: ShoppingBag },
    { href: "/client/orders", label: "My Orders", Icon: Package },
    { href: "/client/dashboard", label: "Dashboard", Icon: LayoutGrid },
    { href: "/client/playlist", label: "Playlist", Icon: ListMusic },
    { href: "/client/profile", label: "My Profile", Icon: User },
  ] as const;

  return (
    <aside className="app-sidebar" style={PILL_STYLE} aria-label="App navigation">
      <nav className="flex flex-col items-center" style={{ gap: 4 }} aria-label="Primary">
        {topLinks.map(({ href, label, Icon }) => {
          const active = isNavActive(href, pathname);
          const showOrdersBadge = href === "/client/orders" && undeliveredOrders > 0;
          return (
            <div key={href} className="relative flex justify-center">
              <Link
                href={href}
                aria-label={label}
                title={label}
                className={[
                  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] transition-all duration-150 ease-in-out",
                  active
                    ? "bg-[rgba(0,191,255,0.12)] text-[#00BFFF]"
                    : "bg-transparent text-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.80)]",
                ].join(" ")}
              >
                <Icon size={18} className="shrink-0" strokeWidth={active ? 2.25 : 2} aria-hidden />
              </Link>
              {showOrdersBadge ? (
                <span
                  className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F5A623] px-0.5 font-label text-[9px] font-bold leading-none text-black"
                  aria-hidden
                >
                  {undeliveredOrders > 99 ? "99+" : undeliveredOrders}
                </span>
              ) : null}
            </div>
          );
        })}
        <div className="relative flex justify-center">
          <button
            type="button"
            aria-label="Open cart"
            title="Cart"
            onClick={() => setCartOpen(true)}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-transparent text-[rgba(255,255,255,0.35)] transition-all duration-150 ease-in-out hover:bg-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.80)]"
          >
            <ShoppingCart size={18} className="shrink-0" strokeWidth={2} aria-hidden />
            {itemCount > 0 ? (
              <span
                className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00BFFF] px-0.5 font-label text-[9px] font-bold leading-none text-black"
                aria-hidden
              >
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            ) : null}
          </button>
        </div>
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

      <button
        type="button"
        aria-label="Sign out"
        title="Sign out"
        onClick={() => void onLogout()}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-transparent text-[rgba(255,255,255,0.25)] transition-all duration-150 ease-in-out hover:text-[#FF4560]"
      >
        <LogOut className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />
      </button>
    </aside>
  );
}
