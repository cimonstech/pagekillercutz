"use client";

import { useEffect, useRef, useState } from "react";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  client_name: string;
  event_type: string;
  event_month: string;
}

export default function ReviewsCarousel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/reviews?limit=10")
      .then((r) => r.json())
      .then((data) => {
        const withText = (data.reviews || []).filter(
          (r: Review) => r.review_text && r.review_text.trim().length > 10,
        );
        setReviews(withText);
      });
  }, []);

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (isPaused || reviews.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev >= reviews.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, reviews.length]);

  if (reviews.length === 0) return null;

  const goTo = (index: number) => {
    setCurrent(index);
    // Reset timer on manual navigation
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const prev = () => {
    goTo(current <= 0 ? reviews.length - 1 : current - 1);
  };

  const next = () => {
    goTo(current >= reviews.length - 1 ? 0 : current + 1);
  };

  return (
    <section
      style={{
        padding: "48px 0",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "24px",
          padding: "0 24px",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "Space Mono",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#00BFFF",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Client Reviews
          </div>
          <h2
            style={{
              fontFamily: "Space Grotesk",
              fontWeight: 700,
              fontSize: "26px",
              color: "white",
              margin: 0,
            }}
          >
            What clients say
          </h2>
        </div>

        {/* Arrows */}
        {reviews.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            <button
              onClick={prev}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.70)",
                fontSize: "16px",
                transition: "all 150ms",
              }}
            >
              ←
            </button>
            <button
              onClick={next}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.70)",
                fontSize: "16px",
                transition: "all 150ms",
              }}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Single card carousel */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          overflow: "hidden",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            transform: `translateX(-${current * 100}%)`,
            transition: "transform 400ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                minWidth: "100%",
                flexShrink: 0,
              }}
            >
              {/* REVIEW CARD */}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  padding: "28px 32px",
                }}
              >
                {/* Stars */}
                <div
                  style={{
                    display: "flex",
                    gap: "3px",
                    marginBottom: "16px",
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      style={{
                        fontSize: "18px",
                        color:
                          star <= review.rating ? "#F5A623" : "rgba(255,255,255,0.15)",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Quote */}
                <div
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "40px",
                    color: "rgba(0,191,255,0.20)",
                    lineHeight: 0.8,
                    marginBottom: "10px",
                    userSelect: "none",
                  }}
                >
                  "
                </div>

                {/* Review text */}
                <p
                  style={{
                    fontFamily: "Inter",
                    fontSize: "15px",
                    color: "#C0C8D8",
                    lineHeight: 1.75,
                    fontStyle: "italic",
                    margin: "0 0 20px",
                  }}
                >
                  {review.review_text}
                </p>

                {/* Attribution */}
                <div
                  style={{
                    paddingTop: "16px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Space Grotesk",
                      fontWeight: 600,
                      fontSize: "14px",
                      color: "white",
                    }}
                  >
                    — {review.client_name}
                  </span>

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Space Mono",
                        fontSize: "9px",
                        color: "#5A6080",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {review.event_type}
                    </div>
                    <div
                      style={{
                        fontFamily: "Inter",
                        fontSize: "11px",
                        color: "#5A6080",
                        marginTop: "2px",
                      }}
                    >
                      {review.event_month}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {reviews.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            marginTop: "20px",
          }}
        >
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === current ? "24px" : "6px",
                height: "6px",
                borderRadius: "999px",
                background:
                  i === current ? "#00BFFF" : "rgba(255,255,255,0.20)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 300ms ease",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
