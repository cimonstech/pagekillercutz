"use client";

/**
 * Floating featured mix player — overlays hero photo (no extra wrapper).
 */
export default function HomeFeaturedMixCard() {
  return (
    <div
      className="pointer-events-auto absolute left-[60%] top-[44%] z-30 hidden w-[320px] -translate-y-1/2 xl:block"
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "20px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.50)",
        padding: "22px",
      }}
    >
      {/* Row 1 */}
      <div className="flex items-center justify-between">
        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-[#00BFFF]">
          Featured mix
        </span>
        <span className="material-symbols-outlined text-lg text-white/45">more_horiz</span>
      </div>

      {/* Row 2 */}
      <div className="mt-4 flex gap-3">
        <div
          className="size-[68px] shrink-0 rounded-xl bg-gradient-to-br from-white/18 to-white/5 ring-1 ring-white/10"
          aria-hidden
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-headline text-[15px] font-semibold leading-snug text-white">
            Accra Night Pulse Vol. 4
          </p>
          <p className="mt-0.5 font-body text-xs text-[#A0A8C0]">By Page KillerCutz</p>
          <p className="mt-1 font-label text-[11px] text-white/45">1:24 / 58:32</p>
        </div>
      </div>

      {/* Row 3 — progress */}
      <div className="relative mt-3 h-[3px] w-full rounded-full bg-white/10">
        <div
          className="absolute left-0 top-0 h-full w-[40%] rounded-full bg-[#00BFFF]"
          style={{ boxShadow: "0 0 8px rgba(0,191,255,0.4)" }}
        />
        <div
          className="absolute left-[40%] top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00BFFF] ring-2 ring-black/20"
          aria-hidden
        />
      </div>

      {/* Row 4 — controls (16px gap) */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button type="button" className="text-white/55 transition-colors hover:text-white" aria-label="Skip to start">
          <span className="material-symbols-outlined text-[18px]">skip_previous</span>
        </button>
        <button type="button" className="text-white/55 transition-colors hover:text-white" aria-label="Previous">
          <span className="material-symbols-outlined text-[18px]">fast_rewind</span>
        </button>
        <button
          type="button"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#00BFFF] text-black shadow-[0_4px_20px_rgba(0,191,255,0.45)] transition-transform hover:scale-105"
          aria-label="Play"
        >
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            play_arrow
          </span>
        </button>
        <button type="button" className="text-white/55 transition-colors hover:text-white" aria-label="Next">
          <span className="material-symbols-outlined text-[18px]">fast_forward</span>
        </button>
        <button type="button" className="text-white/55 transition-colors hover:text-white" aria-label="Skip forward">
          <span className="material-symbols-outlined text-[18px]">skip_next</span>
        </button>
      </div>

      {/* Row 5 */}
      <div className="mt-4 h-px w-full bg-white/[0.08]" />

      {/* Row 6 */}
      <p className="mt-3 font-label text-[9px] font-medium uppercase tracking-widest text-white/45">Tracklist</p>

      {/* Row 7 */}
      <div className="mt-2 space-y-0">
        <div className="flex h-7 items-center border-b border-white/[0.05]">
          <span className="w-5 shrink-0 font-label text-[10px] text-white/45">01</span>
          <span className="min-w-0 flex-1 truncate font-body text-xs text-white">Accra Night Pulse (Intro)</span>
          <span className="shrink-0 font-label text-[10px] text-white/45">4:22</span>
        </div>
        <div className="flex h-7 items-center gap-1 rounded-md bg-[rgba(0,191,255,0.06)] px-1 border-b border-white/[0.05]">
          <span className="flex h-7 w-5 shrink-0 items-center justify-start" aria-hidden>
            <span className="flex h-3.5 items-end gap-0.5">
              <span className="featured-mix-eq-bar" />
              <span className="featured-mix-eq-bar" />
              <span className="featured-mix-eq-bar" />
            </span>
          </span>
          <span className="min-w-0 flex-1 truncate font-body text-xs font-medium text-[#00BFFF]">
            Gold Coast Frequency
          </span>
          <span className="shrink-0 font-label text-[10px] text-[#00BFFF]">6:18</span>
        </div>
        <div className="flex h-7 items-center">
          <span className="w-5 shrink-0 font-label text-[10px] text-white/45">03</span>
          <span className="min-w-0 flex-1 truncate font-body text-xs text-white">Kpanlogo Rave (Extended)</span>
          <span className="shrink-0 font-label text-[10px] text-white/45">8:44</span>
        </div>
      </div>
    </div>
  );
}
