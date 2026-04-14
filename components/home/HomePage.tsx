"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, Info, Mail, Music, Pause, Play, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Database } from "@/lib/database.types";
import { DJ_INFO, DJ_STATS } from "@/lib/constants";
import { MemberAvatarStack } from "@/components/MemberAvatarStack";
import { BorderDrawEdges } from "@/components/ui/BorderDrawEdges";
import HomeAnnouncementBar from "@/components/home/HomeAnnouncementBar";
import HeroMusicCard from "@/components/music/HeroMusicCard";
import HomeGenreChips from "@/components/home/HomeGenreChips";
import ShaderBackground from "@/components/ui/ShaderBackground";
import PublicSidebar from "@/components/layout/PublicSidebar";
import PublicTopBar from "@/components/layout/PublicTopBar";
import PublicFooter from "@/components/layout/PublicFooter";
import AnimateIn from "@/components/ui/AnimateIn";
import { buildAlbumPlayerQueue } from "@/lib/album-playback";
import { formatDuration } from "@/lib/player-utils";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAdmin } from "@/hooks/useStaffAdmin";
import { gsap } from "@/lib/gsap";

type MusicRow = Database["public"]["Tables"]["music"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

function formatMusicTypeLabel(type: MusicRow["type"]): string {
  const map: Record<MusicRow["type"], string> = {
    album: "Album",
    single: "Single",
    mix: "Mix",
  };
  return map[type] ?? type;
}

function formatNewReleaseSubtitle(m: MusicRow): string {
  const y = m.release_date ? String(m.release_date).slice(0, 4) : "";
  const t = formatMusicTypeLabel(m.type);
  if (y && t) return `${y} · ${t}`;
  return t || y || "";
}

function formatEventDate(d: string): string {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return d;
  return x.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
}

function eventTypeEmoji(eventType: string): string {
  const t = eventType.toLowerCase();
  if (t.includes("festival")) return "🎸";
  if (t.includes("wedding")) return "💍";
  if (t.includes("corporate")) return "🏢";
  if (t.includes("club")) return "🎧";
  return "🎤";
}

const ARTIST = DJ_INFO.name;
const isAbsoluteUrl = (url: string | null | undefined) => Boolean(url && (url.startsWith("https://") || url.startsWith("http://")));

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const staffAdmin = useStaffAdmin(user);
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [hasUpcomingBooking, setHasUpcomingBooking] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [popularTracks, setPopularTracks] = useState<MusicRow[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState<string | null>(null);
  const [newReleases, setNewReleases] = useState<MusicRow[]>([]);
  const [releasesLoading, setReleasesLoading] = useState(true);
  const [releasesError, setReleasesError] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [heroMusic, setHeroMusic] = useState<MusicRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadHeroMusic = async () => {
      try {
        const featuredRes = await fetch("/api/music?featured=true&limit=1");
        const featuredJson = (await featuredRes.json()) as { music?: MusicRow[]; releases?: MusicRow[] };
        const featured = featuredJson.music ?? featuredJson.releases ?? [];

        const allRes = await fetch("/api/music?limit=3&sort=desc");
        const allJson = (await allRes.json()) as { music?: MusicRow[]; releases?: MusicRow[] };
        const all = allJson.music ?? allJson.releases ?? [];

        if (cancelled) return;
        if (featured.length > 0) {
          const featuredId = featured[0].id;
          const others = all.filter((m) => m.id !== featuredId).slice(0, 2);
          setHeroMusic([featured[0], ...others]);
          return;
        }
        setHeroMusic(all.slice(0, 3));
      } catch {
        if (!cancelled) setHeroMusic([]);
      }
    };
    void loadHeroMusic();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!user || staffAdmin) {
      setHasUpcomingBooking(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/client/dashboard");
        if (!res.ok) return;
        const d = (await res.json()) as { upcomingBookings?: unknown[] };
        if (cancelled) return;
        setHasUpcomingBooking((d.upcomingBookings?.length ?? 0) > 0);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, staffAdmin]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPopularLoading(true);
      setPopularError(null);
      try {
        /** Popular list: see GET /api/music/popular — featured first (by plays), then most-played, then newest; max 6. */
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

  const playMusicRow = useCallback(
    async (m: MusicRow) => {
      const q = buildAlbumPlayerQueue(m);
      const start = q.find((t) => t.audioUrl) ?? q[0];
      if (!start) return;
      if (currentTrack?.musicId === m.id) {
        togglePlay();
        return;
      }
      setQueue(q);
      await setTrack(start);
    },
    [currentTrack?.musicId, setQueue, setTrack, togglePlay],
  );

  const handleHeroPlay = useCallback(() => {
    if (!heroMusic.length) return;
    const featured = heroMusic[0]!;
    if (currentTrack?.id === featured.id) {
      togglePlay();
      return;
    }
    setQueue(
      heroMusic.map((t) => ({
        id: t.id,
        title: t.title,
        artist: ARTIST,
        coverUrl: t.cover_url,
        audioUrl: t.audio_url,
        type: t.type,
        duration: t.duration ?? undefined,
        musicId: t.id,
      })),
    );
    void setTrack({
      id: featured.id,
      title: featured.title,
      artist: ARTIST,
      coverUrl: featured.cover_url,
      audioUrl: featured.audio_url,
      type: featured.type,
      duration: featured.duration ?? undefined,
      musicId: featured.id,
    });
  }, [heroMusic, currentTrack?.id, setQueue, setTrack, togglePlay]);

  const featuredIsPlaying =
    heroMusic.length > 0 &&
    currentTrack?.id === heroMusic[0]?.id &&
    isPlaying;

  useEffect(() => {
    let cancelled = false;
    (async () => {
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const res = await fetch("/api/events?limit=4&sort=desc");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load events");
        if (!cancelled) setRecentEvents(json.events ?? []);
      } catch (e) {
        if (!cancelled) setEventsError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".kc-hero-badge",    { opacity: 0, y: 10, duration: 0.5 }, 0.05)
        .from(".kc-hero-logo",     { opacity: 0, y: 28, scale: 0.95, duration: 1.0 }, 0.15)
        .from(".kc-hero-subtitle", { opacity: 0, y: 16, duration: 0.7 }, 0.65)
        .from(".kc-hero-ctas", { opacity: 0, y: 14, duration: 0.55 }, 0.85)
        .from(".kc-hero-stats",    { opacity: 0, y: 12, duration: 0.6 }, 1.05);
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <ShaderBackground />
      <PublicSidebar />

      <div className="relative z-10 flex min-h-screen min-w-0 flex-1 flex-col ml-0 sm:ml-[calc(16px+56px+24px)]">
        <PublicTopBar />

        <main className="flex-1 pb-[var(--player-offset,0px)]">
          {/* ── Hero (announcement pill overlays top of image) ── */}
          <section className="relative -mt-1 min-h-[480px] overflow-hidden">
            {/* Background image — fills hero; sits visually under the booking pill */}
            <div className="absolute inset-0">
              <Image
                alt="DJ KillerCutz performing on stage"
                src="/djsystem.webp"
                fill
                className="object-cover opacity-90"
                sizes="(max-width: 1280px) 100vw, 1280px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
            </div>

            <HomeAnnouncementBar className="pointer-events-none absolute left-0 right-0 top-0 z-20 pt-2 [&_a]:pointer-events-auto" />

            {heroMusic.length > 0 ? (
              <HeroMusicCard tracks={heroMusic} />
            ) : (
              <div
                className="pointer-events-none absolute left-[60%] top-[44%] z-30 hidden w-[320px] -translate-y-1/2 rounded-[20px] border border-white/10 bg-white/5 xl:block"
                style={{ height: "360px" }}
              />
            )}

            {/* Content */}
            <div ref={heroRef} className="relative z-10 flex min-h-[480px] flex-col justify-end px-4 sm:px-8 lg:px-12 pb-12 pt-28">
              <div className="kc-hero-badge flex items-center gap-2 mb-3">
                <span
                  className="material-symbols-outlined text-primary text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                  Verified Artist
                </span>
              </div>
              <div className="kc-hero-logo mb-4 max-w-[min(92vw,560px)]">
                <Image
                  src="/killercutz-logo.webp"
                  alt="KillerCutz Ghana"
                  width={560}
                  height={180}
                  priority
                  className="w-full h-auto drop-shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
                />
              </div>
              <p className="kc-hero-subtitle font-headline text-base text-on-surface-variant mb-6 max-w-lg">
                Master of the decks. Afrobeat &amp; Highlife fusion from Accra to the world.
              </p>
              <div className="kc-hero-ctas inline-grid w-max max-w-full grid-flow-col auto-cols-max items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleHeroPlay()}
                  disabled={heroMusic.length === 0}
                  className="flex h-12 min-h-12 items-center justify-center gap-2 rounded-full border border-transparent bg-primary px-6 font-bold leading-none text-on-primary-fixed glow-btn active:scale-[0.96] transition-transform duration-150 ease-out enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:px-7"
                >
                  {featuredIsPlaying ? (
                    <Pause className="size-4 shrink-0 text-black" fill="black" aria-hidden />
                  ) : (
                    <Play className="size-4 shrink-0 text-black" fill="black" aria-hidden />
                  )}
                  <span className="shrink-0 leading-none">{featuredIsPlaying ? "Pause" : "Play"}</span>
                </button>
                {authLoading ? (
                  <div
                    className="h-12 min-h-12 min-w-[148px] animate-pulse rounded-full bg-white/10 sm:min-w-[160px]"
                    aria-hidden
                  />
                ) : !user ? (
                  <Link
                    href="/booking"
                    className="flex h-12 min-h-12 items-center justify-center rounded-full bg-white/10 px-6 font-bold leading-none text-white shadow-border hover:bg-white/20 sm:px-7 transition-[background-color,box-shadow]"
                  >
                    Book the DJ
                  </Link>
                ) : staffAdmin ? (
                  <Link
                    href="/admin"
                    className="flex h-12 min-h-12 items-center justify-center rounded-full bg-white/10 px-6 font-bold leading-none text-white shadow-border hover:bg-white/20 sm:px-7 transition-[background-color,box-shadow]"
                  >
                    Admin →
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push("/client/dashboard")}
                    className="flex h-12 min-h-12 items-center justify-center rounded-full bg-white/10 px-6 font-bold leading-none text-white shadow-border hover:bg-white/20 sm:px-7 transition-[background-color,box-shadow]"
                  >
                    {hasUpcomingBooking ? "My Event →" : "My Dashboard →"}
                  </button>
                )}
                <div ref={moreRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowMoreMenu((v) => !v)}
                    className="flex h-12 w-12 min-h-12 min-w-12 items-center justify-center rounded-full border border-white/20 text-on-surface-variant hover:text-on-surface hover:border-white/40 transition-colors"
                    aria-expanded={showMoreMenu}
                    aria-haspopup="menu"
                    aria-label="More actions"
                  >
                    <span className="material-symbols-outlined text-[18px] leading-none" aria-hidden>
                      more_horiz
                    </span>
                  </button>
                  {showMoreMenu ? (
                    <div
                      className="absolute left-0 z-[100] overflow-hidden rounded-[14px] border border-white/[0.10] p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.60)]"
                      style={{
                        bottom: "calc(100% + 8px)",
                        width: 200,
                        background: "rgba(12,12,22,0.97)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                      }}
                      role="menu"
                    >
                      {(
                        [
                          { icon: Music, label: "Browse Music", href: "/music" },
                          { icon: Calendar, label: "View Events", href: "/events" },
                          { icon: Tag, label: "DJ Packages", href: "/pricing" },
                          { icon: Mail, label: "Contact", href: "/contact" },
                          { icon: Info, label: "About", href: "/about" },
                        ] as const
                      ).map(({ icon: Icon, label, href }) => (
                        <button
                          key={href}
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-[9px] text-left transition-colors hover:bg-white/[0.06]"
                          onClick={() => {
                            setShowMoreMenu(false);
                            router.push(href);
                          }}
                        >
                          <Icon className="size-[15px] shrink-0 text-white/40" aria-hidden />
                          <span className="font-body text-[13px] text-white">{label}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div
                className="kc-hero-stats mt-8 flex w-full max-w-full flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-x-6 sm:gap-y-4 xl:mt-10"
                aria-label="Artist stats with community avatars"
              >
                <MemberAvatarStack size={34} className="shrink-0 justify-start" />
                <div className="flex w-full min-w-0 flex-wrap items-start justify-start gap-x-6 gap-y-4 sm:w-auto sm:items-center">
                    <div>
                      <p className="font-display text-3xl font-extrabold leading-none tracking-tight text-[#00BFFF] tabular-nums sm:text-4xl">
                        {DJ_STATS.eventsPlayed}
                      </p>
                      <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-white/50">
                        EVENTS PLAYED
                      </p>
                    </div>
                    <div className="hidden h-10 w-px bg-outline-variant/30 sm:block" />
                    <div>
                      <p className="font-display text-3xl font-extrabold leading-none tracking-tight text-white tabular-nums sm:text-4xl">
                        {DJ_STATS.yearsActive}
                      </p>
                      <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-white/50">
                        YEARS ACTIVE
                      </p>
                    </div>
                    <div className="hidden h-10 w-px bg-outline-variant/30 sm:block" />
                    <div className="hidden sm:block">
                      <p className="font-display text-3xl font-extrabold leading-none tracking-tight text-[#00BFFF] tabular-nums sm:text-4xl">
                        {DJ_STATS.monthlyListeners}
                      </p>
                      <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-white/50">
                        MONTHLY LISTENERS
                      </p>
                    </div>
                    <div className="hidden h-10 w-px bg-outline-variant/30 sm:block" aria-hidden />
                    <div>
                      <p className="font-display text-3xl font-extrabold leading-none tracking-tight text-white tabular-nums sm:text-4xl">
                        {DJ_STATS.followers}
                      </p>
                      <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-white/50">
                        FOLLOWERS
                      </p>
                    </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Content ── */}
          <div className="px-4 sm:px-8 lg:px-12 py-10 space-y-14">
            {/* Popular Tracks + How It Works */}
            <section>
              <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
                <div className="w-full min-w-0 lg:w-[65%]">
                  <AnimateIn from={16}>
                    <h2 className="mb-5 font-headline text-[20px] font-semibold text-white">Popular</h2>
                  </AnimateIn>
                  <AnimateIn stagger={0.06} className="space-y-1">
                    {popularLoading ? (
                      <>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="flex animate-pulse items-center gap-4 rounded-full px-4 py-2"
                          >
                            <div className="h-4 w-4 shrink-0 rounded bg-white/10" />
                            <div className="size-10 shrink-0 rounded-md bg-white/10" />
                            <div className="h-4 flex-1 rounded bg-white/10" />
                            <div className="hidden h-3 w-16 shrink-0 rounded bg-white/10 sm:block" />
                            <div className="h-3 w-10 shrink-0 rounded bg-white/10" />
                          </div>
                        ))}
                      </>
                    ) : popularError ? (
                      <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {popularError}
                      </p>
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
                              {!t.audio_url
                                ? "music_note"
                                : currentTrack?.musicId === t.id && isPlaying
                                  ? "pause"
                                  : "play_arrow"}
                            </span>
                            <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-surface-container">
                              <Image
                                src={cover}
                                alt={t.title}
                                width={40}
                                height={40}
                                className="size-10 object-cover"
                              />
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

                <AnimateIn delay={0.1} className="w-full min-w-0 lg:w-[35%]">
                  <h2 className="font-headline text-base font-semibold text-white">How It Works</h2>
                  <p className="mt-1 font-body text-[13px] text-[#A0A8C0]">From booking to the dancefloor.</p>

                  <div className="mt-5 flex flex-col">
                    <div
                      className="rounded-[14px] border border-white/10 p-4"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-label text-[10px] text-[#00BFFF]">01</span>
                        <span className="material-symbols-outlined text-base text-white/45">calendar_month</span>
                      </div>
                      <p className="mt-2 font-headline text-sm font-semibold text-white">Book the DJ</p>
                      <p className="mt-2 font-body text-xs leading-[1.6] text-[#5A6080]">
                        Choose your package and fill in your event details. You&apos;ll get a unique Event ID.
                      </p>
                      <Link
                        href="/booking"
                        className="mt-2 inline-block font-label text-[10px] text-[#00BFFF] hover:underline"
                      >
                        Book Now →
                      </Link>
                    </div>

                    <div className="flex h-4 items-center justify-center" aria-hidden>
                      <div className="w-0.5 bg-[rgba(0,191,255,0.2)]" style={{ height: 16 }} />
                    </div>

                    <div
                      className="rounded-[14px] border border-white/10 p-4"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-label text-[10px] text-[#00BFFF]">02</span>
                        <span className="material-symbols-outlined text-base text-white/45">music_note</span>
                      </div>
                      <p className="mt-2 font-headline text-sm font-semibold text-white">Curate Your Playlist</p>
                      <p className="mt-2 font-body text-xs leading-[1.6] text-[#5A6080]">
                        Log in to your private portal. Add must-plays, block songs, and set your event timeline.
                      </p>
                      <Link
                        href="/sign-in"
                        className="mt-2 inline-block font-label text-[10px] text-[#00BFFF] hover:underline"
                      >
                        Open Portal →
                      </Link>
                    </div>

                    <div className="flex h-4 items-center justify-center" aria-hidden>
                      <div className="w-0.5 bg-[rgba(0,191,255,0.2)]" style={{ height: 16 }} />
                    </div>

                    <div
                      className="rounded-[14px] border border-white/10 p-4"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-label text-[10px] text-[#00BFFF]">03</span>
                        <span className="material-symbols-outlined text-base text-white/45">headphones</span>
                      </div>
                      <p className="mt-2 font-headline text-sm font-semibold text-white">Experience the Night</p>
                      <p className="mt-2 font-body text-xs leading-[1.6] text-[#5A6080]">
                        Page KillerCutz reads your playlist, reads the room, and delivers a set you will never forget.
                      </p>
                      <div className="mt-2 flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <span
                            key={si}
                            className="material-symbols-outlined text-[12px] text-[#00BFFF]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </AnimateIn>
              </div>
            </section>

            <AnimateIn from={16}>
              <HomeGenreChips />
            </AnimateIn>

            {/* Recent events */}
            <section>
              <AnimateIn from={16} className="mb-4 flex items-center justify-between">
                <h2 className="font-headline text-[20px] font-semibold text-white">Recent events</h2>
                <Link
                  href="/events"
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-headline font-bold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-on-surface"
                >
                  View all
                </Link>
              </AnimateIn>
              {eventsLoading ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="min-w-[240px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                    >
                      <div className="kc-shimmer h-28 w-full" />
                      <div className="space-y-2 p-4">
                        <div className="kc-shimmer h-4 w-3/4 rounded" />
                        <div className="kc-shimmer h-3 w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : eventsError ? (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {eventsError}
                </p>
              ) : recentEvents.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No results</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {recentEvents.map((ev) => {
                    const bgUrl = ev.media_urls?.[0]?.trim();
                    const hasBg = Boolean(bgUrl);
                    return (
                      <Link
                        key={ev.id}
                        href={`/events/${ev.id}`}
                        className="group min-w-[260px] max-w-[280px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low transition-colors hover:border-primary/30 hover:bg-surface-container"
                      >
                        <div
                          className="relative h-32 w-full overflow-hidden bg-surface-container-high transition-transform duration-500 group-hover:scale-[1.02]"
                          style={
                            hasBg
                              ? {
                                  backgroundImage: `url(${bgUrl})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }
                              : {
                                  background:
                                    "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(8,8,15,0.95) 100%)",
                                }
                          }
                        >
                          {!hasBg ? (
                            <div className="flex h-full w-full items-center justify-center">
                              <span className="material-symbols-outlined text-5xl text-white/15">event</span>
                            </div>
                          ) : null}
                          <div className="absolute right-2 top-2 rounded-full border border-primary/20 bg-black/50 px-2 py-0.5 font-label text-[10px] uppercase tracking-wider text-primary backdrop-blur-md">
                            {ev.event_type}
                          </div>
                          <div className="absolute bottom-2 left-2 text-2xl drop-shadow-lg">
                            {eventTypeEmoji(ev.event_type)}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="line-clamp-2 font-headline text-sm font-semibold">{ev.title}</h3>
                          <p className="mt-1 flex items-center gap-1 font-label text-[11px] text-on-surface-variant">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            {formatEventDate(ev.event_date)}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 font-label text-[11px] text-on-surface-variant">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {ev.location}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* New Releases */}
            <section>
              <AnimateIn from={16} className="flex items-center justify-between mb-6">
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
                      <div
                        key={i}
                        className="animate-pulse overflow-hidden rounded-3xl bg-surface-container-low p-3"
                      >
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
                    const dur = r.duration ?? 240;
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
                                  {!r.audio_url
                                    ? "music_note"
                                    : currentTrack?.musicId === r.id && isPlaying
                                      ? "pause"
                                      : "play_arrow"}
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

            {/* About glass card */}
            <AnimateIn from={32}>
            <section className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10 pointer-events-none" />
              <div className="relative glass border-0 rounded-3xl p-8 lg:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="flex-1">
                  <p className="font-label text-xs text-primary uppercase tracking-widest mb-3">About the Artist</p>
                  <h2 className="font-display text-4xl uppercase tracking-tighter mb-4">{DJ_INFO.name}</h2>
                  <p className="text-on-surface-variant font-body leading-relaxed text-sm max-w-xl">{DJ_INFO.bio}</p>
                  <Link
                    href="/about"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary transition-all hover:gap-3 hover:bg-primary/15"
                  >
                    Read more{" "}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
                <div className="flex w-full shrink-0 flex-col items-start gap-6 md:w-auto md:items-center">
                  <div className="flex flex-col items-start gap-2 md:items-center">
                    <MemberAvatarStack size={40} className="justify-start" />
                    <p className="font-label text-left text-[10px] text-on-surface-variant uppercase tracking-widest md:text-center">
                      Fans in 7+ countries
                    </p>
                  </div>
                  <div className="flex w-full flex-wrap justify-start gap-6 sm:gap-8 md:justify-center">
                    <div className="text-left md:text-center">
                      <p className="font-display text-4xl sm:text-5xl text-primary tabular-nums">
                        {DJ_STATS.eventsPlayed}
                      </p>
                      <p className="font-label text-[10px] text-on-surface-variant mt-1 uppercase tracking-widest">
                        Events
                      </p>
                    </div>
                    <div className="text-left md:text-center">
                      <p className="font-display text-4xl sm:text-5xl text-secondary tabular-nums">
                        {DJ_STATS.yearsActive}
                      </p>
                      <p className="font-label text-[10px] text-on-surface-variant mt-1 uppercase tracking-widest">
                        Years
                      </p>
                    </div>
                    <div className="text-left md:text-center">
                      <p className="font-display text-4xl sm:text-5xl text-white tabular-nums">
                        {DJ_STATS.continents}
                      </p>
                      <p className="font-label text-[10px] text-on-surface-variant mt-1 uppercase tracking-widest">
                        Continents
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            </AnimateIn>

            {/* Book CTA */}
            <AnimateIn from={24}>
            <section className="flex flex-col gap-6 rounded-2xl glass p-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="mb-1 font-headline text-xl font-bold">Book Page KillerCutz</h3>
                <p className="text-sm text-on-surface-variant">
                  Available for festivals, weddings, corporate events, and club nights worldwide.
                </p>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => router.push("/booking")}
                  className="flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary-fixed glow-btn transition-transform duration-150 ease-out active:scale-[0.96]"
                >
                  Book Now <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/pricing")}
                  className="flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3 font-bold text-white transition-colors hover:bg-white/10"
                >
                  View Packages <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </section>
            </AnimateIn>
          </div>
        </main>

        <PublicFooter />
      </div>
    </div>
  );
}
