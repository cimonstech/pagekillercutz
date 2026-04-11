"use client";

import { BorderDrawEdges } from "@/components/ui/BorderDrawEdges";
import { useState } from "react";
import Link from "next/link";
import AnimateIn from "@/components/ui/AnimateIn";

const FILTERS = ["All", "Festival", "Wedding", "Corporate", "Club Night"];

const EVENTS = [
  {
    slug: "echoes-of-the-valley",
    tag: "Festival",
    emoji: "🎸",
    title: "Echoes of the Valley",
    desc: "Headline set featuring a 3-hour journey through sonic futurism and experimental deep house.",
    date: "AUG 24, 2024",
    place: "Accra Central, GH",
    accent: "from-primary/20",
  },
  {
    slug: "neon-pulse-vol-iv",
    tag: "Club Night",
    emoji: "🎧",
    title: "Neon Pulse Vol. IV",
    desc: "Late-night residency set focusing on electric vibes and high-energy transitions.",
    date: "SEP 12, 2024",
    place: "Club Onyx, Accra",
    accent: "from-secondary/20",
  },
  {
    slug: "tech-summit-gala",
    tag: "Corporate",
    emoji: "🏢",
    title: "Tech Summit Gala",
    desc: "Ambient soundscapes and sophisticated grooves for the global innovators dinner.",
    date: "OCT 05, 2024",
    place: "Kempinski Hotel, Accra",
    accent: "from-primary/15",
  },
  {
    slug: "the-mensah-celebration",
    tag: "Wedding",
    emoji: "💍",
    title: "The Mensah Celebration",
    desc: "A curated blend of highlife classics and modern afrobeats for a private luxury event.",
    date: "NOV 18, 2024",
    place: "Kempinski Gold Coast",
    accent: "from-secondary/15",
  },
  {
    slug: "global-rhythm-fest",
    tag: "Festival",
    emoji: "🎸",
    title: "Global Rhythm Fest",
    desc: "Opening set for the main stage, featuring live hardware integration and analog synths.",
    date: "DEC 28, 2024",
    place: "Black Star Square, Accra",
    accent: "from-primary/20",
  },
  {
    slug: "midnight-spectrum",
    tag: "Club Night",
    emoji: "🎧",
    title: "Midnight Spectrum",
    desc: "Immersive 360-degree audio experience at the newly launched Zenith Lounge.",
    date: "JAN 15, 2025",
    place: "Skybar, Accra",
    accent: "from-secondary/20",
  },
];

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All" ? EVENTS : EVENTS.filter((e) => e.tag === activeFilter);

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-10">
      {/* Header */}
      <AnimateIn from={20} className="mb-10">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Events &amp; Shows</h1>
        <p className="text-on-surface-variant text-sm mt-1">Performances, festivals, and headline shows.</p>
      </AnimateIn>

      {/* Filters */}
      <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={[
              "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
              activeFilter === f
                ? "bg-on-surface text-surface font-bold"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-white/5",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Event grid */}
      <AnimateIn stagger={0.08} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
        {filtered.map((ev) => (
          <Link
            key={ev.slug}
            href={`/events/${ev.slug}`}
            className="group relative block overflow-hidden rounded-2xl glass transition-all duration-300 hover:-translate-y-1"
          >
            <BorderDrawEdges />
            <div className="relative z-10">
              <div
                className={`relative flex h-[160px] items-center justify-center bg-gradient-to-br ${ev.accent} to-surface-container-high`}
              >
                <span className="text-6xl transition-transform duration-500 group-hover:scale-110">{ev.emoji}</span>
                <div className="absolute right-3 top-3 rounded-full border border-primary/20 bg-black/50 px-3 py-1 font-label text-[10px] uppercase tracking-wider text-primary backdrop-blur-md">
                  {ev.tag}
                </div>
              </div>

              <div className="space-y-3 p-5">
                <h3 className="font-headline text-base font-semibold">{ev.title}</h3>
                <p className="line-clamp-2 text-sm leading-relaxed text-on-surface-variant">{ev.desc}</p>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 font-label text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    {ev.date}
                  </div>
                  <div className="flex items-center gap-2 font-label text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {ev.place}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </AnimateIn>

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
            href="/contact"
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
