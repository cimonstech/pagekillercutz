"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAdminStore } from "@/lib/store/adminStore";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setRole = useAdminStore((s) => s.setRole);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("adminRole");
          localStorage.removeItem("adminEmail");
        }
        setRole(null);
        router.replace("/admin/login");
        return;
      }

      const { data: adminRecord } = await supabase
        .from("admins")
        .select("role, status")
        .ilike("email", user.email)
        .maybeSingle();

      const row = adminRecord as { role: string; status: string } | null;

      if (!row) {
        await supabase.auth.signOut();
        if (typeof window !== "undefined") {
          localStorage.removeItem("adminRole");
          localStorage.removeItem("adminEmail");
        }
        setRole(null);
        router.replace("/admin/login");
        return;
      }

      if (row.status === "suspended") {
        await supabase.auth.signOut();
        if (typeof window !== "undefined") {
          localStorage.removeItem("adminRole");
          localStorage.removeItem("adminEmail");
        }
        setRole(null);
        router.replace("/admin/login");
        return;
      }

      if (row.role !== "admin" && row.role !== "super_admin") {
        await supabase.auth.signOut();
        if (typeof window !== "undefined") {
          localStorage.removeItem("adminRole");
          localStorage.removeItem("adminEmail");
        }
        setRole(null);
        router.replace("/admin/login");
        return;
      }

      if (cancelled) return;

      const typedRole = row.role as "admin" | "super_admin";
      if (typeof window !== "undefined") {
        localStorage.setItem("adminRole", typedRole);
        localStorage.setItem("adminEmail", user.email ?? "");
      }
      setRole(typedRole);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, setRole]);

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
