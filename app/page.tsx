"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { MemberAvatarStack } from "@/components/MemberAvatarStack";
import { BorderDrawEdges } from "@/components/ui/BorderDrawEdges";
import HomeAnnouncementBar from "@/components/home/HomeAnnouncementBar";
import HomeFeaturedMixCard from "@/components/home/HomeFeaturedMixCard";
import HomeGenreChips from "@/components/home/HomeGenreChips";
import ShaderBackground from "@/components/ui/ShaderBackground";
import PublicSidebar from "@/components/layout/PublicSidebar";
import PublicTopBar from "@/components/layout/PublicTopBar";
import PublicFooter from "@/components/layout/PublicFooter";
import AnimateIn from "@/components/ui/AnimateIn";
import { parseDurationLabel } from "@/lib/player-utils";
import { usePlayerStore } from "@/lib/store/playerStore";
import { gsap } from "@/lib/gsap";

const RELEASES = [
  {
    id: 1,
    title: "Accra Nights Vol. 4",
    subtitle: "2024 · Album",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuA_J8F7-4RVVlbNfMJYSHK_wTOwViXFk2svzkgbdaYzVcKn7a-V2MmKfvGGczRI5HBPCZ1aCZEsPp_xyaJRiwZuED8FZNWb82YmI42TK_WRpoi7nTpp5yzxU4qNbon9T2h-A-oMX82TUM3TBmIOZ2-rqEhSVn6--NtPHaXX1Cu79bJJSRF9sYT8Iph9rTQ8E5Zk1a9tEiAZgCIj43yr0v2f3nfyXc8SIhqYy0whtdNShNGwzXIFjIN0tJuIudD2Qajj9tmaR5HBQ16E",
  },
  {
    id: 2,
    title: "Electric Highlife",
    subtitle: "2024 · EP",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAAA8N-43lShzE9loAwKatvzNqq99mT4lW7ygl0ubRVKphP8-54gJBxSQgzu2Nvoa0I50iZdxNPQeElcJrpcyCE999sBN6Jk3YwfaXRJ7Znr1-SyPJq2a_Mn4sPLU3HS4b-9D5qD7EsclNPg05p78OHFzl4MSc5PIf6TQ2L7RfYIF8NajhtvSYD08FEAAzP229hfOOdM-GcjMcR-IIgErHdx_UaawC8lyRSaJht2nY5vQmfsZb-40j6qGOKTnDqwfzz2kYO0h80m91P",
  },
  {
    id: 3,
    title: "Sunsum Remixes",
    subtitle: "2023 · Single",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCh9xQ8m8pUduhGDxcDbI806SedBbB4nE_e5h5avgkzmrC_CWc0tbUhlXHS44ZK_TrEj4ZQfjBQhWR8hFYtBopNgaN8WD6JJBFu1Lrt03gpUT3vXwGvjUHVPtpXtkWFI5q5VpjO7MWlkE_f-wKwa37q0sEeXXSI7OEi5Mj5cRfa8OPDX7RtE7sqFV2iqcc8ZzFZ23FklyS1FJtEalsseHQVMhpYoEcTM2V6UXscb1lDoNYHoD54w0q4gAlq92Fs0cpW1HOfwCRDzVZG",
  },
  {
    id: 4,
    title: "Gold Coast Grooves",
    subtitle: "2023 · Album",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBofh7EfLBPXxk4q4cOKq4CL3j-ev4gA54uGRpYw4d05L-TFgl4N97KElS4lDmXgTY-6TqRyb4rLsKqpMwV3mUvmRVr6Nw42ba9NYAlFWP5bB34lWfj4VAxaKYKOB57jMR35mOaMUvfHe9_zS9UPG77HFKrgeBeXbwjh8iGjcqjbjFBPCAtcXgGLYCcg2z-i52twJHDmIV3u1ZtH5i5srA_omuRctzDusSmMHyjVAeOoA-L0pFvsj1giZFnPOLfax7_4nFA1nuIBeug",
  },
];

