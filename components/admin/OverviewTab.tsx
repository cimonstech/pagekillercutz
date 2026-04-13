"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Database } from "@/lib/database.types";
import { writeAuditLog } from "@/lib/writeAuditLog";
import { timeAgo } from "@/lib/timeAgo";
import { useAdminToast } from "@/hooks/useAdminToast";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];

type OverviewData = {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  pendingOrders: number;
  bookingsThisMonth: number;
  trendData: { date: string; bookings: number }[];
  revenueData: { month: string; revenue: number }[];
  needsAction: BookingRow[];
  recentLogs: AuditLogRow[];
  recentOrders: OrderRow[];
};

export default function OverviewTab() {
  const router = useRouter();
  const { showToast, ToastComponent } = useAdminToast();
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const loadOverview = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/bookings?limit=100").then((r) => r.json()),
      fetch("/api/orders?limit=100").then((r) => r.json()),
      fetch("/api/audit-logs?limit=5").then((r) => r.json()),
    ])
      .then(([bookings, orders, logs]) => {
        const allBookings = (bookings.bookings || []) as BookingRow[];
        const allOrders = (orders.orders || []) as OrderRow[];
        const recentLogs = (logs.logs || []) as AuditLogRow[];

        const totalBookings = allBookings.length;
        const pendingBookings = allBookings.filter((b) => b.status === "pending").length;
        const confirmedBookings = allBookings.filter((b) => b.status === "confirmed").length;

        const totalRevenue = allOrders
          .filter((o) => o.payment_status === "paid")
          .reduce((sum, o) => sum + (o.total || 0), 0);

        const pendingOrders = allOrders.filter((o) => o.payment_status === "unpaid").length;

        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        const bookingsThisMonth = allBookings.filter((b) => new Date(b.created_at) >= thisMonth).length;

        const trendData: { date: string; bookings: number }[] = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0]!;
          const count = allBookings.filter((b) => b.created_at.startsWith(dateStr)).length;
          trendData.push({
            date: date.toLocaleDateString("en-GH", { month: "short", day: "numeric" }),
            bookings: count,
          });
        }

        const revenueData: { month: string; revenue: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const month = date.toLocaleDateString("en-GH", { month: "short" });
          const year = date.getFullYear();
          const monthNum = date.getMonth();
          const revenue = allOrders
            .filter((o) => {
              const d = new Date(o.created_at);
              return d.getMonth() === monthNum && d.getFullYear() === year && o.payment_status === "paid";
            })
            .reduce((sum, o) => sum + (o.total || 0), 0);
          revenueData.push({ month, revenue });
        }

        const needsAction = allBookings.filter((b) => b.status === "pending").slice(0, 3);
        const recentOrders = allOrders.slice(0, 4);

        setOverviewData({
          totalBookings,
          pendingBookings,
          confirmedBookings,
          totalRevenue,
          pendingOrders,
          bookingsThisMonth,
          trendData,
          revenueData,
          needsAction,
          recentLogs,
          recentOrders,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("[OverviewTab]", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const [roleBadge, setRoleBadge] = useState<"super" | "admin">("admin");
  useEffect(() => {
    setRoleBadge(localStorage.getItem("adminRole") === "super_admin" ? "super" : "admin");
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning." : hour < 17 ? "Good afternoon." : "Good evening.";
  const dateStr = new Date()
    .toLocaleDateString("en-GH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

  const logDotClass = (actionType: string) => {
    if (actionType === "booking") return "bg-[#00BFFF]";
    if (actionType === "payment") return "bg-[#F5A623]";
    if (actionType === "cancellation") return "bg-[#FF4560]";
    if (actionType === "playlist") return "bg-[#22c55e]";
    return "bg-white";
  };

  const handleConfirm = async (booking: BookingRow) => {
    setConfirmId(booking.id);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      if (res.ok) {
        fetch("/api/notify/booking-confirmed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: booking.id }),
        }).catch(console.error);
        writeAuditLog(
          "booking",
          `Confirmed booking ${booking.event_id} for ${booking.client_name}`,
          booking.event_id,
        );
        showToast("Booking confirmed.");
        void loadOverview();
        router.push("/admin/bookings");
      } else {
        showToast("Failed to confirm.", "error");
      }
    } catch {
      showToast("Failed to confirm.", "error");
    } finally {
      setConfirmId(null);
    }
  };

  if (loading && !overviewData) {
    return (
      <div className="pt-24 px-8 pb-12">
        <div className="grid grid-cols-5 gap-6 max-w-full">
          <div className="col-span-2 bg-surface-container-low p-8 rounded-sm min-h-[160px] animate-pulse" />
          <div className="col-span-1 bg-surface-container-low p-6 border-l-4 border-white/10 min-h-[120px] animate-pulse" />
          <div className="col-span-1 bg-surface-container-low p-6 border-l-4 border-white/10 min-h-[120px] animate-pulse" />
          <div className="col-span-1 bg-surface-container-low p-6 border-l-4 border-white/10 min-h-[120px] animate-pulse" />
          <div className="col-span-5 h-64 bg-surface-container-low/50 rounded-sm animate-pulse" />
        </div>
      </div>
    );
  }

  const d = overviewData!;

  return (
    <div className="pt-24 px-8 pb-12">
      <ToastComponent />
      <div className="grid grid-cols-5 grid-rows-[auto_400px_auto_auto] gap-6 max-w-full">
        <div className="col-span-2 bg-surface-container-low p-8 rounded-sm relative overflow-hidden flex flex-col justify-end min-h-[160px]">
          <div className="absolute top-0 right-0 p-8">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase ${
                roleBadge === "super" ? "bg-purple-500/20 text-purple-300" : "bg-cyan-500/20 text-cyan-300"
              }`}
            >
              {roleBadge === "super" ? "SUPER ADMIN" : "ADMIN"}
            </span>
          </div>
          <p className="text-on-surface-variant font-mono text-xs mb-2">{dateStr}</p>
          <h2 className="text-[28px] font-syne font-bold leading-tight text-white">{greeting}</h2>
        </div>
        <div className="col-span-1 bg-surface-container-low p-6 border-l-4 border-primary-container flex flex-col justify-between">
          <div>
            <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider mb-2">Total Bookings</p>
            <h3 className="text-4xl font-syne font-bold text-primary-container">{d.totalBookings}</h3>
          </div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4ade80] mt-4 uppercase">
            <span className="material-symbols-outlined text-sm">trending_up</span>+{d.bookingsThisMonth} this month
          </div>
        </div>
        <div className="col-span-1 bg-surface-container-low p-6 border-l-4 border-secondary flex flex-col justify-between">
          <div>
            <p className="text-secondary text-xs font-medium uppercase tracking-wider mb-2">Pending</p>
            <h3 className="text-4xl font-syne font-bold text-secondary">{d.pendingBookings}</h3>
          </div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary mt-4 uppercase px-2 py-1 bg-secondary/10 rounded-sm">
            <span className="material-symbols-outlined text-sm">bolt</span>
            {d.pendingOrders} unpaid orders
          </div>
        </div>
        <div className="col-span-1 bg-surface-container-low p-6 border-l-4 border-primary-container flex flex-col justify-between">
          <div>
            <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider mb-2">Revenue GHS</p>
            <h3 className="text-2xl font-syne font-bold text-on-surface">
              GHS {d.totalRevenue.toLocaleString()}
            </h3>
          </div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-on-surface-variant mt-4 uppercase">
            {d.confirmedBookings} confirmed
          </div>
        </div>

        <div className="col-span-4 bg-[#08080F]/50 backdrop-blur-xl p-8 rounded-sm relative">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h4 className="text-xl font-headline font-semibold">Booking Trend</h4>
              <p className="text-on-surface-variant font-mono text-xs">Last 30 days</p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.trendData}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#87929b", fontSize: 10, fontFamily: "Space Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "rgba(8,8,15,0.8)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#e4e1ec",
                  }}
                />
                <Area type="monotone" dataKey="bookings" stroke="#00BFFF" fill="rgba(0,191,255,0.15)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-span-1 bg-surface-container-low p-6 rounded-sm">
          <h4 className="text-sm font-semibold uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
            Recent Activity
          </h4>
          <div className="space-y-6">
            {d.recentLogs.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No recent logs.</p>
            ) : (
              d.recentLogs.map((log) => (
                <div key={log.id} className="flex gap-4">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${logDotClass(log.action_type)}`} />
                  <div>
                    <p className="text-[13px] leading-tight text-on-surface-variant">{log.description}</p>
                    <p className="text-[10px] font-mono text-on-surface-variant mt-1">{timeAgo(log.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-span-3 bg-surface-container-low p-8 rounded-sm">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-headline font-semibold">Revenue Overview</h4>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.revenueData}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#87929b", fontSize: 10, fontFamily: "Space Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "rgba(8,8,15,0.8)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#e4e1ec",
                  }}
                />
                <Bar dataKey="revenue" fill="#F5A623" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-span-2 bg-surface-container-low p-6 rounded-sm border-l-4 border-secondary">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-secondary text-xs font-semibold uppercase tracking-[0.2em]">Needs Action</h4>
            <button
              type="button"
              className="text-[#00BFFF] text-[10px] font-bold uppercase hover:underline"
              onClick={() => router.push("/admin/bookings")}
            >
              View all bookings →
            </button>
          </div>
          <div className="space-y-4">
            {d.needsAction.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No pending bookings.</p>
            ) : (
              d.needsAction.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-surface-container-highest rounded-sm"
                >
                  <div>
                    <span className="text-sm font-semibold text-white block">{booking.client_name}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase">{booking.event_type}</span>
                  </div>
                  <button
                    type="button"
                    disabled={confirmId === booking.id}
                    className="px-4 py-2 bg-primary-container text-on-primary text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                    onClick={() => void handleConfirm(booking)}
                  >
                    {confirmId === booking.id ? "…" : "CONFIRM"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-span-5 py-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold uppercase tracking-[0.3em]">Recent Orders</h4>
            <button
              type="button"
              className="text-[#00BFFF] text-[10px] font-bold uppercase hover:underline"
              onClick={() => router.push("/admin/orders")}
            >
              View all orders →
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {d.recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex-none bg-surface-container-low p-4 rounded-sm flex items-center gap-6 min-w-[300px]"
              >
                <span className="font-mono text-primary-container text-xs">{o.order_number}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{o.customer_name}</span>
                  <span className="text-[10px] text-on-surface-variant uppercase font-mono">{o.payment_status}</span>
                </div>
                <div className="px-2 py-0.5 rounded-sm bg-secondary/10 text-secondary text-[10px] font-bold uppercase shrink-0">
                  {o.fulfillment_status}
                </div>
                <span className="font-syne font-bold text-sm ml-auto">
                  GHS {(o.total || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
