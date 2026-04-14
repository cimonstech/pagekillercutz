"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Database } from "@/lib/database.types";
import { getEventGridImages, getEventHeroImage, getRelatedCardImage } from "@/lib/eventImages";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

function formatEventDateLong(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEventDateShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

function eventTypeLabel(t: string): string {
  const x = t.trim();
  if (!x) return "Event";
  return x.charAt(0).toUpperCase() + x.slice(1);
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = typeof params.slug === "string" ? params.slug : "";

  const [event, setEvent] = useState<EventRow | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        const data = (await res.json()) as { event?: EventRow };
        if (!data?.event) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        if (cancelled) return;
        setEvent(data.event);

        const relRes = await fetch(`/api/events?limit=24&sort=desc&type=${encodeURIComponent(data.event.event_type)}`);
        const relJson = (await relRes.json()) as { events?: EventRow[] };
        let list = (relJson.events ?? []).filter((e) => e.id !== eventId);

        if (list.length < 3) {
          const allRes = await fetch(`/api/events?limit=30&sort=desc`);
          const allJson = (await allRes.json()) as { events?: EventRow[] };
          const seen = new Set(list.map((e) => e.id));
          for (const e of allJson.events ?? []) {
            if (e.id === eventId || seen.has(e.id)) continue;
            list.push(e);
            seen.add(e.id);
            if (list.length >= 6) break;
          }
        }

        if (!cancelled) setRelatedEvents(list.slice(0, 3));
      } catch {
        if (!cancelled) {
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const heroImage = useMemo(() => (event ? getEventHeroImage(event) : ""), [event]);
  const gridImages = useMemo(() => (event ? getEventGridImages(event) : []), [event]);
  const locationLine = useMemo(() => {
    if (!event) return "";
    return [event.venue, event.location].filter(Boolean).join(", ");
  }, [event]);

  if (loading) {
    return (
      <div className="min-h-[60vh] px-8 py-20">
        <div className="mx-auto max-w-4xl animate-pulse space-y-6">
          <div className="h-12 w-2/3 rounded-lg bg-white/10" />
          <div className="h-[320px] w-full rounded-2xl bg-white/10" />
          <div className="h-24 w-full rounded-lg bg-white/10" />
        </div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="mx-auto max-w-lg px-8 py-24 text-center">
        <h1 className="font-headline text-2xl font-bold text-white">Event not found</h1>
        <p className="mt-3 text-sm text-on-surface-variant">This event may have been removed or the link is invalid.</p>
        <Link href="/events" className="mt-8 inline-flex text-primary hover:underline">
          ← Back to events
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="pointer-events-none fixed right-0 top-0 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[130px]" />

      {/* Hero */}
      <section className="relative h-[420px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
            unoptimized
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 flex w-full flex-col items-start gap-3 px-8 pb-10 lg:px-12">
          <span className="rounded-full bg-primary px-3 py-1 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary-fixed">
            {eventTypeLabel(event.event_type)}
          </span>
          <h1 className="font-display text-[clamp(2rem,6vw,4rem)] leading-none uppercase tracking-display-title text-white">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 font-headline text-sm text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
              {locationLine}
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
              {formatEventDateLong(event.event_date)}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-8 py-12 lg:flex-row lg:px-12">
        <div className="space-y-12 lg:flex-1">
          <article>
            <h2 className="mb-5 font-headline text-xl font-bold uppercase tracking-wide">About this event</h2>
            <div className="space-y-4 text-sm leading-relaxed text-on-surface-variant">
              {event.description?.trim() ? (
                event.description.split("\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <p className="text-on-surface-variant/80">Details coming soon.</p>
              )}
            </div>
          </article>

          <div>
            <h3 className="mb-5 font-headline text-xl font-bold uppercase tracking-wide">Media highlights</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {gridImages.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-container-low"
                >
                  <Image
                    src={src}
                    alt={`${event.title} media ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                    unoptimized
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="shrink-0 lg:w-[340px]">
          <div className="glass sticky top-24 space-y-6 rounded-2xl p-7">
            <div>
              <h3 className="font-headline text-lg font-semibold text-white" style={{ fontWeight: 600, fontSize: "18px" }}>
                Book Page KillerCutz
              </h3>
              <p className="mt-1 font-body text-[13px] text-on-surface-variant">Available for your next event.</p>
            </div>

            <div className="h-px bg-white/10" />

            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <Calendar className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-label text-[10px] uppercase tracking-wide text-outline">Date</p>
                  <p className="font-headline font-medium text-on-surface">{formatEventDateLong(event.event_date)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-label text-[10px] uppercase tracking-wide text-outline">Location</p>
                  <p className="font-headline font-medium text-on-surface">{locationLine || "—"}</p>
                </div>
              </div>
              <div>
                <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-label text-[10px] font-bold uppercase tracking-wider text-primary">
                  {eventTypeLabel(event.event_type)}
                </span>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            <div className="flex flex-col gap-3 pt-1">
              <button
                type="button"
                onClick={() => router.push("/booking")}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary font-headline text-sm font-bold uppercase tracking-widest text-on-primary-fixed transition-transform hover:scale-[1.02] glow-btn"
              >
                Book the DJ →
              </button>
              <button
                type="button"
                onClick={() => router.push("/pricing")}
                className="flex h-11 w-full items-center justify-center rounded-full border border-white/15 font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:bg-white/5"
              >
                View Packages →
              </button>
            </div>
          </div>
        </aside>
      </div>

      <section className="px-8 pb-16 lg:px-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-headline text-xl font-bold uppercase tracking-wide">More events</h2>
          <Link href="/events" className="text-sm font-bold text-on-surface-variant transition-colors hover:text-on-surface">
            See all
          </Link>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar">
          {relatedEvents.map((rel) => {
            const relImage = getRelatedCardImage(rel);
            const relDate = formatEventDateShort(rel.event_date);
            return (
              <button
                key={rel.id}
                type="button"
                onClick={() => router.push(`/events/${rel.id}`)}
                className="group min-w-[280px] cursor-pointer overflow-hidden rounded-2xl border border-transparent bg-surface-container-low text-left transition-all hover:border-primary/20"
              >
                <div className="relative mb-3 h-40 overflow-hidden rounded-xl">
                  <Image
                    src={relImage}
                    alt={rel.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="280px"
                    unoptimized
                    referrerPolicy="no-referrer"
                  />
                  <div
                    className="absolute left-3 top-3 rounded-md px-2.5 py-1 font-mono text-[10px] font-bold text-white"
                    style={{
                      background: "rgba(8,8,16,0.85)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {relDate}
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <div className="mb-1 font-headline text-[15px] font-semibold text-white">{rel.title}</div>
                  <div className="mb-2 flex items-center gap-1 text-[12px] text-[#5A6080]">
                    <MapPin size={12} className="shrink-0" aria-hidden />
                    <span className="font-body">{rel.location}</span>
                  </div>
                  <div className="flex items-center gap-1 font-headline text-[13px] font-medium text-primary">
                    View Event
                    <ArrowRight size={14} aria-hidden />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {relatedEvents.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No other events to show yet.</p>
        ) : null}
      </section>
    </div>
  );
}
