"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type ReviewPayload = {
  token: string;
  clientName: string;
  firstName: string;
  eventType: string | null;
  eventMonth: string | null;
  rating: number | null;
  reviewText: string | null;
  alreadySubmitted: boolean;
};

export default function ReviewTokenPage() {
  const params = useParams<{ token: string }>();
  const token = (params?.token ?? "").trim();
  const [review, setReview] = useState<ReviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setError("This review link is invalid.");
      setLoading(false);
      return;
    }
    void fetch(`/api/reviews/${token}`)
      .then(async (res) => {
        const j = (await res.json()) as { review?: ReviewPayload; error?: string };
        if (!res.ok) throw new Error(j.error ?? "Failed to load review");
        if (!cancelled) {
          setReview(j.review ?? null);
          setRating(j.review?.rating ?? 0);
          setReviewText(j.review?.reviewText ?? "");
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load review");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const privacyName = useMemo(() => review?.firstName || "Client", [review?.firstName]);

  const submit = async () => {
    if (rating < 1 || rating > 5) {
      setError("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, reviewText }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to submit");
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-xl px-4 py-24 text-sm text-on-surface-variant">Loading review page...</div>;
  }
  if (error) {
    return <div className="mx-auto max-w-xl px-4 py-24 text-sm text-error">{error}</div>;
  }
  if (!review) {
    return <div className="mx-auto max-w-xl px-4 py-24 text-sm text-error">Review record not found.</div>;
  }
  if (review.alreadySubmitted || submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="text-4xl">✓</div>
        <h1 className="mt-3 font-headline text-2xl font-semibold text-white">Thank you for your review!</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Your feedback helps Page KillerCutz continue delivering great events.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-center font-headline text-[22px] font-semibold text-white">
        How was Page KillerCutz at your event?
      </h1>
      <p className="mt-2 text-center text-sm text-on-surface-variant">
        {[review.eventType, review.eventMonth].filter(Boolean).join(" · ")}
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex items-center justify-center gap-2">
          {Array.from({ length: 5 }).map((_, idx) => {
            const n = idx + 1;
            const filled = (hover || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                className={`text-[40px] leading-none ${filled ? "text-[#F5A623]" : "text-white/25"}`}
                aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
              >
                ★
              </button>
            );
          })}
        </div>

        <textarea
          rows={4}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Tell us about your experience with Page KillerCutz..."
          className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary"
        />

        <div className="mt-4 text-xs text-on-surface-variant">
          Your name will appear as: <span className="text-white">{privacyName}</span>
        </div>
        <p className="mt-1 text-[11px] text-on-surface-variant">Only your first name is shown publicly for privacy.</p>

        {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={submitting}
          className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Review →"}
        </button>
      </div>
    </div>
  );
}
