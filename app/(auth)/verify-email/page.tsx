"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authCallbackUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/client";

type Status = "waiting" | "verified" | "expired";

export default function VerifyEmailPage() {
  const supabase = createClient();
  const [status, setStatus] = useState<Status>("waiting");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = q.get("status") as Status | null;
    const e = q.get("email") ?? "";
    if (s === "waiting" || s === "verified" || s === "expired") setStatus(s);
    setEmail(e);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const emailRedirectTo = authCallbackUrl("/verify-email?status=verified");

  const resendSignup = async () => {
    if (!email.trim()) {
      setError("Add your email below or go back to register.");
      return;
    }
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setResendCooldown(60);
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=Space+Grotesk:wght@600&family=Inter:wght@400;500&family=Space+Mono&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style jsx global>{`
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .pulse-ring {
          box-shadow: 0 0 0 0 rgba(143, 214, 255, 0.4);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(143, 214, 255, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 20px rgba(143, 214, 255, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(143, 214, 255, 0);
          }
        }
      `}</style>

      <div className="bg-[#08080F] text-on-surface font-body min-h-screen flex items-center justify-center p-6 overflow-hidden w-full">
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-[10%] right-[15%] w-[400px] h-[400px] bg-primary-container/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] bg-secondary/5 blur-[100px] rounded-full" />
        </div>

        {status === "waiting" && (
          <div
            className="w-full max-w-[460px] p-10 flex flex-col items-center text-center relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
            }}
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary-container/10 blur-3xl rounded-full" />
            <div className="mb-8 animate-float">
              <div className="w-20 h-20 rounded-full bg-primary-container/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[64px] text-primary-container">mail</span>
              </div>
            </div>
            <h1 className="font-headline text-[24px] text-white mb-2">Verify your email</h1>
            <p className="text-on-surface-variant text-[14px] leading-relaxed">We&apos;ve sent a verification link to:</p>
            <div className="my-3 py-2 px-4 bg-surface-container-low rounded-sm w-full max-w-sm">
              <input
                type="email"
                className="w-full bg-transparent text-center font-label text-[15px] text-primary-container outline-none placeholder:text-on-surface-variant/50"
                placeholder="your@email.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                autoComplete="email"
              />
            </div>
            <p className="text-on-surface-variant text-[13px] leading-relaxed mb-6 max-w-[300px]">
              Check your inbox and spam folder. The link confirms your account and signs you in.
            </p>
            {error && (
              <div className="w-full mb-4 text-left text-xs bg-error-container/40 border border-error/30 text-on-error-container px-3 py-2 rounded-sm">
                {error}
              </div>
            )}
            <div className="w-full h-[1px] bg-outline-variant/20 mb-6" />
            <div className="flex flex-col gap-4 w-full">
              <button
                type="button"
                className="flex items-center justify-center gap-2 text-primary-container font-medium hover:text-primary transition-colors duration-200 disabled:opacity-50"
                disabled={loading || resendCooldown > 0}
                onClick={() => void resendSignup()}
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span className="text-[14px]">
                  {loading ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
                </span>
              </button>
              <Link
                className="text-on-surface-variant hover:text-on-surface text-[14px] transition-colors duration-200"
                href="/register"
              >
                Use a different email (register again)
              </Link>
              <Link
                className="flex items-center justify-center gap-2 text-on-surface-variant hover:text-on-surface text-[14px] transition-colors duration-200 mt-2"
                href="/sign-in"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Sign In
              </Link>
            </div>
            <div className="mt-10">
              <span className="font-label text-[10px] text-on-surface-variant tracking-wider uppercase opacity-60">
                Link expires per your Supabase project settings.
              </span>
            </div>
          </div>
        )}

        {status === "verified" && (
          <div className="w-full max-w-[460px] relative">
            <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full" />
            <div
              className="p-10 flex flex-col items-center text-center relative z-10"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px",
              }}
            >
              <div className="mb-8 relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full pulse-ring" />
                <div className="w-[72px] h-[72px] bg-primary rounded-full flex items-center justify-center relative shadow-[0_0_20px_rgba(143,214,255,0.4)]">
                  <span className="material-symbols-outlined text-surface text-4xl" style={{ fontVariationSettings: "'wght' 700" }}>
                    check
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-10">
                <h2 className="font-headline text-2xl text-white tracking-tight">Email verified!</h2>
                <p className="text-on-surface-variant text-[14px] leading-relaxed max-w-[280px] mx-auto">
                  Your account is active. You can open the playlist portal or explore the site.
                </p>
              </div>
              <div className="w-full space-y-4">
                <Link
                  className="block w-full py-4 px-6 bg-primary-container text-on-primary-fixed font-bold text-sm tracking-wide rounded-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98] shadow-[0_0_15px_rgba(0,191,255,0.2)]"
                  href="/client/dashboard"
                >
                  Go to your Playlist Portal →
                </Link>
                <Link
                  className="block w-full py-3 px-6 text-on-surface-variant font-medium text-sm transition-colors duration-200 hover:text-white flex items-center justify-center gap-2"
                  href="/"
                >
                  Or go to the homepage →
                </Link>
              </div>
            </div>
          </div>
        )}

        {status === "expired" && (
          <div className="w-full max-w-[460px] relative">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-[100px]" />
            <div
              className="p-10 flex flex-col items-center text-center shadow-2xl relative z-10"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px",
              }}
            >
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-8 ring-4 ring-secondary/5">
                <span className="material-symbols-outlined text-secondary text-4xl">warning</span>
              </div>
              <h2 className="font-headline text-[22px] text-white leading-tight mb-3">Verification link expired.</h2>
              <p className="text-on-surface-variant text-[13px] leading-relaxed mb-6 max-w-[280px]">
                Request a new confirmation email. Enter the address you used to register.
              </p>
              <input
                type="email"
                className="w-full mb-4 bg-white/[0.06] border border-white/10 rounded-sm px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-primary"
                placeholder="your@email.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
              {error && (
                <div className="w-full mb-4 text-left text-xs bg-error-container/40 border border-error/30 text-on-error-container px-3 py-2 rounded-sm">
                  {error}
                </div>
              )}
              <button
                type="button"
                className="w-full bg-secondary hover:bg-secondary-fixed-dim transition-all duration-200 text-on-secondary font-headline py-4 rounded-sm flex items-center justify-center gap-2 group mb-6 disabled:opacity-50"
                disabled={loading}
                onClick={() => void resendSignup()}
              >
                <span>{loading ? "Sending…" : "Send a new link"}</span>
                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
              <button type="button" className="text-on-surface-variant hover:text-white transition-colors text-[13px] mb-4" onClick={() => setStatus("waiting")}>
                ← Back to instructions
              </button>
              <Link className="text-on-surface-variant hover:text-white transition-colors text-[13px] font-medium" href="/contact">
                Contact support
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
