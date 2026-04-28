"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Clock, Download } from "lucide-react";
import type { Database } from "@/lib/database.types";
import { writeAuditLog } from "@/lib/writeAuditLog";
import { useAdminToast } from "@/hooks/useAdminToast";
import { downloadContractPDF } from "@/lib/downloadContract";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];

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

function normalizeSearchValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
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
  const [generatingContractFor, setGeneratingContractFor] = useState<string | null>(null);
  const [contractsByBooking, setContractsByBooking] = useState<Record<string, ContractRow>>({});
  const [contractModal, setContractModal] = useState<{
    booking: BookingRow;
    contract: ContractRow;
  } | null>(null);

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

  useEffect(() => {
    if (!bookings.length) return;
    const ids = bookings.map((b) => b.event_id).join(",");
    fetch(`/api/contracts?eventIds=${encodeURIComponent(ids)}`)
      .then((r) => r.json())
      .then((contractsData: { contracts?: ContractRow[] }) => {
        const contracts = contractsData.contracts || [];
        const contractMap = contracts.reduce((acc, c) => {
          if (c.booking_id && !acc[c.booking_id]) acc[c.booking_id] = c;
          return acc;
        }, {} as Record<string, ContractRow>);
        setContractsByBooking(contractMap);
      })
      .catch(() => {});
  }, [bookings]);

  const filtered = useMemo(
    () => {
      const query = normalizeSearchValue(search);
      return bookings.filter((b) => {
        const matchesSearch =
          query === "" ||
          normalizeSearchValue(b.client_name).includes(query) ||
          normalizeSearchValue(b.event_id).includes(query) ||
          normalizeSearchValue(b.client_email).includes(query) ||
          normalizeSearchValue(b.client_phone).includes(query) ||
          normalizeSearchValue(b.company_name).includes(query);
        const matchesStatus = statusFilter === "all" || b.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
    },
    [bookings, search, statusFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  const handleDownloadContract = async (booking: BookingRow, contract: ContractRow | undefined) => {
    try {
      if (contract?.pdf_url) {
        downloadContractPDF(contract.pdf_url, `contract-${booking.event_id}.pdf`);
        return;
      }

      setGeneratingContractFor(booking.id);
      const res = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const json = (await res.json()) as { pdfUrl?: string; contractId?: string | null; error?: string };
      setGeneratingContractFor(null);

      if (!res.ok) {
        showToast(json.error ?? "Failed to generate contract PDF", "error");
        return;
      }

      if (json.pdfUrl) {
        setContractsByBooking((prev) => ({
          ...prev,
          [booking.id]: {
            ...(prev[booking.id] ?? (contract as ContractRow)),
            booking_id: booking.id,
            event_id: booking.event_id,
            status: (prev[booking.id]?.status ?? contract?.status ?? "pre-signed") as ContractRow["status"],
            pdf_url: json.pdfUrl,
          } as ContractRow,
        }));
        downloadContractPDF(json.pdfUrl, `contract-${booking.event_id}.pdf`);
      }
    } catch (e) {
      setGeneratingContractFor(null);
      showToast("Failed to download contract", "error");
    }
  };
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages, filtered.length]);

  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const requests = bookings.filter((b) => b.status === "request").length;
  const declined = bookings.filter((b) => b.status === "declined").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;

  const handleAcceptRequest = async (booking: BookingRow) => {
    setActionLoading(`${booking.id}-accept`);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending", booking_type: "normal" }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === booking.id ? { ...b, status: "pending", booking_type: "normal" } : b,
          ),
        );
        await fetch("/api/notify/booking-request-accepted", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: booking.id }),
        }).catch(console.error);
        writeAuditLog(
          "booking",
          `Accepted booking request ${booking.event_id} for ${booking.client_name}`,
          booking.event_id,
        );
        showToast("Request accepted. Client notified with payment details.");
      } else {
        showToast("Failed to accept request.", "error");
      }
    } catch {
      showToast("Failed to accept request.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineRequest = async (booking: BookingRow) => {
    if (!confirm(`Decline request ${booking.event_id}? The client will be notified.`)) return;
    setActionLoading(`${booking.id}-decline`);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "declined" }),
      });
      if (res.ok) {
        setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: "declined" } : b)));
        await fetch("/api/notify/booking-request-declined", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: booking.id }),
        }).catch(console.error);
        writeAuditLog(
          "booking",
          `Declined booking request ${booking.event_id} for ${booking.client_name}`,
          booking.event_id,
        );
        showToast("Request declined. Client notified.");
      } else {
        showToast("Failed to decline.", "error");
      }
    } catch {
      showToast("Failed to decline.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = async (booking: BookingRow) => {
    setActionLoading(booking.id);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/confirm`, { method: "POST" });
      if (res.ok) {
        const json = (await res.json()) as { booking?: BookingRow };
        const updatedBooking = json.booking;
        setBookings((prev) => prev.map((b) => (b.id === booking.id ? (updatedBooking ?? { ...b, status: "confirmed" }) : b)));
        fetch("/api/notify/booking-confirmed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: booking.id }),
        }).catch(console.error);
        fetch("/api/contracts", {
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

  const handleMarkDepositPaid = async (booking: BookingRow) => {
    setActionLoading(`${booking.id}-deposit`);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deposit_paid: true, deposit_paid_at: new Date().toISOString() }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? { ...b, deposit_paid: true, deposit_paid_at: new Date().toISOString() } : b)),
        );
        writeAuditLog("payment", `Deposit marked as paid for ${booking.event_id} — ${booking.client_name}`, booking.event_id);
        showToast("Deposit marked as paid.");
      } else {
        showToast("Failed to update deposit.", "error");
      }
    } catch {
      showToast("Failed to update deposit.", "error");
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
              placeholder="Search by name, email, phone, or Event ID..."
              type="text"
            />
          </div>
          <div className="flex flex-wrap gap-1 rounded-sm bg-surface-container-low p-1">
            {(["all", "pending", "confirmed", "request", "declined", "cancelled"] as const).map((s) => (
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
                {s === "request" ? "Request" : s[0]!.toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
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
            <span className="font-label text-2xl font-bold leading-none text-error">{requests}</span>
            <span className="font-body text-xs uppercase tracking-widest text-on-surface-variant">Request</span>
          </div>
        </div>
        <div className="glass-card rounded-sm border-l-2 border-white/20 p-4">
          <div className="flex items-baseline space-x-2">
            <span className="font-label text-2xl font-bold leading-none text-on-surface-variant">{declined}</span>
            <span className="font-body text-xs uppercase tracking-widest text-on-surface-variant">Declined</span>
          </div>
        </div>
        <div className="glass-card rounded-sm border-l-2 border-error/60 p-4">
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
            const busyAccept = actionLoading === `${b.id}-accept`;
            const busyDecline = actionLoading === `${b.id}-decline`;
            const hasPlaylist = playlistEventIds.has(b.event_id);
            const isRequest = b.status === "request";
            const company = Boolean(b.is_company);
            const contract = contractsByBooking[b.id];
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
                  <div
                    style={{
                      fontFamily: "Space Mono",
                      fontSize: "10px",
                      color: "#5A6080",
                      marginTop: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Clock size={11} color="#5A6080" />
                    Booked{" "}
                    {new Date(b.created_at).toLocaleDateString("en-GH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}
                    {new Date(b.created_at).toLocaleTimeString("en-GH", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                  {company && (b.company_name || b.rep_title) ? (
                    <div className="mb-2 flex items-start gap-2 text-xs text-on-surface-variant">
                      <Building2 className="mt-0.5 size-3.5 shrink-0 text-[#00BFFF]" aria-hidden />
                      <div>
                        {b.company_name ? (
                          <p className="font-medium text-white/90">{b.company_name}</p>
                        ) : null}
                        {b.rep_title ? <p className="text-[11px] text-on-surface-variant">{b.rep_title}</p> : null}
                      </div>
                    </div>
                  ) : null}
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
                    <div>
                      <div
                        style={{
                          fontFamily: "Space Grotesk",
                          fontWeight: 600,
                          fontSize: "15px",
                          color: "white",
                        }}
                      >
                        {new Date(`${b.event_date}T00:00:00`).toLocaleDateString("en-GH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      {b.event_start_time_input ? (
                        <div
                          style={{
                            fontFamily: "Space Mono",
                            fontSize: "11px",
                            color: "#5A6080",
                            marginTop: "2px",
                          }}
                        >
                          {b.event_start_time_input}
                        </div>
                      ) : null}
                    </div>
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
                    <span
                      className={[
                        "rounded-sm px-3 py-1 text-[11px] font-bold uppercase",
                        isRequest
                          ? "bg-error/25 text-error"
                          : b.status === "declined"
                            ? "bg-white/10 text-on-surface-variant"
                            : "bg-primary-container text-on-primary-container",
                      ].join(" ")}
                    >
                      {isRequest ? "request" : b.status}
                    </span>
                    <span className="text-[10px] uppercase text-on-surface-variant">Payment: {b.payment_status}</span>
                    <span className="text-[10px] uppercase text-on-surface-variant">
                      Contract:{" "}
                      {contract
                        ? contract.status === "signed"
                          ? "signed"
                          : contract.status === "pre-signed"
                            ? "service agreement"
                            : "awaiting signature"
                        : "not generated"}
                    </span>
                    {contract?.pdf_url ? (
                      <button
                        type="button"
                        onClick={() => downloadContractPDF(contract.pdf_url!, `contract-${b.event_id}.pdf`)}
                        className="text-[10px] uppercase text-primary hover:underline"
                      >
                        Download PDF
                      </button>
                    ) : null}
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
                    <button
                      type="button"
                      onClick={() => void handleDownloadContract(b, contract)}
                      disabled={generatingContractFor === b.id}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        background: "rgba(0,191,255,0.08)",
                        border: "1px solid rgba(0,191,255,0.25)",
                        color: "#00BFFF",
                        fontFamily: "Space Grotesk",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: generatingContractFor === b.id ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        opacity: generatingContractFor === b.id ? 0.6 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Download size={13} />
                      {generatingContractFor === b.id ? "Generating..." : contract ? "Contract" : "Get Contract"}
                    </button>
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
                    {isRequest ? (
                      <>
                        <button
                          type="button"
                          disabled={busyAccept}
                          className="bg-emerald-600 px-3 py-1.5 text-[11px] font-bold uppercase text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
                          onClick={() => void handleAcceptRequest(b)}
                        >
                          {busyAccept ? "…" : "Accept Request"}
                        </button>
                        <button
                          type="button"
                          disabled={busyDecline}
                          className="border border-error/50 bg-transparent px-3 py-1.5 text-[11px] font-bold uppercase text-error transition-colors hover:bg-error/10 disabled:opacity-40"
                          onClick={() => void handleDeclineRequest(b)}
                        >
                          {busyDecline ? "…" : "Decline"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={busyConfirm || b.status === "confirmed" || b.status === "declined"}
                        className="px-3 py-1.5 text-[11px] font-bold uppercase text-black transition-colors hover:bg-primary/90 disabled:opacity-40 bg-primary"
                        onClick={() => void handleConfirm(b)}
                      >
                        {busyConfirm ? "…" : "Confirm"}
                      </button>
                    )}
                    {b.status === "confirmed" && !b.deposit_paid && b.payment_status !== "paid" ? (
                      <button
                        type="button"
                        disabled={actionLoading === `${b.id}-deposit`}
                        className="border border-[#F5A623]/40 bg-transparent px-3 py-1.5 text-[11px] font-bold uppercase text-[#F5A623] transition-colors hover:bg-[#F5A623]/10 disabled:opacity-40"
                        onClick={() => void handleMarkDepositPaid(b)}
                      >
                        {actionLoading === `${b.id}-deposit` ? "…" : "Mark Deposit Paid"}
                      </button>
                    ) : null}
                    {contract && contract.status === "pending" ? (
                      <button
                        type="button"
                        className="border border-primary/40 px-3 py-1.5 text-[11px] font-bold uppercase text-primary transition-colors hover:bg-primary/10"
                        onClick={() =>
                          void fetch("/api/contracts", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ bookingId: b.id, resendOnly: true }),
                          })
                        }
                      >
                        Resend Link
                      </button>
                    ) : null}
                    {contract ? (
                      <button
                        type="button"
                        className="border border-white/25 px-3 py-1.5 text-[11px] font-bold uppercase text-white transition-colors hover:bg-white/10"
                        onClick={() => setContractModal({ booking: b, contract })}
                      >
                        View Contract
                      </button>
                    ) : null}
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
                      disabled={busyCancel || b.status === "cancelled" || isRequest}
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

      {contractModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.80)",
            backdropFilter: "blur(8px)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={() => setContractModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0a0a14",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "640px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexShrink: 0,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "Space Grotesk",
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "white",
                  }}
                >
                  Contract - {contractModal.booking.event_id}
                </div>
                <div
                  style={{
                    fontFamily: "Space Mono",
                    fontSize: "11px",
                    color:
                      contractModal.contract?.status === "signed" ? "#22c55e" : "#F5A623",
                    marginTop: "4px",
                  }}
                >
                  {contractModal.contract?.status === "signed"
                    ? "✓ SIGNED"
                    : "⏳ AWAITING SIGNATURE"}
                </div>
              </div>
              <button
                onClick={() => setContractModal(null)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "8px",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {contractModal.contract?.status === "signed" && (
                <div
                  style={{
                    background: "rgba(34,197,94,0.06)",
                    border: "1px solid rgba(34,197,94,0.20)",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Space Grotesk",
                      fontWeight: 600,
                      fontSize: "13px",
                      color: "#22c55e",
                      marginBottom: "12px",
                    }}
                  >
                    Signing Details
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Space Mono",
                        fontSize: "10px",
                        color: "#5A6080",
                        textTransform: "uppercase",
                      }}
                    >
                      Signed At
                    </span>
                    <span style={{ fontFamily: "Inter", fontSize: "12px", color: "white" }}>
                      {contractModal.contract.client_signed_at
                        ? new Date(contractModal.contract.client_signed_at).toLocaleString("en-GH")
                        : "—"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Space Mono",
                        fontSize: "10px",
                        color: "#5A6080",
                        textTransform: "uppercase",
                      }}
                    >
                      IP Address
                    </span>
                    <span
                      style={{
                        fontFamily: "Space Mono",
                        fontSize: "12px",
                        color: "#A0A8C0",
                      }}
                    >
                      {contractModal.contract.client_ip || "—"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Space Mono",
                        fontSize: "10px",
                        color: "#5A6080",
                        textTransform: "uppercase",
                      }}
                    >
                      Method
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter",
                        fontSize: "12px",
                        color: "white",
                        textTransform: "capitalize",
                      }}
                    >
                      {contractModal.contract.client_signature_type || "—"}
                    </span>
                  </div>

                  {contractModal.contract.client_signature_data && (
                    <div style={{ marginTop: "12px" }}>
                      <div
                        style={{
                          fontFamily: "Space Mono",
                          fontSize: "10px",
                          color: "#5A6080",
                          textTransform: "uppercase",
                          marginBottom: "8px",
                        }}
                      >
                        Client Signature
                      </div>

                      {contractModal.contract.client_signature_type === "drawn" ? (
                        <div
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: "8px",
                            padding: "8px",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <img
                            src={contractModal.contract.client_signature_data}
                            alt="Client signature"
                            style={{
                              maxWidth: "100%",
                              height: "80px",
                              objectFit: "contain",
                              display: "block",
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            textAlign: "center",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "Georgia, serif",
                              fontStyle: "italic",
                              fontSize: "24px",
                              color: "rgba(255,255,255,0.80)",
                            }}
                          >
                            {contractModal.contract.client_signature_data}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "12px",
                      padding: "8px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: "6px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Space Mono",
                        fontSize: "9px",
                        color: "#5A6080",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      Document Hash (SHA256)
                    </div>
                    <div
                      style={{
                        fontFamily: "Space Mono",
                        fontSize: "9px",
                        color: "#3A4060",
                        wordBreak: "break-all",
                      }}
                    >
                      {contractModal.contract.contract_hash}
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  background: "rgba(0,191,255,0.04)",
                  border: "1px solid rgba(0,191,255,0.12)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                }}
              >
                <p
                  style={{
                    fontFamily: "Inter",
                    fontSize: "12px",
                    color: "#A0A8C0",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  This contract was signed electronically under Ghana's Electronic Transactions Act 2008 (Act 772). The document hash, timestamp, and IP address above constitute a legally valid electronic signature record.
                </p>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: "Space Mono",
                    fontSize: "10px",
                    color: "#5A6080",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  Contract Content
                </div>
                <pre
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: "11px",
                    color: "#A0A8C0",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "10px",
                    padding: "16px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {contractModal.contract?.contract_text || "Contract text not available"}
                </pre>
              </div>
            </div>

            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                gap: "10px",
                flexShrink: 0,
              }}
            >
              {contractModal.contract?.pdf_url && (
                <a
                  href={contractModal.contract.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "#00BFFF",
                    color: "#000",
                    fontFamily: "Space Grotesk",
                    fontWeight: 600,
                    fontSize: "13px",
                    textDecoration: "none",
                  }}
                >
                  Download PDF
                </a>
              )}

              <button
                onClick={() => setContractModal(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#A0A8C0",
                  fontFamily: "Space Grotesk",
                  fontWeight: 500,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
