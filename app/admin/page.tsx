"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/lib/store/adminStore";
import OverviewTab from "@/components/admin/OverviewTab";
import BookingsTab from "@/components/admin/BookingsTab";
import PlaylistsTab from "@/components/admin/PlaylistsTab";
import OrdersTab from "@/components/admin/OrdersTab";
import PackagesTab from "@/components/admin/PackagesTab";
import MusicTab from "@/components/admin/MusicTab";
import EventsTab from "@/components/admin/EventsTab";
import AccountsTab from "@/components/admin/AccountsTab";
import AuditLogTab from "@/components/admin/AuditLogTab";

export default function AdminPage() {
  const { activeTab, role, setRole } = useAdminStore();

  useEffect(() => {
    const stored = localStorage.getItem("adminRole");
    if (stored === "admin" || stored === "super_admin") {
      setRole(stored);
    }
  }, [setRole]);

  if (activeTab === "overview") return <OverviewTab />;
  if (activeTab === "bookings") return <BookingsTab />;
  if (activeTab === "playlists") return <PlaylistsTab />;
  if (activeTab === "orders") return <OrdersTab />;
  if (activeTab === "packages") return <PackagesTab />;
  if (activeTab === "music") return <MusicTab />;
  if (activeTab === "events") return <EventsTab />;
  if (activeTab === "accounts") return role === "super_admin" ? <AccountsTab /> : null;
  if (activeTab === "audit-log") return role === "super_admin" ? <AuditLogTab /> : null;
  return <OverviewTab />;
}