const TRACKS = [
  {
    rank: 1,
    title: "Ahenfie (The Palace)",
    plays: "1.2M plays",
    duration: "4:22",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvRZg1SWShtFtmiQNiNDxJG9hkNMTGHFJBFL_rpGrxOeT9GZBJrew4HkFwk4kKyEK0M2ob0WrMHA5nXNWadQomJSJhyYwugGbtR-zgKfXPs3gOw2VX0bQHwhvVkLynGJYhadu2H5SSLRBVpuPTu0h6qQk933iXUyh1jqD0Jc8kLgosJwAQw11e5QpXgK8iEPL5pgO-3Obusrzj0b9dVxADEIAowOLWPJTEyZ9wCKAS1-o8VQI8eRa0Ur8DloQww2gshOOmO8KTQXPG",
  },
  {
    rank: 2,
    title: "Gold Coast Grooves",
    plays: "980K plays",
    duration: "3:45",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBofh7EfLBPXxk4q4cOKq4CL3j-ev4gA54uGRpYw4d05L-TFgl4N97KElS4lDmXgTY-6TqRyb4rLsKqpMwV3mUvmRVr6Nw42ba9NYAlFWP5bB34lWfj4VAxaKYKOB57jMR35mOaMUvfHe9_zS9UPG77HFKrgeBeXbwjh8iGjcqjbjFBPCAtcXgGLYCcg2z-i52twJHDmIV3u1ZtH5i5srA_omuRctzDusSmMHyjVAeOoA-L0pFvsj1giZFnPOLfax7_4nFA1nuIBeug",
  },
  {
    rank: 3,
    title: "Sunlight over Labadi",
    plays: "850K plays",
    duration: "5:12",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDICHzUL0Val8phgSd8QHb-HJNmHH8GXdgKrkhYpFy7F28mJwnWoosgF8RpSKdRfmCqJicCacMm-KnyJNKzSQx0EA2RIRzvMUtpWvkgAPabGWu75YP6n1lSd4pv02zuZywMX-7DgPWVdknc5jEGULVz33aL_2Qb52RSokrn6ZA2bdOzqF4Rkeb6nVy-_6jZ_JruW-eI87s5eO0mEOVqvmoGefDOxa8XQnLcsNNc4G4TACznyPEpMNcsgjXFPfRW1d6NA0WywhW9dAQr",
  },
  {
    rank: 4,
    title: "Nkran Rhythms",
    plays: "720K plays",
    duration: "4:01",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuA_J8F7-4RVVlbNfMJYSHK_wTOwViXFk2svzkgbdaYzVcKn7a-V2MmKfvGGczRI5HBPCZ1aCZEsPp_xyaJRiwZuED8FZNWb82YmI42TK_WRpoi7nTpp5yzxU4qNbon9T2h-A-oMX82TUM3TBmIOZ2-rqEhSVn6--NtPHaXX1Cu79bJJSRF9sYT8Iph9rTQ8E5Zk1a9tEiAZgCIj43yr0v2f3nfyXc8SIhqYy0whtdNShNGwzXIFjIN0tJuIudD2Qajj9tmaR5HBQ16E",
  },
  {
    rank: 5,
    title: "Kpanlogo Rave",
    plays: "610K plays",
    duration: "6:15",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCh9xQ8m8pUduhGDxcDbI806SedBbB4nE_e5h5avgkzmrC_CWc0tbUhlXHS44ZK_TrEj4ZQfjBQhWR8hFYtBopNgaN8WD6JJBFu1Lrt03gpUT3vXwGvjUHVPtpXtkWFI5q5VpjO7MWlkE_f-wKwa37q0sEeXXSI7OEi5Mj5cRfa8OPDX7RtE7sqFV2iqcc8ZzFZ23FklyS1FJtEalsseHQVMhpYoEcTM2V6UXscb1lDoNYHoD54w0q4gAlq92Fs0cpW1HOfwCRDzVZG",
  },
];

const ARTIST = "Page KillerCutz";

