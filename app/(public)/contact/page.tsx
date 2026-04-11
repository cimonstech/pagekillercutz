"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import AnimateIn from "@/components/ui/AnimateIn";

const CONTACT_ITEMS = [
  { icon: "mail", label: "Direct Line", value: "hello@pagekillercutz.com" },
  { icon: "phone", label: "Global Pulse", value: "+233 240-990123" },
  { icon: "location_on", label: "Headquarters", value: "Accra Digital Center, GH" },
  { icon: "schedule", label: "Working Hours", value: "10:00 — 19:00 UTC" },
];

const SOCIAL = [
  { icon: "brand_awareness", label: "Instagram" },
  { icon: "language", label: "Soundcloud" },
  { icon: "graphic_eq", label: "Mixcloud" },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8 sm:py-14">
      {/* Ambient glows */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-secondary/6 rounded-full blur-[110px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-14 items-start">
        {/* Left — info */}
        <AnimateIn from={32} className="space-y-10">
          <div>
            <span className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-label text-[10px] tracking-[0.2em] uppercase mb-5 rounded-full">
              Get in Touch
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl leading-[0.9] uppercase tracking-tighter">
              Let&apos;s Talk.
            </h1>
          </div>

          <div className="space-y-7">
            {CONTACT_ITEMS.map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-surface-container-low border border-white/5 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </div>
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">{label}</p>
                  <p className="font-headline font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social */}
          <div className="flex items-center gap-3 pt-2">
            {SOCIAL.map(({ icon, label }) => (
              <Link
                key={label}
                href="/"
                aria-label={label}
                className="w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary-fixed hover:border-primary transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </Link>
            ))}
          </div>

          <Link
            href="/contact"
            className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-on-primary-fixed font-bold rounded-full hover:scale-105 transition-transform glow-btn text-sm"
          >
            Book the DJ
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </AnimateIn>

        {/* Right — form */}
        <AnimateIn from={32} delay={0.15} className="relative">
          {/* Glow behind card */}
          <div className="absolute -inset-4 bg-primary/6 blur-3xl rounded-full pointer-events-none" />
          <div className="relative glass-strong rounded-3xl p-7 lg:p-10">
            <h2 className="font-headline font-semibold text-lg mb-8">Send a Message</h2>

            {sent ? (
              <div className="text-center py-12">
                <span
                  className="material-symbols-outlined text-primary text-5xl mb-4 block"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <p className="font-headline font-semibold text-lg mb-2">Message Sent!</p>
                <p className="text-on-surface-variant text-sm">We&apos;ll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline">Full Name</label>
                    <input
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors placeholder:text-outline/40"
                      placeholder="Kofi Mensah"
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline">
                      Email Address
                    </label>
                    <input
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors placeholder:text-outline/40"
                      placeholder="kofi@example.com"
                      type="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline">Subject</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors text-on-surface appearance-none">
                    <option className="bg-surface">General Inquiry</option>
                    <option className="bg-surface">Booking &amp; Events</option>
                    <option className="bg-surface">Artist Partnership</option>
                    <option className="bg-surface">Technical Support</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline">Message</label>
                  <textarea
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors placeholder:text-outline/40 resize-none"
                    placeholder="Describe your vision or project..."
                    rows={4}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary text-on-primary-fixed flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs rounded-full hover:scale-[1.02] transition-transform glow-btn"
                >
                  Send Message <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </form>
            )}
          </div>
        </AnimateIn>
      </div>
    </div>
  );
}
