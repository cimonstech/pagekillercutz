"use client";

import { useRouter } from "next/navigation";
import AnimateIn from "@/components/ui/AnimateIn";

export default function BookingCtaSection() {
  const router = useRouter();
  return (
    <AnimateIn from={24}>
      <section className="glass flex flex-col gap-6 rounded-2xl p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="mb-1 font-headline text-xl font-bold">Book Page KillerCutz</h3>
          <p className="text-sm text-on-surface-variant">
            Available for festivals, weddings, corporate events, and club nights worldwide.
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => router.push("/booking")}
            className="glow-btn flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary-fixed transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            Book Now <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/pricing")}
            className="flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3 font-bold text-white transition-colors hover:bg-white/10"
          >
            View Packages <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </section>
    </AnimateIn>
  );
}
