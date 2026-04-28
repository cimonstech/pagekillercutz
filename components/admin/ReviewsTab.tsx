"use client";

import { useEffect, useMemo, useState } from "react";

type AdminReview = {
  id: string;
  rating: number;
  first_name: string;
  client_name: string;
  event_type: string | null;
  event_month: string | null;
  review_text: string | null;
  submitted_at: string;
  status: "pending" | "approved" | "hidden" | "rejected";
  hidden_reason: string | null;
};

const FILTERS = ["all", "pending", "approved", "hidden"] as const;

export default function ReviewsTab() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    void fetch("/api/reviews?admin=true&limit=300")
      .then((r) => r.json())
      .then((j: { reviews?: AdminReview[] }) => setReviews(j.reviews ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => reviews.filter((r) => filter === "all" || r.status === filter),
    [reviews, filter],
  );

  const counts = useMemo(
    () => ({
      total: reviews.length,
      pending: reviews.filter((r) => r.status === "pending").length,
      approved: reviews.filter((r) => r.status === "approved").length,
      hidden: reviews.filter((r) => r.status === "hidden").length,
    }),
    [reviews],
  );

  const patchReview = async (
    id: string,
    status: "approved" | "hidden" | "rejected",
    hiddenReason?: string,
  ) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, hiddenReason }),
      });
      if (!res.ok) return;
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, hidden_reason: hiddenReason || null } : r)),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-12 pt-24">
      <h3 className="font-headline text-[28px] font-semibold text-white">Reviews</h3>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total" value={counts.total} />
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Approved" value={counts.approved} />
        <Stat label="Hidden" value={counts.hidden} />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-sm px-3 py-1.5 text-xs font-bold uppercase ${
              filter === f ? "bg-primary text-black" : "bg-white/5 text-on-surface-variant"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-on-surface-variant">Loading reviews...</p> : null}

      <div className="space-y-4">
        {filtered.map((r) => {
          const busy = busyId === r.id;
          return (
            <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[#F5A623]">{`${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}`}</div>
                  <p className="mt-2 text-sm text-white">{r.review_text || "No written comment."}</p>
                  <p className="mt-2 text-xs text-on-surface-variant">
                    — {r.first_name}
                    {r.event_type ? `, ${r.event_type}` : ""}
                    {r.event_month ? ` · ${r.event_month}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase text-on-surface-variant">
                  {r.status}
                </span>
              </div>

              {r.status === "pending" ? (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void patchReview(r.id, "approved")}
                    className="rounded-sm bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void patchReview(r.id, "rejected")}
                    className="rounded-sm border border-error/50 px-3 py-1.5 text-xs font-bold uppercase text-error disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              ) : null}

              {r.status === "approved" ? (
                <div className="mt-4 flex items-center gap-2">
                  <input
                    value={reasonById[r.id] ?? ""}
                    onChange={(e) => setReasonById((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Optional reason for hiding"
                    className="w-full max-w-sm rounded-sm border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void patchReview(r.id, "hidden", reasonById[r.id])}
                    className="rounded-sm bg-[#F5A623] px-3 py-1.5 text-xs font-bold uppercase text-black disabled:opacity-50"
                  >
                    Hide
                  </button>
                </div>
              ) : null}

              {r.status === "hidden" ? (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void patchReview(r.id, "approved")}
                    className="rounded-sm bg-primary px-3 py-1.5 text-xs font-bold uppercase text-black disabled:opacity-50"
                  >
                    Un-hide
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void patchReview(r.id, "rejected")}
                    className="rounded-sm border border-error/50 px-3 py-1.5 text-xs font-bold uppercase text-error disabled:opacity-50"
                  >
                    Reject
                  </button>
                  {r.hidden_reason ? <span className="text-xs text-on-surface-variant">Reason: {r.hidden_reason}</span> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-card rounded-sm border border-white/5 p-4">
      <p className="font-body text-xs uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-2 font-label text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
