"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { authCallbackUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = useMemo(() => {
    if (password.length < 6) return "Weak";
    if (password.length < 10) return "Medium";
    return "Strong";
  }, [password]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (password !== confirmPassword) {
      setLoading(false);
      setError("Passwords do not match.");
      return;
    }
    const emailRedirectTo = authCallbackUrl("/verify-email?status=verified");
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      },
    });
    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }
    await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: fullName || "New User",
        clientEmail: email,
        clientPhone: phone || "+233000000000",
        eventType: "Account Registration",
        eventDate: new Date().toISOString().split("T")[0],
        venue: "Online",
        guestCount: null,
        notes: "Auto-created from register flow",
        packageName: null,
        genres: [],
      }),
    });
    setLoading(false);
    router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@400;500;600&family=Space+Mono&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style jsx global>{`
        .vinyl-ring {
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .glass-input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glass-input:focus {
          border-color: #00bfff;
          background: rgba(255, 255, 255, 0.06);
          outline: none;
          box-shadow: 0 0 0 2px rgba(0, 191, 255, 0.2);
        }
      `}</style>
      <div className="bg-[#08080F] text-on-surface font-body min-h-screen selection:bg-primary-container/30 overflow-x-hidden w-full">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-container/10 blur-[120px] rounded-full" />
          <div className="vinyl-ring w-[400px] h-[400px]" />
          <div className="vinyl-ring w-[600px] h-[600px]" />
          <div className="vinyl-ring w-[800px] h-[800px]" />
        </div>

        <main className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12">
          <div
            className="w-full max-w-[480px] p-8 md:p-10 shadow-2xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
            }}
          >
            <header className="flex flex-col items-center mb-10">
                  <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,191,255,0.4)]">
                    <span className="material-symbols-outlined text-surface text-2xl">album</span>
                  </div>
                  <h1 className="font-headline font-semibold text-[26px] text-white leading-tight mb-2 tracking-tight">Create Your Account</h1>
                  <p className="text-on-surface-variant text-[14px] text-center leading-relaxed">Book a DJ, curate your playlist, track your event.</p>
                </header>

                <form className="space-y-5" onSubmit={submit}>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">person</span>
                    <input className="glass-input w-full h-[52px] pl-12 pr-4 rounded-xl text-[14px] text-white placeholder:text-on-surface-variant/40 transition-all" placeholder="Full Name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">mail</span>
                    <input className="glass-input w-full h-[52px] pl-12 pr-4 rounded-xl text-[14px] text-white placeholder:text-on-surface-variant/40 transition-all" placeholder="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="flex gap-2">
                    <div className="glass-input px-4 rounded-xl flex items-center gap-2 border border-white/10 shrink-0 h-[52px]">
                      <span className="material-symbols-outlined text-secondary text-lg">flag</span>
                      <span className="font-mono text-[13px] text-on-surface">+233</span>
                    </div>
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">phone_iphone</span>
                      <input className="glass-input w-full h-[52px] pl-12 pr-4 rounded-xl text-[14px] text-white placeholder:text-on-surface-variant/40 transition-all" placeholder="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">lock</span>
                      <input className="glass-input w-full h-[52px] pl-12 pr-12 rounded-xl text-[14px] text-white placeholder:text-on-surface-variant/40 transition-all" placeholder="Password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                      <button className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors" type="button" onClick={() => setShowPassword((s) => !s)}>
                        <span className="material-symbols-outlined text-lg">{showPassword ? "visibility_off" : "visibility"}</span>
                      </button>
                    </div>
                    <div className="pt-1">
                      <div className="flex justify-between items-center mb-1.5 px-1">
                        <span className="font-mono text-[11px] text-on-surface-variant/60 uppercase tracking-widest">Security Strength</span>
                        <span className="font-mono text-[11px] text-primary-container">{strength}</span>
                      </div>
                      <div className="flex gap-1 h-1 w-full">
                        <div className={`flex-1 rounded-full ${strength === "Weak" || strength === "Medium" || strength === "Strong" ? "bg-error" : "bg-surface-container-high"}`} />
                        <div className={`flex-1 rounded-full ${strength === "Medium" || strength === "Strong" ? "bg-secondary" : "bg-surface-container-high"}`} />
                        <div className={`flex-1 rounded-full ${strength === "Strong" ? "bg-primary-container shadow-[0_0_8px_rgba(0,191,255,0.4)]" : "bg-surface-container-high"}`} />
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">enhanced_encryption</span>
                    <input className="glass-input w-full h-[52px] pl-12 pr-4 rounded-xl text-[14px] text-white placeholder:text-on-surface-variant/40 transition-all" placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                  <div className="flex items-start gap-3 px-1 pt-2">
                    <div className="relative flex items-center justify-center pt-0.5">
                      <input className="w-5 h-5 rounded-md glass-input border-white/10 text-primary-container focus:ring-offset-surface focus:ring-primary-container cursor-pointer" id="terms" type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} required />
                    </div>
                    <label className="text-[13px] text-on-surface-variant leading-relaxed" htmlFor="terms">
                      I agree to the <Link className="text-primary-container hover:underline underline-offset-4" href="/terms">Terms of Service</Link> and <Link className="text-primary-container hover:underline underline-offset-4" href="/privacy">Privacy Policy</Link>.
                    </label>
                  </div>
                  {error && (
                    <div className="w-full bg-error-container/50 border border-error/40 text-on-error-container text-xs px-3 py-2 rounded-sm">
                      {error}
                    </div>
                  )}
                  <button className="w-full h-[46px] bg-primary-container text-surface font-headline font-bold uppercase tracking-widest text-[14px] rounded-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-4" type="submit" disabled={loading}>
                    {loading ? "Loading..." : "Create Account"}
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </form>

            <footer className="text-center mt-8">
              <p className="text-[13px] text-on-surface-variant">
                Already have an account?
                <Link className="text-primary-container font-semibold hover:underline underline-offset-4 ml-1 inline-flex items-center gap-1" href="/sign-in">
                  Sign In <span className="material-symbols-outlined text-[14px] align-middle">arrow_forward</span>
                </Link>
              </p>
            </footer>
          </div>
        </main>

        <div className="fixed bottom-8 right-8 z-20 hidden md:block opacity-20 hover:opacity-100 transition-opacity">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-[0.3em] rotate-90 origin-bottom-right">Page KillerCutz // Secure Auth v3.0</p>
        </div>
      </div>
    </>
  );
}
