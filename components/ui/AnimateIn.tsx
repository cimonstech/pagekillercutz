"use client";

/**
 * Scroll-triggered entrance animation wrapper.
 *
 * Non-stagger mode  →  the wrapper div itself fades/slides up.
 * Stagger mode      →  each direct DOM child staggers in sequentially.
 *
 * Usage:
 *   <AnimateIn from={28}>
 *     <SomeSection />
 *   </AnimateIn>
 *
 *   <AnimateIn stagger={0.08} className="grid grid-cols-3 gap-5">
 *     <Card /> <Card /> <Card />
 *   </AnimateIn>
 */

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface AnimateInProps {
  children: React.ReactNode;
  /** Extra Tailwind / CSS classes applied to the wrapper div */
  className?: string;
  /** Seconds before the animation begins (useful for sequencing siblings) */
  delay?: number;
  /** Y distance (px) to start from — default 28 */
  from?: number;
  /**
   * When set, each direct child staggers by this many seconds.
   * When false/omitted, the wrapper div itself is animated.
   */
  stagger?: number | false;
  /** Tween duration in seconds — default 0.75 */
  duration?: number;
  /** ScrollTrigger start string — default "top 88%" */
  start?: string;
}

export default function AnimateIn({
  children,
  className,
  delay = 0,
  from = 28,
  stagger = false,
  duration = 0.75,
  start = "top 88%",
}: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = stagger !== false ? Array.from(el.children) : el;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        opacity: 0,
        y: from,
        duration,
        ease: "power3.out",
        delay,
        stagger: stagger !== false ? stagger : 0,
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [delay, from, stagger, duration, start]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
