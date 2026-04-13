import type { SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { BorderDrawEdges } from "@/components/ui/BorderDrawEdges";
import AnimateIn from "@/components/ui/AnimateIn";
import { DJ_INFO, DJ_STATS } from "@/lib/constants";

function IconInstagram({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className} {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function IconYoutube({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className} {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function IconSoundCloud({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className} {...props}>
      <path d="M1.175 12.225a.125.125 0 0 0-.101.1l-.233 2.154.233 2.105a.125.125 0 0 0 .2.098.125.125 0 0 0 .099-.09L1.5 14.48l-.225-2.115a.125.125 0 0 0-.1-.095zm1.564.314a.125.125 0 0 0-.103.096l-.207 1.841.213 1.856a.125.125 0 0 0 .213 0l.22-1.856-.22-1.839a.125.125 0 0 0-.103-.098zm1.618.014a.117.117 0 0 0-.115.108l-.173 1.827.18 1.868a.117.117 0 0 0 .224 0l.175-1.868-.175-1.827a.117.117 0 0 0-.116-.108zm1.722.051a.132.132 0 0 0-.133.13l-.15 1.776.158 1.883a.132.132 0 0 0 .264 0l.154-1.883-.154-1.776a.132.132 0 0 0-.133-.13zm.908.038a.14.14 0 0 0-.147.135l-.145 1.738.151 1.831a.14.14 0 0 0 .281 0l.148-1.831-.148-1.738a.14.14 0 0 0-.147-.135zm1.1.067a.147.147 0 0 0-.146.147l-.13 1.671.136 1.779a.147.147 0 0 0 .291 0l.136-1.779-.136-1.671a.147.147 0 0 0-.146-.147zm1.094.072a.158.158 0 0 0-.158.158l-.117 1.599.123 1.727a.158.158 0 0 0 .316 0l.117-1.727-.117-1.599a.158.158 0 0 0-.158-.158zm.903.07a.165.165 0 0 0-.165.165l-.105 1.529.11 1.675a.165.165 0 0 0 .33 0l.111-1.675-.111-1.529a.165.165 0 0 0-.165-.165zm.911.064a.173.173 0 0 0-.173.173l-.09 1.459.092 1.623a.173.173 0 0 0 .346 0l.093-1.623-.093-1.459a.173.173 0 0 0-.173-.173zm1.047.031a.181.181 0 0 0-.181.181l-.076 1.427.076 1.571a.181.181 0 0 0 .362 0l.077-1.571-.077-1.427a.181.181 0 0 0-.181-.181zm1.087-.008a.189.189 0 0 0-.189.189l-.064 1.435.064 1.519a.189.189 0 0 0 .378 0l.064-1.519-.064-1.435a.189.189 0 0 0-.189-.189zm1.096.016a.197.197 0 0 0-.197.197l-.05 1.419.05 1.467a.197.197 0 0 0 .394 0l.05-1.467-.05-1.419a.197.197 0 0 0-.197-.197zm1.14.041a.203.203 0 0 0-.203.203l-.033 1.378.033 1.415a.203.203 0 0 0 .406 0l.033-1.415-.033-1.378a.203.203 0 0 0-.203-.203zm1.191-.049a.211.211 0 0 0-.211.211l-.019 1.427.019 1.363a.211.211 0 0 0 .422 0l.019-1.363-.019-1.427a.211.211 0 0 0-.211-.211zm1.217-.051a.221.221 0 0 0-.221.221l-.002 1.425.002 1.311a.221.221 0 0 0 .442 0l.002-1.311-.002-1.425a.221.221 0 0 0-.221-.221zm1.233-.072a.233.233 0 0 0-.233.233l.013 1.417-.013 1.259a.233.233 0 0 0 .466 0l-.013-1.259.013-1.417a.233.233 0 0 0-.233-.233z" />
    </svg>
  );
}

function IconTiktok({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className} {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64v-3.5a6.41 6.41 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.59-4.63V9.3a8.16 8.16 0 0 0 4.77 1.52v-3.5a4.85 4.85 0 0 1-1-.63z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { name: "Instagram", href: "#", Icon: IconInstagram },
  { name: "YouTube", href: "#", Icon: IconYoutube },
  { name: "SoundCloud", href: "#", Icon: IconSoundCloud },
  { name: "TikTok", href: "#", Icon: IconTiktok },
] as const;

const PRESS_ASSETS = [
  { icon: "token", title: "Hi-Res Logo", desc: "Vector and PNG formats (Black/White/Cyan)", cta: "DOWNLOAD .ZIP (12MB)" },
  { icon: "description", title: "Official Bio", desc: "Short and long versions — PDF/DOCX", cta: "DOWNLOAD .PDF (2MB)" },
  { icon: "photo_camera", title: "Press Photos", desc: "Portrait and landscape by Kelvin Akpalu", cta: "DOWNLOAD .ZIP (85MB)" },
  { icon: "settings_input_component", title: "Tech Rider", desc: "Equipment requirements, stage plot v2024", cta: "DOWNLOAD .PDF (1MB)" },
];

const EQUIPMENT = [
  "2x Pioneer CDJ-3000 Multi-Players",
  "1x Pioneer DJM-V10 Mixer (6-channel)",
  "Rane SL4 Interface (DVS Support)",
  "2x Technics SL-1210MK7 Turntables",
];

const TESTIMONIALS = [
  {
    initials: "AM",
    quote:
      '"The energy Page brings is unparalleled. He doesn\'t just play tracks; he creates an atmosphere that keeps the dancefloor locked for 4+ hours straight."',
    name: "Amara Mensah",
    role: "Events Director, GloFest",
  },
  {
    initials: "SO",
    quote:
      '"Incredible technical skill mixed with a deep understanding of crowd psychology. A professional through and through."',
    name: "Samuel Osei",
    role: "Manager, The Sky Lounge Accra",
  },
  {
    initials: "KL",
    quote:
      '"The premier choice for luxury brand activations. Page KillerCutz understands exactly how to balance background sophistication with foreground energy."',
    name: "Kofi Larbi",
    role: "Marketing Lead, Obsidian Global",
  },
];

export default function AboutPage() {
  return (
    <div className="relative">
      {/* Ambient glows */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed bottom-1/3 left-0 w-[400px] h-[400px] bg-secondary/6 rounded-full blur-[110px] pointer-events-none" />

      <div className="px-4 sm:px-8 lg:px-16 py-8 sm:py-12 max-w-7xl mx-auto">
        {/* ── Hero ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start mb-12 sm:mb-24">
          <AnimateIn from={36} duration={0.9} className="lg:col-span-7 space-y-7">
            <span className="font-label text-xs tracking-[0.2em] uppercase text-primary">About the DJ</span>
            <h1 className="font-display text-4xl sm:text-6xl md:text-8xl uppercase tracking-tighter leading-[0.9]">
              {DJ_INFO.name}
            </h1>
            <div className="space-y-5 text-on-surface-variant leading-[1.8] text-sm max-w-2xl">
              <p>{DJ_INFO.bio}</p>
              <p>{DJ_INFO.bioSecondary}</p>
            </div>

            {/* Stats */}
            <AnimateIn stagger={0.12} className="flex flex-wrap items-center gap-10 py-5 border-y border-white/5">
              <div>
                <span className="font-label text-2xl font-bold text-primary">{DJ_STATS.eventsPlayed}</span>
                <span className="block font-label text-[10px] uppercase tracking-widest text-outline mt-0.5">Events</span>
              </div>
              <div>
                <span className="font-label text-2xl font-bold text-primary">{DJ_STATS.yearsActive}</span>
                <span className="block font-label text-[10px] uppercase tracking-widest text-outline mt-0.5">Years</span>
              </div>
              <div>
                <span className="font-label text-2xl font-bold text-primary">
                  {"\u{1F1EC}\u{1F1ED}"} BASED IN ACCRA
                </span>
                <span className="block font-label text-[10px] text-on-surface-variant mt-0.5">
                  Ghana · West Africa
                </span>
              </div>
            </AnimateIn>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="flex items-center gap-2 px-8 py-4 bg-primary text-on-primary-fixed font-bold rounded-full hover:scale-105 transition-transform glow-btn"
              >
                Book Page KillerCutz
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <a
                href="#"
                className="flex items-center gap-2 px-8 py-4 border border-white/20 text-on-surface font-bold rounded-full hover:bg-white/5 transition-colors"
              >
                Download Press Kit
              </a>
            </div>
          </AnimateIn>

          {/* Portrait */}
          <AnimateIn from={40} delay={0.15} className="lg:col-span-5 relative group">
            <div className="absolute -inset-4 bg-primary/8 blur-3xl opacity-30 group-hover:opacity-60 transition-opacity rounded-full" />
            <div className="relative glass-strong rounded-3xl p-4 shadow-2xl">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl relative">
                <Image
                  alt="Page KillerCutz"
                  className="w-full h-full object-cover transition-all duration-700"
                  src="/eugene.jpg"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
                <div className="absolute top-4 left-4 glass rounded-full px-3 py-1.5 flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  <span className="font-label text-[10px] font-bold uppercase tracking-wider">Verified Artist</span>
                </div>
              </div>
              <div className="mt-5 space-y-3 px-2 pb-2">
                <span className="font-headline font-semibold">Social Connect</span>
                <div className="flex flex-wrap gap-2.5">
                  {SOCIAL_LINKS.map(({ name, href, Icon }) => (
                    <Link
                      key={name}
                      href={href}
                      aria-label={name}
                      title={name}
                      className="group inline-flex size-10 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06] backdrop-blur-md transition-colors hover:border-primary/30 hover:bg-white/[0.09]"
                      style={{
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                      }}
                    >
                      <Icon className="size-[18px] shrink-0 text-on-surface-variant transition-colors group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </AnimateIn>
        </section>

        {/* ── Press Kit ── */}
        <section className="mb-12 sm:mb-24">
          <AnimateIn from={20} className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <span className="font-label text-[10px] tracking-[0.3em] uppercase text-secondary">Assets</span>
              <h2 className="font-headline text-3xl font-bold mt-2">Press Kit</h2>
            </div>
          </AnimateIn>
          <AnimateIn stagger={0.09} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRESS_ASSETS.map(({ icon, title, desc, cta }) => (
              <div
                key={title}
                className="group relative cursor-pointer overflow-hidden rounded-2xl glass transition-all"
              >
                <BorderDrawEdges />
                <div className="relative z-10 p-6">
                  <span className="material-symbols-outlined mb-4 block text-3xl text-primary">{icon}</span>
                  <h3 className="mb-1 font-headline text-sm font-bold">{title}</h3>
                  <p className="mb-6 text-xs leading-relaxed text-on-surface-variant">{desc}</p>
                  <span className="font-label text-[10px] text-primary group-hover:underline">{cta}</span>
                </div>
              </div>
            ))}
          </AnimateIn>
        </section>

        {/* ── Tech Rider ── */}
        <section className="mb-12 sm:mb-24">
          <AnimateIn from={28}>
          <div className="glass-strong rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <h2 className="font-headline text-2xl font-bold mb-8 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">bolt</span>
                  Tech Rider &amp; Requirements
                </h2>
                <div className="space-y-8">
                  <div>
                    <h4 className="font-label text-[10px] tracking-widest uppercase text-secondary mb-4">
                      Preferred Equipment
                    </h4>
                    <ul className="space-y-3">
                      {EQUIPMENT.map((item) => (
                        <li key={item} className="flex items-center gap-3 text-on-surface-variant text-sm">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest/80 p-8 rounded-2xl border border-white/5">
                <h4 className="font-label text-[10px] tracking-widest uppercase text-secondary mb-6">
                  Hospitality &amp; Stage
                </h4>
                <div className="space-y-5">
                  {[
                    ["distance", "Dimensions", "Booth height must be 100cm (approx 40 inches)."],
                    ["lightbulb", "Lighting", "No direct overhead white light. DMX-synced visuals if possible."],
                    ["water_full", "Beverages", "Still water, green tea, and 2x chilled energy drinks."],
                    ["groups", "Guestlist", "Artist requires +5 guestlist spots for all performances."],
                  ].map(([icon, label, value]) => (
                    <div key={String(label)} className="flex gap-4">
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0">
                        {icon}
                      </span>
                      <p className="text-sm text-on-surface-variant">
                        <strong className="text-on-surface">{label}:</strong> {value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-white/5">
                  <p className="font-label text-[10px] text-outline italic">
                    For technical discrepancies, contact technical@pagekillercutz.com at least 72 hours prior to
                    performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </AnimateIn>
        </section>

        {/* ── Testimonials ── */}
        <section className="mb-8">
          <AnimateIn from={16} className="mb-10">
            <span className="font-label text-[10px] tracking-[0.3em] uppercase text-secondary">Feedback</span>
            <h2 className="font-headline text-3xl font-bold mt-2">What They Say</h2>
          </AnimateIn>
          <AnimateIn stagger={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ initials, quote, name, role }) => (
              <div key={name} className="glass rounded-2xl p-8">
                <div className="flex gap-1 text-secondary mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="font-headline text-sm font-medium text-on-surface mb-7 italic leading-relaxed">{quote}</p>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                    {initials}
                  </div>
                  <div>
                    <p className="font-headline font-bold text-sm">{name}</p>
                    <p className="font-label text-xs text-on-surface-variant">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </AnimateIn>
        </section>
      </div>
    </div>
  );
}
