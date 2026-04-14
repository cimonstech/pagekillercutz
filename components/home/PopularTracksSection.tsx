"use client";

import Image from "next/image";
import AnimateIn from "@/components/ui/AnimateIn";
import { usePlayerStore } from "@/lib/store/playerStore";
import { formatDuration, isAbsoluteUrl, type MusicRow } from "./homeShared";
import { usePlayMusicRow } from "./useHomePlayback";
import { useEffect, useState } from "react";

export default function PopularTracksSection() {
  const [popularTracks, setPopularTracks] = useState<MusicRow[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState<string | null>(null);
  const playMusicRow = usePlayMusicRow();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setPopularLoading(true);
      setPopularError(null);
      try {
        const res = await fetch("/api/music/popular");
        const json = (await res.json()) as { music?: MusicRow[]; error?: string };
        if (!res.ok) throw new Error(json.error || "Failed to load popular tracks");
        if (!cancelled) setPopularTracks(json.music ?? []);
      } catch (e) {
        if (!cancelled) setPopularError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setPopularLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full min-w-0 lg:w-[65%]">
      <AnimateIn from={16}>
        <h2 className="mb-5 font-headline text-[20px] font-semibold text-white">Popular</h2>
      </AnimateIn>
      <AnimateIn stagger={0.06} className="space-y-1">
        {popularLoading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 rounded-full px-4 py-2">
                <div className="h-4 w-4 shrink-0 rounded bg-white/10" />
                <div className="size-10 shrink-0 rounded-md bg-white/10" />
                <div className="h-4 flex-1 rounded bg-white/10" />
                <div className="hidden h-3 w-16 shrink-0 rounded bg-white/10 sm:block" />
                <div className="h-3 w-10 shrink-0 rounded bg-white/10" />
              </div>
            ))}
          </>
        ) : popularError ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{popularError}</p>
        ) : popularTracks.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No results</p>
        ) : (
          popularTracks.map((t, i) => {
            const cover = isAbsoluteUrl(t.cover_url) ? (t.cover_url as string) : "/killercutz-logo.webp";
            const durLabel = formatDuration(t.duration);
            return (
              <button
                key={t.id}
                type="button"
                className="group flex w-full items-center gap-4 rounded-full px-4 py-2 text-left transition-[background-color] hover:bg-white/5 active:scale-[0.96] active:transition-transform active:duration-150 active:ease-out"
                onClick={() => void playMusicRow(t)}
              >
                <span className="w-4 shrink-0 text-right font-label text-sm text-on-surface-variant group-hover:hidden">
                  {i + 1}
                </span>
                <span
                  className="material-symbols-outlined hidden w-4 shrink-0 text-sm text-on-surface-variant group-hover:block"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  title={!t.audio_url ? "No audio preview" : undefined}
                >
                  {!t.audio_url ? "music_note" : currentTrack?.musicId === t.id && isPlaying ? "pause" : "play_arrow"}
                </span>
                <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-surface-container">
                  <Image src={cover} alt={t.title} width={40} height={40} className="size-10 object-cover" />
                </div>
                <p className="flex-1 truncate font-headline text-sm font-medium">{t.title}</p>
                <p
                  className="hidden shrink-0 font-label text-xs tabular-nums text-on-surface-variant sm:block"
                  title="Play counts coming soon"
                >
                  —
                </p>
                <p className="shrink-0 font-label text-xs text-on-surface-variant">{durLabel}</p>
              </button>
            );
          })
        )}
      </AnimateIn>
    </div>
  );
}
