"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAdminStore } from "@/lib/store/adminStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const setStoreRole = useAdminStore((s) => s.setRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<"non_admin" | "suspended" | "auth" | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email || cancelled) return;

      const { data: adminRecord, error: adminErr } = await supabase
        .from("admins")
        .select("role, status")
        .ilike("email", user.email)
        .maybeSingle();

      if (adminErr) {
        console.error("[admin-login] session check admin error:", adminErr.message);
        return;
      }

      const row = adminRecord as { role: string; status: string } | null;
      if (
        row &&
        row.status === "active" &&
        (row.role === "admin" || row.role === "super_admin")
      ) {
        if (typeof window !== "undefined") {
          localStorage.setItem("adminRole", row.role);
        }
        setStoreRole(row.role as "admin" | "super_admin");
        router.replace("/admin");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, setStoreRole, supabase]);

  const handleLogin = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    setErrorKind(null);

    try {
      console.log("[admin-login] Attempting login:", email.trim());

      // Step 1: Sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      console.log("[admin-login] Auth result:", {
        user: authData?.user?.email,
        error: authError?.message,
      });

      if (authError) {
        setErrorMessage(authError.message);
        setErrorKind("auth");
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setErrorMessage("Login failed. Please try again.");
        setErrorKind("auth");
        setLoading(false);
        return;
      }

      await supabase.auth.getSession();

      // Step 2: Check admins table (case-insensitive email match)
      const authEmail = authData.user.email ?? "";
      console.log("[admin-login] Checking admins table for:", authEmail);

      const { data: adminRecord, error: adminError } = await supabase
        .from("admins")
        .select("id, role, status, email")
        .ilike("email", authEmail)
        .maybeSingle();

      console.log("[admin-login] Admin record:", {
        record: adminRecord,
        error: adminError?.message,
      });

      if (adminError) {
        console.error("[admin-login] DB error:", adminError);
        await supabase.auth.signOut();
        if (typeof window !== "undefined") {
          localStorage.removeItem("adminRole");
        }
        setStoreRole(null);
        setErrorMessage("Database error. Please try again.");
        setErrorKind("auth");
        setLoading(false);
        return;
      }

      if (!adminRecord) {
        console.error("[admin-login] No admin record found for:", authEmail);
        await supabase.auth.signOut();
        if (typeof window !== "undefined") {
          localStorage.removeItem("adminRole");
        }
        setStoreRole(null);
        setErrorMessage(
          "This email is not registered as an admin. If you are a client, use the main sign in page.",
        );
        setErrorKind("non_admin");
        setLoading(false);
        return;
      }

      const row = adminRecord as { id: string; role: string; status: string };

      if (row.status === "suspended") {
        await supabase.auth.signOut();
        if (typeof window !== "undefined") {
          localStorage.removeItem("adminRole");
        }
        setStoreRole(null);
        setErrorMessage("Your account has been suspended. Contact the platform administrator.");
        setErrorKind("suspended");
        setLoading(false);
        return;
      }

      if (row.role !== "admin" && row.role !== "super_admin") {
        await supabase.auth.signOut();
        if (typeof window !== "undefined") {
          localStorage.removeItem("adminRole");
        }
        setStoreRole(null);
        setErrorMessage(
          "This email is not registered as an admin. If you are a client, use the main sign in page.",
        );
        setErrorKind("non_admin");
        setLoading(false);
        return;
      }

      console.log("[admin-login] Success! Role:", row.role);

      if (typeof window !== "undefined") {
        localStorage.setItem("adminRole", row.role);
      }
      setStoreRole(row.role as "admin" | "super_admin");

      void fetch(`/api/admins/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ last_login: new Date().toISOString() }),
      });

      router.push("/admin");
    } catch (err) {
      console.error("[admin-login] Unexpected error:", err);
      setErrorMessage("An unexpected error occurred.");
      setErrorKind("auth");
    } finally {
      setLoading(false);
    }
  }, [email, password, router, setStoreRole, supabase]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleLogin();
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
        .glow-hint {
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(0, 191, 255, 0.1) 0%, transparent 70%);
          z-index: -1;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      `}</style>

      <div
        className="flex min-h-screen w-full items-center justify-center overflow-hidden font-body text-on-surface"
        style={{
          backgroundColor: "#08080F",
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="glow-hint" />
        <main className="relative z-10 w-full max-w-[420px] px-6">
          <div
            className="flex flex-col items-center rounded-[20px] p-8"
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
            }}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/20">
              <span className="material-symbols-outlined text-primary-container" style={{ fontSize: "24px" }}>
                admin_panel_settings
              </span>
            </div>
            <h1 className="font-headline text-[22px] font-semibold leading-tight text-white">Page KillerCutz Admin</h1>
            <p className="mt-1 font-mono text-[11px] text-on-surface-variant">Page KillerCutz Operations</p>

            <div className="my-6 h-[1px] w-full bg-primary-container/30" />

            <form className="w-full space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <div className="group relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline transition-colors group-focus-within:text-primary-container">
                    alternate_email
                  </span>
                  <input
                    className="h-[46px] w-full rounded-sm border border-outline-variant/30 bg-surface-container-lowest pl-10 pr-4 text-sm outline-none transition-all placeholder:text-outline/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container/20"
                    placeholder="Admin Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="group relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline transition-colors group-focus-within:text-primary-container">
                    lock
                  </span>
                  <input
                    className="h-[46px] w-full rounded-sm border border-outline-variant/30 bg-surface-container-lowest pl-10 pr-12 text-sm outline-none transition-all placeholder:text-outline/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container/20"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-white"
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link
                  className="text-[12px] font-medium text-primary-container transition-colors hover:text-primary"
                  href="/reset-password"
                >
                  Forgot password?
                </Link>
              </div>

              {errorMessage && (
                <div className="w-full space-y-2 rounded-sm border border-error/40 bg-error-container/50 px-3 py-2 text-xs text-on-error-container">
                  <p>{errorMessage}</p>
                  {errorKind === "non_admin" ? (
                    <Link
                      className="inline-flex items-center gap-1 font-medium text-primary-container hover:underline"
                      href="/sign-in"
                    >
                      Go to client sign in →
                    </Link>
                  ) : null}
                </div>
              )}

              <button
                className="flex h-[46px] w-full items-center justify-center gap-2 rounded-sm bg-primary-container font-headline text-sm font-semibold text-on-primary-container transition-all hover:bg-primary active:scale-[0.98] disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? "Loading..." : "Sign In to Admin"}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-4">
              <Link
                className="group flex items-center gap-1 text-xs text-primary-container hover:underline"
                href="/"
              >
                Not an admin? Go to main site
                <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
          <div className="mt-12 flex items-center justify-center opacity-10">
            <span className="font-display text-4xl font-black uppercase italic tracking-tighter text-white">
              Page KillerCutz
            </span>
          </div>
        </main>
      </div>
    </>
  );
}
