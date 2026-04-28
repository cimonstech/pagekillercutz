import { getSupabaseAdmin } from "@/lib/supabase";

type PlatformSettingsResponse = {
  accept_bookings: boolean;
  merch_store_active: boolean;
  playlist_portal_open: boolean;
  maintenance_mode: boolean;
  show_pricing_on_homepage: boolean;
  music_streaming_enabled: boolean;
};

const DEFAULT_SETTINGS: PlatformSettingsResponse = {
  accept_bookings: true,
  merch_store_active: true,
  playlist_portal_open: true,
  maintenance_mode: false,
  show_pricing_on_homepage: true,
  music_streaming_enabled: true,
};

function toBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  if (v == null) return fallback;
  return Boolean(v);
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("platform_settings").select("key,value");
    if (error || !data) {
      return Response.json({ settings: DEFAULT_SETTINGS });
    }

    const asMap = data.reduce(
      (acc, row) => {
        acc[row.key] = row.value;
        return acc;
      },
      {} as Record<string, unknown>,
    );

    const settings: PlatformSettingsResponse = {
      accept_bookings: toBool(asMap.accept_bookings, DEFAULT_SETTINGS.accept_bookings),
      merch_store_active: toBool(asMap.merch_store_active, DEFAULT_SETTINGS.merch_store_active),
      playlist_portal_open: toBool(asMap.playlist_portal_open, DEFAULT_SETTINGS.playlist_portal_open),
      maintenance_mode: toBool(asMap.maintenance_mode, DEFAULT_SETTINGS.maintenance_mode),
      show_pricing_on_homepage: toBool(
        asMap.show_pricing_on_homepage ?? asMap.show_pricing,
        DEFAULT_SETTINGS.show_pricing_on_homepage,
      ),
      music_streaming_enabled: toBool(
        asMap.music_streaming_enabled ?? asMap.music_streaming,
        DEFAULT_SETTINGS.music_streaming_enabled,
      ),
    };

    return Response.json({ settings });
  } catch {
    return Response.json({ settings: DEFAULT_SETTINGS });
  }
}
