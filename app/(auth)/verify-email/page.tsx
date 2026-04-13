"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Check, CheckCircle, Loader2, Mail } from "lucide-react";
import { authCallbackUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/client";

type VerifyStatus = "waiting" | "verified" | "expired";

const glassCard: CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 24,
  padding: "48px 40px",
  textAlign: "center",
  maxWidth: 480,
  width: "100%",
};

const fontGrotesk = "'Space Grotesk', var(--font-space-grotesk), system-ui, sans-serif";
const fontInter = "Inter, var(--font-inter), system-ui, sans-serif";
const fontMono = "'Space Mono', ui-monospace, monospace";

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerifyStatus>("waiting");
  const [userEmail, setUserEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState("");

  const emailRedirectTo = authCallbackUrl("/verify-email?status=verified");

  useEffect(() => {
    const s = searchParams.get("status") as VerifyStatus | null;
    const e = searchParams.get("email") ?? "";
    if (s === "waiting" || s === "verified" || s === "expired") setStatus(s);
    if (e) setUserEmail(e);
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setStatus("verified");
        setUserEmail((prev) => session.user.email ?? prev);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setStatus("verified");
        setUserEmail(session.user.email ?? "");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleResend = async () => {
    if (!userEmail.trim()) {
      setResendError("Enter your email above.");
      return;
    }
    setResendError("");
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: userEmail.trim(),
      options: { emailRedirectTo },
    });
    setResending(false);
    if (error) {
      setResendError(error.message);
      return;
    }
    setResent(true);
  };

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-5 py-16"
      style={{ background: "#08080F" }}
    >
      {/* Vinyl halos */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-hidden
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ width: 500, height: 500, borderColor: "rgba(255,255,255,0.03)" }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ width: 600, height: 600, borderColor: "rgba(255,255,255,0.03)" }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ width: 700, height: 700, borderColor: "rgba(255,255,255,0.03)" }}
        />
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: "radial-gradient(circle, rgba(0,191,255,0.06) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <Link
        href="/"
        className="fixed left-8 top-6 z-20 flex items-center gap-2.5 outline-none"
        style={{ top: 24, left: 32 }}
      >
        <Image src="/pageicon.png" alt="" width={24} height={24} className="h-6 w-auto object-contain" priority />
        <span className="text-[15px] font-bold tracking-tight text-white" style={{ fontFamily: fontGrotesk }}>
          PAGE KILLERCUTZ
        </span>
      </Link>

      {status === "waiting" && (
        <div style={glassCard}>
          <div
            className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full animate-auth-float"
            style={{
              background: "rgba(0,191,255,0.10)",
              border: "1px solid rgba(0,191,255,0.25)",
            }}
          >
            <Mail className="size-9 text-[#00BFFF]" strokeWidth={2} aria-hidden />
          </div>
          <h1 className="mb-2 text-[26px] font-semibold text-white" style={{ fontFamily: fontGrotesk }}>
            Check your email
          </h1>
          <p className="mb-1 text-[14px]" style={{ fontFamily: fontInter, color: "#A0A8C0" }}>
            We&apos;ve sent a verification link to:
          </p>
          <input
            type="email"
            value={userEmail}
            onChange={(ev) => setUserEmail(ev.target.value)}
            placeholder="your@email.com"
            className="mb-6 mt-1 w-full max-w-[320px] rounded-lg px-4 py-2 text-center outline-none"
            style={{
              fontFamily: fontMono,
              fontSize: 15,
              color: "#00BFFF",
              background: "rgba(0,191,255,0.08)",
              border: "1px solid rgba(0,191,255,0.15)",
            }}
          />
          <p
            className="mx-auto mb-8 max-w-[320px] text-[13px] leading-relaxed"
            style={{ fontFamily: fontInter, color: "#A0A8C0" }}
          >
            Check your inbox and click the link to activate your account.
          </p>
          {resendError ? (
            <p className="mb-4 text-[13px] text-[#FF4560]" style={{ fontFamily: fontInter }}>
              {resendError}
            </p>
          ) : null}
          <div className="mb-6 h-px w-full bg-[rgba(255,255,255,0.08)]" />
          <div className="mt-6">
            {!resent ? (
              <div className="flex flex-wrap items-center justify-center gap-1">
                <span className="text-[13px]" style={{ fontFamily: fontInter, color: "#5A6080" }}>
                  Didn&apos;t receive it?
                </span>
                <button
                  type="button"
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 text-[13px] text-[#00BFFF] disabled:opacity-50"
                  style={{ fontFamily: fontInter }}
                  onClick={() => void handleResend()}
                >
                  {resending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Resend verification email
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle className="size-4 text-[#00BFFF]" aria-hidden />
                <span className="text-[13px] text-[#00BFFF]" style={{ fontFamily: fontInter }}>
                  Verification email sent!
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="mt-6 text-[13px] text-[#5A6080] transition-colors hover:text-[#A0A8C0]"
            style={{ fontFamily: fontInter }}
            onClick={() => router.push("/sign-in")}
          >
            Back to Sign In
          </button>
          <p
            className="mt-5 text-[10px] uppercase tracking-wider text-[#5A6080]"
            style={{ fontFamily: fontMono }}
          >
            Link expires in 24 hours.
          </p>
        </div>
      )}

      {status === "verified" && (
        <div style={glassCard}>
          <div className="relative mx-auto mb-6 flex size-20 items-center justify-center">
            <div
              className="flex size-20 items-center justify-center rounded-full animate-auth-pulse-ring"
              style={{
                background: "rgba(0,191,255,0.10)",
                border: "2px solid #00BFFF",
              }}
            >
              <Check className="size-9 text-[#00BFFF]" strokeWidth={2.5} aria-hidden />
            </div>
          </div>
          <div className="relative mx-auto mb-6 h-16 w-full max-w-[200px]">
            <div className="auth-confetti-dot" />
            <div className="auth-confetti-dot" />
            <div className="auth-confetti-dot" />
            <div className="auth-confetti-dot" />
            <div className="auth-confetti-dot" />
            <div className="auth-confetti-dot" />
          </div>
          <h1 className="mb-2 text-[28px] font-semibold text-white" style={{ fontFamily: fontGrotesk }}>
            Email verified!
          </h1>
          <p className="mb-8 text-[15px]" style={{ fontFamily: fontInter, color: "#A0A8C0" }}>
            Your account is now active.
          </p>
          <div className="mb-6 h-px w-full bg-[rgba(255,255,255,0.08)]" />
          <p className="mb-4 mt-6 text-[14px] font-semibold text-white" style={{ fontFamily: fontGrotesk }}>
            What&apos;s next?
          </p>
          <button
            type="button"
            className="mb-2.5 h-[52px] w-full rounded-full bg-[#00BFFF] text-[15px] font-semibold text-black transition-opacity hover:opacity-95"
            style={{ fontFamily: fontGrotesk }}
            onClick={() => router.push("/sign-in")}
          >
            Go to Playlist Portal →
          </button>
          <button
            type="button"
            className="h-12 w-full rounded-full border border-[rgba(255,255,255,0.12)] bg-transparent text-[14px] font-medium text-[#A0A8C0] transition-colors hover:bg-white/[0.04]"
            style={{ fontFamily: fontGrotesk, fontWeight: 500 }}
            onClick={() => router.push("/")}
          >
            Back to Homepage →
          </button>
        </div>
      )}

      {status === "expired" && (
        <div style={glassCard}>
          <div
            className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full"
            style={{
              background: "rgba(245,166,35,0.10)",
              border: "1px solid rgba(245,166,35,0.30)",
            }}
          >
            <AlertTriangle className="size-9 text-[#F5A623]" strokeWidth={2} aria-hidden />
          </div>
          <h1 className="mb-2 text-[26px] font-semibold text-white" style={{ fontFamily: fontGrotesk }}>
            Link expired
          </h1>
          <p className="mb-1 text-[14px]" style={{ fontFamily: fontInter, color: "#A0A8C0" }}>
            This verification link has expired.
          </p>
          <p className="mb-8 text-[13px]" style={{ fontFamily: fontInter, color: "#5A6080" }}>
            Links are valid for 24 hours.
          </p>
          <input
            type="email"
            value={userEmail}
            onChange={(ev) => setUserEmail(ev.target.value)}
            placeholder="your@email.com"
            className="mb-4 w-full rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-[14px] text-white outline-none placeholder:text-[#5A6080] focus:border-[#F5A623]"
            style={{ fontFamily: fontInter }}
          />
          {resendError ? (
            <p className="mb-4 text-[13px] text-[#FF4560]" style={{ fontFamily: fontInter }}>
              {resendError}
            </p>
          ) : null}
          {!resent ? (
            <button
              type="button"
              disabled={resending}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#F5A623] text-[15px] font-semibold text-black disabled:opacity-60"
              style={{ fontFamily: fontGrotesk }}
              onClick={() => void handleResend()}
            >
              {resending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
              Send a new link →
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3">
              <CheckCircle className="size-4 text-[#00BFFF]" aria-hidden />
              <span className="text-[14px] text-[#A0A8C0]" style={{ fontFamily: fontInter }}>
                New verification email sent.
              </span>
            </div>
          )}
          <button
            type="button"
            className="mt-6 text-[13px] text-[#5A6080] transition-colors hover:text-[#A0A8C0]"
            style={{ fontFamily: fontInter }}
            onClick={() => router.push("/contact")}
          >
            Contact support
          </button>
        </div>
      )}
    </div>
  );
}

function VerifyFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08080F] text-sm text-[#A0A8C0]">
      Loading…
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyEmailInner />
    </Suspense>
  );
}
