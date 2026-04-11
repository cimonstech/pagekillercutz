"use client";

import { useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";

type Cat = "all" | "apparel" | "headwear" | "accessories" | "vinyl";

const FILTERS: { id: Cat; label: string }[] = [
  { id: "all", label: "All" },
  { id: "apparel", label: "Apparel" },
  { id: "headwear", label: "Headwear" },
  { id: "accessories", label: "Accessories" },
  { id: "vinyl", label: "Vinyl" },
];

const MOCK_PRODUCTS = [
  { emoji: "\u{1F455}", name: "KillerCutz Logo Tee", category: "Apparel" as const, price: 120, badge: "New Drop" as const, sizes: ["S", "M", "L", "XL"] },
  { emoji: "\u{1F9E2}", name: "Scratch DJ Cap", category: "Headwear" as const, price: 85, badge: "Limited" as const, sizes: ["S", "M", "L", "XL"] },
  { emoji: "\u{1F3A7}", name: "DJ Slipmat Set", category: "Accessories" as const, price: 150, badge: "New Drop" as const, sizes: ["S", "M", "L", "XL"] },
  { emoji: "\u{1F4BF}", name: "Accra Nights Vol.4 Vinyl", category: "Vinyl" as const, price: 200, badge: "Limited" as const, sizes: ["S", "M", "L", "XL"] },
  { emoji: "\u{1F9E5}", name: "KillerCutz Hoodie", category: "Apparel" as const, price: 280, badge: "New Drop" as const, sizes: ["S", "M", "L", "XL"] },
  { emoji: "\u{1F455}", name: "Stage Ready Tee", category: "Apparel" as const, price: 110, badge: "Limited" as const, sizes: ["S", "M", "L", "XL"] },
  { emoji: "\u{1F3A9}", name: "Snapback", category: "Headwear" as const, price: 95, badge: "New Drop" as const, sizes: ["S", "M", "L", "XL"] },
  { emoji: "\u{1F3B5}", name: "Wax & Wire EP Vinyl", category: "Vinyl" as const, price: 180, badge: "Limited" as const, sizes: ["S", "M", "L", "XL"] },
];

function catKey(c: (typeof MOCK_PRODUCTS)[number]["category"]): Cat {
  return c.toLowerCase() as Cat;
}

export default function MerchPage() {
  const [filter, setFilter] = useState<Cat>("all");
  const [cartCount] = useState(0);

  const products = useMemo(() => {
    if (filter === "all") return MOCK_PRODUCTS;
    return MOCK_PRODUCTS.filter((p) => catKey(p.category) === filter);
  }, [filter]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-full bg-[#08080F] px-6 pb-16 pt-8 text-on-surface lg:px-10">
      <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-headline text-[32px] font-semibold leading-tight text-white">Merch Drop</h1>
          <p className="mt-2 font-body text-sm text-[#A0A8C0]">Limited runs. Shipped across Ghana.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 backdrop-blur-md transition-colors hover:bg-white/10"
        >
          <ShoppingBag className="size-5 text-white/90" strokeWidth={1.75} />
          <span className="relative flex size-6 items-center justify-center rounded-full bg-[#00BFFF] font-label text-[11px] font-bold text-black">
            {cartCount}
          </span>
        </button>
      </header>

      <div className="no-scrollbar mb-10 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(({ id, label }) => {
          const on = filter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={[
                "shrink-0 rounded-full px-4 py-2 font-headline text-xs font-semibold transition-colors",
                on ? "bg-[#00BFFF] text-black" : "border border-white/10 bg-white/[0.05] text-[#A0A8C0] hover:bg-white/10",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <li key={p.name}>
            <article
              className="group flex h-full flex-col overflow-visible rounded-2xl border border-white/[0.08] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-[#00BFFF]/45 hover:shadow-[0_0_28px_rgba(0,191,255,0.18)]"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div className="relative h-[180px] overflow-hidden rounded-t-2xl bg-white/[0.04]">
                <span className="absolute left-3 top-3 z-10 rounded-full bg-black/55 px-2 py-1 font-label text-[10px] uppercase tracking-wide text-white/90">
                  {p.badge}
                </span>
                <div className="flex h-full items-center justify-center text-6xl">{p.emoji}</div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-headline text-sm font-semibold text-white">{p.name}</h2>
                <p className="mt-1 font-label text-[11px] text-[#A0A8C0]">{p.category}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.sizes.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 font-label text-[10px] text-white/70"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="font-headline text-[16px] font-bold leading-none text-white">{fmt(p.price)}</p>
                  <button
                    type="button"
                    aria-label={`Add ${p.name} to cart`}
                    className="shrink-0 rounded-full border border-[#00BFFF]/40 bg-[#00BFFF]/10 px-4 py-2 font-headline text-[13px] font-semibold leading-none text-[#00BFFF] transition-colors hover:bg-[#00BFFF]/20"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
