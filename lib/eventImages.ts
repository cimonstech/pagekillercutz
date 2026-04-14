import type { Database } from "@/lib/database.types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

const ASSETS_BASE = "https://assets.pagekillercutz.com";

/** Curated R2 assets for events without enough media. */
export const EVENT_FALLBACK_IMAGES = [
  `${ASSETS_BASE}/event-media/event-media_killercutzcover1.jpg`,
  `${ASSETS_BASE}/event-media/event-media_killercutzcover2.jpg`,
  `${ASSETS_BASE}/event-media/event-media_detty-december-festival.jpg`,
  `${ASSETS_BASE}/event-media/event-media_club-onyx-residency.webp`,
  `${ASSETS_BASE}/event-media/event-media_global-rhythm-fest.webp`,
  `${ASSETS_BASE}/event-media/event-media_asante-mensah-wedding.jpg`,
  `${ASSETS_BASE}/event-media/event-media_mensah-celebration.webp`,
  `${ASSETS_BASE}/event-media/event-media_totalenergies-gala.jpg`,
];

export function getFallbackEventImage(id: string): string {
  const n = Math.abs(
    id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0),
  );
  return EVENT_FALLBACK_IMAGES[n % EVENT_FALLBACK_IMAGES.length]!;
}

/** Normalize stored URLs (https, or site-relative under assets). */
export function resolveEventImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  let u = url.trim();
  if (u.startsWith("//")) u = `https:${u}`;
  if (u.startsWith("http://")) u = `https://${u.slice(7)}`;
  if (u.startsWith("https://")) return u;
  const path = u.startsWith("/") ? u : `/${u}`;
  return `${ASSETS_BASE}${path}`;
}

export function getEventHeroImage(event: Pick<EventRow, "id" | "media_urls">): string {
  const first = event.media_urls?.[0];
  const resolved = resolveEventImageUrl(first ?? null);
  return resolved ?? getFallbackEventImage(event.id);
}

export function getEventGridImages(event: Pick<EventRow, "id" | "media_urls">): string[] {
  const urls =
    event.media_urls?.filter(Boolean).map((u) => resolveEventImageUrl(u)).filter((x): x is string => Boolean(x)) ?? [];
  if (urls.length > 1) {
    return urls.slice(0, 6);
  }
  return EVENT_FALLBACK_IMAGES.slice(0, 6);
}

export function getRelatedCardImage(event: Pick<EventRow, "id" | "media_urls">): string {
  const first = event.media_urls?.[0];
  const resolved = resolveEventImageUrl(first ?? null);
  return resolved ?? getFallbackEventImage(event.id);
}
