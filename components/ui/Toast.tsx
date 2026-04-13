"use client";

import { Check, Info, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  useEffect(() => {
    const id = setTimeout(dismiss, 3000);
    return () => clearTimeout(id);
  }, [message, type]);

  const border =
    type === "success"
      ? "border-l-[#00BFFF]"
      : type === "error"
        ? "border-l-[#FF4560]"
        : "border-l-[#F5A623]";

  const icon =
    type === "success" ? (
      <Check className="size-4 shrink-0 text-[#00BFFF]" strokeWidth={2.5} aria-hidden />
    ) : type === "error" ? (
      <X className="size-4 shrink-0 text-[#FF4560]" strokeWidth={2.5} aria-hidden />
    ) : (
      <Info className="size-4 shrink-0 text-[#F5A623]" strokeWidth={2.5} aria-hidden />
    );

  return (
    <div
      className={[
        "fixed bottom-6 right-6 z-[9999] flex min-w-[280px] max-w-[min(100vw-2rem,400px)] items-start gap-3 rounded-xl border border-white/[0.08] border-l-[3px] p-[14px_20px] shadow-2xl transition-[opacity,transform] duration-300 ease-out",
        border,
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      ].join(" ")}
      style={{
        background: "rgba(16,16,22,0.95)",
        backdropFilter: "blur(16px)",
      }}
      role="status"
    >
      {icon}
      <p className="font-headline text-[14px] font-medium leading-snug text-white">{message}</p>
      <button
        type="button"
        onClick={dismiss}
        className="ml-auto shrink-0 rounded p-1 text-white/40 hover:text-white"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export type ToastState = { message: string; type: ToastType } | null;

export function useToast(): {
  toast: ToastState;
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: () => void;
} {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  return { toast, showToast, dismissToast };
}
