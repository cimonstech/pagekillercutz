"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import type { Database } from "@/lib/database.types";
import { useCartStore } from "@/lib/store/cartStore";

type Cat = "all" | "apparel" | "headwear" | "accessories" | "vinyl";

const FILTERS: { id: Cat; label: string }[] = [
  { id: "all", label: "All" },
  { id: "apparel", label: "Apparel" },
  { id: "headwear", label: "Headwear" },
  { id: "accessories", label: "Accessories" },
  { id: "vinyl", label: "Vinyl" },
];

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

function filterToCategory(cat: Cat): string | null {
  if (cat === "all") return null;
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function MerchPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Cat>("all");
  const itemCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.qty, 0));
  const setCartOpen = useCartStore((s) => s.setIsOpen);
  const addItem = useCartStore((s) => s.addItem);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const cat = filterToCategory(filter);
        const url = cat ? `/api/products?category=${encodeURIComponent(cat)}` : "/api/products";
        const res = await fetch(url);
        const json = (await res.json()) as { error?: string; products?: ProductRow[] };
        if (!res.ok) throw new Error(json.error || "Failed to load products");
        if (!cancelled) setProducts(json.products ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);

  const quickAdd = (p: ProductRow) => {
    if (p.stock <= 0) return;
    const size = p.sizes[0] || "One Size";
    const colour = p.colours[0] ?? "";
    addItem({
      id: p.id,
      name: p.name,
      price: p.price,
      size,
      colour,
      qty: 1,
      image_url: p.image_url,
    });
    setTimeout(() => setCartOpen(true), 400);
  };

  return (
    <div className="mx-auto min-h-full max-w-screen-xl bg-[#08080F] px-3 pb-16 pt-2 text-on-surface sm:px-4">
      <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-headline text-[32px] font-semibold leading-tight text-white">Merch Drop</h1>
          <p className="mt-2 font-body text-sm text-[#A0A8C0]">Limited runs. Shipped across Ghana.</p>
        </div>
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 backdrop-blur-md transition-colors hover:bg-white/10"
          aria-label="Open cart"
        >
          <ShoppingCart className="size-5 text-white/90" strokeWidth={1.75} />
          <span className="relative flex size-6 items-center justify-center rounded-full bg-[#00BFFF] font-label text-[11px] font-bold text-black">
            {itemCount}
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

      {loading ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="animate-pulse rounded-2xl border border-white/[0.08]">
              <div className="h-[180px] rounded-t-2xl bg-white/10" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-2/3 rounded bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-white/10" />
              </div>
            </li>
          ))}
        </ul>
      ) : error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-[#A0A8C0]">No results</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => {
            const img = p.image_url ?? "/killercutz-logo.webp";
            return (
              <li key={p.id}>
                <article
                  className="group flex h-full flex-col overflow-visible rounded-2xl border border-white/[0.08] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-[#00BFFF]/45 hover:shadow-[0_0_28px_rgba(0,191,255,0.18)]"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                  }}
                >
                  <button
                    type="button"
                    className="relative block w-full cursor-pointer text-left"
                    onClick={() => router.push(`/merch/${p.id}`)}
                  >
                    <span className="relative block h-[180px] overflow-hidden rounded-t-2xl bg-white/[0.04]">
                      {p.badge ? (
                        <span className="absolute left-3 top-3 z-10 rounded-full bg-black/55 px-2 py-1 font-label text-[10px] uppercase tracking-wide text-white/90">
                          {p.badge}
                        </span>
                      ) : null}
                      <Image
                        src={img}
                        alt={p.name}
                        width={300}
                        height={300}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col p-4">
                    <Link href={`/merch/${p.id}`}>
                      <h2 className="font-headline text-sm font-semibold text-white hover:text-[#00BFFF]">{p.name}</h2>
                    </Link>
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
                        disabled={p.stock <= 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          quickAdd(p);
                        }}
                        aria-label={`Add ${p.name} to cart`}
                        className="shrink-0 rounded-full border border-[#00BFFF]/40 bg-[#00BFFF]/10 px-4 py-2 font-headline text-[13px] font-semibold leading-none text-[#00BFFF] transition-colors hover:bg-[#00BFFF]/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
