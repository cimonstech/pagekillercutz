"use client";

import { useEffect, useState } from "react";

export interface PaymentSettings {
  id: string;
  momo_enabled: boolean;
  momo_network: string;
  momo_number: string;
  momo_account_name: string;
  bank_enabled: boolean;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  bank_branch: string | null;
  preferred_method: string;
  payment_instructions: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
}

let cachedSettings: PaymentSettings | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export function usePaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings | null>(cachedSettings);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings && Date.now() - cacheTime < CACHE_DURATION) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    fetch("/api/payment-settings")
      .then((r) => r.json())
      .then((data: { settings?: PaymentSettings }) => {
        if (data.settings) {
          cachedSettings = data.settings;
          cacheTime = Date.now();
          setSettings(data.settings);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { settings, loading };
}

export function invalidatePaymentCache() {
  cachedSettings = null;
  cacheTime = 0;
}

