"use client";

import Link from "next/link";
import { ChevronDown, Loader2, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/store/cartStore";
import { useCartStore } from "@/lib/store/cartStore";
import OrderConfirmation from "@/components/merch/OrderConfirmation";

const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Savannah",
  "North East",
  "Oti",
  "Western North",
] as const;

const inputClass =
  "w-full rounded-[10px] border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-[14px] text-white outline-none transition-[border-color,box-shadow] placeholder:text-white/35 focus:border-[#00BFFF] focus:shadow-[0_0_0_3px_rgba(0,191,255,0.10)] font-body";

const lockedInputClass =
  "w-full cursor-not-allowed rounded-[10px] border border-white/[0.05] bg-white/[0.03] py-3 pl-4 pr-10 text-[14px] text-white/50 outline-none focus:border-white/[0.05] focus:shadow-none font-body";

const labelClass = "mb-1.5 block text-[12px] font-medium text-white font-body";

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  region: string;
  notes: string;
};

type FieldErrors = Partial<Record<keyof FormData, string>>;

type Props = {
  onClose: () => void;
};

function normalisePhoneForApi(localDigits: string): string {
  const d = localDigits.replace(/\D/g, "");
  if (d.startsWith("233")) return `+${d}`;
  return `+233${d}`;
}

export default function CheckoutForm({ onClose }: Props) {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [step, setStep] = useState<"form" | "confirmation">("form");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<number>(0);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    region: "Greater Accra",
    notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const subtotal = useMemo(
    () => items.reduce((sum, item: CartItem) => sum + item.price * item.qty, 0),
    [items],
  );

  const djMomo = process.env.NEXT_PUBLIC_DJ_MOMO ?? "+233 24 412 3456";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (user) {
        setIsLoggedIn(true);
        const meta = (user.user_metadata || {}) as Record<string, string | undefined>;
        setFormData((prev) => ({
          ...prev,
          fullName: meta.full_name || prev.fullName,
          email: user.email || prev.email,
          phone: meta.phone ? String(meta.phone).replace(/^\+\s*233\s*/, "") : prev.phone,
        }));
      }
      setLoadingUser(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hadExistingName = Boolean(formData.fullName.trim());

  const setField = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!formData.fullName.trim()) next.fullName = "Required";
    if (!formData.email.trim()) next.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) next.email = "Invalid email";
    if (!formData.phone.replace(/\D/g, "").length) next.phone = "Required";
    if (!formData.address.trim()) next.address = "Required";
    if (!formData.region) next.region = "Required";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onPlaceOrder = async () => {
    setSubmitError(null);
    if (!validate()) return;
    if (!items.length) {
      setSubmitError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    const cartSnapshot = items.map((i: CartItem) => ({ ...i }));
    const orderSubtotal = cartSnapshot.reduce((sum, item) => sum + item.price * item.qty, 0);
    const phoneFull = normalisePhoneForApi(formData.phone);
    const orderItems = cartSnapshot.map((item: CartItem) => ({
      product_id: item.id,
      name: item.name,
      size: item.size,
      colour: item.colour,
      qty: item.qty,
      price: item.price,
      image_url: item.image_url ?? null,
    }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.fullName.trim(),
          customerEmail: formData.email.trim(),
          customerPhone: phoneFull,
          deliveryAddress: formData.address.trim(),
          region: formData.region,
          notes: formData.notes.trim() || null,
          items: orderItems,
          total: orderSubtotal,
        }),
      });
      const result = (await res.json()) as { error?: string; orderNumber?: string };
      if (!res.ok) {
        setSubmitError(result.error || "Failed to place order");
        setSubmitting(false);
        return;
      }
      const num = result.orderNumber;
      if (!num) {
        setSubmitError("Order placed but no order number returned.");
        setSubmitting(false);
        return;
      }
      setOrderNumber(num);
      setConfirmedTotal(orderSubtotal);
      clearCart();

      const notifyPayload = {
        orderNumber: num,
        customerName: formData.fullName.trim(),
        customerEmail: formData.email.trim(),
        customerPhone: phoneFull,
        items: cartSnapshot.map((i: CartItem) => ({
          product_id: i.id,
          name: i.name,
          size: i.size,
          colour: i.colour,
          qty: i.qty,
          price: i.price,
        })),
        total: orderSubtotal,
      };
      fetch("/api/notify/order-placed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifyPayload),
      }).catch((err) => console.error("[order] notify failed:", err));

      setStep("confirmation");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#00BFFF]" aria-hidden />
      </div>
    );
  }

  if (step === "confirmation" && orderNumber) {
    return (
      <OrderConfirmation
        orderNumber={orderNumber}
        total={confirmedTotal}
        djMomo={djMomo}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="w-full min-w-0 px-0 pb-1">
      <h2 className="font-headline text-xl font-semibold text-white">Checkout</h2>
      <p className="mt-1 font-body text-[13px] text-[#A0A8C0]">Complete your delivery details.</p>

      <button
        type="button"
        onClick={() => setSummaryOpen((o) => !o)}
        className="mt-6 flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.06]"
      >
        <span className="font-headline text-[14px] font-semibold text-white">Order summary</span>
        <span className="flex items-center gap-2 font-syne text-[15px] font-bold text-[#00BFFF]">
          GH₵ {subtotal.toLocaleString("en-GH")}
          <ChevronDown
            className={["size-4 text-white/50 transition-transform", summaryOpen ? "rotate-180" : ""].join(" ")}
            aria-hidden
          />
        </span>
      </button>
      {summaryOpen ? (
        <ul className="mt-3 space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
          {items.map((item: CartItem) => (
            <li key={`${item.id}-${item.size}-${item.colour}`} className="flex justify-between gap-3 font-body text-[13px] text-[#A0A8C0]">
              <span className="min-w-0 text-white">
                {item.name}
                <span className="block font-label text-[11px] text-[#5A6080]">
                  {item.size}
                  {item.colour ? ` · ${item.colour}` : ""} × {item.qty}
                </span>
              </span>
              <span className="shrink-0 font-syne text-[13px] font-bold text-white">
                GH₵ {(item.price * item.qty).toLocaleString("en-GH")}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 space-y-6">
        {!isLoggedIn ? (
          <div
            className="rounded-xl border border-white/[0.08] border-l-[3px] border-l-[#00BFFF] p-4"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <p className="font-body text-[12px] leading-relaxed text-[#A0A8C0]">
              Have an account? Sign in to auto-fill your details.{" "}
              <Link href="/sign-in?redirect=/merch" className="font-medium text-[#00BFFF] hover:underline">
                Sign In →
              </Link>
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Full Name</label>
            <div className="relative">
              <input
                readOnly={isLoggedIn && hadExistingName}
                className={
                  isLoggedIn && hadExistingName
                    ? `${lockedInputClass} ${fieldErrors.fullName ? "border-[#FF4560]" : ""}`
                    : `${inputClass} ${fieldErrors.fullName ? "border-[#FF4560]" : ""}`
                }
                value={formData.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                type="text"
                placeholder="Your name"
                aria-readonly={isLoggedIn && hadExistingName}
              />
              {isLoggedIn && hadExistingName ? (
                <Lock className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-white/[0.25]" aria-hidden />
              ) : null}
            </div>
            {fieldErrors.fullName ? <p className="mt-1 font-body text-[12px] text-[#FF4560]">{fieldErrors.fullName}</p> : null}
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <div className="relative">
              <input
                readOnly={isLoggedIn}
                className={
                  isLoggedIn
                    ? `${lockedInputClass} ${fieldErrors.email ? "border-[#FF4560]" : ""}`
                    : `${inputClass} ${fieldErrors.email ? "border-[#FF4560]" : ""}`
                }
                value={formData.email}
                onChange={(e) => setField("email", e.target.value)}
                type="email"
                placeholder="you@example.com"
                aria-readonly={isLoggedIn}
              />
              {isLoggedIn ? (
                <Lock className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-white/[0.25]" aria-hidden />
              ) : null}
            </div>
            {fieldErrors.email ? <p className="mt-1 font-body text-[12px] text-[#FF4560]">{fieldErrors.email}</p> : null}
          </div>
        </div>

        {isLoggedIn && hadExistingName ? (
          <div className="flex items-center gap-[6px]">
            <Lock className="size-3 shrink-0 text-[#5A6080]" aria-hidden />
            <p className="font-label text-[10px] uppercase tracking-wide text-[#5A6080]">Name and email from your account.</p>
          </div>
        ) : null}

        <div>
          <label className={labelClass}>Phone</label>
          <div className="flex overflow-hidden rounded-[10px] border border-white/[0.08] bg-white/[0.05] focus-within:border-[#00BFFF] focus-within:shadow-[0_0_0_3px_rgba(0,191,255,0.10)]">
            <span className="flex shrink-0 items-center border-r border-white/[0.08] bg-white/[0.04] px-3 font-body text-[14px] text-white/80">
              +233
            </span>
            <input
              className={`min-w-0 flex-1 border-0 bg-transparent px-3 py-3 font-body text-[14px] text-white outline-none placeholder:text-white/35 ${fieldErrors.phone ? "ring-1 ring-[#FF4560]" : ""}`}
              value={formData.phone.replace(/^\+\s*233\s*/, "")}
              onChange={(e) => setField("phone", e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="24 412 3456"
              type="tel"
            />
          </div>
          {fieldErrors.phone ? <p className="mt-1 font-body text-[12px] text-[#FF4560]">{fieldErrors.phone}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Delivery Address</label>
          <textarea
            rows={2}
            className={`${inputClass} min-h-[80px] resize-y ${fieldErrors.address ? "border-[#FF4560]" : ""}`}
            value={formData.address}
            onChange={(e) => setField("address", e.target.value)}
            placeholder="Street address, area..."
          />
          {fieldErrors.address ? <p className="mt-1 font-body text-[12px] text-[#FF4560]">{fieldErrors.address}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Region</label>
          <select
            className={`${inputClass} appearance-none ${fieldErrors.region ? "border-[#FF4560]" : ""}`}
            value={formData.region}
            onChange={(e) => setField("region", e.target.value)}
          >
            {GHANA_REGIONS.map((r) => (
              <option key={r} value={r} className="bg-[#13131a]">
                {r}
              </option>
            ))}
          </select>
          {fieldErrors.region ? <p className="mt-1 font-body text-[12px] text-[#FF4560]">{fieldErrors.region}</p> : null}
        </div>

        <div>
          <label className={labelClass}>Order notes (optional)</label>
          <textarea
            rows={2}
            className={`${inputClass} min-h-[80px] resize-y`}
            value={formData.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="Special delivery instructions..."
          />
        </div>

        {submitError ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 font-body text-[13px] text-red-200">{submitError}</p>
        ) : null}

        <button
          type="button"
          disabled={submitting || !items.length}
          onClick={() => void onPlaceOrder()}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#00BFFF] font-headline text-[14px] font-bold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Placing order...
            </>
          ) : (
            "Place Order →"
          )}
        </button>
      </div>
    </div>
  );
}
