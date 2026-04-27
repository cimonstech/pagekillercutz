"use client";

import { Toast, useToast } from "@/components/ui/Toast";
import type { Database } from "@/lib/database.types";
import { AlertTriangle, Calendar, Lock, Music, ShoppingBag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

function passwordStrengthScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-zA-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

function initials(name: string, email: string): string {
  const t = name.trim();
  if (t.length >= 2) return t.slice(0, 2).toUpperCase();
  const e = email.split("@")[0] ?? "";
  return (e.slice(0, 2) || "PK").toUpperCase();
}

export default function ClientProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { toast, showToast, dismissToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ fullName: "", phone: "", email: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [orderCount, setOrderCount] = useState(0);
  const [playCount, setPlayCount] = useState(0);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u?.email) {
        router.replace("/sign-in");
        return;
      }
      setUser(u);
      const meta = u.user_metadata as { full_name?: string; phone?: string };
      const rawPhone = meta.phone ?? "";
      const displayPhone = rawPhone.replace(/^\+\s*233\s*/i, "").replace(/^\+/, "");
      setFormData({
        fullName: meta.full_name ?? "",
        phone: displayPhone,
        email: u.email ?? "",
      });

      const [oRes, pRes] = await Promise.all([
        fetch("/api/orders?limit=200", { credentials: "include" }),
        fetch("/api/plays/stats", { credentials: "include" }),
      ]);
      if (oRes.ok) {
        const j = (await oRes.json()) as { orders?: OrderRow[] };
        setOrderCount(j.orders?.length ?? 0);
      }
      if (pRes.ok) {
        const j = (await pRes.json()) as { totalPlays?: number };
        setPlayCount(j.totalPlays ?? 0);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!(message.includes("lock:") || message.includes("Lock ") || message.includes("steal"))) {
        /* ignore non-critical profile load errors */
      }
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const memberSince = useMemo(() => {
    if (!user?.created_at) return "—";
    const d = new Date(user.created_at);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }, [user?.created_at]);

  const pwScore = passwordStrengthScore(newPw);

  const onSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const digits = formData.phone.replace(/\D/g, "");
      const phone = digits ? `+233${digits.replace(/^233/, "")}` : "";
      const { error } = await supabase.auth.updateUser({
        data: { full_name: formData.fullName, phone },
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
    if (newPw !== confirmPw) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (newPw.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    if (!user?.email) return;
    setSavingPw(true);
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (signErr) {
        showToast("Current password is incorrect.", "error");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      showToast("Password updated.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setSavingPw(false);
    }
  };

  const onDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Failed to delete");
      }
      await supabase.auth.signOut();
      showToast("Account deleted.", "success");
      setDeleteOpen(false);
      setTimeout(() => {
        router.push("/");
      }, 600);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  const glass = "rounded-2xl border border-white/[0.08] bg-white/[0.05] p-6 backdrop-blur-[20px]";

  if (loading || !user) {
    return (
      <main className="relative z-[1] mx-auto w-full max-w-6xl pb-8 text-on-surface">
        <p className="font-body text-sm text-on-surface-variant">Loading…</p>
      </main>
    );
  }

  return (
    <main className="relative z-[1] mx-auto w-full max-w-6xl pb-8 text-on-surface">
      {toast ? <Toast message={toast.message} type={toast.type} onClose={dismissToast} /> : null}

      <header className="mb-10">
        <h1 className="font-headline text-[28px] font-semibold leading-tight text-white">My Profile</h1>
        <p className="mt-2 font-body text-[14px] text-[#A0A8C0]">Manage your account details.</p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-[1.5] space-y-6">
          <section className={glass}>
            <h2 className="font-headline text-[16px] font-semibold text-white">Personal Details</h2>
            <p className="mt-1 font-body text-[13px] text-[#A0A8C0]">Update your name and phone number.</p>

            <label className="mt-6 block">
              <span className="font-body text-[12px] text-on-surface-variant">Full Name</span>
              <input
                className="mt-1.5 w-full rounded-xl border border-white/[0.10] bg-white/[0.06] px-4 py-3 font-body text-sm text-white outline-none ring-primary/30 focus:ring-2"
                value={formData.fullName}
                onChange={(e) => setFormData((f) => ({ ...f, fullName: e.target.value }))}
              />
            </label>

            <label className="mt-4 block">
              <span className="font-body text-[12px] text-on-surface-variant">Phone Number</span>
              <div className="mt-1.5 flex rounded-xl border border-white/[0.10] bg-white/[0.06]">
                <span className="flex shrink-0 items-center border-r border-white/[0.08] px-3 font-mono text-[13px] text-[#A0A8C0]">
                  +233
                </span>
                <input
                  type="tel"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 font-body text-sm text-white outline-none"
                  value={formData.phone.replace(/^\+\s*233\s*/i, "").replace(/^\+/, "")}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, phone: e.target.value.replace(/[^\d\s-]/g, "") }))
                  }
                  placeholder="24 000 0000"
                />
              </div>
            </label>

            <label className="mt-4 block">
              <span className="flex items-center gap-1.5 font-body text-[12px] text-on-surface-variant">
                Email
                <Lock className="size-3.5 text-[#A0A8C0]" aria-hidden />
              </span>
              <input
                readOnly
                className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 font-body text-sm text-[#A0A8C0]"
                value={formData.email}
              />
              <p className="mt-1 font-mono text-[10px] text-[#6B7280]">Email cannot be changed.</p>
            </label>

            <button
              type="button"
              disabled={savingProfile}
              onClick={() => void onSaveProfile()}
              className="mt-6 rounded-full bg-[#00BFFF] px-6 py-2.5 font-headline text-[13px] font-semibold text-black transition-all hover:brightness-110 disabled:opacity-50"
            >
              {savingProfile ? "Saving…" : "Save Changes"}
            </button>
          </section>

          <section className={glass}>
            <h2 className="font-headline text-[16px] font-semibold text-white">Change Password</h2>

            <label className="mt-6 block">
              <span className="font-body text-[12px] text-on-surface-variant">Current Password</span>
              <input
                type="password"
                className="mt-1.5 w-full rounded-xl border border-white/[0.10] bg-white/[0.06] px-4 py-3 font-body text-sm text-white outline-none focus:ring-2 focus:ring-primary/30"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
              />
            </label>

            <label className="mt-4 block">
              <span className="font-body text-[12px] text-on-surface-variant">New Password</span>
              <input
                type="password"
                className="mt-1.5 w-full rounded-xl border border-white/[0.10] bg-white/[0.06] px-4 py-3 font-body text-sm text-white outline-none focus:ring-2 focus:ring-primary/30"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
              />
              <div className="mt-2 flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={[
                      "h-1 flex-1 rounded-full transition-colors",
                      i < pwScore ? "bg-[#00BFFF]" : "bg-white/[0.08]",
                    ].join(" ")}
                  />
                ))}
              </div>
            </label>

            <label className="mt-4 block">
              <span className="font-body text-[12px] text-on-surface-variant">Confirm New Password</span>
              <input
                type="password"
                className="mt-1.5 w-full rounded-xl border border-white/[0.10] bg-white/[0.06] px-4 py-3 font-body text-sm text-white outline-none focus:ring-2 focus:ring-primary/30"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
            </label>

            <button
              type="button"
              disabled={savingPw}
              onClick={() => void onUpdatePassword()}
              className="mt-6 rounded-full border border-[#00BFFF] bg-transparent px-6 py-2.5 font-headline text-[13px] font-semibold text-[#00BFFF] transition-all hover:bg-[#00BFFF]/10 disabled:opacity-50"
            >
              {savingPw ? "Updating…" : "Update Password"}
            </button>
          </section>
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          <section className={glass}>
            <h2 className="text-center font-headline text-[16px] font-semibold text-white">Account</h2>

            <div className="mx-auto mt-4 flex size-16 items-center justify-center rounded-full bg-[#00BFFF]">
              <span className="font-headline text-[24px] font-bold text-black">
                {initials(formData.fullName, formData.email)}
              </span>
            </div>
            <p className="mt-4 text-center font-headline text-[18px] font-semibold text-white">
              {formData.fullName.trim() || "Member"}
            </p>
            <p className="mt-1 text-center font-body text-[13px] text-[#A0A8C0]">{formData.email}</p>

            <div className="my-6 h-px bg-white/[0.08]" />

            <div className="space-y-3">
              <div className="flex items-center gap-2 font-body text-[13px] text-[#A0A8C0]">
                <Calendar className="size-4 shrink-0 text-[#A0A8C0]" aria-hidden />
                Member since {memberSince}
              </div>
              <div className="flex items-center gap-2 font-body text-[13px] text-[#A0A8C0]">
                <ShoppingBag className="size-4 shrink-0 text-[#A0A8C0]" aria-hidden />
                {orderCount} orders placed
              </div>
              <div className="flex items-center gap-2 font-body text-[13px] text-[#A0A8C0]">
                <Music className="size-4 shrink-0 text-[#A0A8C0]" aria-hidden />
                {playCount} tracks played
              </div>
            </div>

            <div className="my-6 h-px bg-white/[0.08]" />

            <div className="flex flex-col gap-2 text-center">
              <button
                type="button"
                onClick={() => router.push("/client/orders")}
                className="font-headline text-[13px] font-medium text-[#00BFFF] hover:underline"
              >
                My Orders →
              </button>
              <button
                type="button"
                onClick={() => router.push("/client/dashboard")}
                className="font-headline text-[13px] font-medium text-[#00BFFF] hover:underline"
              >
                My Dashboard →
              </button>
            </div>
          </section>

          <section
            className="rounded-2xl border border-[rgba(255,69,96,0.25)] bg-white/[0.03] p-6 backdrop-blur-[20px]"
            style={{ borderWidth: 1 }}
          >
            <h2 className="font-headline text-[16px] font-semibold text-[#FF4560]">Danger Zone</h2>
            <p className="mt-4 font-headline text-[14px] font-medium text-white">Delete My Account</p>
            <p className="mt-2 font-body text-[13px] leading-relaxed text-[#A0A8C0]">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(true);
                setDeleteConfirm("");
              }}
              className="mt-4 rounded-full border border-[#FF4560] bg-transparent px-5 py-2 font-headline text-[13px] font-semibold text-[#FF4560] transition-colors hover:bg-[#FF4560]/10"
            >
              Delete Account
            </button>
          </section>
        </div>
      </div>

      {deleteOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-[480px] rounded-2xl border border-white/[0.08] p-8 shadow-2xl"
            style={{
              background: "rgba(16,16,22,0.95)",
              borderTopWidth: 3,
              borderTopColor: "#FF4560",
            }}
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#FF4560]/20">
              <AlertTriangle className="size-7 text-[#FF4560]" strokeWidth={2} aria-hidden />
            </div>
            <h3 className="mt-4 text-center font-headline text-[20px] font-semibold text-white">Delete Your Account?</h3>
            <p className="mt-3 text-center font-body text-[14px] text-[#A0A8C0]">This will permanently delete:</p>
            <ul className="mt-4 space-y-2">
              {[
                "Your account and login credentials",
                "Your booking and playlist data",
                "Your order history",
                "All personal information",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2 font-body text-[13px] text-on-surface">
                  <X className="mt-0.5 size-4 shrink-0 text-[#FF4560]" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-center font-body text-[13px] font-semibold text-[#FF4560]">
              This action cannot be undone.
            </p>

            <label className="mt-6 block">
              <span className="font-body text-[12px] text-[#A0A8C0]">Type DELETE to confirm:</span>
              <input
                className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-[#FF4560]/40"
                style={{ borderColor: "rgba(255,69,96,0.40)" }}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                autoComplete="off"
              />
            </label>

            <button
              type="button"
              disabled={deleteConfirm !== "DELETE" || deleting}
              onClick={() => void onDeleteAccount()}
              className="mt-6 w-full rounded-full bg-[#FF4560] px-6 py-3 font-headline text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting ? "Deleting…" : "Permanently Delete Account"}
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="mt-3 w-full rounded-full border border-white/[0.12] bg-transparent py-2.5 font-headline text-[13px] text-on-surface-variant hover:bg-white/[0.04]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
