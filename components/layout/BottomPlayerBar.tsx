"use client";

import Image from "next/image";
import { useCallback, useMemo } from "react";
import { setPlayerAudioTime } from "@/lib/player-audio-bridge";
import { formatTime } from "@/lib/player-utils";
import { usePlayerStore } from "@/lib/store/playerStore";

const ACCENT = "#EEFF00";
const BAR_COUNT = 52;

function WaveformBar({
  progress,
  onSeek,
}: {
  progress: number;
  onSeek: (ratio: number) => void;
}) {
  const heights = useMemo(
    () => Array.from({ length: BAR_COUNT }, (_, i) => 22 + ((i * 13) % 7) * 8),
    [],
  );

  return (
    <button
      type="button"
      className="flex h-9 w-full max-w-xl cursor-pointer items-end justify-center gap-px rounded-md px-1"
      aria-label="Seek"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
      }}
    >
      {heights.map((h, i) => {
        const t = (i + 0.5) / BAR_COUNT;
        const active = t <= progress;
        return (
          <span
            key={i}
            className="w-[3px] min-w-[2px] max-w-[4px] shrink-0 rounded-[1px] transition-[background-color] duration-150"
            style={{
              height: `${h}%`,
              backgroundColor: active ? ACCENT : "rgba(255,255,255,0.12)",
            }}
          />
        );
      })}
    </button>
  );
}

export default function BottomPlayerBar() {
  const current = usePlayerStore((s) => s.current)!;
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const volume = usePlayerStore((s) => s.volume);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const isSimulated = usePlayerStore((s) => s.isSimulated);
  const toggle = usePlayerStore((s) => s.toggle);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const skipPrev = usePlayerStore((s) => s.skipPrev);
  const skipNext = usePlayerStore((s) => s.skipNext);

  const progressRatio =
    current.durationSec > 0 ? Math.min(1, currentTime / current.durationSec) : 0;

  const onSeek = useCallback(
    (ratio: number) => {
      const t = ratio * current.durationSec;
      seek(t);
      if (current.audioUrl && !isSimulated) {
        setPlayerAudioTime(t);
      }
    },
    [current.audioUrl, current.durationSec, isSimulated, seek],
  );

  if (!isPlaying) return null;

  return (
    <footer
      className="fixed bottom-4 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-[#141418]/90 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl md:gap-6 md:px-6 md:py-3"
      style={{ WebkitBackdropFilter: "blur(16px)" }}
    >
      <div className="flex min-w-0 flex-[0_1_200px] items-center gap-3 md:flex-[0_1_240px]">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 md:h-12 md:w-12">
          <Image src={current.coverUrl} alt="" fill className="object-cover" unoptimized />
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate font-label text-[11px] text-white/70 md:text-xs">{current.artist}</p>
          <p className="truncate font-headline text-sm font-bold text-white md:text-[15px]">{current.title}</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
        <div className="flex items-center justify-center gap-5 md:gap-7">
          <button
            type="button"
            className="text-white/80 transition-transform hover:scale-110 active:scale-95"
            aria-label="Previous"
            onClick={() => skipPrev()}
          >
            <span className="material-symbols-outlined text-[26px] md:text-[28px]">skip_previous</span>
          </button>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full shadow-[0_4px_20px_rgba(238,255,0,0.35)] transition-transform hover:scale-105 active:scale-95 md:h-12 md:w-12"
            style={{ backgroundColor: ACCENT, color: "#0a0a0c" }}
            aria-label="Pause"
            onClick={() => toggle()}
          >
            <span
              className="material-symbols-outlined text-[30px] md:text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              pause
            </span>
          </button>
          <button
            type="button"
            className="text-white/80 transition-transform hover:scale-110 active:scale-95"
            aria-label="Next"
            onClick={() => skipNext()}
          >
            <span className="material-symbols-outlined text-[26px] md:text-[28px]">skip_next</span>
          </button>
        </div>

        <div className="flex w-full max-w-xl items-center gap-2 md:gap-3">
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/70 md:text-[11px]">
            {formatTime(currentTime)}
          </span>
          <WaveformBar progress={progressRatio} onSeek={onSeek} />
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/70 md:text-[11px]">
            {formatTime(current.durationSec)}
          </span>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-1 sm:flex md:gap-2">
        <button
          type="button"
          className={`rounded-full p-1.5 transition-colors ${shuffle ? "text-[#EEFF00]" : "text-white/70 hover:text-white"}`}
          aria-label="Shuffle"
          onClick={() => toggleShuffle()}
        >
          <span className="material-symbols-outlined text-[22px]">shuffle</span>
        </button>
        <button type="button" className="rounded-full p-1.5 text-white/70 hover:text-white" aria-label="Queue">
          <span className="material-symbols-outlined text-[22px]">playlist_play</span>
        </button>
        <div className="ml-1 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[20px] text-white/70">volume_up</span>
          <button
            type="button"
            className="relative h-1.5 w-14 overflow-hidden rounded-full bg-white/15 md:w-20"
            aria-label="Volume"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setVolume(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
            }}
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-white/80"
              style={{ width: `${volume * 100}%` }}
            />
          </button>
        </div>
      </div>
    </footer>
  );
}
