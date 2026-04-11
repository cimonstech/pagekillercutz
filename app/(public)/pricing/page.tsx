"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MemberAvatarStack } from "@/components/MemberAvatarStack";
import { BorderDrawEdges } from "@/components/ui/BorderDrawEdges";
import AnimateIn from "@/components/ui/AnimateIn";

interface Package {
  id: string;
  name: string;
  price: number;
  inclusions: string[];
}

const FALLBACK_PACKAGES: Package[] = [
  {
    id: "1",
    name: "Essentials",
    price: 1500,
    inclusions: ["Up to 3 hours", "Standard DJ setup", "Playlist consultation", "Online booking"],
  },
  {
    id: "2",
    name: "Professional",
    price: 2800,
    inclusions: [
      "Up to 5 hours",
      "Pioneer CDJ-3000 rig",
      "Custom playlist curation",
      "MC service",
      "Post-event photo set",
    ],
  },
  {
    id: "3",
    name: "Elite",
    price: 5000,
    inclusions: [
      "Unlimited hours",
      "Full stage production",
      "Live DVS mixing",
      "Custom intro track",
      "Dedicated crew",
      "Priority booking",
    ],
  },
];

export default function PricingPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/packages");
        const json = (await res.json()) as { packages?: Package[] };
        setPackages(json.packages?.length ? json.packages : FALLBACK_PACKAGES);
      } catch {
        setPackages(FALLBACK_PACKAGES);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const displayed = loading ? FALLBACK_PACKAGES : packages;

  return (
    <div className="px-4 sm:px-8 lg:px-16 py-8 sm:py-12 max-w-6xl mx-auto">
      {/* Ambient glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-secondary/6 rounded-full blur-[110px] pointer-events-none" />

      {/* Header */}
      <header className="mb-14">
        <h1 className="font-headline text-3xl font-bold tracking-tight mb-2">DJ Packages</h1>
        <p className="text-on-surface-variant text-sm">All prices in GHS. Deposit required to secure your date.</p>
        <div className="flex items-center gap-3 mt-4">
          <MemberAvatarStack size={30} />
          <span className="font-label text-[11px] text-on-surface-variant uppercase tracking-wider">
            Trusted by 100+ events
          </span>
        </div>
      </header>

      {/* Package cards */}
      <AnimateIn stagger={0.12} className="mb-20 grid grid-cols-1 gap-7 md:grid-cols-3 md:items-end">
        {displayed.map((pkg, i) => {
          const isFeatured = i === 1;
          return (
            <div
              key={pkg.id}
              className={[
                "group relative flex min-h-0 flex-col overflow-visible rounded-3xl",
                isFeatured
                  ? "glass-strong border-primary/30 shadow-[0_0_40px_rgba(0,191,255,0.12)] md:-mt-6"
                  : "glass",
              ].join(" ")}
            >
              <BorderDrawEdges />
              <div className="relative z-10 flex min-h-0 flex-col p-8 pb-14">
                {isFeatured && (
                  <div className="mb-4 flex justify-center">
                    <span className="rounded-full bg-primary px-4 py-1 font-label text-[10px] font-bold uppercase tracking-widest text-on-primary-fixed">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="mb-5 font-headline text-lg font-bold uppercase tracking-wider">{pkg.name}</h3>

                <div className="mb-8 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold text-white">{pkg.price.toLocaleString()}</span>
                  <span className="font-label text-xs text-on-surface-variant">/SET</span>
                </div>

                <ul className="mb-10 flex flex-1 flex-col space-y-3.5">
                  {pkg.inclusions.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span
                        className="material-symbols-outlined mt-px shrink-0 text-[18px] text-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      <span className="text-sm text-on-surface-variant">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className={[
                    "mt-auto flex w-full shrink-0 items-center justify-center gap-2 rounded-full px-4 py-3.5 font-headline text-xs font-bold uppercase tracking-widest transition-all",
                    isFeatured
                      ? "glow-btn bg-primary text-on-primary-fixed hover:scale-105"
                      : "border border-white/20 text-on-surface-variant hover:bg-white/5",
                  ].join(" ")}
                >
                  Book This Package <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          );
        })}
      </AnimateIn>

      {/* Payment section */}
      <AnimateIn from={24}>
      <section className="mb-16">
        <div className="glass border-l-[3px] border-primary rounded-r-2xl p-8">
          <h2 className="font-headline text-xl font-bold mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">info</span>
            How Payment Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-4">
              <p className="text-on-surface-variant text-sm leading-relaxed">
                To lock in your date, a 40% non-refundable deposit is required via MTN Mobile Money or Bank Transfer.
                Balance must be cleared 24 hours before the event start time.
              </p>
              <div className="flex items-center gap-4 py-3 border-b border-white/5">
                <span className="font-label text-[10px] uppercase text-outline tracking-widest">Preferred Network</span>
                <span className="font-headline font-bold text-sm tracking-wide">MTN MOBILE MONEY</span>
              </div>
            </div>
            <div className="flex flex-col justify-center items-start md:items-end">
              <p className="font-label text-[10px] text-outline uppercase tracking-widest mb-1">MoMo Identifier</p>
              <p className="font-label text-2xl text-primary font-bold">KILLERCUTZ-PAY-01</p>
            </div>
          </div>
        </div>
      </section>
      </AnimateIn>

      {/* Bespoke CTA */}
      <AnimateIn from={20}>
      <section className="flex flex-col items-center text-center pb-10">
        <p className="text-on-surface-variant mb-5 text-sm">Need something bespoke for a festival or private tour?</p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 py-3 px-8 bg-primary text-on-primary-fixed font-headline font-bold uppercase tracking-widest text-sm rounded-full hover:scale-105 transition-transform glow-btn"
        >
          Get in Touch
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </section>
      </AnimateIn>
    </div>
  );
}
