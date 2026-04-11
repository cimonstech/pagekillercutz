"use client";

import { useEffect, useMemo, useState } from "react";
import { mockBookings } from "@/lib/mockData";
import { useAdminStore } from "@/lib/store/adminStore";

export default function BookingsTab() {
  const { setActiveTab, setPlaylistEventIdFilter } = useAdminStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [bookings, setBookings] = useState(mockBookings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/bookings");
        const json = (await res.json()) as { bookings?: typeof mockBookings };
        if (json.bookings) setBookings(json.bookings);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);
  const filtered = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (status === "all" || b.status === status) &&
          `${b.client} ${b.id}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [bookings, q, status],
  );

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-[28px] font-semibold font-headline text-white">Bookings</h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} className="w-[280px] bg-white/5 border-none rounded-sm pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-primary transition-all" placeholder="Search by name or Event ID..." type="text" />
          </div>
          <div className="flex bg-surface-container-low p-1 rounded-sm gap-1">
            {["all", "pending", "confirmed", "cancelled"].map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1 text-xs font-medium rounded-sm ${status === s ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-white transition-colors"}`}>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-sm border border-white/5"><div className="flex items-baseline space-x-2"><span className="text-2xl font-label font-bold text-white leading-none">48</span><span className="text-xs text-on-surface-variant uppercase tracking-widest font-body">Total</span></div></div>
        <div className="glass-card p-4 rounded-sm border-l-2 border-primary"><div className="flex items-baseline space-x-2"><span className="text-2xl font-label font-bold text-primary leading-none">32</span><span className="text-xs text-on-surface-variant uppercase tracking-widest font-body">Confirmed</span></div></div>
        <div className="glass-card p-4 rounded-sm border-l-2 border-secondary"><div className="flex items-baseline space-x-2"><span className="text-2xl font-label font-bold text-secondary leading-none">06</span><span className="text-xs text-on-surface-variant uppercase tracking-widest font-body">Pending</span></div></div>
        <div className="glass-card p-4 rounded-sm border-l-2 border-error"><div className="flex items-baseline space-x-2"><span className="text-2xl font-label font-bold text-error leading-none">10</span><span className="text-xs text-on-surface-variant uppercase tracking-widest font-body">Cancelled</span></div></div>
      </div>

      {loading ? <div className="text-on-surface-variant text-sm">Loading bookings...</div> : <div className="space-y-4">
        {filtered.map((b) => (
          <div key={b.id} className="glass-card p-6 rounded-sm flex flex-col lg:flex-row lg:items-center gap-8 border border-white/5 hover:bg-white/10 transition-all group">
            <div className="lg:w-1/4">
              <p className="font-label text-[13px] text-primary-container mb-1 tracking-tight">#{b.id}</p>
              <h4 className="font-headline text-lg text-white mb-2 group-hover:text-primary transition-colors">{b.client}</h4>
              <div className="space-y-0.5">
                <p className="text-xs text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">mail</span>{b.email}</p>
                <p className="text-xs text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">phone</span>{b.phone}</p>
              </div>
            </div>
            <div className="lg:flex-1 grid grid-cols-2 gap-y-4 gap-x-8">
              <div><p className="font-label text-[10px] text-slate-500 uppercase tracking-tighter mb-1">Event Type</p><p className="text-sm font-medium text-white">{b.eventType}</p></div>
              <div><p className="font-label text-[10px] text-slate-500 uppercase tracking-tighter mb-1">Date</p><p className="text-sm font-medium text-white">{b.date}</p></div>
              <div><p className="font-label text-[10px] text-slate-500 uppercase tracking-tighter mb-1">Venue</p><p className="text-sm font-medium text-white">{b.venue}</p></div>
              <div><p className="font-label text-[10px] text-slate-500 uppercase tracking-tighter mb-1">Package</p><p className="text-sm font-medium text-white">{b.packageName}</p></div>
            </div>
            <div className="lg:w-1/3 flex flex-col items-end gap-4">
              <span className="px-3 py-1 bg-primary-container text-on-primary-container text-[11px] font-bold uppercase rounded-sm">{b.status}</span>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  className="px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/10 transition-colors uppercase"
                  onClick={() => {
                    setPlaylistEventIdFilter(b.id);
                    setActiveTab("playlists");
                  }}
                >
                  View Playlist
                </button>
                <button className="px-3 py-1.5 text-[11px] font-bold bg-primary text-black hover:bg-primary/90 transition-colors uppercase">Confirm</button>
                <button className="px-3 py-1.5 text-[11px] font-bold bg-secondary text-black hover:bg-secondary/90 transition-colors uppercase">Mark Paid</button>
                <button className="px-3 py-1.5 text-[11px] font-bold border border-error/30 text-error hover:bg-error/10 transition-colors uppercase">Cancel</button>
              </div>
            </div>
          </div>
        ))}
      </div>}
      <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-on-surface-variant font-body">Showing <span className="text-white font-semibold">1–10</span> of <span className="text-white font-semibold">48</span> bookings</p>
        <div className="flex items-center gap-2"><button className="flex items-center justify-center w-10 h-10 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">chevron_left</span></button><div className="flex bg-white/5 rounded-full p-1 gap-1"><button className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-on-primary text-[11px] font-bold font-label">1</button><button className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-white text-[11px] font-bold font-label">2</button></div><button className="flex items-center justify-center w-10 h-10 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">chevron_right</span></button></div>
      </div>
    </div>
  );
}
