"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import AnimateIn from "@/components/ui/AnimateIn";
import { gsap } from "@/lib/gsap";
import { BorderDrawEdges } from "@/components/ui/BorderDrawEdges";
import { parseDurationLabel } from "@/lib/player-utils";
import type { PlayerTrack } from "@/lib/store/playerStore";
import { usePlayerStore } from "@/lib/store/playerStore";

const TABS = ["Discography", "Mixes", "Singles", "Videos"] as const;
type Tab = (typeof TABS)[number];

interface Release {
  id: string;
  title: string;
  meta: string;
  src: string;
  audioUrl?: string | null;
  durationSec?: number;
}

const ARTIST = "Page KillerCutz";

const FEATURED_ALBUM_COVER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDsbMyDOGr-pT4p9pEs6Mhc0DEx4bKES3dhUS54WTDMhn9njvaY2hkIeR67Uj05-PDah2tC6CoHnsjD1wwbGhYLbgMvSNceQd89NrVjiO1PgBEGqchMY7qDpgELymZ4YD_hYv08PeBXyRcjvc4smD_nSjJVtFDgc-HNEsn7uYubcv0uf-16qUopnuC1apIXwDcpD1tPd8u_qIF79wyZr_bJ_O55y3WXMamRTlyuZR4JKgxGcyuiDKAXydBMHA46E4LzlT4_x0WQdy03";

function releaseToTrack(item: Release): PlayerTrack {
  return {
    id: item.id,
    title: item.title,
    artist: ARTIST,
    coverUrl: item.src,
    audioUrl: item.audioUrl ?? null,
    durationSec: item.durationSec && item.durationSec > 0 ? item.durationSec : 210,
  };
}

async function playReleaseFromApi(item: Release, playOrResume: (t: PlayerTrack) => void) {
  const track = releaseToTrack(item);
  if (track.audioUrl) {
    playOrResume(track);
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
      playOrResume({
        ...track,
        audioUrl: m.audio_url ?? null,
        durationSec:
          typeof m.duration === "number" && m.duration > 0 ? m.duration : track.durationSec,
      });
      return;
    }
  } catch {
    /* fall through to simulated */
  }
  playOrResume({ ...track, audioUrl: null });
}

const FALLBACK_RELEASES: Release[] = [
  {
    id: "accra-nights",
    title: "Accra Nights Vol. 4",
    meta: "ALBUM • 2024",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuA_J8F7-4RVVlbNfMJYSHK_wTOwViXFk2svzkgbdaYzVcKn7a-V2MmKfvGGczRI5HBPCZ1aCZEsPp_xyaJRiwZuED8FZNWb82YmI42TK_WRpoi7nTpp5yzxU4qNbon9T2h-A-oMX82TUM3TBmIOZ2-rqEhSVn6--NtPHaXX1Cu79bJJSRF9sYT8Iph9rTQ8E5Zk1a9tEiAZgCIj43yr0v2f3nfyXc8SIhqYy0whtdNShNGwzXIFjIN0tJuIudD2Qajj9tmaR5HBQ16E",
  },
  {
    id: "electric-highlife",
    title: "Electric Highlife",
    meta: "EP • 2024",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAAA8N-43lShzE9loAwKatvzNqq99mT4lW7ygl0ubRVKphP8-54gJBxSQgzu2Nvoa0I50iZdxNPQeElcJrpcyCE999sBN6Jk3YwfaXRJ7Znr1-SyPJq2a_Mn4sPLU3HS4b-9D5qD7EsclNPg05p78OHFzl4MSc5PIf6TQ2L7RfYIF8NajhtvSYD08FEAAzP229hfOOdM-GcjMcR-IIgErHdx_UaawC8lyRSaJht2nY5vQmfsZb-40j6qGOKTnDqwfzz2kYO0h80m91P",
  },
  {
    id: "sunsum-remixes",
    title: "Sunsum Remixes",
    meta: "SINGLE • 2023",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCh9xQ8m8pUduhGDxcDbI806SedBbB4nE_e5h5avgkzmrC_CWc0tbUhlXHS44ZK_TrEj4ZQfjBQhWR8hFYtBopNgaN8WD6JJBFu1Lrt03gpUT3vXwGvjUHVPtpXtkWFI5q5VpjO7MWlkE_f-wKwa37q0sEeXXSI7OEi5Mj5cRfa8OPDX7RtE7sqFV2iqcc8ZzFZ23FklyS1FJtEalsseHQVMhpYoEcTM2V6UXscb1lDoNYHoD54w0q4gAlq92Fs0cpW1HOfwCRDzVZG",
  },
  {
    id: "gold-coast-grooves",
    title: "Gold Coast Grooves",
    meta: "ALBUM • 2023",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBofh7EfLBPXxk4q4cOKq4CL3j-ev4gA54uGRpYw4d05L-TFgl4N97KElS4lDmXgTY-6TqRyb4rLsKqpMwV3mUvmRVr6Nw42ba9NYAlFWP5bB34lWfj4VAxaKYKOB57jMR35mOaMUvfHe9_zS9UPG77HFKrgeBeXbwjh8iGjcqjbjFBPCAtcXgGLYCcg2z-i52twJHDmIV3u1ZtH5i5srA_omuRctzDusSmMHyjVAeOoA-L0pFvsj1giZFnPOLfax7_4nFA1nuIBeug",
  },
  {
    id: "kpanlogo-rave",
    title: "Kpanlogo Rave",
    meta: "EP • 2023",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDICHzUL0Val8phgSd8QHb-HJNmHH8GXdgKrkhYpFy7F28mJwnWoosgF8RpSKdRfmCqJicCacMm-KnyJNKzSQx0EA2RIRzvMUtpWvkgAPabGWu75YP6n1lSd4pv02zuZywMX-7DgPWVdknc5jEGULVz33aL_2Qb52RSokrn6ZA2bdOzqF4Rkeb6nVy-_6jZ_JruW-eI87s5eO0mEOVqvmoGefDOxa8XQnLcsNNc4G4TACznyPEpMNcsgjXFPfRW1d6NA0WywhW9dAQr",
  },
];