export default function Home() {
  const playOrResume = usePlayerStore((s) => s.playOrResume);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".kc-hero-badge",    { opacity: 0, y: 10, duration: 0.5 }, 0.05)
        .from(".kc-hero-logo",     { opacity: 0, y: 28, scale: 0.95, duration: 1.0 }, 0.15)
        .from(".kc-hero-subtitle", { opacity: 0, y: 16, duration: 0.7 }, 0.65)
        .from(".kc-hero-ctas > *", { opacity: 0, y: 14, duration: 0.55, stagger: 0.09 }, 0.85)
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

            <HomeFeaturedMixCard />

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
              <div className="kc-hero-ctas flex flex-wrap items-center justify-start gap-4">
                <Link
                  href="/sign-in"
                  className="flex items-center gap-2 pl-7 pr-6 py-3 bg-primary text-on-primary-fixed font-bold rounded-full active:scale-[0.96] transition-transform duration-150 ease-out glow-btn"
                >
                  <span
                    className="material-symbols-outlined text-[20px] ml-[2px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    play_arrow
                  </span>
                  Play
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 px-7 py-3 bg-white/10 text-white font-bold rounded-full shadow-border hover:bg-white/20 transition-[background-color,box-shadow]"
                >
                  Book the DJ
                </Link>
                <Link
                  href="/about"
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 text-on-surface-variant hover:text-on-surface hover:border-white/40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                </Link>
              </div>
              <div
                className="kc-hero-stats mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 xl:mt-10"
                aria-label="Artist stats with community avatars"
              >
                <MemberAvatarStack size={34} />
                <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                    <div>
                      <p className="font-display text-3xl font-extrabold leading-none tracking-tight text-[#00BFFF] tabular-nums sm:text-4xl">
                        100+
                      </p>
                      <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-white/50">
                        EVENTS PLAYED
                      </p>
                    </div>
                    <div className="hidden h-10 w-px bg-outline-variant/30 sm:block" />
                    <div>
                      <p className="font-display text-3xl font-extrabold leading-none tracking-tight text-white tabular-nums sm:text-4xl">
                        12+
                      </p>
                      <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-white/50">
                        YEARS ACTIVE
                      </p>
                    </div>
                    <div className="hidden h-10 w-px bg-outline-variant/30 sm:block" />
                    <div>
                      <p className="font-display text-3xl font-extrabold leading-none tracking-tight text-[#00BFFF] tabular-nums sm:text-4xl">
                        50K
                      </p>
                      <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-white/50">
                        MONTHLY LISTENERS
                      </p>
                    </div>
                    <div className="hidden h-10 w-px bg-outline-variant/30 sm:block" />
                    <div>
                      <p className="font-display text-3xl font-extrabold leading-none tracking-tight text-white tabular-nums sm:text-4xl">
                        2K
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
                    {TRACKS.map((t, i) => (
                      <button
                        key={t.rank}
                        type="button"
                        className="group flex w-full items-center gap-4 rounded-full px-4 py-2 hover:bg-white/5 transition-[background-color] active:scale-[0.96] transition-transform duration-150 ease-out text-left"
                        onClick={() =>
                          playOrResume({
                            id: `popular-${t.rank}`,
                            title: t.title,
                            artist: ARTIST,
                            coverUrl: t.src,
                            audioUrl: null,
                            durationSec: parseDurationLabel(t.duration),
                          })
                        }
                      >
                        <span className="font-label text-sm text-on-surface-variant w-4 text-right shrink-0 group-hover:hidden">
                          {i + 1}
                        </span>
                        <span
                          className="material-symbols-outlined text-sm text-on-surface-variant hidden group-hover:block shrink-0 w-4"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          play_arrow
                        </span>
                        <div className="relative size-10 rounded-md overflow-hidden bg-surface-container shrink-0">
                          <Image fill src={t.src} alt={t.title} className="object-cover" unoptimized />
                        </div>
                        <p className="flex-1 font-headline text-sm font-medium truncate">{t.title}</p>
                        <p className="font-label text-xs text-on-surface-variant hidden sm:block shrink-0">{t.plays}</p>
                        <p className="font-label text-xs text-on-surface-variant shrink-0">{t.duration}</p>
                      </button>
                    ))}
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
                        href="/contact"
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
              <AnimateIn stagger={0.07} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {RELEASES.map((r) => (
                  <div
                    key={r.id}
                    className="group relative overflow-hidden rounded-3xl bg-surface-container-low p-3 transition-[background-color] hover:bg-surface-container-high"
                  >
                    <BorderDrawEdges />
                    <div className="relative z-10">
                      <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-surface-container shadow-lg">
                        <Link href={`/music/${r.id}`} className="absolute inset-0 block">
                          <Image
                            fill
                            src={r.src}
                            alt={r.title}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                          />
                        </Link>
                        <button
                          type="button"
                          className="absolute bottom-2 right-2 z-20 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-primary opacity-0 shadow-[0_4px_16px_rgba(0,191,255,0.5)] transition-[transform,opacity] duration-300 group-hover:translate-y-0 group-hover:opacity-100 active:scale-[0.96]"
                          aria-label={`Play ${r.title}`}
                          onClick={() =>
                            playOrResume({
                              id: `release-${r.id}`,
                              title: r.title,
                              artist: ARTIST,
                              coverUrl: r.src,
                              audioUrl: null,
                              durationSec: 240,
                            })
                          }
                        >
                          <span
                            className="material-symbols-outlined text-[20px] text-on-primary-fixed ml-[2px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            play_arrow
                          </span>
                        </button>
                      </div>
                      <Link href={`/music/${r.id}`} className="block">
                        <p className="truncate font-headline text-sm font-semibold">{r.title}</p>
                        <p className="mt-1 font-label text-xs text-on-surface-variant">{r.subtitle}</p>
                      </Link>
                    </div>
                  </div>
                ))}
              </AnimateIn>
            </section>

            {/* About glass card */}
            <AnimateIn from={32}>
            <section className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10 pointer-events-none" />
              <div className="relative glass border-0 rounded-3xl p-8 lg:p-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <p className="font-label text-xs text-primary uppercase tracking-widest mb-3">About the Artist</p>
                  <h2 className="font-display text-4xl uppercase tracking-tighter mb-4">Page KillerCutz</h2>
                  <p className="text-on-surface-variant font-body leading-relaxed text-sm max-w-xl">
                    Hailing from the vibrant streets of Accra, Page KillerCutz has redefined the sound of modern West
                    Africa. Merging deep traditional Highlife rhythms with cutting-edge electronic production, his sets
                    are legendary for their energy and cultural depth.
                  </p>
                  <Link
                    href="/about"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary transition-all hover:gap-3 hover:bg-primary/15"
                  >
                    Read more{" "}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
                <div className="flex flex-col items-center gap-6 shrink-0">
                  <div className="flex flex-col items-center gap-2">
                    <MemberAvatarStack size={40} />
                    <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest text-center">
                      Fans in 7+ countries
                    </p>
                  </div>
                  <div className="flex gap-6 sm:gap-8">
                    <div className="text-center">
                      <p className="font-display text-4xl sm:text-5xl text-primary tabular-nums">100+</p>
                      <p className="font-label text-[10px] text-on-surface-variant mt-1 uppercase tracking-widest">
                        Events
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-4xl sm:text-5xl text-secondary tabular-nums">12+</p>
                      <p className="font-label text-[10px] text-on-surface-variant mt-1 uppercase tracking-widest">
                        Years
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-4xl sm:text-5xl text-white tabular-nums">3</p>
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
            <section className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-2xl glass">
              <div>
                <h3 className="font-headline text-xl font-bold mb-1">Book Page KillerCutz</h3>
                <p className="text-on-surface-variant text-sm">
                  Available for festivals, weddings, corporate events, and club nights worldwide.
                </p>
              </div>
              <Link
                href="/contact"
                className="shrink-0 flex items-center gap-2 px-8 py-3 bg-primary text-on-primary-fixed font-bold rounded-full active:scale-[0.96] transition-transform duration-150 ease-out glow-btn"
              >
                Book Now <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </section>
            </AnimateIn>
          </div>
        </main>

        <PublicFooter />
      </div>
    </div>
  );
}
