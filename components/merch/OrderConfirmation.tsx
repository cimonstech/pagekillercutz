"use client";

import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PaymentDetails from "@/components/payment/PaymentDetails";

type Props = {
  orderNumber: string;
  total: number;
  onClose: () => void;
};

export default function OrderConfirmation({ orderNumber, total, onClose }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-center px-0 py-1 text-center sm:px-1 sm:py-2">
      <div className="animate-merch-check-pop mb-4 flex size-[72px] shrink-0 items-center justify-center rounded-full border-2 border-[#00BFFF] bg-[rgba(0,191,255,0.12)] shadow-[0_0_32px_rgba(0,191,255,0.25)] sm:mb-6">
        <Check className="size-9 text-[#00BFFF]" strokeWidth={2.5} aria-hidden />
      </div>
      <h2 className="font-syne text-[26px] font-bold leading-tight text-white sm:text-[32px]">Order Placed.</h2>
      <p className="mt-2 font-body text-[14px] text-[#A0A8C0]">We have received your order.</p>

      <div
        className="mt-5 w-full rounded-2xl border border-white/[0.08] p-4 text-left sm:mt-8 sm:p-5"
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
        }}
      >
        <p className="font-label text-[10px] uppercase tracking-[0.15em] text-[#5A6080]">Your order ID</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-label text-[22px] font-bold tracking-wide text-[#00BFFF]">{orderNumber}</span>
          <button
            type="button"
            onClick={() => void copyId()}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition-colors hover:text-white"
            aria-label="Copy order ID"
          >
            <Copy className="size-4" />
          </button>
          {copied ? <span className="font-body text-[12px] text-[#00BFFF]">Copied</span> : null}
        </div>
      </div>

      <div
        className="mt-3 w-full rounded-2xl border border-white/[0.08] border-l-[3px] border-l-[#F5A623] p-4 text-left sm:mt-4 sm:p-5"
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
        }}
      >
        <h3 className="font-headline text-[15px] font-semibold text-white">Complete Your Payment</h3>
        <div className="mt-3">
          <PaymentDetails reference={orderNumber} amount={total} amountLabel="Order Total" />
        </div>
      </div>

      <p className="mt-4 font-body text-[12px] text-[#5A6080] sm:mt-6">Check your email and SMS for full details.</p>

      <div className="mt-5 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push("/track-order");
          }}
          className="h-[48px] rounded-full border border-[#00BFFF] bg-transparent px-6 font-headline text-[13px] font-semibold text-[#00BFFF] transition-colors hover:bg-[#00BFFF]/10"
        >
          Track My Order →
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push("/merch");
          }}
          className="h-[48px] rounded-full border border-white/10 bg-white/[0.04] px-6 font-headline text-[13px] font-semibold text-white/80 transition-colors hover:bg-white/[0.08]"
        >
          Continue Shopping
        </button>
      </div>

      <Link href="/merch" className="mt-4 font-body text-[12px] text-[#5A6080] underline-offset-2 hover:text-[#A0A8C0]">
        Back to store
      </Link>
    </div>
  );
}
