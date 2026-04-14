"use client";

import Image from "next/image";
import Link from "next/link";
import AnimateIn from "@/components/ui/AnimateIn";
import { BorderDrawEdges } from "@/components/ui/BorderDrawEdges";
import { usePlayerStore } from "@/lib/store/playerStore";
import { formatNewReleaseSubtitle, isAbsoluteUrl, type MusicRow } from "./homeShared";
import { usePlayMusicRow } from "./useHomePlayback";
import { useEffect, useState } from "react";

export default function NewReleasesSection() {
  const [newReleases, setNewReleases] = useState<MusicRow[]>([]);
  const [releasesLoading, setReleasesLoading] = useState(true);
  const [releasesError, setReleasesError] = useState<string | null>(null);
  const playMusicRow = usePlayMusicRow();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setReleasesLoading(true);
      setReleasesError(null);
      try {
        const res = await fetch("/api/music?limit=4&sort=desc");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load releases");
        if (!cancelled) setNewReleases(json.music ?? []);
      } catch (e) {
        if (!cancelled) setReleasesError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setReleasesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <AnimateIn from={16} className="mb-6 flex items-center justify-between">
        <h2 className="font-headline text-2xl font-bold">New Releases</h2>
        <Link
          href="/music"
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-headline font-bold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-on-surface"
        >
          Show all
        </Link>
      </AnimateIn>
      <AnimateIn stagger={0.07} className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {releasesLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-3xl bg-surface-container-low p-3">
                <div className="mb-3 aspect-square rounded-xl bg-white/10" />
                <div className="h-4 rounded bg-white/10" />
                <div className="mt-2 h-3 w-2/3 rounded bg-white/10" />
              </div>
            ))}
          </>
        ) : releasesError ? (
          <p className="col-span-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {releasesError}
          </p>
        ) : newReleases.length === 0 ? (
          <p className="col-span-full text-sm text-on-surface-variant">No results</p>
        ) : (
          newReleases.map((r) => {
            const cover = isAbsoluteUrl(r.cover_url) ? (r.cover_url as string) : "/killercutz-logo.webp";
            const subtitle = formatNewReleaseSubtitle(r);
            return (
              <div
                key={r.id}
                className="group relative overflow-hidden rounded-3xl bg-surface-container-low p-3 transition-[background-color] hover:bg-surface-container-high"
              >
                <BorderDrawEdges />
                <div className="relative z-10">
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-surface-container shadow-lg">
                    <Link href={`/music/${r.id}`} className="absolute inset-0 block">
                      <Image
                        src={cover}
                        alt={r.title}
                        width={300}
                        height={300}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>
                    <button
                      type="button"
                      className="absolute bottom-2 right-2 z-20 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-primary opacity-0 shadow-[0_4px_16px_rgba(0,191,255,0.5)] transition-[transform,opacity] duration-300 group-hover:translate-y-0 group-hover:opacity-100 active:scale-[0.96]"
                      aria-label={`Play ${r.title}`}
                      onClick={() => void playMusicRow(r)}
                    >
                      <span
                        className="material-symbols-outlined ml-[2px] text-[20px] text-on-primary-fixed"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                        title={!r.audio_url ? "No audio preview" : undefined}
                      >
                        {!r.audio_url ? "music_note" : currentTrack?.musicId === r.id && isPlaying ? "pause" : "play_arrow"}
                      </span>
                    </button>
                  </div>
                  <Link href={`/music/${r.id}`} className="block">
                    <p className="truncate font-headline text-sm font-semibold">{r.title}</p>
                    <p className="mt-1 font-label text-xs text-on-surface-variant">{subtitle}</p>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </AnimateIn>
    </section>
  );
}
