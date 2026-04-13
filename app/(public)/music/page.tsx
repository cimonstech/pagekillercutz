"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import AnimateIn from "@/components/ui/AnimateIn";
import { gsap } from "@/lib/gsap";
import { BorderDrawEdges } from "@/components/ui/BorderDrawEdges";
import { buildAlbumPlayerQueue } from "@/lib/album-playback";
import type { Database } from "@/lib/database.types";
import { formatDuration } from "@/lib/player-utils";
import type { PlayerTrack } from "@/lib/store/playerStore";
import { usePlayerStore } from "@/lib/store/playerStore";

type MusicRow = Database["public"]["Tables"]["music"]["Row"];

const TABS = ["Discography", "Mixes", "Singles", "Videos"] as const;
type Tab = (typeof TABS)[number];

interface Release {
  id: string;
  title: string;
  meta: string;
  src: string;
  audioUrl?: string | null;
  durationSec?: number;
  releaseType?: string;
}

const ARTIST = "Page KillerCutz";

const PLACEHOLDER_COVER = "/killercutz-logo.webp";
const isAbsoluteUrl = (url: string | null | undefined) => Boolean(url && (url.startsWith("https://") || url.startsWith("http://")));

function releaseToTrack(item: Release): PlayerTrack {
  return {
    id: item.id,
    musicId: item.id,
    title: item.title,
    artist: ARTIST,
    coverUrl: item.src,
    audioUrl: item.audioUrl ?? null,
    durationSec: item.durationSec && item.durationSec > 0 ? item.durationSec : 210,
    releaseType: item.releaseType,
  };
}

