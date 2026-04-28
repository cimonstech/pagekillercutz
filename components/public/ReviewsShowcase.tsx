"use client";

import { useEffect, useMemo, useState } from "react";

type PublicReview = {
  id: string;
  rating: number;
  first_name: string;
  event_type: string | null;
  event_month: string | null;
  review_text: string | null;
};

export default function ReviewsShowcase({ limit = 6 }: { limit?: number }) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetch(`/api/reviews?limit=${limit}`)
      .then((r) => r.json())
      .then((j: { reviews?: PublicReview[] }) => setReviews(j.reviews ?? []))
      .finally(() => setLoading(false));
  }, [limit]);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  if (!loading && reviews.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-extrabold leading-none text-[#F5A623]">
            {average ? average.toFixed(1) : "—"} ★
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">Based on {reviews.length} reviews</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(loading ? Array.from({ length: 3 }).map((_, i) => ({ id: `s-${i}` } as PublicReview)) : reviews).map((r) => (
          <article key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[#F5A623]">{loading ? "★★★★★" : `${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}`}</div>
            <p className="mt-2 line-clamp-3 text-sm text-white/90">
              {loading ? "Loading review..." : (r.review_text || "Great experience.")}
            </p>
            {!loading ? (
              <p className="mt-3 text-xs text-on-surface-variant">
                — {r.first_name}
                {r.event_type ? `, ${r.event_type}` : ""}
              </p>
            ) : null}
            {!loading && r.event_month ? <p className="text-[11px] text-on-surface-variant">{r.event_month}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
