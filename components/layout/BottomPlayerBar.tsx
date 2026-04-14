"use client";

import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeCoverUrl } from "@/lib/coverUrl";
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
  const isMinimized = usePlayerStore((s) => s.isMinimized);
  const setMinimized = usePlayerStore((s) => s.setMinimized);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const stop = usePlayerStore((s) => s.stop);

  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [sheetEntered, setSheetEntered] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__audioRef = audioRef;
    }
  }, []);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (window.innerWidth >= 768) {
        setMinimized(false);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [setMinimized]);

  useEffect(() => {
    if (isMobile && !isMinimized) {
      const id = requestAnimationFrame(() => setSheetEntered(true));
      return () => cancelAnimationFrame(id);
    }
    setSheetEntered(false);
  }, [isMobile, isMinimized]);

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

  const currentCover =
    current.coverUrl && current.coverUrl.startsWith("http")
      ? normalizeCoverUrl(current.coverUrl) ?? current.coverUrl
      : null;

  /** Clears the sidebar pill (~56px) + gap; on small screens the pill is hidden. */
  const miniLeftClass = "left-4 sm:left-[80px]";

  const mobileMinimizedStrip = (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setMinimized(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setMinimized(false);
        }
      }}
      style={{
        position: "fixed",
        bottom: isMobile ? "88px" : "0px",
        left: 0,
        right: 0,
        height: "64px",
        background: "rgba(10,10,20,0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "12px",
        zIndex: 100,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "2px",
          width: `${durationValue > 0 ? (progress / durationValue) * 100 : 0}%`,
          background: "#00BFFF",
          transition: "width 500ms linear",
        }}
      />

      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          overflow: "hidden",
          flexShrink: 0,
          background: "rgba(0,191,255,0.10)",
          position: "relative",
        }}
      >
        {currentCover ? (
          <Image
            src={currentCover}
            alt={current.title}
            fill
            style={{ objectFit: "cover" }}
            unoptimized
            referrerPolicy="no-referrer"
            sizes="40px"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Music size={18} color="#00BFFF" />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            color: "white",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {current.title}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body), system-ui, sans-serif",
            fontSize: "11px",
            color: "#5A6080",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {current.artist}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "#00BFFF",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 0 16px rgba(0,191,255,0.30)",
        }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause size={18} color="#000" fill="#000" />
        ) : (
          <Play size={18} color="#000" fill="#000" style={{ marginLeft: "2px" }} />
        )}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          nextTrack();
        }}
        style={{
          width: "36px",
          height: "36px",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.50)",
          flexShrink: 0,
        }}
        aria-label="Next track"
      >
        <SkipForward size={18} />
      </button>

      <ChevronUp size={16} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} aria-hidden />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          stop();
        }}
        style={{
          width: "24px",
          height: "24px",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FF4560",
          flexShrink: 0,
        }}
        aria-label="Close player"
      >
        <X size={14} color="#FF4560" />
      </button>
    </div>
  );

  const mobileExpandedSheet = (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        transform: sheetEntered ? "translateY(0)" : "translateY(100%)",
        transition: "transform 350ms cubic-bezier(0.4,0,0.2,1)",
        background: "rgba(8,8,16,0.98)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderTop: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "20px 20px 0 0",
        padding: "0 0 40px",
        zIndex: 100,
        maxHeight: "90vh",
        overflowY: "auto",
      }}
      className="relative"
      onTouchStart={(e) => {
        setTouchStart(e.touches[0].clientY);
      }}
      onTouchMove={(e) => {
        if (touchStart == null) return;
        const diff = e.touches[0].clientY - touchStart;
        if (diff > 80) {
          setMinimized(true);
          setTouchStart(null);
        }
      }}
      onTouchEnd={() => {
        setTouchStart(null);
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "12px 0 8px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "4px",
            background: "rgba(255,255,255,0.20)",
            borderRadius: "999px",
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => setMinimized(true)}
        style={{
          position: "absolute",
          top: "16px",
          right: "20px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "rgba(255,255,255,0.60)",
        }}
        aria-label="Minimize player"
      >
        <ChevronDown size={16} />
      </button>
      <button
        type="button"
        onClick={() => stop()}
        style={{
          position: "absolute",
          top: "16px",
          right: "60px",
          background: "rgba(255, 69, 96, 0.12)",
          border: "1px solid rgba(255, 69, 96, 0.35)",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#FF4560",
        }}
        aria-label="Close player"
      >
        <X size={16} color="#FF4560" />
      </button>

      <div
        style={{
          width: "220px",
          height: "220px",
          borderRadius: "16px",
          overflow: "hidden",
          margin: "20px auto 24px",
          background: "rgba(0,191,255,0.08)",
          border: "1px solid rgba(0,191,255,0.15)",
          position: "relative",
          boxShadow: "0 24px 60px rgba(0,0,0,0.60)",
        }}
      >
        {currentCover ? (
          <Image
            src={currentCover}
            alt={current.title}
            fill
            style={{ objectFit: "cover" }}
            unoptimized
            referrerPolicy="no-referrer"
            sizes="220px"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Music size={48} color="#00BFFF" />
          </div>
        )}
      </div>

      <div
        style={{
          textAlign: "center",
          padding: "0 32px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "22px",
            color: "white",
            marginBottom: "6px",
            lineHeight: 1.2,
          }}
        >
          {current.title}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body), system-ui, sans-serif",
            fontSize: "14px",
            color: "#A0A8C0",
          }}
        >
          {current.artist}
        </div>
        {isPreview ? (
          <div
            style={{
              fontFamily: "var(--font-label), monospace",
              fontSize: "10px",
              color: "#5A6080",
              marginTop: "6px",
            }}
          >
            30s preview · Deezer
          </div>
        ) : null}
        {!current.audioUrl ? (
          <div
            style={{
              fontFamily: "var(--font-label), monospace",
              fontSize: "10px",
              color: "#5A6080",
              marginTop: "6px",
            }}
          >
            No audio · Preview unavailable
          </div>
        ) : null}
      </div>

      <div style={{ padding: "0 32px 16px" }}>
        <input
          type="range"
          min={0}
          max={durationValue || 1}
          step={0.1}
          value={Math.min(progress, durationValue || 1)}
          onChange={(e) => {
            const time = parseFloat(e.target.value);
            if (audioRef.current) {
              audioRef.current.currentTime = time;
            }
            setProgress(time);
          }}
          style={{
            width: "100%",
            accentColor: "#00BFFF",
            cursor: "pointer",
            height: "4px",
          }}
          aria-label="Seek"
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "6px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-label), monospace",
              fontSize: "11px",
              color: "#5A6080",
            }}
          >
            {formatDuration(progress)}
          </span>
          <span
            style={{
              fontFamily: "var(--font-label), monospace",
              fontSize: "11px",
              color: "#5A6080",
            }}
          >
            {formatDuration(durationValue)}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          padding: "0 32px 24px",
        }}
      >
        <button
          type="button"
          onClick={() => prevTrack()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.60)",
            padding: "8px",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Previous track"
        >
          <SkipBack size={28} />
        </button>

        <button
          type="button"
          onClick={() => togglePlay()}
          disabled={noAudio}
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            background: "#00BFFF",
            border: "none",
            cursor: noAudio ? "not-allowed" : "pointer",
            opacity: noAudio ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 32px rgba(0,191,255,0.50)",
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={28} color="#000" fill="#000" />
          ) : (
            <Play size={28} color="#000" fill="#000" style={{ marginLeft: "3px" }} />
          )}
        </button>

        <button
          type="button"
          onClick={() => nextTrack()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.60)",
            padding: "8px",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Next track"
        >
          <SkipForward size={28} />
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "0 40px",
        }}
      >
        <span className="material-symbols-outlined text-[16px] text-white/40" aria-hidden>
          volume_down
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{
            flex: 1,
            accentColor: "#00BFFF",
            cursor: "pointer",
          }}
          aria-label="Volume"
        />
        <span className="material-symbols-outlined text-[16px] text-white/40" aria-hidden>
          volume_up
        </span>
      </div>
    </div>
  );

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
      {isMobile ? (
        isMinimized ? (
          mobileMinimizedStrip
        ) : (
          mobileExpandedSheet
        )
      ) : isMinimized ? (
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
              onClick={() => setMinimized(false)}
            >
              {currentCover ? (
                <Image
                  src={currentCover}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized
                  referrerPolicy="no-referrer"
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
              onClick={() => setMinimized(true)}
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
                  referrerPolicy="no-referrer"
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
              className="rounded-full p-1.5 text-[#FF4560] transition-colors hover:text-[#ff6b82]"
              aria-label="Close player"
              title="Close player"
              onClick={() => stop()}
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
            <button
              type="button"
              className="rounded-full p-1.5 text-white/70 transition-colors hover:text-white"
              aria-label="Minimize player"
              title="Minimize player"
              onClick={() => setMinimized(true)}
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
