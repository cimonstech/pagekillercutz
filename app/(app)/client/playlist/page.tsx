"use client";

import Link from "next/link";
import { mockClientDashboard, mockPlaylists } from "@/lib/mockData";

const glass = "rounded-[20px] border border-white/[0.08] bg-white/[0.05] p-6 backdrop-blur-[20px]";

const playlist = mockPlaylists[0]!;
const ev = mockClientDashboard;

export default function ClientPlaylistPage() {
  const locked = playlist.status === "locked";

  return (
    <main className="relative z-[1] w-full min-w-0 pb-8 text-on-surface">
      <header className="sticky top-0 z-20 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-[#00BFFF]">Playlist Portal</h1>
          <p className="mt-1 font-body text-sm text-on-surface-variant">Curate your event playlist — changes sync to Page KillerCutz.</p>
        </div>
        <Link
          href="/client/dashboard"
          className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.05] px-4 py-2 font-headline text-xs font-semibold text-primary transition-colors hover:border-primary/30 hover:bg-primary/10"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to dashboard
        </Link>
      </header>

      <div>
        {locked ? (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-primary-container/30 bg-primary/5 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
              <span className="font-headline font-semibold tracking-wide text-primary-container">Your playlist has been locked.</span>
            </div>
            <span className="font-mono text-xs text-primary/60">SUBMITTED 12:45 UTC</span>
          </div>
        ) : (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-white/10 bg-white/[0.03] px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">edit_note</span>
              <span className="font-body text-sm text-on-surface">You can edit your playlist until the DJ locks it before the event.</span>
            </div>
          </div>
        )}

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 lg:grid-cols-[62%_38%]">
          <div className="flex flex-col gap-6">
            {/* Genres */}
            <section className={`${glass} relative`}>
              <span className="material-symbols-outlined absolute right-6 top-6 text-on-surface-variant/40">lock</span>
              <label className="mb-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">Genres</label>
              <div className="flex flex-wrap gap-2">
                {playlist.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-sm bg-primary-container px-4 py-1.5 text-sm font-medium text-on-primary-container"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </section>

            {/* Vibe */}
            <section className={`${glass} relative`}>
              <span className="material-symbols-outlined absolute right-6 top-6 text-on-surface-variant/40">lock</span>
              <label className="mb-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">Pulse Vibe</label>
              <div className="flex flex-wrap gap-3">
                {["Chill", "High Energy", "Old School", "Late Night", "Soulful"].map((v) => {
                  const selected = playlist.vibe.toLowerCase().includes(v.toLowerCase());
                  return (
                    <button
                      key={v}
                      type="button"
                      disabled={locked}
                      className={[
                        "rounded-full border px-6 py-2 text-xs font-semibold transition-colors",
                        selected
                          ? "border-primary-container text-primary-container"
                          : "border-outline-variant/30 text-on-surface-variant/50",
                      ].join(" ")}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Must-play */}
            <section className={`${glass} relative`}>
              <span className="material-symbols-outlined absolute right-6 top-6 text-on-surface-variant/40">lock</span>
              <label className="mb-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">Must-Play Songs</label>
              <div className="relative mb-6">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30">
                  search
                </span>
                <input
                  className="w-full rounded-sm border-none bg-surface-container-lowest py-3 pl-12 text-sm text-on-surface opacity-60 outline-none ring-0 focus:ring-1 focus:ring-primary-container"
                  disabled
                  placeholder="Search track or artist..."
                  readOnly
                />
              </div>
              <div className="space-y-3">
                {playlist.mustPlay.map((title, i) => (
                  <div key={title} className="group flex items-center justify-between rounded-sm bg-white/5 p-3">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[10px] text-primary-container">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <p className="font-headline font-medium text-on-surface">{title}</p>
                        <p className="text-xs text-on-surface-variant">Client request</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant/30">close</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Do-not-play */}
            <section className={`${glass} relative`}>
              <span className="material-symbols-outlined absolute right-6 top-6 text-on-surface-variant/40">lock</span>
              <label className="mb-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-error">Do-Not-Play (Blacklist)</label>
              <div className="relative mb-6">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-error/30">search</span>
                <input
                  className="w-full rounded-sm border-none bg-surface-container-lowest py-3 pl-12 text-sm opacity-60 outline-none ring-0 focus:ring-1 focus:ring-error"
                  disabled
                  placeholder="Search tracks to avoid..."
                  readOnly
                />
              </div>
              <div className="space-y-3">
                {playlist.dontPlay.map((title, i) => (
                  <div
                    key={title}
                    className="flex items-center justify-between rounded-sm border border-error/10 bg-error/5 p-3"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[10px] text-error/60">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <p className="font-headline font-medium text-on-surface/50 line-through">{title}</p>
                        <p className="text-xs text-on-surface-variant/50">Blocked</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-error">close</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Timeline placeholder */}
            <section className={`${glass} relative`}>
              <span className="material-symbols-outlined absolute right-6 top-6 text-on-surface-variant/40">lock</span>
              <label className="mb-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">Event Timeline</label>
              <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">
                <input className="rounded-sm border-none bg-surface-container-lowest py-2 text-sm opacity-50" disabled placeholder="Time" />
                <input className="rounded-sm border-none bg-surface-container-lowest py-2 text-sm opacity-50" disabled placeholder="Moment" />
                <input className="rounded-sm border-none bg-surface-container-lowest py-2 text-sm opacity-50" disabled placeholder="Notes" />
                <button type="button" className="rounded-sm bg-primary-container/20 p-2 text-primary-container" disabled>
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 border-l-2 border-primary-container bg-white/5 p-4">
                  <span className="rounded-sm bg-primary-container/10 px-2 py-1 font-mono text-xs text-primary-container">21:00</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">Grand Entrance</p>
                    <p className="font-mono text-[10px] uppercase text-on-surface-variant">Switch to Up-Tempo Afrobeat</p>
                  </div>
                  <span className="material-symbols-outlined text-sm text-on-surface-variant/30">edit</span>
                </div>
                <div className="flex items-center gap-4 border-l-2 border-primary-container bg-white/5 p-4">
                  <span className="rounded-sm bg-primary-container/10 px-2 py-1 font-mono text-xs text-primary-container">22:30</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">Cake Cutting</p>
                    <p className="font-mono text-[10px] uppercase text-on-surface-variant">Instrumental Jazz only</p>
                  </div>
                  <span className="material-symbols-outlined text-sm text-on-surface-variant/30">edit</span>
                </div>
              </div>
            </section>

            {/* Notes */}
            <section className={`${glass} relative`}>
              <span className="material-symbols-outlined absolute right-6 top-6 text-on-surface-variant/40">lock</span>
              <label className="mb-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">Additional Instructions</label>
              <textarea
                className="custom-scrollbar w-full rounded-sm border-none bg-surface-container-lowest p-4 text-sm opacity-70 outline-none ring-0 focus:ring-1 focus:ring-primary-container"
                disabled
                rows={4}
                readOnly
                defaultValue="Please ensure the transition between the Father-Daughter dance and the main set is seamless. No explicit lyrics before midnight."
              />
            </section>
          </div>

          {/* Sticky summary */}
          <aside className="lg:sticky lg:top-6">
            <div className={`${glass} relative overflow-hidden border-white/10 p-8 shadow-2xl`}>
              <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 bg-primary/10 blur-[100px]" />
              <div className="relative z-10">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="mb-1 font-headline text-3xl font-semibold tracking-tight text-on-surface">{ev.eventName}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-sm border border-secondary/20 bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                        {ev.eventType}
                      </span>
                      <span className="text-xs text-on-surface-variant">{ev.eventDate}</span>
                    </div>
                  </div>
                  <span className="rounded-sm bg-primary-container/10 px-2 py-1 font-mono text-[10px] text-primary-container">
                    #{ev.eventId}
                  </span>
                </div>
                <div className="mb-8 flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span className="text-sm">{ev.venue}</span>
                </div>
                <div className="mb-8 grid grid-cols-3 gap-2">
                  <div className="rounded-sm border border-white/5 bg-surface-container-low p-3 text-center">
                    <p className="font-mono text-xl font-bold text-primary-container">{ev.mustPlayCount}</p>
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-widest text-on-surface-variant">Must-Play</p>
                  </div>
                  <div className="rounded-sm border border-white/5 bg-surface-container-low p-3 text-center">
                    <p className="font-mono text-xl font-bold text-error">{ev.doNotPlayCount}</p>
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-widest text-on-surface-variant">Skip</p>
                  </div>
                  <div className="rounded-sm border border-white/5 bg-surface-container-low p-3 text-center">
                    <p className="font-mono text-xl font-bold text-secondary">{ev.timelineMoments}</p>
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-widest text-on-surface-variant">Moments</p>
                  </div>
                </div>
                <div className="mb-8 flex flex-wrap items-center justify-between gap-2 border-y border-white/5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-green-500">
                      {ev.paymentStatus === "pending" ? "Payment pending" : "Payment verified"}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-on-surface-variant">
                    {ev.paymentStatus === "pending" ? "BALANCE DUE" : "FULL ACCESS"}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={locked}
                  className={[
                    "w-full rounded-sm py-4 font-headline text-lg font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(0,191,255,0.3)] transition-transform active:scale-[0.98]",
                    locked
                      ? "cursor-not-allowed bg-primary-container/40 text-on-primary-container opacity-50"
                      : "bg-primary-container text-on-primary-container",
                  ].join(" ")}
                >
                  Save Playlist
                </button>
                <p className="mt-4 text-center text-[10px] italic text-on-surface-variant/50">
                  {locked ? "Playlist portal locked. Contact admin for changes." : "Preview — connect to API to save changes."}
                </p>
              </div>
            </div>
            <div className="mt-8 border-l-2 border-primary-container/20 px-8 py-12">
              <h3 className="font-display text-7xl leading-none opacity-5 select-none">KILLERCUTZ</h3>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
