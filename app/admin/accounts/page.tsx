"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AccountsTab from "@/components/admin/AccountsTab";
import { useAdminStore } from "@/lib/store/adminStore";

export default function AdminAccountsPage() {
  const router = useRouter();
  const role = useAdminStore((s) => s.role);

  useEffect(() => {
    if (role !== "super_admin") {
      router.replace("/admin/overview");
    }
  }, [role, router]);

  if (role !== "super_admin") return null;
  return <AccountsTab />;
}
