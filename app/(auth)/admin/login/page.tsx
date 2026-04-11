"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAdminStore } from "@/lib/store/adminStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const setStoreRole = useAdminStore((s) => s.setRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email || cancelled) return;

      const { data: adminRecord } = await supabase
        .from("admins")
        .select("role, status")
        .eq("email", user.email)
        .maybeSingle();

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
  }, [router, setStoreRole]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user?.email) {
      setLoading(false);
      setErrorMessage("Login failed. Check your email and password.");
      return;
    }

    const { data: adminRecord, error: adminErr } = await supabase
      .from("admins")
      .select("id, role, status")
      .eq("email", data.user.email)
      .maybeSingle();

    if (adminErr || !adminRecord) {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        localStorage.removeItem("adminRole");
      }
      setStoreRole(null);
      setLoading(false);
      setErrorMessage("You are not authorised to access the admin portal.");
      return;
    }

    const row = adminRecord as { id: string; role: string; status: string };

    if (row.status === "suspended") {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        localStorage.removeItem("adminRole");
      }
      setStoreRole(null);
      setLoading(false);
      setErrorMessage(
        "Your account has been suspended. Contact the platform administrator.",
      );
      return;
    }

    if (row.role !== "admin" && row.role !== "super_admin") {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        localStorage.removeItem("adminRole");
      }
      setStoreRole(null);
      setLoading(false);
      setErrorMessage("You are not authorised to access the admin portal.");
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("adminRole", row.role);
    }
    setStoreRole(row.role as "admin" | "super_admin");

    void fetch(`/api/admins/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ last_login: new Date().toISOString() }),
    });

    setLoading(false);
    router.push("/admin");
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
        className="flex items-center justify-center min-h-screen text-on-surface font-body overflow-hidden w-full"
        style={{
          backgroundColor: "#08080F",
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="glow-hint" />
        <main className="w-full max-w-[420px] px-6 relative z-10">
          <div
            className="rounded-[20px] p-8 flex flex-col items-center"
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
            }}
          >
            <div className="w-12 h-12 bg-primary-container/20 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary-container" style={{ fontSize: "24px" }}>
                admin_panel_settings
              </span>
            </div>
            <h1 className="font-headline text-[22px] font-semibold text-white leading-tight">Page KillerCutz Admin</h1>
            <p className="font-mono text-[11px] text-on-surface-variant mt-1">Page KillerCutz Operations</p>

            <div className="w-full h-[1px] bg-primary-container/30 my-6" />

            <form className="w-full space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] group-focus-within:text-primary-container transition-colors">
                    alternate_email
                  </span>
                  <input
                    className="w-full h-[46px] bg-surface-container-lowest border border-outline-variant/30 rounded-sm pl-10 pr-4 text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 outline-none transition-all placeholder:text-outline/50"
                    placeholder="Admin Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] group-focus-within:text-primary-container transition-colors">
                    lock
                  </span>
                  <input
                    className="w-full h-[46px] bg-surface-container-lowest border border-outline-variant/30 rounded-sm pl-10 pr-12 text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 outline-none transition-all placeholder:text-outline/50"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-white transition-colors" type="button" onClick={() => setShowPassword((s) => !s)}>
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link className="text-[12px] text-primary-container font-medium hover:text-primary transition-colors" href="/reset-password">
                  Forgot password?
                </Link>
              </div>

              {errorMessage && (
                <div className="w-full bg-error-container/50 border border-error/40 text-on-error-container text-xs px-3 py-2 rounded-sm">
                  {errorMessage}
                </div>
              )}

              <button className="w-full h-[46px] bg-primary-container hover:bg-primary text-on-primary-container font-headline font-semibold text-sm transition-all active:scale-[0.98] rounded-sm flex items-center justify-center gap-2" type="submit" disabled={loading}>
                {loading ? "Loading..." : "Sign In to Admin"}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-4">
              <Link className="text-xs text-primary-container hover:underline flex items-center gap-1 group" href="/">
                Not an admin? Go to main site
                <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              <p className="font-mono text-[10px] text-on-surface-variant opacity-60 text-center px-4">
                Super Admin access uses separate credentials.
              </p>
            </div>
          </div>
          <div className="mt-12 flex items-center justify-center opacity-10">
            <span className="font-display text-4xl tracking-tighter italic font-black uppercase text-white">Page KillerCutz</span>
          </div>
        </main>
      </div>
    </>
  );
}
