"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { formatDuration } from "@/lib/player-utils";
import { usePlayerStore } from "@/lib/store/playerStore";

const ACCENT = "#00BFFF";
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const isPlayingRef = useRef(false);
  const currentTrackIdRef = useRef<string | null>(null);
  const current = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const isVisible = usePlayerStore((s) => s.isVisible);
  const playerBarMinimized = usePlayerStore((s) => s.playerBarMinimized);
  const setPlayerBarMinimized = usePlayerStore((s) => s.setPlayerBarMinimized);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const nextTrack = usePlayerStore((s) => s.nextTrack);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__audioRef = audioRef;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;

    isPlayingRef.current = isPlaying;
    const trackChanged = currentTrackIdRef.current !== current.id;

    if (trackChanged) {
      currentTrackIdRef.current = current.id;
      if (current.audioUrl) {
        audio.src = current.audioUrl;
        const playWhenReady = () => {
          if (isPlayingRef.current) {
            audio.play().catch((err: unknown) => {
              if (err instanceof Error && err.name !== "AbortError") {
                console.error("[player] Play failed:", err.message);
              }
            });
          }
          audio.removeEventListener("canplay", playWhenReady);
        };
        audio.addEventListener("canplay", playWhenReady);
        audio.load();
      } else {
        setIsPlaying(false);
      }
      return;
    }

    if (isPlaying && current.audioUrl) {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((err: unknown) => {
          if (err instanceof Error && err.name !== "AbortError") {
            console.error("[player] Play failed:", err.message);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [current, isPlaying, setIsPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  if (!isVisible || !current) return null;
  const noAudio = !current.audioUrl;
  const isPreview = Boolean(current.audioUrl?.includes("deezer") || current.audioUrl?.includes("dzcdn"));
  const durationValue = duration || current.durationSec || current.duration || 0;
  const progressRatio = durationValue > 0 ? Math.min(1, progress / durationValue) : 0;

  const onSeek = (ratio: number) => {
    if (!audioRef.current) return;
    const t = ratio * (durationValue || 1);
    audioRef.current.currentTime = t;
    setProgress(t);
  };

  const currentCover = current.coverUrl && current.coverUrl.startsWith("http") ? current.coverUrl : null;

  /** Clears the sidebar pill (~56px) + gap; on small screens the pill is hidden. */
  const miniLeftClass = "left-4 sm:left-[80px]";

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (!audioRef.current) return;
          setProgress(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (!audioRef.current) return;
          setDuration(audioRef.current.duration);
        }}
        onEnded={() => {
          nextTrack();
        }}
        onError={(e) => {
          console.error("[player] Audio error:", e);
          setIsPlaying(false);
        }}
      />
      {playerBarMinimized ? (
        <div
          className={`fixed bottom-4 z-[100] flex flex-col items-center gap-2 ${miniLeftClass}`}
          role="region"
          aria-label="Now playing (minimized)"
        >
          <div className="relative">
            <button
              type="button"
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#141418]/95 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl ring-2 ring-[#00BFFF]/25 transition-transform hover:scale-[1.04] active:scale-[0.98] sm:h-[52px] sm:w-[52px]"
              style={{ WebkitBackdropFilter: "blur(16px)" }}
              aria-label="Expand player"
              onClick={() => setPlayerBarMinimized(false)}
            >
              {currentCover ? (
                <Image
                  src={currentCover}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-white/50">music_note</span>
              )}
            </button>
            {isPlaying ? (
              <span
                className="pointer-events-none absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#00BFFF] shadow-[0_0_8px_rgba(0,191,255,0.9)]"
                aria-hidden
              />
            ) : null}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-0.5 backdrop-blur-md">
            <button
              type="button"
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10"
              aria-label="Previous track"
              onClick={() => prevTrack()}
            >
              <span className="material-symbols-outlined text-[20px]">skip_previous</span>
            </button>
            <button
              type="button"
              disabled={noAudio}
              className={`flex h-9 w-9 items-center justify-center rounded-full ${noAudio ? "cursor-not-allowed opacity-40" : ""}`}
              style={{ backgroundColor: ACCENT, color: "#000000" }}
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={() => togglePlay()}
            >
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>
            <button
              type="button"
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10"
              aria-label="Next track"
              onClick={() => nextTrack()}
            >
              <span className="material-symbols-outlined text-[20px]">skip_next</span>
            </button>
          </div>
        </div>
      ) : (
      <footer
        className="fixed bottom-4 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-[#141418]/90 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl md:gap-6 md:px-6 md:py-3"
        style={{ WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="flex min-w-0 flex-[0_1_200px] items-center gap-2 md:flex-[0_1_240px] md:gap-3">
          <button
            type="button"
            className="shrink-0 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
            aria-label="Minimize player"
            onClick={() => setPlayerBarMinimized(true)}
          >
            <span className="material-symbols-outlined text-[22px]">expand_more</span>
          </button>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#11131a] ring-1 ring-white/10">
            {currentCover ? (
              <Image
                src={currentCover}
                alt={current.title}
                width={48}
                height={48}
                unoptimized
                style={{ borderRadius: "8px", objectFit: "cover" }}
              />
            ) : (
              <span className="material-symbols-outlined text-white/35">music_note</span>
            )}
          </div>
          <div className="min-w-0 text-left">
            <p className="truncate font-label text-[11px] text-white/70 md:text-xs">{current.artist}</p>
            <p className="truncate font-headline text-sm font-bold text-white md:text-[15px]">{current.title}</p>
            {isPreview ? (
              <p className="font-mono text-[10px] text-[#5A6080]">30s preview · Deezer</p>
            ) : noAudio ? (
              <p className="font-mono text-[10px] text-[#5A6080]">No audio · Preview unavailable</p>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex items-center justify-center gap-5 md:gap-7">
            <button
              type="button"
              className="text-white/80 transition-transform hover:scale-110 active:scale-95"
              aria-label="Previous"
              onClick={() => prevTrack()}
            >
              <span className="material-symbols-outlined text-[26px] md:text-[28px]">skip_previous</span>
            </button>
            <button
              type="button"
              disabled={noAudio}
              title={noAudio ? "No audio available" : undefined}
              className={`flex h-11 w-11 items-center justify-center rounded-full shadow-[0_0_20px_rgba(0,191,255,0.40)] transition-[transform,box-shadow] md:h-12 md:w-12 ${
                noAudio ? "cursor-not-allowed opacity-50" : "hover:scale-105 active:scale-95"
              }`}
              style={{ backgroundColor: ACCENT, color: "#000000" }}
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={() => togglePlay()}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 28px rgba(0,191,255,0.60)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 0 20px rgba(0,191,255,0.40)";
              }}
            >
              <span
                className="material-symbols-outlined text-[30px] md:text-[32px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isPlaying ? "pause" : noAudio ? "music_note" : "play_arrow"}
              </span>
            </button>
            <button
              type="button"
              className="text-white/80 transition-transform hover:scale-110 active:scale-95"
              aria-label="Next"
              onClick={() => nextTrack()}
            >
              <span className="material-symbols-outlined text-[26px] md:text-[28px]">skip_next</span>
            </button>
          </div>

          <div className="flex w-full max-w-xl items-center gap-2 md:gap-3">
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/70 md:text-[11px]">
              {formatDuration(progress)}
            </span>
            {noAudio ? <div className="h-9 w-full max-w-xl rounded-md bg-white/[0.03]" /> : (
              <WaveformBar progress={progressRatio} onSeek={onSeek} />
            )}
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/70 md:text-[11px]">
              {formatDuration(durationValue)}
            </span>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-1 sm:flex md:gap-2">
          <button
            type="button"
            className="rounded-full p-1.5 text-white/70 transition-colors hover:text-white"
            aria-label="Minimize player"
            title="Minimize player"
            onClick={() => setPlayerBarMinimized(true)}
          >
            <span className="material-symbols-outlined text-[22px]">expand_more</span>
          </button>
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
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="h-1.5 w-20 cursor-pointer accent-white"
              aria-label="Volume"
            />
          </div>
        </div>
      </footer>
      )}
    </>
  );
}
