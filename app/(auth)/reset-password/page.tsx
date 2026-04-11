"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authCallbackUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/client";

type Step = "1" | "2" | "3";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState<Step>("1");

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);
  const [formError, setFormError] = useState("");
  const [updateError, setUpdateError] = useState("");

  const strength = useMemo(() => {
    if (newPassword.length < 6) return "Weak";
    if (newPassword.length < 10) return "Medium";
    return "Strong";
  }, [newPassword]);

  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get("step") as Step | null;
    if (current === "1" || current === "2" || current === "3") {
      setStep(current);
    }
  }, []);

  const gotoStep = (s: Step) => {
    setStep(s);
    router.push(`/reset-password?step=${s}`);
  };

  const onRequest = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const redirectTo = authCallbackUrl("/reset-password?step=3");
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    gotoStep("2");
  };

  const onUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setUpdateError("");
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      setUpdateError(error.message);
      return;
    }
    router.push("/sign-in?notice=password_updated");
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=Space+Grotesk:wght@600&family=Inter:wght@400;500&family=Space+Mono&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style jsx global>{`
        .hero-font {
          font-family: "Barlow Condensed", sans-serif;
        }
        .mono-font {
          font-family: "Space Mono", monospace;
        }
        .hardware-gradient {
          background: linear-gradient(135deg, #8fd6ff 0%, #00bfff 100%);
        }
      `}</style>

      <div className="bg-[#08080F] text-on-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden w-full">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-container/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 blur-[120px] rounded-full" />
        </div>

        <main className="relative z-10 w-full max-w-[440px]">
          <section
            className={`${step === "2" ? "p-12 rounded-3xl" : "p-10 rounded-2xl"} shadow-[0_40px_80px_rgba(0,0,0,0.3)] flex flex-col items-center`}
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
            }}
          >
            {step === "1" && (
              <>
                <div className="mb-8 w-8 h-8 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[32px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                    album
                  </span>
                </div>
                <h1 className="text-[24px] font-semibold mb-2 text-white text-center leading-tight">Reset Your Password</h1>
                <p className="text-on-surface-variant text-[14px] mb-8 text-center leading-relaxed">Enter your email. We&apos;ll send a reset link.</p>
                <form className="w-full space-y-6" onSubmit={onRequest}>
                  <div>
                    <label className="block text-[10px] font-medium text-on-surface-variant uppercase tracking-[0.15em] mb-2 px-1">Email Address</label>
                    <input className="w-full bg-white/[0.03] border border-white/[0.05] focus:ring-1 focus:ring-primary focus:border-primary text-on-surface py-3 px-4 rounded-sm transition-all outline-none placeholder:text-on-surface-variant/30" placeholder="name@domain.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <button className="w-full hardware-gradient text-on-primary font-bold h-[46px] rounded-sm flex items-center justify-center gap-2 group transition-all active:scale-[0.98] shadow-[0_4px_16px_rgba(0,191,255,0.25)]" type="submit" disabled={loading}>
                    {loading ? "Loading..." : "Send Reset Link"}
                    <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </form>
                <Link className="mt-8 text-on-surface-variant text-sm font-medium hover:text-white transition-colors flex items-center gap-2" href="/sign-in">
                  <span className="material-symbols-outlined text-lg">west</span>
                  Back to Sign In
                </Link>
              </>
            )}

            {step === "2" && (
              <>
                <div className="w-[52px] h-[52px] rounded-full bg-primary/10 flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl">mail</span>
                </div>
                <h2 className="text-[22px] font-semibold mb-3 text-white text-center leading-tight">Check your email.</h2>
                <p className="text-on-surface-variant text-sm mb-10 text-center leading-relaxed">
                  We&apos;ve sent a reset link to <br />
                  <span className="mono-font text-primary font-medium tracking-tight">{email || "dj.pulse@killercutz.fm"}</span>
                </p>
                <div className="flex flex-col items-center gap-6">
                  <button
                    type="button"
                    className="text-primary text-sm font-medium hover:underline flex items-center gap-2 transition-all disabled:opacity-50"
                    disabled={loading}
                    onClick={() => void onRequest()}
                  >
                    {loading ? "Sending…" : "Resend reset email"}
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                  <button className="text-on-surface-variant/60 text-sm hover:text-on-surface transition-colors flex items-center gap-2" onClick={() => gotoStep("3")}>
                    Continue to set new password
                  </button>
                </div>
              </>
            )}

            {step === "3" && (
              <>
                <div className="mb-6 flex items-center justify-center w-14 h-14 bg-primary/20 rounded-full">
                  <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    lock
                  </span>
                </div>
                <h2 className="text-[22px] font-semibold mb-2 text-white font-headline">Set a New Password</h2>
                <p className="text-on-surface-variant text-sm mb-10 text-center">Make sure your new password is at least 12 characters long and complex.</p>
                <form className="w-full space-y-6" onSubmit={onUpdate}>
                  {(formError || updateError) && (
                    <div className="w-full bg-error-container/50 border border-error/40 text-on-error-container text-xs px-3 py-2 rounded-sm">
                      {formError || updateError}
                    </div>
                  )}
                  <div className="relative">
                    <label className="block text-[10px] font-medium text-on-surface-variant uppercase tracking-[0.2em] mb-2 px-1">New Password</label>
                    <div className="relative">
                      <input className="w-full bg-surface-container-highest border-none focus:ring-1 focus:ring-primary text-on-surface py-3.5 px-4 rounded-sm transition-all outline-none pr-12" placeholder="••••••••••••" type={showA ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                      <button className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors" type="button" onClick={() => setShowA((s) => !s)}>
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1"><span className="text-[11px] mono-font uppercase text-on-surface-variant tracking-wider">Strength</span><span className={`text-[11px] mono-font uppercase tracking-wider font-bold ${strength === "Strong" ? "text-[#4ADE80]" : strength === "Medium" ? "text-[#FBBF24]" : "text-[#EF4444]"}`}>{strength}</span></div>
                    <div className="flex gap-1 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="w-full h-full flex gap-1">
                        <div className={`h-full w-1/3 ${strength === "Weak" || strength === "Medium" || strength === "Strong" ? "bg-[#EF4444]" : "bg-surface-container-high"}`} />
                        <div className={`h-full w-1/3 ${strength === "Medium" || strength === "Strong" ? "bg-[#FBBF24]" : "bg-surface-container-high"}`} />
                        <div className={`h-full w-1/3 ${strength === "Strong" ? "bg-[#22C55E] shadow-[0_0_12px_rgba(34,197,94,0.4)]" : "bg-surface-container-high"}`} />
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-[10px] font-medium text-on-surface-variant uppercase tracking-[0.2em] mb-2 px-1">Confirm Password</label>
                    <div className="relative">
                      <input className="w-full bg-surface-container-highest border-none focus:ring-1 focus:ring-primary text-on-surface py-3.5 px-4 rounded-sm transition-all outline-none pr-12" placeholder="••••••••••••" type={showB ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                      <button className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors" type="button" onClick={() => setShowB((s) => !s)}>
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </button>
                    </div>
                  </div>
                  <button className="w-full hardware-gradient text-white font-bold py-4 rounded-sm flex items-center justify-center gap-2 group transition-all active:scale-[0.98] shadow-[0_10px_20px_rgba(0,191,255,0.2)]" type="submit" disabled={loading}>
                    {loading ? "Loading..." : "Update Password"}
                    <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </form>
                <p className="mt-8 text-[10px] mono-font text-on-surface-variant uppercase text-center opacity-40 tracking-widest">Success will redirect to dashboard</p>
              </>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
