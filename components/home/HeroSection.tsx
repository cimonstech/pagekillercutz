"use client";

import Image from "next/image";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DJ_STATS } from "@/lib/constants";
import { MemberAvatarStack } from "@/components/MemberAvatarStack";
import HomeAnnouncementBar from "@/components/home/HomeAnnouncementBar";
import HeroMusicCard from "@/components/music/HeroMusicCard";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAdmin } from "@/hooks/useStaffAdmin";
import { gsap } from "@/lib/gsap";
import { ARTIST, type MusicRow } from "./homeShared";

export default function HeroSection() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const staffAdmin = useStaffAdmin(user);
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroMusic, setHeroMusic] = useState<MusicRow[]>([]);
  const [reviewStats, setReviewStats] = useState<{ average: number; count: number } | null>(null);

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
    let cancelled = false;
    void fetch("/api/reviews?limit=60")
      .then((r) => r.json())
      .then((j: { reviews?: { rating: number }[] }) => {
        const rows = j.reviews ?? [];
        const count = rows.length;
        const average = count ? rows.reduce((s, x) => s + (x.rating || 0), 0) / count : 0;
        if (!cancelled) setReviewStats({ average, count });
      })
      .catch(() => {
        if (!cancelled) setReviewStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    heroMusic.length > 0 && currentTrack?.id === heroMusic[0]?.id && isPlaying;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".kc-hero-badge", { opacity: 0, y: 10, duration: 0.5 }, 0.05)
        .from(".kc-hero-logo", { opacity: 0, y: 28, scale: 0.95, duration: 1.0 }, 0.15)
        .from(".kc-hero-subtitle", { opacity: 0, y: 16, duration: 0.7 }, 0.65)
        .from(".kc-hero-ctas", { opacity: 0, y: 14, duration: 0.55 }, 0.85)
        .from(".kc-hero-stats", { opacity: 0, y: 12, duration: 0.6 }, 1.05);
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative -mt-1 min-h-[480px] overflow-hidden">
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

      <div ref={heroRef} className="relative z-10 flex min-h-[480px] flex-col justify-end px-4 pb-12 pt-28 sm:px-8 lg:px-12">
        <div className="kc-hero-badge mb-3 flex items-center gap-2">
          <span
            className="material-symbols-outlined text-primary text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
          <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Verified Artist</span>
        </div>
        <div className="kc-hero-logo mb-4 max-w-[min(92vw,560px)]">
          <Image
            src="/killercutz-logo.webp"
            alt="KillerCutz Ghana"
            width={560}
            height={180}
            priority
            className="h-auto w-full drop-shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
          />
        </div>
        <p className="kc-hero-subtitle mb-6 max-w-lg font-headline text-base text-on-surface-variant">
          Master of the decks. Afrobeat &amp; Highlife fusion from Accra to the world.
        </p>
        {reviewStats?.count ? (
          <div className="mb-4">
            <p className="font-display text-2xl font-extrabold leading-none text-[#F5A623]">
              {reviewStats.average.toFixed(1)} ★
            </p>
            <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-white/50">
              Based on {reviewStats.count} reviews
            </p>
          </div>
        ) : null}
        <div className="kc-hero-ctas inline-grid w-max max-w-full auto-cols-max grid-flow-col items-center gap-3">
          <button
            type="button"
            onClick={() => void handleHeroPlay()}
            disabled={heroMusic.length === 0}
            className="glow-btn flex h-12 min-h-12 items-center justify-center gap-2 rounded-full border border-transparent bg-primary px-6 font-bold leading-none text-on-primary-fixed transition-transform duration-150 ease-out enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.96] sm:px-7"
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
              className="shadow-border flex h-12 min-h-12 items-center justify-center rounded-full bg-white/10 px-6 font-bold leading-none text-white transition-[background-color,box-shadow] hover:bg-white/20 sm:px-7"
            >
              Book the DJ
            </Link>
          ) : staffAdmin ? (
            <Link
              href="/admin"
              className="shadow-border flex h-12 min-h-12 items-center justify-center rounded-full bg-white/10 px-6 font-bold leading-none text-white transition-[background-color,box-shadow] hover:bg-white/20 sm:px-7"
            >
              Admin →
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/client/dashboard")}
              className="shadow-border flex h-12 min-h-12 items-center justify-center rounded-full bg-white/10 px-6 font-bold leading-none text-white transition-[background-color,box-shadow] hover:bg-white/20 sm:px-7"
            >
              My Dashboard →
            </button>
          )}
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
              <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-white/50">EVENTS PLAYED</p>
            </div>
            <div className="hidden h-10 w-px bg-outline-variant/30 sm:block" />
            <div>
              <p className="font-display text-3xl font-extrabold leading-none tracking-tight text-white tabular-nums sm:text-4xl">
                {DJ_STATS.yearsActive}
              </p>
              <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-white/50">YEARS ACTIVE</p>
            </div>
            <div className="hidden h-10 w-px bg-outline-variant/30 sm:block" />
            <div className="hidden sm:block">
              <p className="font-display text-3xl font-extrabold leading-none tracking-tight text-[#00BFFF] tabular-nums sm:text-4xl">
                {DJ_STATS.monthlyListeners}
              </p>
              <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-white/50">MONTHLY LISTENERS</p>
            </div>
            <div className="hidden h-10 w-px bg-outline-variant/30 sm:block" aria-hidden />
            <div>
              <p className="font-display text-3xl font-extrabold leading-none tracking-tight text-white tabular-nums sm:text-4xl">
                {DJ_STATS.followers}
              </p>
              <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-white/50">FOLLOWERS</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
