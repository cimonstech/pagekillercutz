"use client";

import Link from "next/link";

const glass = "rounded-2xl border border-white/[0.08] bg-white/[0.05] p-8 backdrop-blur-[20px] shadow-2xl";

export default function BookingPage() {
  return (
    <div className="mx-auto max-w-[700px] px-4 pb-20 pt-8 text-on-surface md:px-6">
      <header className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="mb-2 font-headline text-[32px] font-semibold leading-none tracking-tight text-on-surface">Book the DJ</h1>
          <p className="font-body text-sm text-on-surface-variant">Reserve your date and customize your sonic experience.</p>
        </div>
        <Link href="/contact" className="text-xs font-medium text-primary hover:underline">
          Questions? Contact us →
        </Link>
      </header>

      <nav className="relative mb-12 flex items-center justify-between px-4">
        <div className="absolute left-0 top-1/2 z-0 h-0.5 w-full -translate-y-1/2 bg-surface-container-highest" />
        <div className="absolute left-0 top-1/2 z-0 h-0.5 w-[15%] -translate-y-1/2 bg-primary-container" />
        {(
          [
            ["1", "Details", true],
            ["2", "Vibe", false],
            ["3", "Payment", false],
          ] as const
        ).map(([num, label, on]) => (
          <div key={num} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={[
                "flex size-8 items-center justify-center rounded-full text-[12px] font-bold",
                on
                  ? "bg-primary-container text-on-primary-container shadow-[0_0_0_4px_rgba(0,191,255,0.2)] ring-4 ring-primary-container/20"
                  : "border-2 border-outline-variant bg-surface text-on-surface-variant",
              ].join(" ")}
            >
              {num}
            </div>
            <span
              className={[
                "font-mono text-[10px] uppercase tracking-widest",
                on ? "text-primary" : "text-on-surface-variant",
              ].join(" ")}
            >
              {label}
            </span>
          </div>
        ))}
      </nav>

      <section className={glass}>
        <div className="mb-8 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">event_note</span>
          <h2 className="font-headline text-xl font-medium text-on-surface">Event Details</h2>
        </div>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="px-1 font-body text-[12px] font-medium text-on-surface-variant">Full Name</label>
              <input
                className="rounded-lg border border-outline-variant/30 bg-[#16161F] px-4 py-3 text-on-surface outline-none transition-all focus:border-primary-container focus:ring-2 focus:ring-primary-container/50"
                placeholder="John Doe"
                type="text"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="px-1 font-body text-[12px] font-medium text-on-surface-variant">Email Address</label>
              <input
                className="rounded-lg border border-outline-variant/30 bg-[#16161F] px-4 py-3 text-on-surface outline-none transition-all focus:border-primary-container focus:ring-2 focus:ring-primary-container/50"
                placeholder="john@example.com"
                type="email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="px-1 font-body text-[12px] font-medium text-on-surface-variant">Phone Number</label>
              <input
                className="rounded-lg border border-outline-variant/30 bg-[#16161F] px-4 py-3 text-on-surface outline-none transition-all focus:border-primary-container focus:ring-2 focus:ring-primary-container/50"
                placeholder="+233 XX XXX XXXX"
                type="tel"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="px-1 font-body text-[12px] font-medium text-on-surface-variant">Event Type</label>
              <select className="appearance-none rounded-lg border border-outline-variant/30 bg-[#16161F] px-4 py-3 text-on-surface outline-none transition-all focus:border-primary-container focus:ring-2 focus:ring-primary-container/50">
                <option>Private Party</option>
                <option>Wedding</option>
                <option>Corporate Gala</option>
                <option>Club Set</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="px-1 font-body text-[12px] font-medium text-on-surface-variant">Event Date</label>
              <input
                className="rounded-lg border border-outline-variant/30 bg-[#16161F] px-4 py-3 text-on-surface outline-none transition-all focus:border-primary-container focus:ring-2 focus:ring-primary-container/50"
                type="date"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="px-1 font-body text-[12px] font-medium text-on-surface-variant">Guest Count</label>
              <input
                className="rounded-lg border border-outline-variant/30 bg-[#16161F] px-4 py-3 text-on-surface outline-none transition-all focus:border-primary-container focus:ring-2 focus:ring-primary-container/50"
                placeholder="50+"
                type="number"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="px-1 font-body text-[12px] font-medium text-on-surface-variant">Venue Address</label>
            <input
              className="rounded-lg border border-outline-variant/30 bg-[#16161F] px-4 py-3 text-on-surface outline-none transition-all focus:border-primary-container focus:ring-2 focus:ring-primary-container/50"
              placeholder="Venue, Accra"
              type="text"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="px-1 font-body text-[12px] font-medium text-on-surface-variant">Additional Notes</label>
            <textarea
              className="resize-none rounded-lg border border-outline-variant/30 bg-[#16161F] px-4 py-3 text-on-surface outline-none transition-all focus:border-primary-container focus:ring-2 focus:ring-primary-container/50"
              placeholder="Tell us about the vibe, special requests, or equipment available..."
              rows={4}
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-primary-container px-8 py-3 font-semibold text-on-primary-container shadow-[0_0_20px_rgba(0,191,255,0.3)] transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Continue
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
