"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminToast } from "@/hooks/useAdminToast";
import { invalidatePaymentCache, type PaymentSettings } from "@/hooks/usePaymentSettings";

const DEFAULT_SETTINGS: Record<
  "accept_bookings" | "merch_store_active" | "playlist_portal_open" | "maintenance_mode" | "show_pricing" | "music_streaming",
  boolean
> = {
  accept_bookings: true,
  merch_store_active: true,
  playlist_portal_open: true,
  maintenance_mode: false,
  show_pricing: true,
  music_streaming: true,
};

type SettingsState = typeof DEFAULT_SETTINGS;
type SettingsKey = keyof SettingsState;

const FLAG_ROWS: { key: SettingsKey; label: string }[] = [
  { key: "accept_bookings", label: "Accept bookings" },
  { key: "merch_store_active", label: "Merch store active" },
  { key: "playlist_portal_open", label: "Playlist portal open" },
  { key: "maintenance_mode", label: "Maintenance mode" },
  { key: "show_pricing", label: "Show pricing on homepage" },
  { key: "music_streaming", label: "Music streaming enabled" },
];

function asBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  if (v == null) return fallback;
  return Boolean(v);
}

function normalizeSettings(raw: Record<string, unknown> | undefined): SettingsState {
  if (!raw) return { ...DEFAULT_SETTINGS };
  return {
    accept_bookings: asBool(raw.accept_bookings, DEFAULT_SETTINGS.accept_bookings),
    merch_store_active: asBool(raw.merch_store_active, DEFAULT_SETTINGS.merch_store_active),
    playlist_portal_open: asBool(raw.playlist_portal_open, DEFAULT_SETTINGS.playlist_portal_open),
    maintenance_mode: asBool(raw.maintenance_mode, DEFAULT_SETTINGS.maintenance_mode),
    show_pricing: asBool(raw.show_pricing, DEFAULT_SETTINGS.show_pricing),
    music_streaming: asBool(raw.music_streaming, DEFAULT_SETTINGS.music_streaming),
  };
}

