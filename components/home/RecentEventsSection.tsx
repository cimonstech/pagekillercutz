"use client";

import Link from "next/link";
import AnimateIn from "@/components/ui/AnimateIn";
import { resolveEventImageUrl } from "@/lib/eventImages";
import { eventTypeEmoji, formatEventDate, type EventRow } from "./homeShared";
import { useEffect, useState } from "react";

export default function RecentEventsSection() {
  const [recentEvents, setRecentEvents] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const res = await fetch("/api/events?limit=4&sort=desc");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load events");
        if (!cancelled) setRecentEvents(json.events ?? []);
      } catch (e) {
        if (!cancelled) setEventsError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <AnimateIn from={16} className="mb-4 flex items-center justify-between">
        <h2 className="font-headline text-[20px] font-semibold text-white">Recent events</h2>
        <Link
          href="/events"
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-headline font-bold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-on-surface"
        >
          View all
        </Link>
      </AnimateIn>
      {eventsLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="min-w-[240px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              <div className="kc-shimmer h-28 w-full" />
              <div className="space-y-2 p-4">
                <div className="kc-shimmer h-4 w-3/4 rounded" />
                <div className="kc-shimmer h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : eventsError ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{eventsError}</p>
      ) : recentEvents.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No results</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {recentEvents.map((ev) => {
            const bgUrl = resolveEventImageUrl(ev.media_urls?.[0] ?? null);
            const hasBg = Boolean(bgUrl);
            return (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className="group min-w-[260px] max-w-[280px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low transition-colors hover:border-primary/30 hover:bg-surface-container"
              >
                <div
                  className="relative h-32 w-full overflow-hidden bg-surface-container-high transition-transform duration-500 group-hover:scale-[1.02]"
                  style={
                    hasBg
                      ? {
                          backgroundImage: `url(${bgUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : {
                          background:
                            "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(8,8,15,0.95) 100%)",
                        }
                  }
                >
                  {!hasBg ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-white/15">event</span>
                    </div>
                  ) : null}
                  <div className="absolute right-2 top-2 rounded-full border border-primary/20 bg-black/50 px-2 py-0.5 font-label text-[10px] uppercase tracking-wider text-primary backdrop-blur-md">
                    {ev.event_type}
                  </div>
                  <div className="absolute bottom-2 left-2 text-2xl drop-shadow-lg">{eventTypeEmoji(ev.event_type)}</div>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 font-headline text-sm font-semibold">{ev.title}</h3>
                  <p className="mt-1 flex items-center gap-1 font-label text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    {formatEventDate(ev.event_date)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 font-label text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {ev.location}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
