"use client";

import Image from "next/image";
import { FastForward, MoreHorizontal, Pause, Play, Rewind, SkipBack, SkipForward } from "lucide-react";
import { useState } from "react";
import { buildAlbumPlayerQueue } from "@/lib/album-playback";
import type { Database } from "@/lib/database.types";
import { formatDuration } from "@/lib/player-utils";
import { usePlayerStore } from "@/lib/store/playerStore";

type MusicRow = Database["public"]["Tables"]["music"]["Row"];

interface HeroMusicCardProps {
  tracks: MusicRow[];
}

const FALLBACK_COVER = "/killercutz-logo.webp";

export default function HeroMusicCard({ tracks }: HeroMusicCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);

  const safeTracks = tracks.slice(0, 3);
  const globalActiveIndex = currentTrack
    ? safeTracks.findIndex((t) => t.id === currentTrack.musicId)
    : -1;
  const resolvedActiveIndex = globalActiveIndex !== -1 ? globalActiveIndex : activeIndex;
  const activeTrack = safeTracks[resolvedActiveIndex];

  const isThisTrackActive = Boolean(activeTrack && currentTrack?.musicId === activeTrack.id);
  const isThisCardPlaying = Boolean(isThisTrackActive && isPlaying);

  const displayProgress = isThisTrackActive ? progress : 0;
  const displayDuration = isThisTrackActive ? duration : activeTrack?.duration ?? 0;
  const progressPct = displayDuration > 0 ? Math.min(100, (displayProgress / displayDuration) * 100) : 0;

  const playReleaseAtIndex = (index: number) => {
    const m = safeTracks[index];
    if (!m) return;
    setActiveIndex(index);
    const q = buildAlbumPlayerQueue(m);
    const start = q.find((t) => t.audioUrl) ?? q[0];
    if (!start) return;
    setQueue(q);
    void setTrack(start);
  };

  const handleTrackClick = (index: number) => {
    const m = safeTracks[index];
    if (!m) return;
    if (currentTrack?.musicId === m.id) {
      togglePlay();
      return;
    }
    playReleaseAtIndex(index);
  };

  const handlePlayPause = () => {
    if (!activeTrack) return;
    if (isThisTrackActive) {
      togglePlay();
      return;
    }
    playReleaseAtIndex(resolvedActiveIndex);
  };

  const handlePrev = () => {
    const from = resolvedActiveIndex;
    const nextIndex = from > 0 ? from - 1 : safeTracks.length - 1;
    handleTrackClick(nextIndex);
  };

  const handleNext = () => {
    const from = resolvedActiveIndex;
    const nextIndex = from < safeTracks.length - 1 ? from + 1 : 0;
    handleTrackClick(nextIndex);
  };

  const coverSrc =
    activeTrack.cover_url && activeTrack.cover_url.startsWith("http") ? activeTrack.cover_url : FALLBACK_COVER;

  if (!safeTracks.length || !activeTrack) return null;

  return (
    <div
      className="pointer-events-auto absolute left-[60%] top-[44%] z-30 hidden w-[320px] -translate-y-1/2 overflow-hidden rounded-[20px] xl:block"
      style={{
        background: "rgba(10,10,20,0.85)",
        backdropFilter: "blur(32px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.60)",
      }}
    >
      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <span className="font-label text-[10px] font-bold uppercase tracking-[0.15em] text-[#00BFFF]">
          {safeTracks[0]?.featured ? "Featured Mix" : "Latest Releases"}
        </span>
        <MoreHorizontal size={16} color="rgba(255,255,255,0.30)" />
      </div>

      <div className="flex items-center gap-3.5 px-5 pb-4">
        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-[rgba(0,191,255,0.2)] bg-[rgba(0,191,255,0.10)]">
          <Image src={coverSrc} alt={activeTrack.title} fill className="object-cover" unoptimized />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-headline text-base font-semibold text-white">{activeTrack.title}</div>
          <div className="mb-2 text-xs text-[#A0A8C0]">By Page KillerCutz</div>
          <div className="font-mono text-[11px] tabular-nums text-[#5A6080]">
            {formatDuration(displayProgress)} / {formatDuration(displayDuration)}
          </div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <div className="relative h-[3px] rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#00BFFF] transition-[width] duration-500" style={{ width: `${progressPct}%` }} />
          <div
            className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_6px_rgba(0,191,255,0.6)] transition-[left] duration-500"
            style={{ left: `${progressPct}%`, opacity: progressPct > 0 ? 1 : 0, transform: "translate(-50%, -50%)" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 px-5 pb-5">
        <button type="button" onClick={handlePrev} className="rounded-full p-2 text-white/50 transition-colors hover:text-white">
          <SkipBack size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (isThisTrackActive && window.__audioRef?.current) window.__audioRef.current.currentTime -= 10;
          }}
          className="rounded-full p-2 text-white/50 transition-colors hover:text-white"
        >
          <Rewind size={18} />
        </button>
        <button
          type="button"
          onClick={handlePlayPause}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#00BFFF] text-black shadow-[0_0_20px_rgba(0,191,255,0.40)] transition-[transform,box-shadow] hover:scale-105 hover:shadow-[0_0_28px_rgba(0,191,255,0.60)] active:scale-[0.96]"
        >
          {isThisCardPlaying ? <Pause size={22} fill="#000" /> : <Play size={22} fill="#000" className="ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={() => {
            if (isThisTrackActive && window.__audioRef?.current) window.__audioRef.current.currentTime += 10;
          }}
          className="rounded-full p-2 text-white/50 transition-colors hover:text-white"
        >
          <FastForward size={18} />
        </button>
        <button type="button" onClick={handleNext} className="rounded-full p-2 text-white/50 transition-colors hover:text-white">
          <SkipForward size={18} />
        </button>
      </div>

      {safeTracks.length > 1 ? (
        <div className="border-t border-white/10 pb-1 pt-3">
          <div className="px-5 pb-2 font-label text-[9px] font-bold uppercase tracking-[0.15em] text-[#5A6080]">Tracklist</div>
          {safeTracks.map((track, i) => {
            const isActive = i === resolvedActiveIndex;
            const isThisPlaying = currentTrack?.musicId === track.id && isPlaying;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => handleTrackClick(i)}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
                className="flex w-full items-center gap-3 border-l-2 px-5 py-2 text-left transition-colors"
                style={{
                  borderLeftColor: isActive ? "#00BFFF" : "transparent",
                  background: isActive ? "rgba(0,191,255,0.06)" : hoveredRow === i ? "rgba(255,255,255,0.03)" : "transparent",
                }}
              >
                <div className="w-5 shrink-0 text-center">
                  {isThisPlaying ? (
                    <div className="flex h-[14px] items-end justify-center gap-[2px]">
                      <div className="h-1 w-[3px] rounded-[1px] bg-[#00BFFF] animate-[eq-bar-1_0.8s_ease-in-out_infinite]" />
                      <div className="h-2 w-[3px] rounded-[1px] bg-[#00BFFF] animate-[eq-bar-2_0.8s_ease-in-out_infinite]" />
                      <div className="h-1 w-[3px] rounded-[1px] bg-[#00BFFF] animate-[eq-bar-3_0.8s_ease-in-out_infinite]" />
                    </div>
                  ) : (
                    <span className={`font-mono text-[11px] ${isActive ? "text-[#00BFFF]" : "text-[#5A6080]"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>
                <span className={`min-w-0 flex-1 truncate font-headline text-[13px] ${isActive ? "font-semibold text-white" : "text-[#A0A8C0]"}`}>
                  {track.title}
                </span>
                <span className={`shrink-0 font-mono text-[11px] tabular-nums ${isActive ? "text-[#00BFFF]" : "text-[#5A6080]"}`}>
                  {formatDuration(track.duration)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
