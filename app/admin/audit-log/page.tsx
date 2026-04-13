"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuditLogTab from "@/components/admin/AuditLogTab";
import { useAdminStore } from "@/lib/store/adminStore";

export default function AdminAuditLogPage() {
  const router = useRouter();
  const role = useAdminStore((s) => s.role);

  useEffect(() => {
    if (role !== "super_admin") {
      router.replace("/admin/overview");
    }
  }, [role, router]);

  if (role !== "super_admin") return null;
  return <AuditLogTab />;
}