async function fetchMusicRow(id: string): Promise<MusicRow | null> {
  try {
    const res = await fetch(`/api/music/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { music?: MusicRow };
    return json.music ?? null;
  } catch {
    return null;
  }
}

async function playReleaseFromApi(
  item: Release,
  setTrack: (t: PlayerTrack) => Promise<void>,
  setQueue: (tracks: PlayerTrack[]) => void,
) {
  const track = releaseToTrack(item);
  setQueue([track]);
  if (track.audioUrl) {
    await setTrack(track);
    return;
  }
  try {
    const res = await fetch(`/api/music/${encodeURIComponent(item.id)}`);
    if (!res.ok) throw new Error("bad response");
    const json = (await res.json()) as {
      music?: { audio_url?: string | null; duration?: number | null };
    };
    const m = json.music;
    if (m && (m.audio_url != null || (m.duration != null && m.duration > 0))) {
      const next = {
        ...track,
        audioUrl: m.audio_url ?? null,
        durationSec:
          typeof m.duration === "number" && m.duration > 0 ? m.duration : track.durationSec,
      };
      setQueue([next]);
      await setTrack(next);
      return;
    }
  } catch {
    /* fall through to simulated */
  }
  await setTrack({ ...track, audioUrl: null });
}

function tabToApiUrl(tab: Tab): string | null {
  if (tab === "Discography") return "/api/music?type=album";
  if (tab === "Mixes") return "/api/music?type=mix";
  if (tab === "Singles") return "/api/music?type=single";
  if (tab === "Videos") return null;
  return "/api/music";
}

export default function MusicPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Discography");
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredRow, setFeaturedRow] = useState<{
    id: string;
    title: string;
    cover: string;
    description: string | null;
    type: "album" | "single" | "mix";
    tracks: { title: string; duration: number; audio_url?: string }[] | null;
  } | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const bannerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Banner entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".kc-music-title",   { opacity: 0, y: 32, scale: 0.97, duration: 0.9 }, 0.1)
        .from(".kc-music-meta",    { opacity: 0, y: 16, duration: 0.65 }, 0.45)
        .from(".kc-music-actions > *", { opacity: 0, y: 12, duration: 0.55, stagger: 0.1 }, 0.7);
    }, bannerRef);
    return () => ctx.revert();
  }, []);

  const playRelease = useCallback(
    async (item: Release) => {
      const full = await fetchMusicRow(item.id);
      if (full) {
        const queue = buildAlbumPlayerQueue(full);
        const start = queue.find((t) => t.audioUrl) ?? queue[0];
        if (!start) return;
        if (currentTrack?.musicId === item.id) {
          togglePlay();
          return;
        }
        setQueue(queue);
        await setTrack(start);
        return;
      }
      if (currentTrack?.musicId === item.id || currentTrack?.id === item.id) {
        togglePlay();
        return;
      }
      await playReleaseFromApi(item, setTrack, setQueue);
    },
    [currentTrack?.id, currentTrack?.musicId, setQueue, setTrack, togglePlay],
  );

  const handleCardClick = useCallback(
    (e: React.MouseEvent, music: Release) => {
      const target = e.target as HTMLElement;
      if (target.closest(".play-button")) return;
      router.push(`/music/${music.id}`);
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const url = tabToApiUrl(activeTab);
      if (url === null) {
        setReleases([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url);
        const json = (await res.json()) as {
          error?: string;
          music?: Array<{
            id: string;
            title: string;
            type: string;
            release_date: string | null;
            cover_url: string | null;
            audio_url: string | null;
            duration: number | null;
          }>;
        };
        if (!res.ok) throw new Error(json.error || "Failed to load music");
        if (cancelled) return;
        const mapped = (json.music ?? []).map((m) => ({
          id: m.id,
          title: m.title,
          meta: `${m.type.toUpperCase()}${m.release_date ? ` • ${new Date(m.release_date).getFullYear()}` : ""}`,
          src: isAbsoluteUrl(m.cover_url) ? (m.cover_url as string) : PLACEHOLDER_COVER,
          audioUrl: m.audio_url,
          durationSec: typeof m.duration === "number" && m.duration > 0 ? m.duration : undefined,
          releaseType: m.type,
        }));
        setReleases(mapped);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFeaturedLoading(true);
      setFeaturedError(null);
      try {
        const res = await fetch("/api/music?featured=true&limit=1");
        const json = (await res.json()) as {
          error?: string;
          music?: Array<{
            id: string;
            title: string;
            type: "album" | "single" | "mix";
            cover_url: string | null;
            description: string | null;
            tracks: { title: string; duration: number; audio_url?: string }[] | null;
          }>;
        };
        if (!res.ok) throw new Error(json.error || "Failed to load featured release");
        const m = json.music?.[0];
        if (cancelled) return;
        if (m) {
          const relType = m.type === "album" || m.type === "single" || m.type === "mix" ? m.type : "album";
          setFeaturedRow({
            id: m.id,
            title: m.title,
            cover: isAbsoluteUrl(m.cover_url) ? (m.cover_url as string) : PLACEHOLDER_COVER,
            description: m.description,
            type: relType,
            tracks: m.tracks,
          });
        } else setFeaturedRow(null);
      } catch (e) {
        if (!cancelled) setFeaturedError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative">
      {/* ── Artist banner ── */}
      <section className="relative h-[260px] w-full overflow-hidden">
        <Image
          className="w-full h-full object-cover blur-2xl opacity-25 scale-110"
          alt=""
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAs4Rmxd1JfY7dcYuSOCUURXg-dlfMkZqLMWCMmdjju3nMwf7EzD_TmHWap2XRvTTdJMPYkwwa6UZ6iRzXJyXGGv8fhY3OqE8iI09m0RUAaH2Owx3SDFR7Cygr5vVVluT7UzGNIbuTPiYMw--NZWfcZPWEihmpzMKMmqUNFEAR4nWw8NbBCnLQzMLDPxStrDjRXb2wDOi-YdNY_8Vgl7ml-U3uFb9HKLUDdE5_etIbaIOlCBMDQBCEi4DTs9r-Ifr1AMHz5OEe4pFwi"
          fill
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        <div ref={bannerRef} className="absolute bottom-0 left-0 w-full px-4 sm:px-8 lg:px-12 pb-6 sm:pb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 sm:gap-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-primary text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <span className="font-label text-[10px] text-primary uppercase tracking-widest">Verified Artist</span>
            </div>
            <h1 className="kc-music-title font-display text-3xl sm:text-5xl lg:text-7xl uppercase tracking-tighter leading-none text-white">
              Page KillerCutz
            </h1>
            <div className="kc-music-meta flex gap-6">
              <div>
                <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-wide">
                  Monthly Listeners
                </span>
                <p className="font-headline text-lg font-bold">50K</p>
              </div>
              <div>
                <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-wide">
                  Followers
                </span>
                <p className="font-headline text-lg font-bold">2K</p>
              </div>
            </div>
          </div>

          <div className="kc-music-actions flex gap-3">
            <button
              type="button"
              className="pl-6 pr-5 py-2.5 bg-primary text-on-primary-fixed font-headline font-bold text-sm uppercase tracking-widest rounded-full active:scale-[0.96] transition-transform duration-150 ease-out glow-btn flex items-center gap-2"
              onClick={() => {
                const first = releases[0];
                if (first) void playRelease(first);
                else if (featuredRow)
                  void playReleaseFromApi(
                    {
                      id: featuredRow.id,
                      title: featuredRow.title,
                      meta: "",
                      src: featuredRow.cover,
                      releaseType: featuredRow.type,
                    },
                    setTrack,
                    setQueue,
                  );
              }}
            >
              <span
                className="material-symbols-outlined text-[18px] ml-[2px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                play_arrow
              </span>
              Play All
            </button>
            <button className="px-6 py-2.5 shadow-border text-on-surface font-headline font-bold text-sm uppercase tracking-widest rounded-full hover:bg-white/5 transition-[background-color,box-shadow]">
              Follow
            </button>
          </div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className="px-4 sm:px-8 lg:px-12 mt-6 border-b border-white/5">
        <nav className="flex gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "pb-4 font-headline text-sm uppercase tracking-widest transition-colors border-b-2",
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface",
              ].join(" ")}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 py-10 space-y-14">
        {/* ── Recent Releases ── */}
        <section>
          <h2 className="font-headline text-xs uppercase tracking-widest text-on-surface-variant mb-6">
            Recent Releases
          </h2>
          <AnimateIn stagger={0.06} className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {loading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse rounded-3xl bg-surface-container-low p-3">
                    <div className="mb-3 aspect-square rounded-xl bg-white/10" />
                    <div className="h-4 rounded bg-white/10" />
                    <div className="mt-2 h-3 w-2/3 rounded bg-white/10" />
                  </div>
                ))}
              </>
            ) : error ? (
              <p className="col-span-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : releases.length === 0 ? (
              <p className="col-span-full text-sm text-on-surface-variant">No results</p>
            ) : (
              releases.map((item) => (
                (() => {
                  const isActive =
                    currentTrack?.musicId === item.id ||
                    currentTrack?.id === item.id;
                  const showEq = isActive && isPlaying;
                  return (
                <div
                  key={item.id}
                  onClick={(e) => handleCardClick(e, item)}
                  className={`group relative overflow-hidden rounded-3xl p-3 transition-[background-color,box-shadow] hover:bg-surface-container-high ${
                    isActive
                      ? "bg-surface-container-high shadow-[0_0_0_2px_rgba(0,191,255,0.75)]"
                      : "bg-surface-container-low"
                  } cursor-pointer`}
                >
                  <BorderDrawEdges />
                  <div className="relative z-10">
                    <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-surface-container">
                      {showEq ? (
                        <div className="absolute left-2 top-2 z-20 flex h-5 items-end gap-0.5 rounded-md bg-black/40 px-1.5 py-1">
                          <span className="h-1 w-[3px] rounded-[1px] bg-[#00BFFF] animate-[eq-bar-1_0.8s_ease-in-out_infinite]" />
                          <span className="h-2 w-[3px] rounded-[1px] bg-[#00BFFF] animate-[eq-bar-2_0.8s_ease-in-out_infinite]" />
                          <span className="h-1 w-[3px] rounded-[1px] bg-[#00BFFF] animate-[eq-bar-3_0.8s_ease-in-out_infinite]" />
                        </div>
                      ) : null}
                      <Image
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={item.title}
                        src={item.src}
                        width={300}
                        height={300}
                      />
                      <button
                        type="button"
                        className="play-button absolute bottom-2 right-2 z-20 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-primary opacity-0 shadow-[0_4px_16px_rgba(0,191,255,0.5)] transition-[transform,opacity] duration-300 group-hover:translate-y-0 group-hover:opacity-100 active:scale-[0.96]"
                        aria-label={`Play ${item.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          playRelease(item);
                        }}
                      >
                        <span
                          className="material-symbols-outlined ml-[2px] text-[20px] text-on-primary-fixed"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {!item.audioUrl
                            ? "music_note"
                            : (currentTrack?.musicId === item.id || currentTrack?.id === item.id) && isPlaying
                              ? "pause"
                              : "play_arrow"}
                        </span>
                      </button>
                    </div>
                    <div>
                      <h3 className="truncate font-headline text-sm font-bold">{item.title}</h3>
                      <p className="mt-0.5 font-label text-[10px] text-on-surface-variant">{item.meta}</p>
                    </div>
                  </div>
                </div>
                  );
                })()
              ))
            )}
          </AnimateIn>
        </section>

        {/* ── Featured album ── */}
        <AnimateIn from={28}>
        <section>
          <h2 className="font-headline text-xs uppercase tracking-widest text-on-surface-variant mb-6">
            Featured Album
          </h2>
          {featuredLoading ? (
            <div className="glass animate-pulse rounded-3xl p-6 lg:p-8">
              <div className="flex flex-col gap-8 md:flex-row">
                <div className="relative h-48 w-full shrink-0 rounded-xl bg-white/10 md:h-56 md:w-56" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-24 rounded bg-white/10" />
                  <div className="h-10 w-3/4 rounded bg-white/10" />
                  <div className="h-12 rounded bg-white/10" />
                </div>
              </div>
            </div>
          ) : featuredError ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {featuredError}
            </p>
          ) : !featuredRow ? (
            <p className="text-sm text-on-surface-variant">No results</p>
          ) : (
            <div className="glass rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row gap-8">
              <div className="relative h-48 w-full md:h-56 md:w-56 shrink-0 overflow-hidden rounded-xl shadow-2xl">
                <Image
                  className="h-full w-full object-cover"
                  alt={featuredRow.title}
                  src={featuredRow.cover}
                  width={300}
                  height={300}
                />
              </div>
              <div className="flex-1">
                <span className="font-label text-[10px] text-primary uppercase tracking-widest">Now Featured</span>
                <h2 className="font-display mt-1 mb-4 text-3xl uppercase tracking-tighter text-white sm:text-5xl">
                  {featuredRow.title}
                </h2>
                {featuredRow.description ? (
                  <p className="mb-6 line-clamp-4 text-sm text-on-surface-variant">{featuredRow.description}</p>
                ) : null}
                {featuredRow.tracks && featuredRow.tracks.length > 0 ? (
                  <div className="space-y-1">
                    {featuredRow.tracks.map((tr, i) => {
                      const n = String(i + 1).padStart(2, "0");
                      const duration = formatDuration(tr.duration);
                      const rowId = `${featuredRow.id}::tr::${i}`;
                      const active =
                        currentTrack?.musicId === featuredRow.id && currentTrack?.id === rowId;
                      return (
                        <button
                          key={`${tr.title}-${i}`}
                          type="button"
                          className={[
                            "group flex w-full items-center gap-5 rounded-lg px-3 py-2.5 text-left transition-[background-color] active:scale-[0.96] active:transition-transform active:duration-150",
                            active ? "bg-primary/8 shadow-[0_0_0_1px_rgba(0,191,255,0.15)]" : "hover:bg-white/5",
                          ].join(" ")}
                          onClick={async () => {
                            const m = await fetchMusicRow(featuredRow.id);
                            if (!m) {
                              const fallback = {
                                id: rowId,
                                musicId: featuredRow.id,
                                title: tr.title,
                                artist: ARTIST,
                                coverUrl: featuredRow.cover,
                                audioUrl: tr.audio_url ?? null,
                                durationSec: tr.duration > 0 ? tr.duration : 0,
                                releaseType: featuredRow.type,
                                type: featuredRow.type,
                                duration: tr.duration > 0 ? tr.duration : 0,
                              };
                              setQueue([fallback]);
                              await setTrack(fallback);
                              return;
                            }
                            const q = buildAlbumPlayerQueue(m);
                            const target = q[i];
                            if (!target) return;
                            setQueue(q);
                            await setTrack(target);
                          }}
                        >
                          <span
                            className={`w-5 font-label text-xs ${active ? "text-primary" : "text-on-surface-variant"}`}
                          >
                            {n}
                          </span>
                          <div className="flex flex-1 items-center gap-2">
                            <span
                              className={`font-headline text-sm font-medium ${active ? "text-primary" : "text-on-surface"}`}
                            >
                              {tr.title}
                            </span>
                            {active && (
                              <span
                                className="material-symbols-outlined text-[14px] text-primary"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                equalizer
                              </span>
                            )}
                          </div>
                          <span
                            className={`font-label text-xs ${active ? "text-primary" : "text-on-surface-variant"}`}
                          >
                            {duration}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Link
                    href={`/music/${featuredRow.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2 text-sm font-bold text-primary hover:bg-primary/10"
                  >
                    Open release
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
        </AnimateIn>

        {/* ── Video clips ── */}
        <section>
          <h2 className="font-headline text-xs uppercase tracking-widest text-on-surface-variant mb-6">
            Scratch Video Clips
          </h2>
          <AnimateIn stagger={0.08} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Link
                key={i}
                href="/music"
                className="group relative block overflow-hidden rounded-2xl bg-surface-container-low transition-colors hover:bg-surface-container-high"
              >
                <BorderDrawEdges />
                <div className="relative z-10">
                  <div className="relative flex aspect-video items-center justify-center bg-surface-container">
                    <div
                      className="absolute inset-0 opacity-5"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 2px 2px, rgba(0,191,255,0.3) 1px, transparent 0)",
                        backgroundSize: "20px 20px",
                      }}
                    />
                    <span className="material-symbols-outlined text-4xl text-primary transition-transform group-hover:scale-110">
                      play_circle
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-headline text-xs font-medium">Mix Session {i + 1}</p>
                    <p className="mt-0.5 font-label text-[10px] text-on-surface-variant">Video clip</p>
                  </div>
                </div>
              </Link>
            ))}
          </AnimateIn>
        </section>

      </div>
    </div>
  );
}
