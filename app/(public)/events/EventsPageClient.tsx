"use client";

import Image from "next/image";
import { BorderDrawEdges } from "@/components/ui/BorderDrawEdges";
import { useEffect, useState } from "react";
import Link from "next/link";
import AnimateIn from "@/components/ui/AnimateIn";
import type { Database } from "@/lib/database.types";

const FILTERS = ["All", "Festival", "Wedding", "Corporate", "Club Night"] as const;
type Filter = (typeof FILTERS)[number];

type EventRow = Database["public"]["Tables"]["events"]["Row"];

function eventAccent(eventType: string): string {
  const t = eventType.toLowerCase();
  if (t.includes("festival")) return "from-primary/20";
  if (t.includes("club")) return "from-secondary/20";
  if (t.includes("corporate")) return "from-primary/15";
  if (t.includes("wedding")) return "from-secondary/15";
  return "from-primary/20";
}

function eventEmoji(eventType: string): string {
  const t = eventType.toLowerCase();
  if (t.includes("festival")) return "\u{1F3B8}";
  if (t.includes("wedding")) return "\u{1F48D}";
  if (t.includes("corporate")) return "\u{1F3E2}";
  if (t.includes("club")) return "\u{1F3A7}";
  return "\u{1F3A4}";
}

function formatEventDate(d: string): string {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return d;
  return x.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
}

export default function EventsPageClient() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url =
          activeFilter === "All"
            ? "/api/events"
            : `/api/events?type=${encodeURIComponent(activeFilter)}`;
        const res = await fetch(url);
        const json = (await res.json()) as { error?: string; events?: EventRow[] };
        if (!res.ok) throw new Error(json.error || "Failed to load events");
        if (!cancelled) setEvents(json.events ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeFilter]);

  return (
    <div className="px-4 py-10 pb-24 sm:px-8 lg:px-12">
      {/* Header */}
      <header className="mb-10">
        <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tighter text-white mb-2">Live Dates</h1>
        <p className="text-on-surface-variant text-sm max-w-xl">
          Experience the energy of Page KillerCutz live. From intimate club sets to massive festival stages.
        </p>
      </header>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={[
              "shrink-0 px-5 py-2 rounded-full font-headline text-xs uppercase tracking-widest transition-all border",
              activeFilter === f
                ? "bg-primary text-on-primary-fixed border-primary glow-cyan"
                : "bg-transparent text-on-surface-variant border-white/10 hover:border-white/20",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass animate-pulse overflow-hidden rounded-2xl">
              <div className="h-[160px] bg-white/10" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 rounded bg-white/10" />
                <div className="h-4 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="mb-14 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
      ) : events.length === 0 ? (
        <p className="mb-14 text-sm text-on-surface-variant">No results</p>
      ) : (
        <AnimateIn stagger={0.08} className="grid grid-cols-1 gap-6 mb-14 md:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => {
            const img = ev.media_urls?.[0];
            return (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className="group relative block overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_32px_rgba(0,191,255,0.16)]"
                style={{
                  background: "rgba(12,14,24,0.88)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                <BorderDrawEdges />
                <div className="relative z-10">
                  <div
                    className={`relative flex h-[160px] items-center justify-center overflow-hidden bg-gradient-to-br ${eventAccent(ev.event_type)} to-surface-container-high`}
                  >
                    {img ? (
                      <Image
                        src={img}
                        alt={ev.title}
                        fill
                        className="object-cover opacity-100"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <span className="text-6xl transition-transform duration-500 group-hover:scale-110">
                        {eventEmoji(ev.event_type)}
                      </span>
                    )}
                    <div className="absolute right-3 top-3 rounded-full border border-primary/20 bg-black/50 px-3 py-1 font-label text-[10px] uppercase tracking-wider text-primary backdrop-blur-md">
                      {ev.event_type}
                    </div>
                  </div>

                  <div className="space-y-3 p-5">
                    <h3 className="font-headline text-base font-semibold">{ev.title}</h3>
                    <p className="line-clamp-2 text-sm leading-relaxed text-on-surface-variant/90">
                      {ev.description ?? ""}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2 font-label text-[11px] text-on-surface-variant/90">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {formatEventDate(ev.event_date)}
                      </div>
                      <div className="flex items-center gap-2 font-label text-[11px] text-on-surface-variant/90">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {ev.location}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </AnimateIn>
      )}

      {/* CTA Banner */}
      <AnimateIn from={24}>
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-secondary/10" />
          <div className="relative glass border-0 rounded-2xl border-l-[3px] border-primary p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-headline font-bold text-xl mb-1">Book Page KillerCutz for your next event.</h2>
              <p className="text-on-surface-variant text-sm">
                Available worldwide for festivals, and high-end private functions.
              </p>
            </div>
            <Link
              href="/booking"
              className="shrink-0 flex items-center gap-2 px-8 py-3 bg-primary text-on-primary-fixed font-bold rounded-full hover:scale-105 transition-transform glow-btn"
            >
              Book Now
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </AnimateIn>
    </div>
  );
}
