"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/database.types";
import { writeAuditLog } from "@/lib/writeAuditLog";
import { useAdminToast } from "@/hooks/useAdminToast";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

function formatRowDate(iso: string): string {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const PER_PAGE = 10;

export default function BookingsTab() {
  const router = useRouter();
  const { showToast, ToastComponent } = useAdminToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [playlistEventIds, setPlaylistEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/bookings?limit=200").then((r) => r.json()),
      fetch("/api/playlists?limit=200").then((r) => r.json()),
    ])
      .then(([bookingsData, playlistsData]) => {
        setBookings((bookingsData as { bookings?: BookingRow[] }).bookings || []);
        const rows = (playlistsData as { playlists?: { event_id: string }[] }).playlists || [];
        setPlaylistEventIds(new Set(rows.map((p) => p.event_id)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      bookings.filter((b) => {
        const matchesSearch =
          search === "" ||
          b.client_name.toLowerCase().includes(search.toLowerCase()) ||
          b.event_id.toLowerCase().includes(search.toLowerCase()) ||
          b.client_email.toLowerCase().includes(search.toLowerCase()) ||
          b.client_phone.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || b.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [bookings, search, statusFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages, filtered.length]);

  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;

  const handleConfirm = async (booking: BookingRow) => {
    setActionLoading(booking.id);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? { ...b, status: "confirmed" } : b)),
        );
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
      } else {
        showToast("Failed to confirm.", "error");
      }
    } catch {
      showToast("Failed to confirm.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (booking: BookingRow) => {
    setActionLoading(`${booking.id}-paid`);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: "paid" }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? { ...b, payment_status: "paid" } : b)),
        );
        fetch("/api/notify/payment-confirmed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: booking.id }),
        }).catch(console.error);
        writeAuditLog(
          "payment",
          `Payment confirmed for ${booking.event_id} — ${booking.client_name}`,
          booking.event_id,
        );
        showToast("Payment marked as confirmed.");
      } else {
        showToast("Failed to update.", "error");
      }
    } catch {
      showToast("Failed to update.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (booking: BookingRow) => {
    if (
      !confirm(`Cancel booking ${booking.event_id}? This cannot be undone.`)
    ) {
      return;
    }
    setActionLoading(`${booking.id}-cancel`);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? { ...b, status: "cancelled" } : b)),
        );
        writeAuditLog(
          "cancellation",
          `Cancelled booking ${booking.event_id} for ${booking.client_name}`,
          booking.event_id,
        );
        showToast("Booking cancelled.", "error");
      } else {
        showToast("Failed to cancel.", "error");
      }
    } catch {
      showToast("Failed to cancel.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-12 pt-24">
      <ToastComponent />
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h3 className="font-headline text-[28px] font-semibold text-white">Bookings</h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="group relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
              search
            </span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-[280px] rounded-sm border-none bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:ring-1 focus:ring-primary"
              placeholder="Search by name or Event ID..."
              type="text"
            />
          </div>
          <div className="flex gap-1 rounded-sm bg-surface-container-low p-1">
            {(["all", "pending", "confirmed", "cancelled"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatusFilter(s);
                  setCurrentPage(1);
                }}
                className={`rounded-sm px-3 py-1 text-xs font-medium ${
                  statusFilter === s ? "bg-primary text-on-primary" : "text-on-surface-variant transition-colors hover:text-white"
                }`}
              >
                {s[0]!.toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-card rounded-sm border border-white/5 p-4">
          <div className="flex items-baseline space-x-2">
            <span className="font-label text-2xl font-bold leading-none text-white">{total}</span>
            <span className="font-body text-xs uppercase tracking-widest text-on-surface-variant">Total</span>
          </div>
        </div>
        <div className="glass-card rounded-sm border-l-2 border-primary p-4">
          <div className="flex items-baseline space-x-2">
            <span className="font-label text-2xl font-bold leading-none text-primary">{confirmed}</span>
            <span className="font-body text-xs uppercase tracking-widest text-on-surface-variant">Confirmed</span>
          </div>
        </div>
        <div className="glass-card rounded-sm border-l-2 border-secondary p-4">
          <div className="flex items-baseline space-x-2">
            <span className="font-label text-2xl font-bold leading-none text-secondary">{pending}</span>
            <span className="font-body text-xs uppercase tracking-widest text-on-surface-variant">Pending</span>
          </div>
        </div>
        <div className="glass-card rounded-sm border-l-2 border-error p-4">
          <div className="flex items-baseline space-x-2">
            <span className="font-label text-2xl font-bold leading-none text-error">{cancelled}</span>
            <span className="font-body text-xs uppercase tracking-widest text-on-surface-variant">Cancelled</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-on-surface-variant">Loading bookings...</div>
      ) : (
        <div className="space-y-4">
          {pageItems.map((b) => {
            const busyConfirm = actionLoading === b.id;
            const busyPaid = actionLoading === `${b.id}-paid`;
            const busyCancel = actionLoading === `${b.id}-cancel`;
            const hasPlaylist = playlistEventIds.has(b.event_id);
            return (
              <div
                key={b.id}
                className="glass-card group flex flex-col gap-8 rounded-sm border border-white/5 p-6 transition-all hover:bg-white/10 lg:flex-row lg:items-center"
              >
                <div className="lg:w-1/4">
                  <p className="mb-1 font-label text-[13px] tracking-tight text-primary-container">#{b.event_id}</p>
                  <h4 className="mb-2 font-headline text-lg text-white transition-colors group-hover:text-primary">
                    {b.client_name}
                  </h4>
                  <div className="space-y-0.5">
                    <p className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px]">mail</span>
                      {b.client_email}
                    </p>
                    <p className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px]">phone</span>
                      {b.client_phone}
                    </p>
                  </div>
                </div>
                <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="mb-1 font-label text-[10px] uppercase tracking-tighter text-slate-500">Event Type</p>
                    <p className="text-sm font-medium text-white">{b.event_type}</p>
                  </div>
                  <div>
                    <p className="mb-1 font-label text-[10px] uppercase tracking-tighter text-slate-500">Date</p>
                    <p className="text-sm font-medium text-white">{formatRowDate(b.event_date)}</p>
                  </div>
                  <div>
                    <p className="mb-1 font-label text-[10px] uppercase tracking-tighter text-slate-500">Venue</p>
                    <p className="text-sm font-medium text-white">{b.venue}</p>
                  </div>
                  <div>
                    <p className="mb-1 font-label text-[10px] uppercase tracking-tighter text-slate-500">Package</p>
                    <p className="text-sm font-medium text-white">{b.package_name ?? "—"}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-4 lg:w-1/3">
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-sm bg-primary-container px-3 py-1 text-[11px] font-bold uppercase text-on-primary-container">
                      {b.status}
                    </span>
                    <span className="text-[10px] uppercase text-on-surface-variant">Payment: {b.payment_status}</span>
                    {hasPlaylist ? (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "Space Mono, ui-monospace, monospace",
                          color: "#00BFFF",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        ♪ Playlist ready
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "Space Mono, ui-monospace, monospace",
                          color: "#5A6080",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        ○ No playlist
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {hasPlaylist ? (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/admin/playlists?eventId=${encodeURIComponent(b.event_id)}`)
                        }
                        style={{
                          padding: "6px 12px",
                          background: "transparent",
                          border: "1px solid #00BFFF",
                          borderRadius: "6px",
                          color: "#00BFFF",
                          fontSize: "12px",
                          fontFamily: "Space Grotesk, system-ui, sans-serif",
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        View Playlist
                      </button>
                    ) : (
                      <span
                        style={{
                          padding: "6px 12px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "6px",
                          color: "#5A6080",
                          fontSize: "11px",
                          fontFamily: "Space Mono, ui-monospace, monospace",
                          whiteSpace: "nowrap",
                          display: "inline-block",
                        }}
                      >
                        No playlist yet
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={busyConfirm || b.status === "confirmed"}
                      className="px-3 py-1.5 text-[11px] font-bold uppercase text-black transition-colors hover:bg-primary/90 disabled:opacity-40 bg-primary"
                      onClick={() => void handleConfirm(b)}
                    >
                      {busyConfirm ? "…" : "Confirm"}
                    </button>
                    <button
                      type="button"
                      disabled={busyPaid || b.payment_status === "paid"}
                      className="bg-secondary px-3 py-1.5 text-[11px] font-bold uppercase text-black transition-colors hover:bg-secondary/90 disabled:opacity-40"
                      onClick={() => void handleMarkPaid(b)}
                    >
                      {busyPaid ? "…" : "Mark Paid"}
                    </button>
                    <button
                      type="button"
                      disabled={busyCancel || b.status === "cancelled"}
                      className="border border-error/40 px-3 py-1.5 text-[11px] font-bold uppercase text-error transition-colors hover:bg-error/10 disabled:opacity-40"
                      onClick={() => void handleCancel(b)}
                    >
                      {busyCancel ? "…" : "Cancel"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-4 pt-8 md:flex-row">
        <p className="font-body text-xs text-on-surface-variant">
          Showing{" "}
          <span className="font-semibold text-white">
            {filtered.length === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1}–
            {Math.min(currentPage * PER_PAGE, filtered.length)}
          </span>{" "}
          of <span className="font-semibold text-white">{filtered.length}</span> booking
          {filtered.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            className="px-3 py-1 text-xs rounded-sm bg-white/5 disabled:opacity-40"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="text-xs text-on-surface-variant">
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            className="px-3 py-1 text-xs rounded-sm bg-white/5 disabled:opacity-40"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
