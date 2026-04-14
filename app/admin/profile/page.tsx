"use client";

import { useAdminToast } from "@/hooks/useAdminToast";
import { useAdminStore } from "@/lib/store/adminStore";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  AlertTriangle,
  Key,
  Loader2,
  Lock,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type AdminRow = Database["public"]["Tables"]["admins"]["Row"];

function calculateStrength(pwd: string): number {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

function strengthLabel(score: number): { text: string; color: string } {
  if (score <= 0) return { text: "", color: "#5A6080" };
  if (score === 1) return { text: "Weak", color: "#FF4560" };
  if (score === 2) return { text: "Fair", color: "#F5A623" };
  if (score === 3) return { text: "Good", color: "#00BFFF" };
  return { text: "Strong", color: "#22c55e" };
}

function strengthFill(score: number): { width: string; bg: string } {
  if (score <= 0) return { width: "0%", bg: "#FF4560" };
  if (score === 1) return { width: "25%", bg: "#FF4560" };
  if (score === 2) return { width: "50%", bg: "#F5A623" };
  if (score === 3) return { width: "75%", bg: "#00BFFF" };
  return { width: "100%", bg: "#22c55e" };
}

function initials(name: string, email: string): string {
  const t = name.trim();
  if (t.length >= 2) return t.slice(0, 2).toUpperCase();
  const e = email.split("@")[0] ?? "";
  return (e.slice(0, 2) || "PK").toUpperCase();
}

const glassInput =
  "w-full rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-[14px] text-white outline-none placeholder:text-[#5A6080] focus:border-[#00BFFF] focus:shadow-[0_0_0_3px_rgba(0,191,255,0.10)]";

export default function AdminProfilePage() {
  const router = useRouter();
  const role = useAdminStore((s) => s.role);
  const setSession = useAdminStore((s) => s.setSession);
  const { showToast, ToastComponent } = useAdminToast();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwFieldErrors, setPwFieldErrors] = useState({ newPw: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [adminSince, setAdminSince] = useState<string | null>(null);
  const [superAdminCount, setSuperAdminCount] = useState(0);

  const [signingOutAll, setSigningOutAll] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeEmailInput, setRemoveEmailInput] = useState("");
  const [removing, setRemoving] = useState(false);

  const strength = calculateStrength(newPassword);
  const label = strengthLabel(strength);
  const fill = strengthFill(strength);

  const adminEmail = user?.email ?? "";

  const isOnlySuperAdmin = role === "super_admin" && superAdminCount === 1;

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    try {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u?.email) {
        router.replace("/admin/login");
        return;
      }
      setUser(u);
      const meta = u.user_metadata as { full_name?: string };
      setFullName(meta.full_name ?? "");

      const res = await fetch("/api/admins");
      if (res.ok) {
        const json = (await res.json()) as { admins?: AdminRow[] };
        const admins = json.admins ?? [];
        const self = admins.find((a) => a.email.toLowerCase() === u.email?.toLowerCase());
        if (self?.created_at) {
          const d = new Date(self.created_at);
          setAdminSince(
            Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
          );
        } else {
          setAdminSince(null);
        }
        setSuperAdminCount(admins.filter((a) => a.role === "super_admin" && a.status === "active").length);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const lastSignIn = useMemo(() => {
    if (!user?.last_sign_in_at) return "—";
    const d = new Date(user.last_sign_in_at);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  }, [user?.last_sign_in_at]);

  const onSaveProfile = async () => {
    const supabase = createClient();
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (error) throw error;
      showToast("Profile updated.");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const onUpdatePassword = async () => {
    setPwError("");
    setPwFieldErrors({ newPw: "", confirm: "" });
    if (newPassword.length < 8) {
      setPwFieldErrors((p) => ({ ...p, newPw: "At least 8 characters." }));
      return;
    }
    if (strength < 2) {
      setPwFieldErrors((p) => ({ ...p, newPw: "Use uppercase, numbers, or symbols." }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwFieldErrors((p) => ({ ...p, confirm: "Passwords do not match." }));
      return;
    }
    const supabase = createClient();
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPwError(error.message);
        return;
      }
      showToast("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingPw(false);
    }
  };

  const onSignOutAll = async () => {
    const supabase = createClient();
    setSigningOutAll(true);
    try {
      await supabase.auth.signOut({ scope: "global" });
      await fetch("/api/auth/admin-session", { method: "DELETE" });
      setSession({ role: null, staffEmail: null });
      router.push("/admin/login");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Sign out failed", "error");
    } finally {
      setSigningOutAll(false);
    }
  };

  const onRemoveAccess = async () => {
    if (removeEmailInput.trim().toLowerCase() !== adminEmail.toLowerCase()) {
      showToast("Email must match exactly.", "error");
      return;
    }
    setRemoving(true);
    try {
      const res = await fetch("/api/admins/remove-self", { method: "DELETE" });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(j.error || "Request failed", "error");
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch("/api/auth/admin-session", { method: "DELETE" });
      setSession({ role: null, staffEmail: null });
      router.push("/");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setRemoving(false);
      setRemoveOpen(false);
      setRemoveEmailInput("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[#5A6080]">
        <Loader2 className="size-8 animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <>
      <ToastComponent />
      <div className="mx-auto max-w-[900px] pb-8">
        <h1 className="font-headline text-[28px] font-semibold text-white">My Profile</h1>
        <p className="mt-1 font-body text-[13px] text-[#A0A8C0]">Manage your admin account settings.</p>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[3fr_2fr]">
          <div className="space-y-8">
            <div className="rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] p-6 backdrop-blur-sm">
              <h2 className="font-headline text-base font-semibold text-white">Account Details</h2>
              <p className="mt-1 font-body text-[13px] text-[#A0A8C0]">Update your display name.</p>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block font-body text-[12px] font-medium text-white">Display Name</label>
                  <input
                    className={glassInput}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-[12px] font-medium text-white">Email Address</label>
                  <div className="relative">
                    <input className={`${glassInput} pr-10`} readOnly value={adminEmail} />
                    <Lock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#5A6080]" aria-hidden />
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-[#5A6080]">Email cannot be changed.</p>
                </div>
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={() => void onSaveProfile()}
                  className="rounded-full bg-[#00BFFF] px-6 py-2.5 font-headline text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {savingProfile ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] p-6 backdrop-blur-sm">
              <h2 className="font-headline text-base font-semibold text-white">Change Password</h2>
              <p className="mt-1 font-body text-[13px] text-[#A0A8C0]">Choose a strong password.</p>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block font-body text-[12px] font-medium text-white">Current Password</label>
                  <input
                    type="password"
                    className={glassInput}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-[12px] font-medium text-white">New Password</label>
                  <input
                    type="password"
                    className={glassInput}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  {pwFieldErrors.newPw ? <p className="mt-1 text-[12px] text-[#FF4560]">{pwFieldErrors.newPw}</p> : null}
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-body text-[11px] text-[#5A6080]">Password strength</span>
                      {label.text ? (
                        <span className="font-body text-[11px] font-medium" style={{ color: label.color }}>
                          {label.text}
                        </span>
                      ) : null}
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: fill.width, background: fill.bg }} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-[12px] font-medium text-white">Confirm Password</label>
                  <input
                    type="password"
                    className={glassInput}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  {pwFieldErrors.confirm ? <p className="mt-1 text-[12px] text-[#FF4560]">{pwFieldErrors.confirm}</p> : null}
                </div>
                {pwError ? <p className="text-[13px] text-[#FF4560]">{pwError}</p> : null}
                <button
                  type="button"
                  disabled={savingPw}
                  onClick={() => void onUpdatePassword()}
                  className="rounded-full border border-[#00BFFF] bg-transparent px-6 py-2.5 font-headline text-sm font-semibold text-[#00BFFF] transition-colors hover:bg-[#00BFFF]/10 disabled:opacity-50"
                >
                  {savingPw ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Updating…
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] p-6 text-center backdrop-blur-sm">
              <div
                className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full font-headline text-[28px] font-bold text-black"
                style={{ background: role === "super_admin" ? "#a78bfa" : "#00BFFF" }}
              >
                {initials(fullName, adminEmail)}
              </div>
              <p className="mt-4 font-headline text-[18px] font-semibold text-white">{fullName || "Admin"}</p>
              <p className="mt-1 font-body text-[13px] text-[#A0A8C0]">{adminEmail}</p>
              <div className="mt-3 flex justify-center">
                <span
                  className="rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: role === "super_admin" ? "rgba(167,139,250,0.2)" : "rgba(0,191,255,0.15)",
                    color: role === "super_admin" ? "#c4b5fd" : "#7ad8ff",
                  }}
                >
                  {role === "super_admin" ? "Super admin" : "Admin"}
                </span>
              </div>
              <div className="my-5 h-px bg-white/[0.06]" />
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-2">
                  <Shield className="mt-0.5 size-4 shrink-0 text-[#5A6080]" aria-hidden />
                  <p className="font-body text-[13px] text-[#A0A8C0]">
                    Admin since {adminSince ?? "—"}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Key className="mt-0.5 size-4 shrink-0 text-[#5A6080]" aria-hidden />
                  <p className="font-body text-[13px] text-[#A0A8C0]">Last sign in: {lastSignIn}</p>
                </div>
              </div>
              <div className="my-4 h-px bg-white/[0.06]" />
              <button
                type="button"
                onClick={() => router.push("/admin/overview")}
                className="font-body text-[13px] font-medium text-[#00BFFF] hover:underline"
              >
                Back to Dashboard →
              </button>
            </div>

            <div className="rounded-2xl border border-[rgba(255,69,96,0.25)] bg-[rgba(255,69,96,0.04)] p-6">
              <h2 className="font-headline text-base font-semibold text-[#FF4560]">Danger Zone</h2>

              <div className="mt-4">
                <p className="font-headline text-sm font-medium text-white">Sign Out Everywhere</p>
                <p className="mt-1 font-body text-[13px] text-[#A0A8C0]">Sign out from all devices and browsers.</p>
                <button
                  type="button"
                  disabled={signingOutAll}
                  onClick={() => void onSignOutAll()}
                  className="mt-3 rounded-full border border-[#F5A623] bg-transparent px-5 py-2 font-headline text-[13px] font-semibold text-[#F5A623] transition-colors hover:bg-[#F5A623]/10 disabled:opacity-50"
                >
                  {signingOutAll ? "Signing out…" : "Sign Out All Devices"}
                </button>
              </div>

              <div className="my-5 h-px bg-[rgba(255,69,96,0.2)]" />

              <div>
                <p className="font-headline text-sm font-medium text-white">Delete My Admin Account</p>
                <p className="mt-1 font-body text-[13px] text-[#A0A8C0]">
                  Remove your admin access permanently. Your Supabase Auth account will remain but admin access will be revoked.
                </p>
                {isOnlySuperAdmin ? (
                  <div className="mt-3 flex gap-2 rounded-lg border border-[#F5A623]/30 bg-[#F5A623]/10 p-3">
                    <AlertTriangle className="size-5 shrink-0 text-[#F5A623]" aria-hidden />
                    <p className="font-body text-[13px] text-[#F5A623]">
                      You are the only super admin. Invite another super admin before removing yourself.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRemoveOpen(true)}
                    className="mt-3 rounded-full border border-[#FF4560] bg-transparent px-5 py-2 font-headline text-[13px] font-semibold text-[#FF4560] transition-colors hover:bg-[#FF4560]/10"
                  >
                    Remove My Admin Access
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {removeOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-xl">
            <h3 className="font-headline text-lg font-semibold text-white">Remove admin access?</h3>
            <p className="mt-2 font-body text-[13px] text-[#A0A8C0]">
              This will remove your access to the admin portal. You will be signed out immediately.
            </p>
            <label className="mt-4 block font-body text-[12px] text-white">Type your email to confirm</label>
            <input
              className={`${glassInput} mt-1`}
              value={removeEmailInput}
              onChange={(e) => setRemoveEmailInput(e.target.value)}
              placeholder={adminEmail}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full px-4 py-2 font-body text-sm text-[#A0A8C0] hover:bg-white/5"
                onClick={() => {
                  setRemoveOpen(false);
                  setRemoveEmailInput("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={() => void onRemoveAccess()}
                className="rounded-full bg-[#FF4560] px-4 py-2 font-headline text-sm font-semibold text-white disabled:opacity-50"
              >
                {removing ? "Removing…" : "Remove Access"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
