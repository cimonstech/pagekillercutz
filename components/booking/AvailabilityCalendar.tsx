"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DayStatus = "available" | "amber" | "blocked" | "past";

interface AvailabilityCalendarProps {
  onDateSelect: (date: string, status: "available" | "amber" | "blocked") => void;
  selectedDate: string | null;
}

export default function AvailabilityCalendar({ onDateSelect, selectedDate }: AvailabilityCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [availability, setAvailability] = useState<Record<string, { status: string }>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    fetch(`/api/availability?year=${viewYear}&month=${viewMonth}`)
      .then(async (r) => {
        const data = (await r.json()) as { availability?: Record<string, { status: string }>; error?: string };
        if (!r.ok) throw new Error(data.error ?? "Failed to load availability");
        if (!cancelled) setAvailability(data.availability ?? {});
      })
      .catch((e) => {
        if (!cancelled) {
          setFetchError(e instanceof Error ? e.message : "Failed to load");
          setAvailability({});
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [viewYear, viewMonth]);

  const monthName = new Date(viewYear, viewMonth - 1, 1).toLocaleDateString("en-GH", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const getDateStr = (day: number) =>
    `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isPast = (day: number) => {
    const date = new Date(viewYear, viewMonth - 1, day);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return date < todayStart;
  };

  const getStatus = (day: number): DayStatus => {
    if (isPast(day)) return "past";
    const dateStr = getDateStr(day);
    const s = availability[dateStr]?.status;
    if (s === "blocked" || s === "amber" || s === "available") return s;
    return "available";
  };

  const getDayStyle = (day: number): CSSProperties => {
    const status = getStatus(day);
    const dateStr = getDateStr(day);
    const isSelected = selectedDate === dateStr;

    const base: CSSProperties = {
      width: "36px",
      height: "36px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "13px",
      fontFamily: "var(--font-headline), 'Space Grotesk', sans-serif",
      fontWeight: 500,
      cursor: status === "past" ? "not-allowed" : "pointer",
      transition: "all 150ms ease",
      border: "1px solid transparent",
      position: "relative",
    };

    if (isSelected) {
      return {
        ...base,
        background: "#00BFFF",
        color: "#000",
        fontWeight: 700,
      };
    }

    switch (status) {
      case "past":
        return {
          ...base,
          color: "rgba(255,255,255,0.15)",
          cursor: "not-allowed",
        };
      case "available":
        return {
          ...base,
          color: "white",
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.20)",
        };
      case "amber":
        return {
          ...base,
          color: "#F5A623",
          background: "rgba(245,166,35,0.08)",
          border: "1px solid rgba(245,166,35,0.20)",
        };
      case "blocked":
        return {
          ...base,
          color: "rgba(255,69,96,0.60)",
          background: "rgba(255,69,96,0.06)",
          border: "1px solid rgba(255,69,96,0.15)",
          textDecoration: "line-through",
        };
      default:
        return {
          ...base,
          color: "rgba(255,255,255,0.50)",
        };
    }
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "20px",
      }}
    >
      {fetchError ? (
        <p className="mb-3 font-body text-[12px] text-[#FF4560]">
          Calendar could not load availability ({fetchError}). Dates are shown as available until the database is updated.
        </p>
      ) : null}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <button
          type="button"
          onClick={prevMonth}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "8px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "white",
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <span
          style={{
            fontFamily: "var(--font-headline), 'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: "15px",
            color: "white",
          }}
        >
          {monthName}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "8px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "white",
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 36px)",
          gap: "4px",
          marginBottom: "8px",
          justifyContent: "center",
        }}
      >
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div
            key={d}
            style={{
              width: "36px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-mono), 'Space Mono', monospace",
              fontSize: "10px",
              color: "#5A6080",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 36px)",
          gap: "4px",
          justifyContent: "center",
          opacity: loading ? 0.4 : 1,
          transition: "opacity 300ms",
        }}
      >
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const status = getStatus(day);

          return (
            <button
              key={day}
              type="button"
              style={getDayStyle(day)}
              onClick={() => {
                if (status === "past") return;
                const dateStr = getDateStr(day);
                if (status === "blocked") onDateSelect(dateStr, "blocked");
                else if (status === "amber") onDateSelect(dateStr, "amber");
                else onDateSelect(dateStr, "available");
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          marginTop: "16px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {[
          { color: "#22c55e", label: "Available" },
          { color: "#F5A623", label: "Limited" },
          { color: "#FF4560", label: "Fully booked" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: item.color,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-body), Inter, sans-serif",
                fontSize: "11px",
                color: "#A0A8C0",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
