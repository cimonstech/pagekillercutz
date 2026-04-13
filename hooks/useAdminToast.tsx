"use client";

import { Toast, useToast } from "@/components/ui/Toast";

export function useAdminToast() {
  const { toast, showToast, dismissToast } = useToast();

  function ToastComponent() {
    if (!toast) return null;
    return <Toast message={toast.message} type={toast.type} onClose={dismissToast} />;
  }

  return { showToast, dismissToast, ToastComponent };
}
