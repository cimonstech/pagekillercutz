"use client";

import { cn } from "@/lib/utils";
import { useId, useLayoutEffect, useRef, useState } from "react";

type BorderDrawEdgesProps = {
  /** Extra classes on the SVG layer */
  className?: string;
};

/** Inset rounded-rect path so a centered stroke stays inside `overflow-hidden`. */
function buildRoundedRectPath(w: number, h: number, r: number, strokeWidth: number): string {
  const inset = 1 + strokeWidth / 2;
  if (w <= 0 || h <= 0) return "";
  const x = inset;
  const y = inset;
  const ww = Math.max(0, w - 2 * inset);
  const hh = Math.max(0, h - 2 * inset);
  const rr = Math.max(0, Math.min(Math.max(0, r - inset), ww / 2, hh / 2));
  if (rr === 0) {
    return `M ${x},${y} L ${x + ww},${y} L ${x + ww},${y + hh} L ${x},${y + hh} Z`;
  }
  return `M ${x + rr},${y} L ${x + ww - rr},${y} A ${rr},${rr} 0 0 1 ${x + ww},${y + rr} L ${x + ww},${y + hh - rr} A ${rr},${rr} 0 0 1 ${x + ww - rr},${y + hh} L ${x + rr},${y + hh} A ${rr},${rr} 0 0 1 ${x},${y + hh - rr} L ${x},${y + rr} A ${rr},${rr} 0 0 1 ${x + rr},${y} Z`;
}

function parseRadiusPx(value: string): number {
  const v = value.trim().split(/\s+/)[0] ?? "0";
  const px = v.match(/^([\d.]+)px$/i);
  if (px) return parseFloat(px[1]);
  const rem = v.match(/^([\d.]+)rem$/i);
  if (rem) return parseFloat(rem[1]) * 16;
  return 16;
}

/**
 * Gradient stroke traces the full perimeter on hover, including rounded corners.
 * Parent must be `group relative` with `overflow-hidden` and a `border-radius`.
 */
export function BorderDrawEdges({ className }: BorderDrawEdgesProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `border-draw-grad-${rawId}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const [d, setD] = useState("");

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const parent = svg?.parentElement;
    if (!svg || !parent) return;

    const update = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const r = parseRadiusPx(getComputedStyle(parent).borderTopLeftRadius);
      setD(buildRoundedRectPath(w, h, r, 2));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible", className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#00BFFF" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      {d ? (
        <path
          d={d}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          vectorEffect="non-scaling-stroke"
          className={cn(
            "transition-[stroke-dashoffset] duration-[620ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
            "[stroke-dasharray:1] [stroke-dashoffset:1] group-hover:[stroke-dashoffset:0]",
          )}
        />
      ) : null}
    </svg>
  );
}
