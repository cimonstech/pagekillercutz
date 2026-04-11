"use client";

/**
 * Counts a number up from 0 to `value` when it scrolls into view.
 * Renders as an inline <span> so it can replace a static number inside
 * any existing element without affecting layout.
 */

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface AnimateCounterProps {
  value: number;
  /** Text appended after the number, e.g. "+" or "K" */
  suffix?: string;
  /** Text prepended before the number */
  prefix?: string;
  className?: string;
  /** Tween duration — default 1.6s */
  duration?: number;
}

export default function AnimateCounter({
  value,
  suffix = "",
  prefix = "",
  className,
  duration = 1.6,
}: AnimateCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obj = { val: 0 };

    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: value,
        duration,
        ease: "power2.out",
        snap: { val: 1 },
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          once: true,
        },
        onUpdate() {
          el.textContent = prefix + Math.round(obj.val).toLocaleString() + suffix;
        },
      });
    });

    return () => ctx.revert();
  }, [value, suffix, prefix, duration]);

  // Server-rendered placeholder shown before JS runs
  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
