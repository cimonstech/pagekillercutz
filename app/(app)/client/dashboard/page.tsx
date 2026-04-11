"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mockClientDashboard } from "@/lib/mockData";

/** Glass panel base (padding 24px applied per card). */
const glass =
  "rounded-[20px] border border-white/[0.08] bg-white/[0.05] p-6 backdrop-blur-[20px]";

const d = mockClientDashboard;

const notifications = [
  {
    icon: "notifications" as const,
    tone: "primary" as const,
    message: "Your booking was confirmed by Page KillerCutz.",
    time: "2 hours ago",
  },
  {
    icon: "notifications" as const,
    tone: "secondary" as const,
    message: "Playlist lock reminder — 7 days to go.",
    time: "1 day ago",
  },
  {
    icon: "notifications" as const,
    tone: "primary" as const,
    message: "Payment confirmation is still pending.",
    time: "3 days ago",
  },
];

export default function ClientDashboardPage() {
  const router = useRouter();

  return (
    <main className="relative z-[1] w-full min-w-0 pb-8 text-on-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6">
          {/* ROW 1 */}
          <div
            className={`group relative col-span-12 flex min-h-[320px] flex-col justify-end overflow-hidden lg:col-span-8 ${glass} border-0 p-8`}
          >
            <div className="absolute inset-0 z-0">
              <Image
                src={d.heroImageUrl}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover opacity-30 transition-transform duration-700 group-hover:scale-105"
                unoptimized
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#13131a] via-[#13131a]/60 to-transparent" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant">Your Event</span>
                <span className="rounded bg-primary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-primary-container">
                  {d.eventType}
                </span>
              </div>
              <h1 className="font-headline text-[22px] font-semibold leading-tight tracking-tight text-white">{d.eventName}</h1>
              <div className="flex flex-wrap gap-6 text-sm font-medium text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-primary">calendar_today</span>
                  <span className="font-body">{d.eventDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                  <span className="font-body">{d.venue}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[#00BFFF]">
                  <span className="material-symbols-outlined text-lg">fingerprint</span>
                  <span>{d.eventId}</span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/client/playlist")}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#00BFFF] py-3 font-headline text-sm font-semibold text-black transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  Curate Your Playlist <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          <div
            className={`col-span-12 flex flex-col justify-between border-l-[3px] border-[#F5A623] lg:col-span-4 ${glass}`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-on-surface-variant">Payment Status</span>
                {d.paymentStatus === "pending" ? (
                  <span className="rounded-full border border-[#F5A623]/30 bg-[#F5A623]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F5A623]">
                    Pending
                  </span>
                ) : (
                  <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                    Confirmed
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-on-surface-variant">Amount Due</p>
                <p className="font-headline text-4xl font-bold text-[#F5A623]">{d.amountDue}</p>
              </div>
              <div className="rounded-sm border border-outline-variant/10 bg-surface-container-highest/40 p-4">
                <p className="mb-3 font-body text-[12px] leading-snug text-on-surface-variant">
                  Send via Mobile Money using your Event ID as reference.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium text-on-surface-variant">DJ MoMo</span>
                    <span className="font-mono text-lg text-[#00BFFF]">{d.djMoMo}</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">content_copy</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="mt-6 w-full border border-[#F5A623] py-3 text-sm font-bold uppercase tracking-widest text-[#F5A623] transition-colors hover:bg-[#F5A623]/10"
            >
              Confirm Payment
            </button>
          </div>

          {/* ROW 2 */}
          <div className={`col-span-12 flex flex-col md:col-span-4 lg:col-span-3 ${glass}`}>
            <h3 className="mb-6 font-headline text-lg font-semibold text-on-surface">Your Playlist</h3>
            <div className="flex flex-1 flex-col space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_#8fd6ff]" />
                <span className="text-sm font-medium text-on-surface">{d.mustPlayCount} Must-play songs</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-error shadow-[0_0_8px_#ffb4ab]" />
                <span className="text-sm font-medium text-on-surface">{d.doNotPlayCount} Do-not-play</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_8px_#ffb955]" />
                <span className="text-sm font-medium text-on-surface">{d.timelineMoments} Timeline moments</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/client/playlist")}
              className="mt-8 flex items-center gap-2 text-sm font-bold text-primary transition-transform hover:translate-x-1"
            >
              Edit Playlist <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>

          <div
            className={`relative col-span-12 flex flex-col items-center justify-center md:col-span-4 lg:col-span-3 ${glass}`}
            style={{
              boxShadow:
                "0 0 0 1px rgba(0,191,255,0.20), 0 8px 32px rgba(0,191,255,0.08)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-primary/5 blur-3xl" />
            <div className="relative text-center">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-on-surface-variant">
                Days Until Your Event
              </p>
              <p className="font-headline text-[64px] font-bold leading-none text-[#00BFFF] drop-shadow-[0_0_15px_rgba(143,214,255,0.4)]">
                {d.daysUntilEvent}
              </p>
              <p className="mt-2 font-body text-xs uppercase tracking-[0.3em] text-on-surface-variant">days to go</p>
            </div>
            <div className="absolute bottom-4 flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
            </div>
          </div>

          <div className={`col-span-12 md:col-span-12 lg:col-span-6 ${glass}`}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-headline text-lg font-semibold text-on-surface">Recent Updates</h3>
              <span className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-primary">View All</span>
            </div>
            <div className="space-y-4">
              {notifications.map((n, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-4 rounded p-3 transition-colors hover:bg-surface-container-highest/30"
                >
                  <span
                    className={[
                      "material-symbols-outlined rounded p-2",
                      n.tone === "primary" ? "bg-primary/10 text-primary-container" : "bg-secondary/10 text-secondary",
                    ].join(" ")}
                  >
                    {n.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[13px] font-medium text-on-surface">{n.message}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                      {n.time}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100">
                    chevron_right
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ROW 3 */}
          <div className={`col-span-12 overflow-hidden border-l-[3px] border-[#F5A623] ${glass}`}>
            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F5A623]">Package</span>
                  <h2 className="font-headline text-[18px] font-semibold text-white">{d.packageName}</h2>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  {d.packageInclusions.map((line) => (
                    <div key={line} className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-sm text-primary-container"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      <span className="text-sm text-on-surface-variant">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
                  Included in your booking
                </span>
                <span className="font-headline text-[28px] font-bold text-[#F5A623]">{d.packagePrice}</span>
                <Link
                  href="/booking"
                  className="mt-1 border-b border-primary/30 pb-0.5 text-[12px] font-bold uppercase text-primary transition-all hover:border-primary"
                >
                  Details &amp; Contract
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}
