"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Database } from "@/lib/database.types";
import { useCartStore } from "@/lib/store/cartStore";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const glassChip =
  "rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 font-headline text-[13px] font-medium text-white/85 backdrop-blur-sm transition-colors hover:bg-white/[0.09]";
const glassChipActive =
  "rounded-full border-2 border-[#00BFFF] bg-[rgba(0,191,255,0.08)] px-3 py-1.5 font-headline text-[13px] font-medium text-[#00BFFF]";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[1]![0]).toUpperCase();
}

function badgeLabel(badge: string | null): string {
  if (!badge) return "New Drop";
  if (/limited/i.test(badge)) return "Limited";
  return "New Drop";
}

export default function MerchProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.slug as string;

  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setIsOpen);

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [similarProducts, setSimilarProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColour, setSelectedColour] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/products/${encodeURIComponent(productId)}`)
      .then((res) => res.json())
      .then((data: { product?: ProductRow; error?: string }) => {
        if (cancelled) return;
        setProduct(data.product ?? null);
        if (data.product?.category) {
          fetch(`/api/products?category=${encodeURIComponent(data.product.category)}&limit=4`)
            .then((r) => r.json())
            .then((d: { products?: ProductRow[] }) => {
              if (cancelled) return;
              setSimilarProducts(
                (d.products || [])
                  .filter((p) => p.id !== productId)
                  .slice(0, 3),
              );
            })
            .catch(() => {});
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    const sizes = product.sizes;
    const colours = product.colours;
    if (sizes.length === 1) {
      setSelectedSize(sizes[0]!);
    } else {
      setSelectedSize("");
    }
    if (colours.length >= 1) {
      setSelectedColour(colours[0] ?? "");
    } else {
      setSelectedColour("");
    }
    setQuantity(1);
  }, [product]);

  const maxQty = useMemo(() => {
    if (!product) return 1;
    return Math.min(Math.max(product.stock, 0), 10);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    setQuantity((q) => Math.min(Math.max(1, q), maxQty || 1));
  }, [product, maxQty]);

  const onAddToCart = () => {
    if (!product || product.stock <= 0) return;
    if (product.sizes.length > 1 && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    const size = selectedSize || product.sizes[0] || "One Size";
    const colour =
      product.colours.length > 1 ? selectedColour : (product.colours[0] ?? "");
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      size,
      colour,
      qty: quantity,
      image_url: product.image_url,
    });
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 1500);
    setTimeout(() => setCartOpen(true), 800);
  };

  const quickAddSimilar = (p: ProductRow) => {
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

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1100px] animate-pulse px-4 py-10">
        <div className="mb-6 h-4 w-40 rounded bg-white/10" />
        <div className="grid gap-10 lg:grid-cols-[48%_52%] lg:items-start">
          <div className="aspect-square rounded-2xl bg-white/10" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 rounded bg-white/10" />
            <div className="h-10 w-1/3 rounded bg-white/10" />
            <div className="h-24 rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-10">
        <Link
          href="/merch"
          className="mb-6 inline-flex items-center gap-2 font-body text-[13px] text-[#A0A8C0] transition-colors hover:text-white"
        >
          <ArrowLeft className="size-[14px]" strokeWidth={2} />
          Back to Merch
        </Link>
        <p className="font-body text-sm text-[#A0A8C0]">Product not found.</p>
      </div>
    );
  }

  const inStock = product.stock > 0;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-6">
      <Link
        href="/merch"
        className="mb-8 inline-flex items-center gap-2 font-body text-[13px] text-[#A0A8C0] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-[14px]" strokeWidth={2} />
        Back to Merch
      </Link>

      <div className="grid gap-10 lg:grid-cols-[48%_52%] lg:items-start">
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04]">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 48vw"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1a24] via-[#0e0e14] to-[#08080f]">
                <span className="font-headline text-4xl font-semibold text-white/30">{initials(product.name)}</span>
              </div>
            )}
            <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 font-label text-[10px] uppercase tracking-wide text-white/95">
              {badgeLabel(product.badge)}
            </span>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="relative h-[60px] w-[60px] shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 border-[#00BFFF] bg-white/[0.06] backdrop-blur-md"
              aria-label="Product thumbnail"
            >
              {product.image_url ? (
                <Image src={product.image_url} alt="" width={60} height={60} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-label text-[9px] text-white/40">—</div>
              )}
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-label text-[11px] uppercase tracking-[0.12em] text-[#5A6080]">{product.category}</p>
          <h1 className="mt-1 font-headline text-[28px] font-semibold leading-tight text-white">{product.name}</h1>
          <p className="mt-3 font-syne text-[32px] font-bold leading-none text-[#00BFFF]">
            GH₵ {fmt(product.price)}
          </p>
          {product.description ? (
            <p className="mt-3 font-body text-[14px] leading-[1.7] text-[#A0A8C0]">{product.description}</p>
          ) : null}

          <div className="my-8 h-px bg-[rgba(255,255,255,0.08)]" />

          <div className={["rounded-xl transition-[box-shadow]", sizeError ? "ring-2 ring-[#FF4560]" : ""].join(" ")}>
            <p className="font-label text-[10px] uppercase tracking-[0.15em] text-[#5A6080]">Sizes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSelectedSize(s);
                    setSizeError(false);
                  }}
                  className={selectedSize === s ? glassChipActive : glassChip}
                >
                  {s}
                </button>
              ))}
            </div>
            {sizeError ? <p className="mt-2 font-body text-[12px] text-[#FF4560]">Please select a size</p> : null}
          </div>

          {product.colours.length > 1 ? (
            <div className="mt-8">
              <p className="font-label text-[10px] uppercase tracking-[0.15em] text-[#5A6080]">Colours</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colours.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColour(c)}
                    className={selectedColour === c ? glassChipActive : glassChip}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex items-center gap-2">
            {product.stock > 10 ? (
              <>
                <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                <span className="font-body text-[13px] text-white/90">In stock</span>
              </>
            ) : product.stock > 0 ? (
              <>
                <span className="size-2 shrink-0 rounded-full bg-[#F5A623]" />
                <span className="font-body text-[13px] text-[#F5A623]">Low stock — {product.stock} left</span>
              </>
            ) : (
              <>
                <span className="size-2 shrink-0 rounded-full bg-[#FF4560]" />
                <span className="font-body text-[13px] text-[#FF4560]">Out of stock</span>
              </>
            )}
          </div>

          <div className="mt-8">
            <p className="font-label text-[10px] uppercase tracking-[0.15em] text-[#5A6080]">Quantity</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] p-1">
              <button
                type="button"
                disabled={quantity <= 1}
                className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-full bg-white/[0.06] font-body text-lg text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center font-body text-[15px] text-white">{quantity}</span>
              <button
                type="button"
                disabled={quantity >= maxQty}
                className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-full bg-white/[0.06] font-body text-lg text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-8">
            <button
              type="button"
              disabled={!inStock}
              onClick={onAddToCart}
              className={[
                "flex h-[52px] w-full items-center justify-center gap-2 rounded-full font-headline text-[14px] font-bold transition-colors",
                !inStock
                  ? "cursor-not-allowed bg-[rgba(255,255,255,0.05)] text-[#5A6080]"
                  : addSuccess
                    ? "border border-[#00BFFF] bg-[rgba(0,191,255,0.12)] text-[#00BFFF]"
                    : "bg-[#00BFFF] text-black",
              ].join(" ")}
            >
              {!inStock ? (
                "Out of Stock"
              ) : addSuccess ? (
                "✓ Added to Cart"
              ) : (
                <>
                  <ShoppingCart className="size-4 shrink-0" strokeWidth={2} />
                  Add to Cart
                </>
              )}
            </button>
          </div>

          <div
            className="mt-8 rounded-xl border border-white/[0.08] border-l-[3px] border-l-[#00BFFF] p-4"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <p className="font-headline text-[13px] font-semibold text-white">💡 Payment is offline</p>
            <p className="mt-2 font-body text-[12px] leading-relaxed text-[#A0A8C0]">
              After placing your order you&apos;ll receive a unique Order ID. Send payment via Mobile Money using your Order ID as the reference.
            </p>
          </div>
        </div>
      </div>

      <section className="mt-16 border-t border-white/[0.06] pt-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="font-headline text-[20px] font-semibold text-white">You Might Also Like</h2>
          <button
            type="button"
            onClick={() => router.push("/merch")}
            className="shrink-0 font-body text-[13px] text-[#00BFFF] hover:underline"
          >
            View all →
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {similarProducts.map((p) => {
            const img = p.image_url ?? "/killercutz-logo.webp";
            return (
              <article
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#00BFFF]/35 hover:shadow-[0_0_24px_rgba(0,191,255,0.12)]"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <Link href={`/merch/${p.id}`} className="relative block h-[160px] overflow-hidden rounded-t-xl bg-white/[0.04]">
                  {p.badge ? (
                    <span className="absolute left-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 font-label text-[10px] uppercase text-white/90">
                      {p.badge}
                    </span>
                  ) : null}
                  <Image
                    src={img}
                    alt={p.name}
                    width={400}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <Link href={`/merch/${p.id}`}>
                    <h3 className="font-headline text-[14px] font-semibold text-white hover:text-[#00BFFF]">{p.name}</h3>
                  </Link>
                  <p className="mt-1 font-label text-[11px] text-[#5A6080]">{p.category}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="font-syne text-[16px] font-bold text-[#00BFFF]">GH₵ {fmt(p.price)}</p>
                    <button
                      type="button"
                      disabled={p.stock <= 0}
                      onClick={(e) => {
                        e.preventDefault();
                        quickAddSimilar(p);
                      }}
                      className="shrink-0 font-headline text-[13px] font-semibold text-[#00BFFF] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
