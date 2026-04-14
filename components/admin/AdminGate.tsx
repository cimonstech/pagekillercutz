"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAdminStore } from "@/lib/store/adminStore";

type MeResponse = {
  user?: { email?: string | null };
  admin?: { role: string; status: string } | null;
};

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setSession = useAdminStore((s) => s.setSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const clearAdminSession = async () => {
      await fetch("/api/auth/admin-session", { method: "DELETE" }).catch(() => {});
    };

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setSession({ role: null, staffEmail: null });
        router.replace("/admin/login");
        return;
      }

      const res = await fetch("/api/auth/me");
      if (cancelled) return;

      if (!res.ok) {
        await clearAdminSession();
        await supabase.auth.signOut();
        setSession({ role: null, staffEmail: null });
        router.replace("/admin/login");
        return;
      }

      const data = (await res.json()) as MeResponse;
      const admin = data.admin;

      if (
        !admin ||
        admin.status === "suspended" ||
        (admin.role !== "admin" && admin.role !== "super_admin")
      ) {
        await clearAdminSession();
        await supabase.auth.signOut();
        setSession({ role: null, staffEmail: null });
        router.replace("/admin/login");
        return;
      }

      if (cancelled) return;

      setSession({
        role: admin.role as "admin" | "super_admin",
        staffEmail: user.email ?? null,
      });
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, setSession]);

  if (!ready) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#08080F] text-on-surface-variant text-sm"
        role="status"
        aria-live="polite"
      >
        Verifying session…
      </div>
    );
  }

  return <>{children}</>;
}
