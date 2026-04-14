"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CheckoutForm from "@/components/merch/CheckoutForm";
import type { CartItem } from "@/lib/store/cartStore";
import { useCartStore } from "@/lib/store/cartStore";

export default function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const setIsOpen = useCartStore((s) => s.setIsOpen);
  const setAutoOpenOnAdd = useCartStore((s) => s.setAutoOpenOnAdd);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) setCheckoutOpen(false);
  }, [isOpen]);

  const subtotal = useMemo(
    () => items.reduce((sum, item: CartItem) => sum + item.price * item.qty, 0),
    [items],
  );

  const closeAll = () => {
    setCheckoutOpen(false);
    setIsOpen(false);
  };

  const panel = (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close cart"
          className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed right-0 top-0 z-[150] flex h-full w-full max-w-[420px] flex-col border-l border-white/[0.08] shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
        ].join(" ")}
        style={{
          background: "rgba(12,12,18,0.96)",
          backdropFilter: "blur(24px)",
        }}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <h2 className="font-headline text-lg font-semibold text-white">Your cart</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex size-9 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="font-body text-[14px] text-[#A0A8C0]">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item: CartItem) => (
                <li
                  key={`${item.id}-${item.size}-${item.colour}`}
                  className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] p-3"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-[10px] bg-white/[0.06]">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-label text-[10px] text-white/40">—</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-headline text-[14px] font-semibold leading-tight text-white">{item.name}</p>
                    <p className="mt-0.5 font-label text-[11px] text-[#5A6080]">
                      {item.size}
                      {item.colour ? ` · ${item.colour}` : ""}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] p-0.5">
                        <button
                          type="button"
                          className="flex size-7 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
                          aria-label="Decrease quantity"
                          onClick={() => updateQty(item.id, item.size, item.colour, item.qty - 1)}
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="min-w-[1.5rem] text-center font-body text-[13px] text-white">{item.qty}</span>
                        <button
                          type="button"
                          className="flex size-7 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
                          aria-label="Increase quantity"
                          onClick={() => updateQty(item.id, item.size, item.colour, item.qty + 1)}
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <p className="font-syne text-[14px] font-bold text-white">
                        GH₵ {(item.price * item.qty).toLocaleString("en-GH")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 self-start text-white/35 hover:text-[#FF4560]"
                    aria-label="Remove"
                    onClick={() => removeItem(item.id, item.size, item.colour)}
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-white/[0.08] px-5 py-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-body text-[14px] text-[#A0A8C0]">Subtotal</span>
            <span className="font-syne text-[18px] font-bold text-[#00BFFF]">
              GH₵ {subtotal.toLocaleString("en-GH")}
            </span>
          </div>
          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => setCheckoutOpen(true)}
            className="flex h-[48px] w-full items-center justify-center rounded-full bg-[#00BFFF] font-headline text-[14px] font-bold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            Proceed to Checkout →
          </button>
          <Link
            href="/merch"
            className="mt-3 block text-center font-body text-[13px] text-[#00BFFF] hover:underline"
            onClick={() => {
              setAutoOpenOnAdd(false);
              setIsOpen(false);
            }}
          >
            Continue shopping
          </Link>
        </div>
      </aside>

      {checkoutOpen ? (
        <div
          className="fixed inset-0 z-[160] overflow-y-auto overscroll-y-contain"
          role="dialog"
          aria-modal="true"
          aria-label="Checkout"
        >
          <button
            type="button"
            aria-label="Close checkout"
            className="fixed inset-0 bg-black/70"
            onClick={() => setCheckoutOpen(false)}
          />
          <div className="relative flex min-h-full justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 sm:pb-10 sm:pt-8">
            <div
              className="relative z-[1] my-auto w-full max-w-lg rounded-2xl border border-white/[0.1] px-4 pb-5 pt-12 shadow-2xl sm:px-6 sm:pb-6 sm:pt-14"
              style={{
                background: "rgba(16,16,22,0.98)",
                backdropFilter: "blur(28px)",
              }}
            >
              <button
                type="button"
                className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-lg text-white/50 hover:bg-white/[0.08] hover:text-white"
                aria-label="Close checkout"
                onClick={() => setCheckoutOpen(false)}
              >
                <X className="size-5" />
              </button>
              <CheckoutForm
                onClose={() => {
                  setCheckoutOpen(false);
                  closeAll();
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  if (!mounted) return null;
  return createPortal(panel, document.body);
}
