import type { Database } from "@/lib/database.types";
import { DJ_INFO } from "@/lib/constants";
import { formatDuration } from "@/lib/player-utils";

export type MusicRow = Database["public"]["Tables"]["music"]["Row"];
export type EventRow = Database["public"]["Tables"]["events"]["Row"];

export const ARTIST = DJ_INFO.name;

export function formatMusicTypeLabel(type: MusicRow["type"]): string {
  const map: Record<MusicRow["type"], string> = {
    album: "Album",
    single: "Single",
    mix: "Mix",
  };
  return map[type] ?? type;
}

export function formatNewReleaseSubtitle(m: MusicRow): string {
  const y = m.release_date ? String(m.release_date).slice(0, 4) : "";
  const t = formatMusicTypeLabel(m.type);
  if (y && t) return `${y} · ${t}`;
  return t || y || "";
}

export function formatEventDate(d: string): string {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return d;
  return x.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
}

export function eventTypeEmoji(eventType: string): string {
  const t = eventType.toLowerCase();
  if (t.includes("festival")) return "\u{1F3B8}";
  if (t.includes("wedding")) return "\u{1F48D}";
  if (t.includes("corporate")) return "\u{1F3E2}";
  if (t.includes("club")) return "\u{1F3A7}";
  return "\u{1F3A4}";
}

export const isAbsoluteUrl = (url: string | null | undefined) =>
  Boolean(url && (url.startsWith("https://") || url.startsWith("http://")));

export { formatDuration };
