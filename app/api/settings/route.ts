import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";

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

type SettingsMap = typeof DEFAULT_SETTINGS;

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
    const { data, error } = await supabase.from("platform_settings").select("*");

    if (error) {
      logger.errorRaw("route", "[api/settings] GET Error:", JSON.stringify(error));
      return Response.json({ settings: { ...DEFAULT_SETTINGS } });
    }

    const reduced = (data ?? []).reduce(
      (obj, row: { key: string; value: unknown }) => ({
        ...obj,
        [row.key]: row.value,
      }),
      {} as Record<string, unknown>,
    );

    const settings = { ...DEFAULT_SETTINGS, ...reduced } as Record<keyof SettingsMap, unknown>;
    const merged: SettingsMap = {
      accept_bookings: toBool(settings.accept_bookings, DEFAULT_SETTINGS.accept_bookings),
      merch_store_active: toBool(settings.merch_store_active, DEFAULT_SETTINGS.merch_store_active),
      playlist_portal_open: toBool(settings.playlist_portal_open, DEFAULT_SETTINGS.playlist_portal_open),
      maintenance_mode: toBool(settings.maintenance_mode, DEFAULT_SETTINGS.maintenance_mode),
      show_pricing: toBool(settings.show_pricing, DEFAULT_SETTINGS.show_pricing),
      music_streaming: toBool(settings.music_streaming, DEFAULT_SETTINGS.music_streaming),
    };

    return Response.json({ settings: merged });
  } catch (err) {
    logger.errorRaw("route", "[api/settings] GET:", err);
    return Response.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { key?: string; value?: unknown };
    const { key, value } = body;

    if (!key) {
      return Response.json({ error: "Missing key" }, { status: 400 });
    }
    if (value === undefined) {
      return Response.json({ error: "Missing value" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("platform_settings").upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    logger.errorRaw("route", "[api/settings] PATCH:", err);
    return Response.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
