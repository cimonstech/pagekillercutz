"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** True when the signed-in user is an admin or super_admin (staff — not a client playlist user). */
export function useStaffAdmin(user: User | null): boolean {
  const [staff, setStaff] = useState(() => {
    if (typeof window === "undefined") return false;
    const r = localStorage.getItem("adminRole");
    return r === "admin" || r === "super_admin";
  });

  useEffect(() => {
    if (!user?.email) {
      setStaff(false);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase
        .from("admins")
        .select("role, status")
        .ilike("email", user.email ?? "")
        .maybeSingle();
      if (cancelled) return;
      const row = data as { role: string; status: string } | null;
      const is =
        Boolean(row) &&
        row!.status !== "suspended" &&
        (row!.role === "admin" || row!.role === "super_admin");
      setStaff(is);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return staff;
}
