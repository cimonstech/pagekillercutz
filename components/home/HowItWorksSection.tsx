"use client";

import Link from "next/link";
import AnimateIn from "@/components/ui/AnimateIn";

export default function HowItWorksSection() {
  return (
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
          <Link href="/booking" className="mt-2 inline-block font-label text-[10px] text-[#00BFFF] hover:underline">
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
          <Link href="/sign-in" className="mt-2 inline-block font-label text-[10px] text-[#00BFFF] hover:underline">
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
  );
}
