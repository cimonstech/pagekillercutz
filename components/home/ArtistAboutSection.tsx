"use client";

import Link from "next/link";
import AnimateIn from "@/components/ui/AnimateIn";
import { MemberAvatarStack } from "@/components/MemberAvatarStack";
import { DJ_INFO, DJ_STATS } from "@/lib/constants";

export default function ArtistAboutSection() {
  return (
    <AnimateIn from={32}>
      <section className="relative overflow-hidden rounded-3xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10" />
        <div className="glass relative flex flex-col items-start gap-8 rounded-3xl border-0 p-8 md:flex-row md:items-center lg:p-10">
          <div className="flex-1">
            <p className="mb-3 font-label text-xs uppercase tracking-widest text-primary">About the Artist</p>
            <h2 className="mb-4 font-display text-4xl uppercase tracking-display-title">{DJ_INFO.name}</h2>
            <p className="max-w-xl font-body text-sm leading-relaxed text-on-surface-variant">{DJ_INFO.bio}</p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary transition-all hover:gap-3 hover:bg-primary/15"
            >
              Read more <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="flex w-full shrink-0 flex-col items-start gap-6 md:w-auto md:items-center">
            <div className="flex flex-col items-start gap-2 md:items-center">
              <MemberAvatarStack size={40} className="justify-start" />
              <p className="text-left font-label text-[10px] uppercase tracking-widest text-on-surface-variant md:text-center">
                Fans in 7+ countries
              </p>
            </div>
            <div className="flex w-full flex-wrap justify-start gap-6 sm:gap-8 md:justify-center">
              <div className="text-left md:text-center">
                <p className="font-display text-4xl tabular-nums text-primary sm:text-5xl">{DJ_STATS.eventsPlayed}</p>
                <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Events</p>
              </div>
              <div className="text-left md:text-center">
                <p className="font-display text-4xl tabular-nums text-secondary sm:text-5xl">{DJ_STATS.yearsActive}</p>
                <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Years</p>
              </div>
              <div className="text-left md:text-center">
                <p className="font-display text-4xl tabular-nums text-white sm:text-5xl">{DJ_STATS.continents}</p>
                <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Continents</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AnimateIn>
  );
}
