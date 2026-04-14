"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PAGE_ICON_URL } from "@/lib/constants";
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
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");
  const [checking, setChecking] = useState(true);
  const [lastTypedAt, setLastTypedAt] = useState(0);
  const [submitHover, setSubmitHover] = useState(false);
  const [spinTick, setSpinTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSpinTick((t) => t + 1), 280);
    return () => window.clearInterval(id);
  }, []);

  const recentlyTyping = spinTick >= 0 && Date.now() - lastTypedAt < 1000;
  const spinDurationSec = submitHover ? 1.5 : recentlyTyping ? 8 : 4;

  useEffect(() => {
    if (searchParams.get("notice") === "after_booking") {
      setBanner(
        "Booked successfully. Sign in with the password you set from your email. New here? Open the email we sent you (subject: set up your account) to choose a password first — we also texted your phone.",
      );
      return;
    }
    if (searchParams.get("notice") === "login_required") {
      setBanner(
        "Sign in to manage your booking and playlist. If you just booked, check your email (and SMS) to set your password first.",
      );
      return;
    }
    if (searchParams.get("notice") === "password_updated") {
      setBanner("Password updated. Sign in with your new password.");
      return;
    }
    if (searchParams.get("error") === "auth_callback") {
      setBanner(
        "That sign-in link could not be completed (expired or already used). If you clicked “set password” from email, try “Forgot your password?” below, or open the latest email from us.",
      );
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const client = createClient();
    const redirectTarget = safeRedirectPath(searchParams.get("redirect"));

    void (async () => {
      if (typeof window !== "undefined" && window.location.hash && window.location.hash.length > 1) {
        const hp = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const access_token = hp.get("access_token");
        const refresh_token = hp.get("refresh_token");
        const type = hp.get("type");
        if (access_token && refresh_token) {
          const { error: hashErr } = await client.auth.setSession({ access_token, refresh_token });
          if (cancelled) return;
          if (!hashErr) {
            const url = new URL(window.location.href);
            url.hash = "";
            url.searchParams.delete("error");
            window.history.replaceState(null, "", `${url.pathname}${url.search}`);
            if (type === "recovery") {
              router.replace("/reset-password?step=3");
              return;
            }
            router.replace(redirectTarget);
            return;
          }
          setBanner(
            "This link could not be used. It may have expired — use Forgot password or request a new email from booking.",
          );
        }
      }

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
        setChecking(false);
        return;
      }
      if (gate.kind === "admin") {
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
      setError("Your account has been suspended. Contact the platform administrator.");
      return;
    }
    if (gate.kind === "admin") {
      router.refresh();
      router.replace("/admin");
      return;
    }
    router.refresh();
    const redirectTo = safeRedirectPath(searchParams.get("redirect"));
    router.replace(redirectTo);
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
        <Image
          src={PAGE_ICON_URL}
          alt=""
          width={28}
          height={28}
          className="h-7 w-auto object-contain"
          priority
          unoptimized
        />
      </Link>

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 items-start justify-center overflow-x-hidden overflow-y-visible px-6 py-8 sm:items-center sm:overflow-hidden sm:px-12 sm:py-0">
          <div className="flex w-full max-w-[960px] flex-col items-center gap-8 sm:h-full sm:flex-row sm:items-center sm:justify-center">
            {/*
              Mobile: do not flex-1/min-h-0 the vinyl column — it shrinks below content height and
              overflow-visible lets headings + pills paint over the sign-in card below.
            */}
            <div className="flex w-full shrink-0 flex-col items-center justify-center overflow-visible sm:min-h-0 sm:h-full sm:flex-1">
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

              <div className="flex justify-end pt-3">
                <Link
                  href="/reset-password"
                  className="font-body text-[13px] text-[#00BFFF] hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="my-4 h-px w-full bg-white/[0.08]" aria-hidden />

              <p className="text-center font-body text-[13px] leading-snug text-[#A0A8C0]">
                No account yet?{" "}
                <Link
                  href="/booking"
                  className="font-headline text-[13px] font-semibold text-[#00BFFF] hover:underline"
                >
                  Book the DJ first →
                </Link>
              </p>
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
