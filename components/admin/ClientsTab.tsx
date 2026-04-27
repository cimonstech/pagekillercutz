"use client";

import { useEffect, useMemo, useState } from "react";

type ClientSummary = {
  key: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  confirmedBookings: number;
  totalSpent: number;
  totalOrders: number;
  lastBookingAt: string | null;
  nextEventDate: string | null;
  lastEventId: string | null;
};

function formatDate(dateIso: string | null): string {
  if (!dateIso) return "—";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatEventDate(dateIso: string | null): string {
  if (!dateIso) return "—";
  const d = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const PER_PAGE = 12;

export default function ClientsTab() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [search, setSearch] = useState("");
  const [repeatOnly, setRepeatOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/admin/clients")
      .then((r) => r.json())
      .then((json: { clients?: ClientSummary[] }) => {
        if (cancelled) return;
        setClients(json.clients ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.lastEventId ?? "").toLowerCase().includes(q);
      const matchesRepeat = !repeatOnly || c.totalBookings > 1;
      return matchesSearch && matchesRepeat;
    });
  }, [clients, search, repeatOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages, filtered.length]);

  const repeatClients = clients.filter((c) => c.totalBookings > 1).length;
  const totalSpend = clients.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-12 pt-24">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h3 className="font-headline text-[28px] font-semibold text-white">Clients</h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="group relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
              search
            </span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-[300px] rounded-sm border-none bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:ring-1 focus:ring-primary"
              placeholder="Search name, email, phone, event ID..."
              type="text"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setRepeatOnly((v) => !v);
              setPage(1);
            }}
            className={`rounded-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              repeatOnly ? "bg-primary text-on-primary" : "bg-white/5 text-on-surface-variant hover:text-white"
            }`}
          >
            Repeat only
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-card rounded-sm border border-white/5 p-4">
          <p className="font-body text-xs uppercase tracking-widest text-on-surface-variant">Total Clients</p>
          <p className="mt-2 font-label text-2xl font-bold text-white">{clients.length}</p>
        </div>
        <div className="glass-card rounded-sm border-l-2 border-primary p-4">
          <p className="font-body text-xs uppercase tracking-widest text-on-surface-variant">Repeat Clients</p>
          <p className="mt-2 font-label text-2xl font-bold text-primary">{repeatClients}</p>
        </div>
        <div className="glass-card rounded-sm border-l-2 border-secondary p-4">
          <p className="font-body text-xs uppercase tracking-widest text-on-surface-variant">Total Paid Spend</p>
          <p className="mt-2 font-label text-2xl font-bold text-secondary">GHS {totalSpend.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-sm border border-white/5 p-4">
          <p className="font-body text-xs uppercase tracking-widest text-on-surface-variant">Showing</p>
          <p className="mt-2 font-label text-2xl font-bold text-white">{filtered.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-on-surface-variant">Loading clients...</div>
      ) : (
        <div className="space-y-4">
          {rows.map((c) => (
            <div
              key={c.key}
              className="glass-card group grid grid-cols-1 gap-5 rounded-sm border border-white/5 p-6 transition-all hover:bg-white/10 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
            >
              <div>
                <h4 className="text-lg font-headline text-white">{c.name}</h4>
                <p className="text-xs text-on-surface-variant">{c.email}</p>
                <p className="text-xs text-on-surface-variant">{c.phone}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Bookings</p>
                <p className="mt-1 text-sm font-semibold text-white">{c.totalBookings}</p>
                <p className="text-[11px] text-primary">{c.confirmedBookings} confirmed</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Spent</p>
                <p className="mt-1 text-sm font-semibold text-secondary">GHS {c.totalSpent.toLocaleString()}</p>
                <p className="text-[11px] text-on-surface-variant">{c.totalOrders} order(s)</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Last Booking</p>
                <p className="mt-1 text-sm font-semibold text-white">{formatDate(c.lastBookingAt)}</p>
                <p className="text-[11px] text-on-surface-variant">Event: {c.lastEventId ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Next Event</p>
                <p className="mt-1 text-sm font-semibold text-white">{formatEventDate(c.nextEventDate)}</p>
                <span
                  className={`mt-1 inline-block rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase ${
                    c.totalBookings > 1 ? "bg-primary/20 text-primary" : "bg-white/10 text-on-surface-variant"
                  }`}
                >
                  {c.totalBookings > 1 ? "Repeat" : "New"}
                </span>
              </div>
            </div>
          ))}
          {rows.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No clients match this filter.</p>
          ) : null}
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-4 pt-4 md:flex-row">
        <p className="font-body text-xs text-on-surface-variant">
          Showing{" "}
          <span className="font-semibold text-white">
            {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–
            {Math.min(page * PER_PAGE, filtered.length)}
          </span>{" "}
          of <span className="font-semibold text-white">{filtered.length}</span> client
          {filtered.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-sm bg-white/5 px-3 py-1 text-xs disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="text-xs text-on-surface-variant">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            className="rounded-sm bg-white/5 px-3 py-1 text-xs disabled:opacity-40"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

