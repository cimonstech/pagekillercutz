"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Mail,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { Database } from "@/lib/database.types";
import { writeAuditLog } from "@/lib/writeAuditLog";
import { useAdminToast } from "@/hooks/useAdminToast";
import { useAdminStore } from "@/lib/store/adminStore";

type AdminRow = Database["public"]["Tables"]["admins"]["Row"];
type AdminRole = "admin" | "super_admin";

function initialsFromEmail(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

function formatJoined(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function AccountsTab() {
  const staffEmail = useAdminStore((s) => s.staffEmail);
  const { showToast, ToastComponent } = useAdminToast();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("admin");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admins");
      const data = (await response.json()) as { admins?: AdminRow[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to load admin accounts.");
      setAdmins(data.admins ?? []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to load admin accounts.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const currentAdminEmail = (staffEmail ?? "").toLowerCase();

  const closeInviteModal = () => {
    setModalOpen(false);
    setInviteEmail("");
    setInviteRole("admin");
    setInviteError("");
    setInviteSuccess(false);
    setInviting(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      setInviteError("Please enter a valid email.");
      return;
    }

    setInviting(true);
    setInviteError("");

    try {
      const email = inviteEmail.trim().toLowerCase();
      const res = await fetch("/api/admins/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setInviteError(data.error || "Failed to send invite.");
        return;
      }

      setInviteSuccess(true);
      setAdmins((prev) => [
        {
          id: `temp-${Date.now()}`,
          email,
          role: inviteRole,
          status: "active",
          created_at: new Date().toISOString(),
          last_login: null,
        },
        ...prev,
      ]);
      writeAuditLog("account", `Invited new admin: ${email} (role: ${inviteRole})`, email);
      showToast("Invite email sent.");
      void loadAdmins();
    } catch {
      setInviteError("An unexpected error occurred.");
    } finally {
      setInviting(false);
    }
  };

  const handleStatusChange = async (admin: AdminRow, status: "active" | "suspended") => {
    try {
      const res = await fetch(`/api/admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to update admin.");
      setAdmins((prev) => prev.map((row) => (row.id === admin.id ? { ...row, status } : row)));
      writeAuditLog("account", `${status === "suspended" ? "Suspended" : "Reactivated"} admin ${admin.email}`, admin.id);
      showToast(status === "suspended" ? "Admin suspended." : "Admin reactivated.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Update failed.", "error");
    }
  };

  const handleRemoveAdmin = async (admin: AdminRow) => {
    try {
      const res = await fetch(`/api/admins/${admin.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setAdmins((prev) => prev.filter((row) => row.id !== admin.id));
      setRemoveConfirmId(null);
      writeAuditLog("account", `Removed admin ${admin.email}`, admin.id);
      showToast("Admin removed.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Delete failed.", "error");
    }
  };

  return (
    <main className="min-h-screen">
      <ToastComponent />
      <div className="px-10 pb-12 pt-24">
        <section className="mb-10 flex flex-col justify-between gap-6 border-l-2 border-purple-400 pl-4 md:flex-row md:items-end">
          <div>
            <h2 className="mb-2 text-[28px] font-headline text-white">Admin Accounts</h2>
            <p className="max-w-xl text-sm text-on-surface-variant">
              Configure administrative access levels and secure credentials.
            </p>
          </div>
          <button
            type="button"
            className="h-12 rounded-full bg-[#a78bfa] px-6 text-sm font-semibold text-black transition-transform hover:brightness-110 active:scale-[0.96]"
            onClick={() => setModalOpen(true)}
          >
            Invite Admin
          </button>
        </section>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-400">User</th>
                <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-xs uppercase tracking-widest text-slate-400">Joined</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-sm text-on-surface-variant">
                    Loading...
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const isSelf = currentAdminEmail && currentAdminEmail === admin.email.toLowerCase();
                  return (
                    <tr key={admin.id} className="align-top transition-colors hover:bg-purple-500/[0.03]">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold text-black ${
                              admin.role === "super_admin" ? "bg-[#a78bfa]" : "bg-[#00BFFF]"
                            }`}
                          >
                            {initialsFromEmail(admin.email)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">{admin.email}</p>
                              {isSelf ? (
                                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-[#5A6080]">
                                  You
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            admin.role === "super_admin"
                              ? "border-[#a78bfa]/40 bg-[#a78bfa]/15 text-[#a78bfa]"
                              : "border-[#00BFFF]/35 bg-[#00BFFF]/12 text-[#00BFFF]"
                          }`}
                        >
                          {admin.role === "super_admin" ? "SUPER ADMIN" : "ADMIN"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-2 text-xs">
                          <span className={`h-1.5 w-1.5 rounded-full ${admin.status === "active" ? "bg-[#22c55e]" : "bg-[#FF4560]"}`} />
                          <span className={admin.status === "active" ? "text-[#22c55e]" : "text-[#FF4560]"}>
                            {admin.status === "active" ? "Active" : "Suspended"}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs text-[#A0A8C0]">{formatJoined(admin.created_at)}</td>
                      <td className="px-6 py-5">
                        {isSelf ? null : (
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className={`h-9 rounded-full border px-3 text-xs ${
                                  admin.status === "active"
                                    ? "border-[#FF4560]/35 text-[#FF4560]"
                                    : "border-[#22c55e]/35 text-[#22c55e]"
                                }`}
                                onClick={() =>
                                  void handleStatusChange(admin, admin.status === "active" ? "suspended" : "active")
                                }
                              >
                                {admin.status === "active" ? "Suspend" : "Reactivate"}
                              </button>
                              <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#FF4560]/35 text-[#FF4560]"
                                onClick={() => setRemoveConfirmId(removeConfirmId === admin.id ? null : admin.id)}
                                aria-label={`Remove ${admin.email}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {removeConfirmId === admin.id ? (
                              <div className="w-[280px] rounded-xl border border-[#FF4560]/30 bg-[#FF4560]/8 p-3 text-left">
                                <p className="text-xs text-[#ff9db0]">
                                  Remove {admin.email} as admin? They will lose all admin access.
                                </p>
                                <div className="mt-3 flex gap-2">
                                  <button
                                    type="button"
                                    className="h-8 rounded-full bg-[#FF4560] px-3 text-xs font-semibold text-black"
                                    onClick={() => void handleRemoveAdmin(admin)}
                                  >
                                    Remove
                                  </button>
                                  <button
                                    type="button"
                                    className="h-8 rounded-full border border-white/15 px-3 text-xs text-[#A0A8C0]"
                                    onClick={() => setRemoveConfirmId(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#08080F]/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-[480px] rounded-3xl border border-white/10 bg-white/[0.05] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-6 h-[3px] w-full rounded-full bg-[#a78bfa]" />
            {!inviteSuccess ? (
              <>
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full border border-[#a78bfa]/35 bg-[#a78bfa]/15 p-2.5">
                      <Users className="h-5 w-5 text-[#a78bfa]" />
                    </div>
                    <h3 className="text-[20px] font-semibold text-white">Invite Admin</h3>
                  </div>
                  <button type="button" onClick={closeInviteModal} className="text-[#A0A8C0] hover:text-white" aria-label="Close">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white">Email Address</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6080]" />
                      <input
                        type="email"
                        placeholder="admin@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#5A6080] focus:border-[#a78bfa] focus:shadow-[0_0_0_3px_rgba(167,139,250,0.14)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-[#a78bfa] focus:shadow-[0_0_0_3px_rgba(167,139,250,0.14)]"
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <div className="rounded-[10px] border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="flex items-start gap-2 text-[12px] text-[#A0A8C0]">
                      <span
                        className={`mt-1 inline-block h-2 w-2 rounded-full ${
                          inviteRole === "super_admin" ? "bg-[#a78bfa]" : "bg-[#00BFFF]"
                        }`}
                      />
                      <p>
                        {inviteRole === "super_admin"
                          ? "Full access including accounts management, audit log, platform settings, and all admin capabilities."
                          : "Can manage bookings, orders, playlists, packages, music, events and merch."}
                      </p>
                    </div>
                    {inviteRole === "super_admin" ? (
                      <div className="mt-2 flex items-start gap-1.5 text-[11px] text-[#F5A623]">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                        <p>Super admin access should only be granted to trusted team members.</p>
                      </div>
                    ) : null}
                  </div>

                  {inviteError ? (
                    <div className="rounded-xl border border-[#FF4560]/30 border-l-4 bg-[#FF4560]/10 p-3">
                      <div className="flex items-start gap-2 text-[13px] text-[#FF4560]">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{inviteError}</span>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    disabled={inviting}
                    onClick={() => void handleInvite()}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#a78bfa] text-[14px] font-semibold text-black transition-transform hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.96]"
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending invite...
                      </>
                    ) : (
                      "Send Invite →"
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="py-2 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-[#a78bfa]" />
                <h3 className="mb-2 text-[22px] font-semibold text-white">Invite sent!</h3>
                <p className="text-sm text-[#A0A8C0]">An invite email has been sent to:</p>
                <div className="mx-auto mb-3 mt-3 inline-block rounded-lg border border-[#a78bfa]/25 bg-[#a78bfa]/12 px-4 py-2 font-mono text-sm text-[#a78bfa]">
                  {inviteEmail}
                </div>
                <p className="mx-auto mt-2 max-w-[360px] text-[13px] text-[#A0A8C0]">
                  They will receive a link to set their password and access the admin portal.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    className="h-11 flex-1 rounded-full border border-white/15 text-sm text-[#A0A8C0]"
                    onClick={() => {
                      setInviteEmail("");
                      setInviteRole("admin");
                      setInviteError("");
                      setInviteSuccess(false);
                    }}
                  >
                    Invite Another
                  </button>
                  <button
                    type="button"
                    className="h-11 flex-1 rounded-full bg-[#a78bfa] text-sm font-semibold text-black"
                    onClick={closeInviteModal}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