export default function SuperAdminSettingsPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useAdminToast();
  const [accessOk, setAccessOk] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({ ...DEFAULT_SETTINGS });
  const [message, setMessage] = useState(
    "Page KillerCutz is currently under scheduled maintenance. We'll be back at 04:00 UTC.",
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [djPhone, setDjPhone] = useState("");
  const [djEmail, setDjEmail] = useState("");
  const [role, setRole] = useState<string>("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/admin-session")
      .then((r) => {
        if (!r.ok) throw new Error("unauthorized");
        return r.json() as Promise<{ role?: string }>;
      })
      .then((data) => {
        if (cancelled) return;
        if (data.role !== "super_admin" && data.role !== "admin") {
          router.replace("/admin/overview");
          return;
        }
        setRole(data.role ?? "");
        setAccessOk(true);
      })
      .catch(() => {
        if (!cancelled) router.replace("/admin/overview");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!accessOk) return;
    setLoading(true);
    Promise.all([fetch("/api/settings").then((r) => r.json()), fetch("/api/payment-settings").then((r) => r.json())])
      .then(([data, paymentData]: [{ settings?: Record<string, unknown> }, { settings?: PaymentSettings }]) => {
        if (data.settings && typeof data.settings === "object") {
          setSettings(normalizeSettings(data.settings));
        }
        if (paymentData.settings) setPaymentSettings(paymentData.settings);
      })
      .catch(() => showToastRef.current("Could not load settings.", "error"))
      .finally(() => setLoading(false));
  }, [accessOk]);

  const savePaymentSettings = async () => {
    if (!paymentSettings) return;
    setSavingPayment(true);
    setPaymentError(null);
    try {
      const res = await fetch("/api/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentSettings),
      });
      const json = (await res.json()) as { settings?: PaymentSettings; error?: string };
      if (!res.ok) {
        setPaymentError(json.error ?? "Failed to update payment details");
        return;
      }
      if (json.settings) setPaymentSettings(json.settings);
      invalidatePaymentCache();
      showToast("Payment details updated");
    } catch {
      setPaymentError("Failed to update payment details");
    } finally {
      setSavingPayment(false);
    }
  };

  const patchSetting = useCallback(async (key: SettingsKey, value: boolean) => {
    setSaving(key);
    let previous = false;
    setSettings((p) => {
      previous = p[key];
      return { ...p, [key]: value };
    });
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSettings((p) => ({ ...p, [key]: previous }));
      showToast("Failed to save setting.", "error");
    } finally {
      setSaving(null);
    }
  }, [showToast]);

  const handleToggle = async (key: SettingsKey) => {
    if (loading || saving !== null) return;
    const newValue = !settings[key];

    if (key === "maintenance_mode" && newValue === true) {
      setMaintenanceDialogOpen(true);
      return;
    }

    await patchSetting(key, newValue);
  };

  const confirmMaintenanceOn = async () => {
    setMaintenanceDialogOpen(false);
    await patchSetting("maintenance_mode", true);
  };

  const testSms = async () => {
    setTestingSMS(true);
    try {
      const res = await fetch("/api/notify/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: djPhone,
          type: "sms",
        }),
      });
      const data = (await res.json()) as { sms?: { success?: boolean; error?: string }; error?: string };
      if (res.ok && data.sms?.success) {
        showToast("Test SMS sent successfully!");
      } else {
        showToast(`SMS failed: ${data.sms?.error ?? data.error ?? "Unknown error"}`, "error");
      }
    } catch {
      showToast("SMS request failed.", "error");
    } finally {
      setTestingSMS(false);
    }
  };

  const testEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await fetch("/api/notify/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: djEmail,
          type: "email",
        }),
      });
      const data = (await res.json()) as { email?: { success?: boolean; error?: string }; error?: string };
      if (res.ok && data.email?.success) {
        showToast("Test email sent successfully!");
      } else {
        showToast(`Email failed: ${data.email?.error ?? data.error ?? "Unknown error"}`, "error");
      }
    } catch {
      showToast("Email request failed.", "error");
    } finally {
      setTestingEmail(false);
    }
  };

  const clearAuditLogs = async () => {
    setClearBusy(true);
    try {
      const res = await fetch("/api/audit-logs/clear", { method: "POST" });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Request failed");
      }
      showToast("Audit logs cleared.");
      setClearDialogOpen(false);
    } catch {
      showToast("Failed to clear audit logs.", "error");
    } finally {
      setClearBusy(false);
    }
  };

  if (!accessOk) {
    return null;
  }

  return (
    <div className="w-full max-w-[1100px] mx-auto p-0">
      <ToastComponent />

      <Link href="/admin/overview" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Admin
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 border-l-[3px] border-[#A855F7] pl-4">
        <div>
          <h1 className="text-[20px] font-headline font-bold text-on-surface tracking-tight uppercase">
            Platform Settings
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Configure global application behavior and core integrations.
          </p>
        </div>
        <div className="bg-[#A855F7] text-white px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase shrink-0">
          SUPER ADMIN
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 glass-card p-6 sm:p-8 border-l border-white/5 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">api</span>
            <h2 className="text-lg font-headline font-semibold">Integrations</h2>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-on-surface-variant">Fish Africa (SMS API)</label>
                <div className="flex gap-2">
                  <input
                    className="w-full bg-surface-container-lowest border-none text-sm p-3 font-mono text-primary rounded-sm focus:ring-1 focus:ring-primary"
                    type="password"
                    readOnly
                    value="••••••••••••••••"
                  />
                </div>
                <input
                  className="w-full bg-surface-container-lowest border-none text-sm p-3 rounded-sm"
                  placeholder="Sender ID"
                  readOnly
                  value="KILLERCUTZ"
                />
                <input
                  className="w-full bg-surface-container-lowest border-none text-sm p-3 rounded-sm font-mono"
                  placeholder="Test phone (E.164 or local)"
                  value={djPhone}
                  onChange={(e) => setDjPhone(e.target.value)}
                />
                <button
                  type="button"
                  disabled={testingSMS}
                  onClick={() => void testSms()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary disabled:opacity-50"
                >
                  {testingSMS ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
                  Test SMS
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-on-surface-variant">Resend (Email API)</label>
                <div className="flex gap-2">
                  <input
                    className="w-full bg-surface-container-lowest border-none text-sm p-3 font-mono text-primary rounded-sm focus:ring-1 focus:ring-primary"
                    type="password"
                    readOnly
                    value="••••••••••••••••"
                  />
                </div>
                <input
                  className="w-full bg-surface-container-lowest border-none text-sm p-3 rounded-sm"
                  placeholder="From address"
                  readOnly
                  value="support@pagekillercutz.com"
                />
                <input
                  className="w-full bg-surface-container-lowest border-none text-sm p-3 rounded-sm"
                  type="email"
                  placeholder="Test recipient email"
                  value={djEmail}
                  onChange={(e) => setDjEmail(e.target.value)}
                />
                <button
                  type="button"
                  disabled={testingEmail}
                  onClick={() => void testEmail()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary disabled:opacity-50"
                >
                  {testingEmail ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
                  Test Email
                </button>
              </div>
            </div>
            <div className="bg-secondary/10 border-l-2 border-secondary p-4 flex gap-4 items-start">
              <span className="material-symbols-outlined text-secondary">warning</span>
              <p className="text-xs text-secondary-fixed leading-relaxed">
                <span className="font-bold">Note:</span> API keys live in the server environment. SMS and email tests
                use your signed-in admin session only.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 glass-card p-6 sm:p-8 border-l border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">flag</span>
            <h2 className="text-lg font-headline font-semibold">Feature Flags</h2>
            {loading && <span className="text-[10px] text-on-surface-variant">Loading…</span>}
          </div>
          <div className="space-y-4">
            {FLAG_ROWS.map(({ key, label }) => {
              const busy = saving === key;
              const disabled = loading || saving !== null;
              return (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-on-surface">{label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {busy ? <Loader2 className="size-4 animate-spin text-primary" aria-hidden /> : null}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings[key]}
                      aria-busy={busy}
                      disabled={disabled}
                      onClick={() => void handleToggle(key)}
                      className={`relative w-10 h-5 rounded-full p-1 flex transition-colors ${
                        settings[key]
                          ? "items-center justify-end bg-primary-container"
                          : "items-center justify-start bg-surface-container-highest"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className={`w-3 h-3 rounded-full ${settings[key] ? "bg-white" : "bg-outline"}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-12 glass-card p-6 sm:p-8 border-l border-white/5">
          <h2 className="text-lg font-headline font-semibold text-white">Payment Details</h2>
          <p className="mt-1 text-[13px] text-on-surface-variant">Update how clients send payment.</p>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-headline text-[16px] font-semibold text-white">Mobile Money</p>
                <button
                  type="button"
                  className={`relative h-6 w-11 rounded-full ${paymentSettings?.momo_enabled ? "bg-[#00BFFF]" : "bg-white/20"}`}
                  onClick={() =>
                    setPaymentSettings((p) => (p ? { ...p, momo_enabled: !p.momo_enabled } : p))
                  }
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                      paymentSettings?.momo_enabled ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
              <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${paymentSettings?.momo_enabled ? "" : "opacity-50"}`}>
                <div>
                  <label className="mb-1 block text-xs text-on-surface-variant">Network</label>
                  <div className="flex gap-2">
                    {(["MTN", "Vodafone", "AirtelTigo"] as const).map((network) => (
                      <button
                        key={network}
                        type="button"
                        disabled={!paymentSettings?.momo_enabled}
                        onClick={() => setPaymentSettings((p) => (p ? { ...p, momo_network: network } : p))}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold"
                        style={{
                          background:
                            paymentSettings?.momo_network === network
                              ? network === "MTN"
                                ? "#FFCC00"
                                : network === "Vodafone"
                                  ? "#E60000"
                                  : "#0066CC"
                              : "rgba(255,255,255,0.06)",
                          color: paymentSettings?.momo_network === network ? (network === "MTN" ? "#000" : "#fff") : "#A0A8C0",
                        }}
                      >
                        {network}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-on-surface-variant">MoMo Number</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                    placeholder="0240000000"
                    value={paymentSettings?.momo_number ?? ""}
                    onChange={(e) => setPaymentSettings((p) => (p ? { ...p, momo_number: e.target.value } : p))}
                    disabled={!paymentSettings?.momo_enabled}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-on-surface-variant">Registered Account Name</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                    placeholder="Name as registered on MoMo"
                    value={paymentSettings?.momo_account_name ?? ""}
                    onChange={(e) => setPaymentSettings((p) => (p ? { ...p, momo_account_name: e.target.value } : p))}
                    disabled={!paymentSettings?.momo_enabled}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-headline text-[16px] font-semibold text-white">Bank Transfer</p>
                <button
                  type="button"
                  className={`relative h-6 w-11 rounded-full ${paymentSettings?.bank_enabled ? "bg-[#00BFFF]" : "bg-white/20"}`}
                  onClick={() =>
                    setPaymentSettings((p) => (p ? { ...p, bank_enabled: !p.bank_enabled } : p))
                  }
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                      paymentSettings?.bank_enabled ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
              <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${paymentSettings?.bank_enabled ? "" : "opacity-50"}`}>
                <input className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" placeholder="e.g. GCB Bank" value={paymentSettings?.bank_name ?? ""} onChange={(e) => setPaymentSettings((p) => (p ? { ...p, bank_name: e.target.value } : p))} disabled={!paymentSettings?.bank_enabled} />
                <input className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" placeholder="0000000000" value={paymentSettings?.bank_account_number ?? ""} onChange={(e) => setPaymentSettings((p) => (p ? { ...p, bank_account_number: e.target.value } : p))} disabled={!paymentSettings?.bank_enabled} />
                <input className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" placeholder="Name on account" value={paymentSettings?.bank_account_name ?? ""} onChange={(e) => setPaymentSettings((p) => (p ? { ...p, bank_account_name: e.target.value } : p))} disabled={!paymentSettings?.bank_enabled} />
                <input className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" placeholder="e.g. Accra Main Branch" value={paymentSettings?.bank_branch ?? ""} onChange={(e) => setPaymentSettings((p) => (p ? { ...p, bank_branch: e.target.value } : p))} disabled={!paymentSettings?.bank_enabled} />
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <label className="mb-1 block text-xs text-on-surface-variant">Payment Instructions</label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                placeholder="Any additional payment instructions shown to clients..."
                value={paymentSettings?.payment_instructions ?? ""}
                onChange={(e) => setPaymentSettings((p) => (p ? { ...p, payment_instructions: e.target.value } : p))}
              />
              <label className="mb-1 mt-4 block text-xs text-on-surface-variant">Preferred Method</label>
              <div className="space-y-2">
                {[
                  { id: "momo", label: "Mobile Money first" },
                  { id: "bank", label: "Bank Transfer first" },
                  { id: "both", label: "Show both equally" },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm text-white">
                    <input
                      type="radio"
                      name="preferred_method"
                      checked={paymentSettings?.preferred_method === opt.id}
                      onChange={() => setPaymentSettings((p) => (p ? { ...p, preferred_method: opt.id } : p))}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {paymentError ? <p className="mt-3 text-sm text-error">{paymentError}</p> : null}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => void savePaymentSettings()}
              disabled={savingPayment}
              className="rounded-full bg-[#00BFFF] px-6 py-2.5 font-headline text-sm font-semibold text-[#004a65] disabled:opacity-50"
            >
              {savingPayment ? "Saving..." : "Save Payment Details"}
            </button>
          </div>
          {paymentSettings?.updated_by ? (
            <p className="mt-2 text-right text-[11px] text-on-surface-variant">
              Last updated by {paymentSettings.updated_by} on{" "}
              {paymentSettings.updated_at
                ? new Date(paymentSettings.updated_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
          ) : null}
        </div>

        {settings.maintenance_mode && (
          <div className="lg:col-span-12 glass-card p-6 sm:p-8 border-l-[3px] border-error relative">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-error">construction</span>
              <h2 className="text-lg font-headline font-semibold text-error">Maintenance Mode</h2>
            </div>
            <div className="space-y-6">
              <textarea
                className="w-full bg-surface-container-lowest border-none text-sm p-4 font-body text-on-surface rounded-sm focus:ring-1 focus:ring-error"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="button"
                disabled={loading || saving !== null}
                className="bg-error px-4 py-2 text-[10px] font-black uppercase text-white rounded-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                onClick={() => void patchSetting("maintenance_mode", false)}
              >
                Turn Off Maintenance Mode
              </button>
            </div>
          </div>
        )}

        {role === "super_admin" ? (
        <div className="lg:col-span-12 glass-card p-6 sm:p-8 border-l-[3px] border-error">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-error">priority_high</span>
            <h2 className="text-lg font-headline font-semibold">Danger Zone</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-highest flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Clear audit logs</p>
                <p className="text-xs text-on-surface-variant mt-1">Permanently removes all audit log entries.</p>
              </div>
              <button
                type="button"
                className="border border-error text-error text-[10px] font-bold px-4 py-2 uppercase hover:bg-error hover:text-white transition-colors shrink-0"
                onClick={() => setClearDialogOpen(true)}
              >
                Clear…
              </button>
            </div>
          </div>
        </div>
        ) : null}
      </div>

      {maintenanceDialogOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
          <div className="glass max-w-md w-full p-6 border border-white/10 rounded-lg space-y-4">
            <p className="text-sm text-on-surface">
              Turn on maintenance mode? Public visitors will see the maintenance page.
            </p>
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                className="px-4 py-2 text-sm text-on-surface-variant hover:text-white"
                onClick={() => setMaintenanceDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-bold uppercase bg-error text-white rounded-sm hover:opacity-90"
                onClick={() => void confirmMaintenanceOn()}
              >
                Turn On
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {clearDialogOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
          <div className="glass max-w-md w-full p-6 border border-white/10 rounded-lg space-y-4">
            <p className="text-sm text-on-surface font-medium">Delete all audit log entries?</p>
            <p className="text-xs text-on-surface-variant">This cannot be undone. A single system entry will remain noting who cleared the log.</p>
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                className="px-4 py-2 text-sm text-on-surface-variant hover:text-white"
                disabled={clearBusy}
                onClick={() => setClearDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearBusy}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase bg-error text-white rounded-sm hover:opacity-90 disabled:opacity-50"
                onClick={() => void clearAuditLogs()}
              >
                {clearBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Clear all logs
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
