"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { mockOrders } from "@/lib/mockData";
import { useAdminStore } from "@/lib/store/adminStore";

const trendData = [
  { name: "OCT 01", value: 12 },
  { name: "OCT 08", value: 20 },
  { name: "OCT 15", value: 24 },
  { name: "OCT 22", value: 18 },
  { name: "OCT 30", value: 30 },
];

const revData = [
  { month: "JAN", value: 16 },
  { month: "FEB", value: 24 },
  { month: "MAR", value: 32 },
  { month: "APR", value: 12 },
  { month: "MAY", value: 28 },
  { month: "JUN", value: 38 },
];

export default function OverviewTab() {
  const { setActiveTab } = useAdminStore();
  const [orders, setOrders] = useState(mockOrders);
  const [bookingsCount, setBookingsCount] = useState(48);

  useEffect(() => {
    const load = async () => {
      try {
        const [b, o] = await Promise.all([fetch("/api/bookings"), fetch("/api/orders")]);
        const bj = (await b.json()) as { count?: number };
        const oj = (await o.json()) as { orders?: typeof mockOrders };
        if (typeof bj.count === "number") setBookingsCount(bj.count);
        if (oj.orders) setOrders(oj.orders);
      } catch {
        // Keep UI fallback values.
      }
    };
    void load();
  }, []);

  return (
    <div className="pt-24 px-8 pb-12">
      <div className="grid grid-cols-5 grid-rows-[auto_400px_auto_auto] gap-6 max-w-full">
        <div className="col-span-2 bg-surface-container-low p-8 rounded-sm relative overflow-hidden flex flex-col justify-end min-h-[160px]">
          <div className="absolute top-0 right-0 p-8">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-mono tracking-widest uppercase">System Admin</span>
          </div>
          <p className="text-on-surface-variant font-mono text-xs mb-2">OCTOBER 24, 2024</p>
          <h2 className="text-[28px] font-syne font-bold leading-tight">Good morning.</h2>
        </div>
        <div className="col-span-1 bg-surface-container-low p-6 border-l-4 border-primary-container flex flex-col justify-between">
          <div><p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider mb-2">Total Bookings</p><h3 className="text-4xl font-syne font-bold text-primary-container">{bookingsCount}</h3></div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4ade80] mt-4 uppercase"><span className="material-symbols-outlined text-sm">trending_up</span>↑ +8 this month</div>
        </div>
        <div className="col-span-1 bg-surface-container-low p-6 border-l-4 border-secondary flex flex-col justify-between">
          <div><p className="text-secondary text-xs font-medium uppercase tracking-wider mb-2">Pending</p><h3 className="text-4xl font-syne font-bold text-secondary">12</h3></div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary mt-4 uppercase px-2 py-1 bg-secondary/10 rounded-sm"><span className="material-symbols-outlined text-sm">bolt</span>↑ 2 new today</div>
        </div>
        <div className="col-span-1 bg-surface-container-low p-6 border-l-4 border-primary-container flex flex-col justify-between">
          <div><p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider mb-2">Revenue GHS</p><h3 className="text-2xl font-syne font-bold text-on-surface">12,400</h3></div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4ade80] mt-4 uppercase"><span className="material-symbols-outlined text-sm">trending_up</span>↑ 23% vs last month</div>
        </div>

        <div className="col-span-4 bg-[#08080F]/50 backdrop-blur-xl p-8 rounded-sm relative">
          <div className="flex justify-between items-start mb-10"><div><h4 className="text-xl font-headline font-semibold">Booking Trend</h4><p className="text-on-surface-variant font-mono text-xs">Last 30 days</p></div><div className="bg-primary/10 text-primary-container px-3 py-1 rounded-sm text-[10px] font-bold uppercase">↑ 23% vs last month</div></div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis dataKey="name" tick={{ fill: "#87929b", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "rgba(8,8,15,0.8)", border: "1px solid rgba(255,255,255,0.08)", color: "#e4e1ec" }} />
                <Area type="monotone" dataKey="value" stroke="#00BFFF" fill="rgba(0,191,255,0.15)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-span-1 bg-surface-container-low p-6 rounded-sm">
          <h4 className="text-sm font-semibold uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Recent Activity</h4>
          <div className="space-y-6">
            <div className="flex gap-4"><div className="mt-1.5 w-2 h-2 rounded-full bg-primary-container shrink-0" /><div><p className="text-[13px] leading-tight">New booking by <span className="text-on-surface font-semibold">David K.</span></p><p className="text-[10px] font-mono text-on-surface-variant mt-1">10:24 AM</p></div></div>
            <div className="flex gap-4"><div className="mt-1.5 w-2 h-2 rounded-full bg-secondary shrink-0" /><div><p className="text-[13px] leading-tight">Payment received from <span className="text-on-surface font-semibold">Club Onyx</span></p><p className="text-[10px] font-mono text-on-surface-variant mt-1">09:15 AM</p></div></div>
          </div>
        </div>

        <div className="col-span-3 bg-surface-container-low p-8 rounded-sm">
          <div className="flex justify-between items-center mb-8"><h4 className="text-lg font-headline font-semibold">Revenue Overview</h4></div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revData}>
                <XAxis dataKey="month" tick={{ fill: "#87929b", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "rgba(8,8,15,0.8)", border: "1px solid rgba(255,255,255,0.08)", color: "#e4e1ec" }} />
                <Bar dataKey="value" fill="#F5A623" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-span-2 bg-surface-container-low p-6 rounded-sm border-l-4 border-secondary">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-secondary text-xs font-semibold uppercase tracking-[0.2em]">Needs Action</h4>
            <button className="text-[#00BFFF] text-[10px] font-bold uppercase hover:underline" onClick={() => setActiveTab("bookings")}>
              View all bookings →
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-container-highest rounded-sm"><div><span className="text-sm font-semibold">Samuel Owusu</span></div><button className="px-4 py-2 bg-primary-container text-on-primary text-[10px] font-bold uppercase tracking-widest">Confirm</button></div>
            <div className="flex items-center justify-between p-4 bg-surface-container-highest rounded-sm"><div><span className="text-sm font-semibold">Twist Nightclub</span></div><button className="px-4 py-2 bg-primary-container text-on-primary text-[10px] font-bold uppercase tracking-widest">Confirm</button></div>
          </div>
        </div>

        <div className="col-span-5 py-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold uppercase tracking-[0.3em]">Recent Orders</h4>
            <button
              className="text-[#00BFFF] text-[10px] font-bold uppercase hover:underline"
              onClick={() => setActiveTab("orders")}
            >
              View all orders →
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {orders.map((o) => (
              <div key={o.id} className="flex-none bg-surface-container-low p-4 rounded-sm flex items-center gap-6 min-w-[300px]">
                <span className="font-mono text-primary-container text-xs">#{o.id}</span>
                <div className="flex flex-col"><span className="text-sm font-medium">{o.customer}</span><span className="text-[10px] text-on-surface-variant uppercase font-mono">{o.item}</span></div>
                <div className="px-2 py-0.5 rounded-sm bg-secondary/10 text-secondary text-[10px] font-bold uppercase shrink-0">{o.status}</div>
                <span className="font-syne font-bold text-sm ml-auto">GHS {o.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
