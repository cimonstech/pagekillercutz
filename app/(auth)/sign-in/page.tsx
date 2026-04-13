"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SpinningVinyl } from "@/components/ui/SpinningVinyl";

const DASHBOARD = "/client/dashboard";

function safeRedirectPath(param: string | null): string {
  if (param && param.startsWith("/") && !param.startsWith("//")) {
    return param;
  }
  return DASHBOARD;
}

type AdminGateResult =
  | { kind: "client" }
  | { kind: "admin"; role: "admin" | "super_admin" }
  | { kind: "suspended" };

async function resolveAdminGateForEmail(
  supabase: ReturnType<typeof createClient>,
  email: string | undefined,
): Promise<AdminGateResult> {
  if (!email) return { kind: "client" };
  const { data } = await supabase
    .from("admins")
    .select("role, status")
    .eq("email", email)
    .maybeSingle();
  const row = data as { role: string; status: string } | null;
  if (!row) return { kind: "client" };
  if (row.status === "suspended") return { kind: "suspended" };
  if (row.role === "admin" || row.role === "super_admin") {
    return { kind: "admin", role: row.role as "admin" | "super_admin" };
  }
  return { kind: "client" };
}

function SignInPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");
  const [checking, setChecking] = useState(true);
  const [lastTypedAt, setLastTypedAt] = useState(0);
  const [submitHover, setSubmitHover] = useState(false);
  const [spinTick, setSpinTick] = useState(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("notice") === "password_updated") {
      setBanner("Password updated. Sign in with your new password.");
    }
    if (q.get("error") === "auth_callback") {
      setBanner("Sign-in link expired or is invalid. Try again or request a new email.");
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setSpinTick((t) => t + 1), 280);
    return () => window.clearInterval(id);
  }, []);

  const recentlyTyping = spinTick >= 0 && Date.now() - lastTypedAt < 1000;
  const spinDurationSec = submitHover ? 1.5 : recentlyTyping ? 8 : 4;

  useEffect(() => {
    let cancelled = false;
    const client = createClient();
    const redirectTarget = safeRedirectPath(searchParams.get("redirect"));
    void (async () => {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (cancelled) return;
      if (!user?.email) {
        setChecking(false);
        return;
      }
      const gate = await resolveAdminGateForEmail(client, user.email);
      if (cancelled) return;
      if (gate.kind === "suspended") {
        await client.auth.signOut();
        localStorage.removeItem("adminRole");
        setChecking(false);
        return;
      }
      if (gate.kind === "admin") {
        localStorage.setItem("adminRole", gate.role);
        router.replace("/admin");
        return;
      }
      router.replace(redirectTarget);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: authError, data: authData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const signedInEmail = user?.email ?? authData.user?.email;
    const gate = await resolveAdminGateForEmail(supabase, signedInEmail);
    if (gate.kind === "suspended") {
      await supabase.auth.signOut();
      localStorage.removeItem("adminRole");
      setError("Your account has been suspended. Contact the platform administrator.");
      return;
    }
    if (gate.kind === "admin") {
      localStorage.setItem("adminRole", gate.role);
      router.refresh();
      router.replace("/admin");
      return;
    }
    localStorage.removeItem("adminRole");
    router.refresh();
    const redirectTo = safeRedirectPath(searchParams.get("redirect"));
    router.replace(redirectTo);
  };

  const signInWithGoogle = async () => {
    setError("");
    setOauthLoading(true);
    const next = safeRedirectPath(searchParams.get("redirect"));
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    setOauthLoading(false);
    if (oauthError) {
      setError(oauthError.message);
    }
  };

  if (checking) {
    return (
      <div className="flex h-[100vh] items-center justify-center bg-[#08080F]">
        <span className="font-body text-sm text-white/50">Loading…</span>
      </div>
    );
  }

  return (
    <div
      className="flex h-[100vh] flex-col overflow-y-auto overflow-x-hidden bg-[#08080F] sm:overflow-hidden"
      style={{ background: "#08080F" }}
    >
      <div
        className="pointer-events-none fixed left-0 top-0 z-0 h-[100vh] w-[100vw] overflow-hidden"
        aria-hidden
      >
        <div className="absolute left-1/2 top-1/2 h-[min(92vw,820px)] w-[min(92vw,820px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,191,255,0.04)]" />
        <div className="absolute left-1/2 top-1/2 h-[min(72vw,620px)] w-[min(72vw,620px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,191,255,0.06)]" />
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00BFFF]/10 blur-[100px]" />
      </div>

      <Link
        href="/"
        className="fixed left-8 top-6 z-10 flex items-center gap-2 outline-none ring-offset-2 ring-offset-[#08080F] focus-visible:ring-2 focus-visible:ring-[#00BFFF]"
        aria-label="Page KillerCutz home"
      >
        <Image src="/pageicon.png" alt="" width={28} height={28} className="h-7 w-auto object-contain" priority />
      </Link>

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-12 py-0">
          <div className="flex h-full w-full max-w-[960px] flex-col items-center justify-center gap-8 sm:h-full sm:flex-row sm:gap-12">
            <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-visible sm:h-full">
              <SpinningVinyl spinDurationSec={spinDurationSec} />
            </div>
            <div
              className="flex min-h-0 max-h-full w-full max-w-[400px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] p-8"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div className="mb-3 text-center">
                <h1 className="font-headline text-[22px] font-semibold leading-tight text-white">Sign in</h1>
                <p className="mt-1 font-body text-[13px] leading-snug text-[#A0A8C0]">
                  Access your playlist portal and bookings.
                </p>
              </div>

              {banner ? (
                <div className="mb-3 w-full rounded-[10px] border border-[#00BFFF]/30 bg-[#00BFFF]/10 px-3 py-2 font-body text-xs text-[#c3e8ff]">
                  {banner}
                </div>
              ) : null}

              <form onSubmit={onSubmit} className="space-y-2">
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-2.5 top-1/2 size-[18px] -translate-y-1/2 text-white/40"
                    strokeWidth={1.75}
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setLastTypedAt(Date.now());
                      setEmail(e.target.value);
                    }}
                    placeholder="Email"
                    className="w-full rounded-[10px] border border-white/10 bg-white/[0.06] py-2 pl-10 pr-3 font-body text-[13px] text-white placeholder:text-white/35 outline-none ring-0 focus:border-[#00BFFF]/40"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-2.5 top-1/2 size-[18px] -translate-y-1/2 text-white/40"
                    strokeWidth={1.75}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setLastTypedAt(Date.now());
                      setPassword(e.target.value);
                    }}
                    placeholder="Password"
                    className="w-full rounded-[10px] border border-white/10 bg-white/[0.06] py-2 pl-10 pr-11 font-body text-[13px] text-white placeholder:text-white/35 outline-none focus:border-[#00BFFF]/40"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                <div className="flex justify-end pt-0.5">
                  <Link href="/reset-password" className="font-body text-xs text-[#00BFFF] hover:underline">
                    Forgot your password?
                  </Link>
                </div>
                {error ? <p className="font-body text-xs text-error">{error}</p> : null}
                <button
                  type="submit"
                  disabled={loading}
                  onMouseEnter={() => setSubmitHover(true)}
                  onMouseLeave={() => setSubmitHover(false)}
                  className="flex h-9 w-full items-center justify-center rounded-full bg-[#00BFFF] font-headline text-[13px] font-semibold text-black transition-opacity hover:opacity-95 disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Sign In →"}
                </button>
              </form>

              <div className="my-2.5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="font-label text-[11px] text-white/45">or</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <button
                type="button"
                disabled={loading || oauthLoading}
                onClick={() => void signInWithGoogle()}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.05] font-headline text-[13px] font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/[0.09] disabled:opacity-60"
              >
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {oauthLoading ? "Redirecting…" : "Continue with Google"}
              </button>

              <p className="mt-2.5 text-center font-body text-[12px] leading-snug text-[#A0A8C0]">
                No account yet?{" "}
                <Link href="/booking" className="font-medium text-[#00BFFF] hover:underline">
                  Book the DJ first →
                </Link>
              </p>
              <div className="mt-5 border-t border-white/[0.06] pt-4 text-center">
                <p className="font-mono text-[10px] leading-relaxed text-[#5A6080]">
                  Are you the DJ or an admin?
                  <button
                    type="button"
                    onClick={() => router.push("/admin/login")}
                    className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[10px] text-[#5A6080] hover:text-[#A0A8C0]"
                  >
                    {" "}
                    Admin login →
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100vh] items-center justify-center bg-[#08080F]">
          <span className="font-body text-sm text-white/50">Loading…</span>
        </div>
      }
    >
      <SignInPageInner />
    </Suspense>
  );
}
