"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { authCallbackUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/client";

const glassCard =
  "w-full max-w-[440px] rounded-[24px] border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.05)] px-10 py-12 text-center backdrop-blur-[24px]";
const fontGrotesk = "'Space Grotesk', var(--font-space-grotesk), system-ui, sans-serif";
const fontInter = "Inter, var(--font-inter), system-ui, sans-serif";

async function smartRedirect(router: { push: (href: string) => void }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    router.push("/sign-in");
    return;
  }
  const { data } = await supabase.from("admins").select("role, status").ilike("email", user.email).maybeSingle();
  const row = data as { role: string; status: string } | null;
  if (row?.status === "active" && (row.role === "admin" || row.role === "super_admin")) {
    if (typeof window !== "undefined") localStorage.setItem("adminRole", row.role);
    router.push("/admin/overview");
    return;
  }
  router.push("/client/dashboard");
}

function calculateStrength(pwd: string): number {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

function strengthLabel(score: number): { text: string; color: string } {
  if (score <= 0) return { text: "", color: "#5A6080" };
  if (score === 1) return { text: "Weak", color: "#FF4560" };
  if (score === 2) return { text: "Fair", color: "#F5A623" };
  if (score === 3) return { text: "Good", color: "#00BFFF" };
  return { text: "Strong", color: "#22c55e" };
}

function strengthFill(score: number): { width: string; bg: string } {
  if (score <= 0) return { width: "0%", bg: "#FF4560" };
  if (score === 1) return { width: "25%", bg: "#FF4560" };
  if (score === 2) return { width: "50%", bg: "#F5A623" };
  if (score === 3) return { width: "75%", bg: "#00BFFF" };
  return { width: "100%", bg: "#22c55e" };
}

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [strength, setStrength] = useState(0);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const s = searchParams.get("step");
    if (s === "3") setStep(3);
    else if (s === "2") setStep(2);
  }, [searchParams]);

  useEffect(() => {
    setStrength(calculateStrength(password));
  }, [password]);

  const handleStep1 = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const redirectTo = authCallbackUrl("/reset-password?step=3");
    const { error: reqErr } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    if (reqErr) {
      setError(reqErr.message);
      return;
    }
    setStep(2);
    router.replace("/reset-password?step=2");
  };

  const handleStep3 = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (strength < 2) {
      setError("Password is too weak. Add uppercase letters, numbers, or symbols.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: upErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setStep(4);
  };

  useEffect(() => {
    if (step !== 4) return;
    setCountdown(3);
    let count = 3;
    const timer = window.setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        window.clearInterval(timer);
        void smartRedirect(router);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, router]);

  const fill = strengthFill(strength);
  const label = strengthLabel(strength);
  const confirmMismatch = Boolean(confirmPassword && password !== confirmPassword);
  const confirmMatch = Boolean(confirmPassword && password === confirmPassword);
  const canSubmit =
    password.length >= 8 && password === confirmPassword && strength >= 2 && !loading;

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-5 py-16"
      style={{ background: "#08080F" }}
    >
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
        className="fixed z-20 flex items-center gap-2.5 outline-none"
        style={{ top: 24, left: 32 }}
      >
        <Image src="/pageicon.png" alt="" width={24} height={24} className="h-6 w-auto object-contain" priority />
        <span className="text-[15px] font-bold tracking-tight text-white" style={{ fontFamily: fontGrotesk }}>
          PAGE KILLERCUTZ
        </span>
      </Link>

      <div className={glassCard}>
        {step === 1 && (
          <>
            <div
              className="mx-auto mb-6 flex size-[60px] items-center justify-center rounded-full"
              style={{
                background: "rgba(0,191,255,0.08)",
                border: "1px solid rgba(0,191,255,0.20)",
              }}
            >
              <Lock className="size-7 text-[#00BFFF]" strokeWidth={2} aria-hidden />
            </div>
            <h1 className="mb-2 text-[24px] font-semibold text-white" style={{ fontFamily: fontGrotesk }}>
              Reset your password
            </h1>
            <p className="mb-8 text-[14px] leading-relaxed text-[#A0A8C0]" style={{ fontFamily: fontInter }}>
              Enter your email address and we&apos;ll send you a reset link.
            </p>
            <label className="mb-1.5 block w-full text-left text-[12px] font-medium text-white" style={{ fontFamily: fontInter }}>
              Email address
            </label>
            <div className="relative mb-2 w-full">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#5A6080]"
                aria-hidden
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="h-[52px] w-full rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.05)] py-0 pl-11 pr-4 text-[14px] text-white outline-none placeholder:text-[#5A6080] focus:border-[#00BFFF] focus:shadow-[0_0_0_3px_rgba(0,191,255,0.10)]"
                style={{ fontFamily: fontInter }}
              />
            </div>
            {error ? (
              <div className="mt-2 flex items-start gap-2 text-left">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-[#FF4560]" aria-hidden />
                <span className="text-[13px] text-[#FF4560]" style={{ fontFamily: fontInter }}>
                  {error}
                </span>
              </div>
            ) : null}
            <button
              type="button"
              disabled={loading}
              className="mt-6 flex h-[52px] w-full items-center justify-center rounded-full bg-[#00BFFF] text-[15px] font-semibold text-black disabled:opacity-60"
              style={{ fontFamily: fontGrotesk }}
              onClick={() => void handleStep1()}
            >
              {loading ? <Loader2 className="size-[18px] animate-spin text-black" aria-hidden /> : "Send Reset Link →"}
            </button>
            <button
              type="button"
              className="mt-5 flex w-full items-center justify-center gap-1.5 text-[13px] text-[#5A6080] transition-colors hover:text-[#A0A8C0]"
              style={{ fontFamily: fontInter }}
              onClick={() => router.push("/sign-in")}
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Back to Sign In
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div
              className="mx-auto mb-6 flex size-[60px] items-center justify-center rounded-full animate-auth-float"
              style={{
                background: "rgba(0,191,255,0.10)",
                border: "1px solid rgba(0,191,255,0.25)",
              }}
            >
              <Mail className="size-7 text-[#00BFFF]" strokeWidth={2} aria-hidden />
            </div>
            <h1 className="mb-2 text-[24px] font-semibold text-white" style={{ fontFamily: fontGrotesk }}>
              Check your inbox
            </h1>
            <p className="mb-1 text-[14px] text-[#A0A8C0]" style={{ fontFamily: fontInter }}>
              We&apos;ve sent a password reset link to:
            </p>
            <div
              className="mx-auto mb-6 mt-1 inline-block rounded-lg px-4 py-2"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 14,
                color: "#00BFFF",
                background: "rgba(0,191,255,0.08)",
                border: "1px solid rgba(0,191,255,0.15)",
              }}
            >
              {email || "your inbox"}
            </div>
            <p className="mx-auto mb-8 max-w-[300px] text-[13px] leading-relaxed text-[#A0A8C0]" style={{ fontFamily: fontInter }}>
              Click the link in the email to set a new password. The link expires in 1 hour.
            </p>
            <div className="mb-6 h-px w-full bg-[rgba(255,255,255,0.08)]" />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-1">
              <span className="text-[13px] text-[#5A6080]" style={{ fontFamily: fontInter }}>
                Didn&apos;t receive it?
              </span>
              <button
                type="button"
                className="text-[13px] text-[#00BFFF]"
                style={{ fontFamily: fontInter }}
                onClick={() => {
                  setStep(1);
                  router.replace("/reset-password");
                }}
              >
                Resend →
              </button>
            </div>
            <button
              type="button"
              className="mt-4 text-[13px] text-[#5A6080] transition-colors hover:text-[#A0A8C0]"
              style={{ fontFamily: fontInter }}
              onClick={() => router.push("/sign-in")}
            >
              Back to Sign In
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div
              className="mx-auto mb-6 flex size-[60px] items-center justify-center rounded-full"
              style={{
                background: "rgba(0,191,255,0.08)",
                border: "1px solid rgba(0,191,255,0.20)",
              }}
            >
              <ShieldCheck className="size-7 text-[#00BFFF]" strokeWidth={2} aria-hidden />
            </div>
            <h1 className="mb-2 text-[24px] font-semibold text-white" style={{ fontFamily: fontGrotesk }}>
              Set a new password
            </h1>
            <p className="mb-8 text-[14px] leading-relaxed text-[#A0A8C0]" style={{ fontFamily: fontInter }}>
              Choose a strong password for your Page KillerCutz account.
            </p>

            <label className="mb-1.5 block w-full text-left text-[12px] font-medium text-white" style={{ fontFamily: fontInter }}>
              New password
            </label>
            <div className="relative mb-2 w-full">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#5A6080]"
                aria-hidden
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[52px] w-full rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.05)] py-0 pl-11 pr-12 text-[14px] text-white outline-none focus:border-[#00BFFF] focus:shadow-[0_0_0_3px_rgba(0,191,255,0.10)]"
                style={{ fontFamily: fontInter }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6080] hover:text-white"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div className="mb-4 w-full">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] text-[#5A6080]" style={{ fontFamily: fontInter }}>
                  Password strength
                </span>
                {label.text ? (
                  <span className="text-[11px] font-medium" style={{ color: label.color, fontFamily: fontInter }}>
                    {label.text}
                  </span>
                ) : null}
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{ width: fill.width, background: fill.bg }}
                />
              </div>
            </div>

            <label className="mb-1.5 block w-full text-left text-[12px] font-medium text-white" style={{ fontFamily: fontInter }}>
              Confirm password
            </label>
            <div className="relative mb-2 w-full">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#5A6080]"
                aria-hidden
              />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-[52px] w-full rounded-xl border bg-[rgba(255,255,255,0.05)] py-0 pl-11 pr-12 text-[14px] text-white outline-none"
                style={{
                  fontFamily: fontInter,
                  borderColor: confirmMismatch ? "#FF4560" : confirmMatch ? "#22c55e" : "rgba(255,255,255,0.10)",
                  boxShadow: confirmMismatch
                    ? "0 0 0 3px rgba(255,69,96,0.10)"
                    : confirmMatch
                      ? "0 0 0 3px rgba(34,197,94,0.10)"
                      : undefined,
                }}
              />
              {confirmMatch ? (
                <CheckCircle className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-[#22c55e]" aria-hidden />
              ) : (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6080] hover:text-white"
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              )}
            </div>
            {confirmMismatch ? (
              <p className="mb-2 text-left text-[12px] text-[#FF4560]" style={{ fontFamily: fontInter }}>
                Passwords do not match
              </p>
            ) : null}
            {error ? (
              <div className="mt-2 flex items-start gap-2 text-left">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-[#FF4560]" aria-hidden />
                <span className="text-[13px] text-[#FF4560]" style={{ fontFamily: fontInter }}>
                  {error}
                </span>
              </div>
            ) : null}

            <button
              type="button"
              disabled={!canSubmit}
              className="mt-6 flex h-[52px] w-full items-center justify-center rounded-full text-[15px] font-semibold disabled:cursor-not-allowed disabled:bg-[rgba(255,255,255,0.06)] disabled:text-[#5A6080]"
              style={{
                fontFamily: fontGrotesk,
                ...(canSubmit
                  ? { background: "#00BFFF", color: "#000" }
                  : {}),
              }}
              onClick={() => void handleStep3()}
            >
              {loading ? <Loader2 className="size-[18px] animate-spin text-black" aria-hidden /> : "Update Password →"}
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <div
              className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full animate-auth-pulse-ring-green"
              style={{
                background: "rgba(34,197,94,0.10)",
                border: "2px solid #22c55e",
              }}
            >
              <Check className="size-9 text-[#22c55e]" strokeWidth={2.5} aria-hidden />
            </div>
            <h1 className="mb-2 text-[26px] font-semibold text-white" style={{ fontFamily: fontGrotesk }}>
              Password updated!
            </h1>
            <p className="mb-8 text-[14px] text-[#A0A8C0]" style={{ fontFamily: fontInter }}>
              Your password has been changed successfully.
            </p>
            <p className="mb-6 text-[12px] text-[#5A6080]" style={{ fontFamily: "'Space Mono', monospace" }}>
              Redirecting in {Math.max(0, countdown)}…
            </p>
            <button
              type="button"
              className="flex h-[52px] w-full items-center justify-center rounded-full bg-[#00BFFF] text-[15px] font-semibold text-black"
              style={{ fontFamily: fontGrotesk }}
              onClick={() => void smartRedirect(router)}
            >
              Go to Sign In now →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ResetFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08080F] text-sm text-[#A0A8C0]">
      Loading…
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