const FEATURED_TRACKS = [
  { n: "01", title: "Ahenfie (The Palace)", duration: "4:32" },
  { n: "02", title: "Cybernetic Dreams", duration: "5:18" },
  { n: "03", title: "The Void Echoes", duration: "3:55" },
  { n: "04", title: "Static Interference", duration: "4:12" },
];

export default function MusicPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Discography");
  const [releases, setReleases] = useState<Release[]>(FALLBACK_RELEASES);
  const playOrResume = usePlayerStore((s) => s.playOrResume);
  const bannerRef = useRef<HTMLDivElement>(null);

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
    (item: Release) => {
      void playReleaseFromApi(item, playOrResume);
    },
    [playOrResume],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/music");
        const json = (await res.json()) as {
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
        const mapped = (json.music ?? []).map((m) => ({
          id: m.id,
          title: m.title,
          meta: `${m.type.toUpperCase()}${m.release_date ? ` • ${new Date(m.release_date).getFullYear()}` : ""}`,
          src: m.cover_url ?? FALLBACK_RELEASES[0].src,
          audioUrl: m.audio_url,
          durationSec:
            typeof m.duration === "number" && m.duration > 0 ? m.duration : undefined,
        }));
        if (mapped.length) setReleases(mapped);
      } catch {
        // keep fallback
      }
    };
    void load();
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
              onClick={() => playRelease(releases[0] ?? FALLBACK_RELEASES[0])}
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
          <AnimateIn stagger={0.06} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {releases.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-3xl bg-surface-container-low p-3 transition-[background-color] hover:bg-surface-container-high"
              >
                <BorderDrawEdges />
                <div className="relative z-10">
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-surface-container">
                    <Link href={`/music/${item.id}`} className="absolute inset-0 block">
                      <Image
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={item.title}
                        src={item.src}
                        fill
                        unoptimized
                      />
                    </Link>
                    <button
                      type="button"
                      className="absolute bottom-2 right-2 z-20 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-primary opacity-0 shadow-[0_4px_16px_rgba(0,191,255,0.5)] transition-[transform,opacity] duration-300 group-hover:translate-y-0 group-hover:opacity-100 active:scale-[0.96]"
                      aria-label={`Play ${item.title}`}
                      onClick={() => playRelease(item)}
                    >
                      <span
                        className="material-symbols-outlined text-[20px] text-on-primary-fixed ml-[2px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        play_arrow
                      </span>
                    </button>
                  </div>
                  <Link href={`/music/${item.id}`} className="block">
                    <h3 className="truncate font-headline text-sm font-bold">{item.title}</h3>
                    <p className="mt-0.5 font-label text-[10px] text-on-surface-variant">{item.meta}</p>
                  </Link>
                </div>
              </div>
            ))}
          </AnimateIn>
        </section>

        {/* ── Featured album ── */}
        <AnimateIn from={28}>
        <section>
          <h2 className="font-headline text-xs uppercase tracking-widest text-on-surface-variant mb-6">
            Featured Album
          </h2>
          <div className="glass rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-56 h-48 md:h-56 shrink-0 overflow-hidden rounded-xl shadow-2xl relative">
              <Image
                className="w-full h-full object-cover"
                alt="Electric Pulse"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsbMyDOGr-pT4p9pEs6Mhc0DEx4bKES3dhUS54WTDMhn9njvaY2hkIeR67Uj05-PDah2tC6CoHnsjD1wwbGhYLbgMvSNceQd89NrVjiO1PgBEGqchMY7qDpgELymZ4YD_hYv08PeBXyRcjvc4smD_nSjJVtFDgc-HNEsn7uYubcv0uf-16qUopnuC1apIXwDcpD1tPd8u_qIF79wyZr_bJ_O55y3WXMamRTlyuZR4JKgxGcyuiDKAXydBMHA46E4LzlT4_x0WQdy03"
                fill
                unoptimized
              />
            </div>
            <div className="flex-1">
              <span className="font-label text-[10px] text-primary uppercase tracking-widest">Now Featured</span>
              <h2 className="font-display text-5xl text-white uppercase tracking-tighter mt-1 mb-6">
                Electric Pulse (Deluxe)
              </h2>
              <div className="space-y-1">
                {FEATURED_TRACKS.map(({ n, title, duration }, i) => (
                  <button
                    key={n}
                    type="button"
                    className={[
                      "flex w-full items-center gap-5 px-3 py-2.5 rounded-lg transition-[background-color] active:scale-[0.96] transition-transform duration-150 group text-left",
                      i === 1 ? "bg-primary/8 shadow-[0_0_0_1px_rgba(0,191,255,0.15)]" : "hover:bg-white/5",
                    ].join(" ")}
                    onClick={() =>
                      playOrResume({
                        id: `featured-${n}`,
                        title,
                        artist: ARTIST,
                        coverUrl: FEATURED_ALBUM_COVER,
                        audioUrl: null,
                        durationSec: parseDurationLabel(duration),
                      })
                    }
                  >
                    <span className={`font-label text-xs w-5 ${i === 1 ? "text-primary" : "text-on-surface-variant"}`}>
                      {n}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <span
                        className={`font-headline text-sm font-medium ${i === 1 ? "text-primary" : "text-on-surface"}`}
                      >
                        {title}
                      </span>
                      {i === 1 && (
                        <span
                          className="material-symbols-outlined text-primary text-[14px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          equalizer
                        </span>
                      )}
                    </div>
                    <span className={`font-label text-xs ${i === 1 ? "text-primary" : "text-on-surface-variant"}`}>
                      {duration}
                    </span>
                    <span
                      className={`material-symbols-outlined text-[18px] ${i === 1 ? "text-primary" : "text-on-surface-variant group-hover:text-primary transition-colors"}`}
                    >
                      {i === 1 ? "favorite" : "more_horiz"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
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
                    <p className="mt-0.5 font-label text-[10px] text-on-surface-variant">
                      {["18:24", "22:41", "15:08", "31:55"][i]}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </AnimateIn>
        </section>

        {/* ── Sign-in prompt ── */}
        <section className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 border-l-[3px] border-primary">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-2xl">headphones</span>
            <div>
              <p className="font-headline font-bold">Listen to the full catalog</p>
              <p className="text-on-surface-variant text-sm">
                Sign in to stream every track, mix, and exclusive release.
              </p>
            </div>
          </div>
          <Link
            href="/sign-in"
            className="shrink-0 px-6 py-2.5 bg-primary text-on-primary-fixed font-bold rounded-full text-sm uppercase tracking-widest active:scale-[0.96] transition-transform duration-150 ease-out glow-btn"
          >
            Sign In
          </Link>
        </section>
      </div>
    </div>
  );
}
