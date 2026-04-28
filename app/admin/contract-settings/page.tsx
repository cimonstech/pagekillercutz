"use client";

import { type ReactNode, useEffect, useState } from "react";

type Tier = { days_min: number; days_max: number | null; percentage_retained: number; label: string };
type ContractSettings = {
  deposit_percentage: number;
  payment_deadline_days: number;
  cancellation_tiers: Tier[];
  dj_cancellation_compensation_pct: number;
  dj_cancellation_notice_days: number;
  overtime_rate_ghs: number;
  free_postponements_allowed: number;
  postponement_min_notice_days: number;
  buffer_hours: number;
  custom_clauses: string[];
  force_majeure_text: string;
  governing_law: string;
  updated_by?: string | null;
  updated_at?: string | null;
};

export default function ContractSettingsPage() {
  const [settings, setSettings] = useState<ContractSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    void fetch("/api/contract-settings")
      .then((r) => r.json())
      .then((j: { settings?: ContractSettings }) => setSettings(j.settings ?? null));
  }, []);

  if (!settings) return <div className="px-8 py-24 text-sm text-on-surface-variant">Loading contract settings...</div>;

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/contract-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const j = (await res.json()) as { settings?: ContractSettings };
      if (res.ok && j.settings) setSettings(j.settings);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!settings) return;
    setLoadingPreview(true);
    try {
      const res = await fetch("/api/contract-settings/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      const data = (await res.json()) as { contractText?: string };
      setPreviewContent(data.contractText || "");
      setShowPreview(true);
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-8 pb-12 pt-24">
      <h3 className="font-headline text-[28px] font-semibold text-white">Contract &amp; Policy</h3>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h4 className="mb-3 font-semibold text-white">Deposit</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Deposit percentage">
            <input type="number" value={settings.deposit_percentage} onChange={(e) => setSettings({ ...settings, deposit_percentage: Number(e.target.value) || 0 })} className="w-full rounded-sm border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
          </Field>
          <Field label="Payment deadline days">
            <input type="number" value={settings.payment_deadline_days} onChange={(e) => setSettings({ ...settings, payment_deadline_days: Number(e.target.value) || 0 })} className="w-full rounded-sm border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h4 className="mb-3 font-semibold text-white">Cancellation policy</h4>
        <div className="space-y-3">
          {settings.cancellation_tiers.map((t, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px_1fr_auto]">
              <input value={t.label} onChange={(e) => setSettings({ ...settings, cancellation_tiers: settings.cancellation_tiers.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x) })} className="rounded-sm border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" />
              <input type="number" value={t.percentage_retained} onChange={(e) => setSettings({ ...settings, cancellation_tiers: settings.cancellation_tiers.map((x, idx) => idx === i ? { ...x, percentage_retained: Number(e.target.value) || 0 } : x) })} className="rounded-sm border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" />
              <input value={String(t.days_min)} onChange={(e) => setSettings({ ...settings, cancellation_tiers: settings.cancellation_tiers.map((x, idx) => idx === i ? { ...x, days_min: Number(e.target.value) || 0 } : x) })} className="rounded-sm border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" />
              <button type="button" onClick={() => setSettings({ ...settings, cancellation_tiers: settings.cancellation_tiers.filter((_, idx) => idx !== i) })} className="rounded-sm border border-error/40 px-3 text-xs text-error">×</button>
            </div>
          ))}
          <button type="button" onClick={() => setSettings({ ...settings, cancellation_tiers: [...settings.cancellation_tiers, { days_min: 0, days_max: null, percentage_retained: 0, label: "New tier" }] })} className="rounded-sm bg-white/10 px-3 py-1.5 text-xs text-white">
            Add tier
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h4 className="mb-3 font-semibold text-white">Force majeure</h4>
        <textarea
          value={settings.force_majeure_text}
          onChange={(e) => setSettings({ ...settings, force_majeure_text: e.target.value })}
          rows={4}
          className="w-full rounded-sm border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        />
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h4 className="mb-3 font-semibold text-white">Additional clauses</h4>
        <div className="space-y-2">
          {settings.custom_clauses.map((c, i) => (
            <div key={i} className="flex gap-2">
              <textarea value={c} onChange={(e) => setSettings({ ...settings, custom_clauses: settings.custom_clauses.map((x, idx) => idx === i ? e.target.value : x) })} rows={2} className="w-full rounded-sm border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" />
              <button type="button" onClick={() => setSettings({ ...settings, custom_clauses: settings.custom_clauses.filter((_, idx) => idx !== i) })} className="rounded-sm border border-error/40 px-3 text-xs text-error">×</button>
            </div>
          ))}
          <button type="button" onClick={() => setSettings({ ...settings, custom_clauses: [...settings.custom_clauses, ""] })} className="rounded-sm bg-white/10 px-3 py-1.5 text-xs text-white">
            Add clause +
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handlePreview()}
          disabled={loadingPreview}
          className="rounded-full border border-white/15 bg-transparent px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loadingPreview ? "Loading preview..." : "Preview Contract"}
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {settings.updated_by ? (
          <p className="mt-2 text-xs text-on-surface-variant">
            Last saved by {settings.updated_by} on {settings.updated_at ? new Date(settings.updated_at).toLocaleString("en-GH") : "—"}
          </p>
        ) : null}
      </div>

      {showPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.80)",
            backdropFilter: "blur(8px)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "#0a0a14",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                flexShrink: 0,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "Space Grotesk",
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "white",
                  }}
                >
                  Contract Preview
                </div>
                <div
                  style={{
                    fontFamily: "Inter",
                    fontSize: "12px",
                    color: "#5A6080",
                    marginTop: "2px",
                  }}
                >
                  Sample contract with current settings
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "8px",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
              }}
            >
              <pre
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "12px",
                  color: "#A0A8C0",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {previewContent}
              </pre>
            </div>

            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                flexShrink: 0,
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "Inter",
                  fontSize: "12px",
                  color: "#5A6080",
                }}
              >
                This is a preview using sample data. Real contracts use actual booking details.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}
