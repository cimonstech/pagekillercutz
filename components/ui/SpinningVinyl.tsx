import Image from "next/image";

export type SpinningVinylProps = {
  /** Full rotation duration in seconds (e.g. 4 idle, 8 typing, 1.5 submit hover). */
  spinDurationSec: number;
};

export function SpinningVinyl({ spinDurationSec }: SpinningVinylProps) {
  return (
    <div className="playlist-vinyl-root flex min-h-0 w-full max-w-[360px] flex-col items-center">
      {/* 320×320 stage (260×260 when max-height: 700px) — halos + disc + label + tonearm */}
      <div className="playlist-vinyl-stage relative flex h-[320px] w-[320px] shrink-0 items-center justify-center">
        {/* Static halo rings */}
        <div
          className="playlist-vinyl-halo-3 pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,191,255,0.03)]"
          aria-hidden
        />
        <div
          className="playlist-vinyl-halo-2 pointer-events-none absolute left-1/2 top-1/2 h-[296px] w-[296px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,191,255,0.06)]"
          aria-hidden
        />
        <div
          className="playlist-vinyl-halo-1 pointer-events-none absolute left-1/2 top-1/2 h-[272px] w-[272px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,191,255,0.10)]"
          aria-hidden
        />

        {/* Outer: centering only. Inner: spin animation (keyframes replace transform — must not merge with translate). */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-hidden
        >
          <div
            className="playlist-vinyl-disc h-[264px] w-[264px] rounded-full border-2 border-[rgba(255,255,255,0.08)] shadow-[0_0_0_1px_rgba(0,191,255,0.15),0_0_32px_rgba(0,191,255,0.08),0_10px_32px_rgba(0,0,0,0.55)]"
            style={{
              background: `repeating-radial-gradient(
                circle,
                #0a0a0a 0px,
                #0a0a0a 2px,
                #111 2px,
                #111 4px
              )`,
              animation: `spin ${spinDurationSec}s linear infinite`,
            }}
          >
            <svg
              className="pointer-events-none absolute left-0 top-0 size-full overflow-visible"
              viewBox="0 0 320 320"
              preserveAspectRatio="xMidYMid meet"
              fill="none"
              aria-hidden
            >
              <path
                d="M 52 228 A 118 118 0 0 1 44 92"
                stroke="rgba(0,191,255,0.20)"
                strokeWidth={1}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Centre label — static, does not spin */}
        <div className="playlist-vinyl-label pointer-events-none absolute left-1/2 top-1/2 z-[3] flex h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full border border-[rgba(255,255,255,0.10)] bg-[#161616]">
          <Image src="/pageicon.png" alt="" width={28} height={28} className="size-[28px] object-contain" />
          <span className="font-label text-[8px] font-normal leading-tight text-white">PAGE</span>
          <span className="font-label text-[8px] font-normal leading-tight text-[#00BFFF]">KILLERCUTZ</span>
        </div>

        {/* Tonearm */}
        <svg
          className="pointer-events-none absolute -right-[50px] -top-[30px] z-[5] h-[180px] w-[140px] overflow-visible"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden
        >
          <circle cx={168} cy={24} r={4} fill="rgba(255,255,255,0.20)" />
          <line
            x1={168}
            y1={24}
            x2={38}
            y2={148}
            stroke="rgba(255,255,255,0.30)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle cx={38} cy={148} r={2} fill="#00BFFF" />
        </svg>
      </div>

      {/* 20px below stage, 6px between lines, 16px before pills */}
      <div className="relative z-10 mt-5 flex w-full min-h-0 flex-col items-center text-center">
        <p className="font-headline text-[18px] font-semibold leading-snug text-white">Your event. Your music.</p>
        <p className="mt-[6px] max-w-[320px] font-body text-[13px] leading-snug text-[#A0A8C0]">
          Curate the perfect playlist for your night.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {["100+ Events", "12+ Years", `Ghana \u{1F1EC}\u{1F1ED}`].map((label) => (
            <span
              key={label}
              className="rounded-[999px] border border-white/[0.10] bg-white/[0.06] px-3 py-1.5 font-label text-[11px] text-white/55 backdrop-blur-md"
              style={{
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
