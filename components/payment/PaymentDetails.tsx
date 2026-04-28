"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";

interface PaymentDetailsProps {
  reference: string;
  amount?: number;
  amountLabel?: string;
  compact?: boolean;
}

export default function PaymentDetails({ reference, amount, amountLabel, compact = false }: PaymentDetailsProps) {
  const { settings, loading } = usePaymentSettings();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <div
          style={{
            height: "16px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "6px",
            marginBottom: "8px",
          }}
        />
        <div
          style={{
            height: "24px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "6px",
            width: "60%",
          }}
        />
      </div>
    );
  }

  if (!settings) return null;

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      type="button"
      onClick={() => copyToClipboard(text, id)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: copied === id ? "#22c55e" : "rgba(255,255,255,0.40)",
        padding: "2px",
        display: "flex",
        alignItems: "center",
        transition: "color 150ms",
      }}
    >
      {copied === id ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );

  const blocks: Array<"momo" | "bank"> =
    settings.preferred_method === "both"
      ? ["momo", "bank"]
      : settings.preferred_method === "bank"
        ? ["bank", "momo"]
        : ["momo", "bank"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {amount !== undefined ? (
        <div
          style={{
            textAlign: "center",
            padding: compact ? "12px" : "16px",
            background: "rgba(0,191,255,0.06)",
            border: "1px solid rgba(0,191,255,0.15)",
            borderRadius: "12px",
          }}
        >
          {amountLabel ? (
            <div
              style={{
                fontFamily: "Space Mono",
                fontSize: "9px",
                color: "#5A6080",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              {amountLabel}
            </div>
          ) : null}
          <div
            style={{
              fontFamily: "Space Grotesk",
              fontWeight: 800,
              fontSize: compact ? "28px" : "36px",
              color: "#00BFFF",
            }}
          >
            GHS {amount.toLocaleString()}
          </div>
        </div>
      ) : null}

      {blocks.includes("momo") && settings.momo_enabled ? (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background:
                  settings.momo_network === "MTN"
                    ? "#FFCC00"
                    : settings.momo_network === "Vodafone"
                      ? "#E60000"
                      : "#0066CC",
              }}
            />
            <span style={{ fontFamily: "Space Mono", fontSize: "10px", fontWeight: 700, color: "white" }}>
              {settings.momo_network} MoMo
            </span>
          </div>

          <div
            style={{
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div>
              <div style={{ fontFamily: "Space Mono", fontSize: "9px", color: "#5A6080", textTransform: "uppercase", marginBottom: "3px" }}>
                Number
              </div>
              <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: compact ? "18px" : "22px", color: "white", letterSpacing: "0.03em" }}>
                {settings.momo_number}
              </div>
              <div style={{ fontFamily: "Inter", fontSize: "11px", color: "#5A6080", marginTop: "2px" }}>
                {settings.momo_account_name}
              </div>
            </div>
            <CopyButton text={settings.momo_number} id="momo_number" />
          </div>

          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "Space Mono", fontSize: "9px", color: "#5A6080", textTransform: "uppercase", marginBottom: "3px" }}>
                Reference / Narration
              </div>
              <div style={{ fontFamily: "Space Mono", fontWeight: 700, fontSize: "15px", color: "#F5A623", letterSpacing: "0.05em" }}>
                {reference}
              </div>
              <div style={{ fontFamily: "Inter", fontSize: "11px", color: "#5A6080", marginTop: "2px" }}>
                Use this as your narration
              </div>
            </div>
            <CopyButton text={reference} id="reference" />
          </div>
        </div>
      ) : null}

      {blocks.includes("bank") && settings.bank_enabled ? (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <span style={{ fontFamily: "Space Mono", fontSize: "10px", fontWeight: 700, color: "white" }}>Bank Transfer</span>
          </div>
          {[
            { label: "Bank", value: settings.bank_name, id: "bank_name" },
            { label: "Account Number", value: settings.bank_account_number, id: "bank_account_number" },
            { label: "Account Name", value: settings.bank_account_name, id: "bank_account_name" },
            settings.bank_branch ? { label: "Branch", value: settings.bank_branch, id: "bank_branch" } : null,
            { label: "Reference", value: reference, id: "bank_reference", highlight: true },
          ]
            .filter(Boolean)
            .map((row) => {
              const r = row as { label: string; value: string; id: string; highlight?: boolean };
              return (
                <div
                  key={r.id}
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "Space Mono", fontSize: "9px", color: "#5A6080", textTransform: "uppercase", marginBottom: "2px" }}>
                      {r.label}
                    </div>
                    <div
                      style={{
                        fontFamily: r.id === "bank_account_number" || r.id === "bank_reference" ? "Space Mono" : "Inter",
                        fontWeight: r.highlight ? 700 : 500,
                        fontSize: r.highlight ? "15px" : "13px",
                        color: r.highlight ? "#F5A623" : "white",
                      }}
                    >
                      {r.value || "—"}
                    </div>
                  </div>
                  {r.value ? <CopyButton text={r.value} id={r.id} /> : null}
                </div>
              );
            })}
        </div>
      ) : null}

      {settings.payment_instructions ? (
        <p style={{ fontFamily: "Inter", fontSize: "12px", color: "#5A6080", lineHeight: 1.6, margin: 0, textAlign: "center" }}>
          {settings.payment_instructions}
        </p>
      ) : null}
    </div>
  );
}

