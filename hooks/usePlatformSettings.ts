"use client";

import { useEffect, useState } from "react";

export interface PlatformSettings {
  accept_bookings: boolean;
  merch_store_active: boolean;
  playlist_portal_open: boolean;
  maintenance_mode: boolean;
  show_pricing_on_homepage: boolean;
  music_streaming_enabled: boolean;
}

let cache: PlatformSettings | null = null;
let cacheTime = 0;

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache && Date.now() - cacheTime < 60 * 1000) {
      setSettings(cache);
      setLoading(false);
      return;
    }

    fetch("/api/platform-settings")
      .then((r) => r.json())
      .then((data: { settings?: PlatformSettings }) => {
        if (data.settings) {
          cache = data.settings;
          cacheTime = Date.now();
          setSettings(data.settings);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { settings, loading };
}
