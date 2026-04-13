import type { User } from "@supabase/supabase-js";

function capitalizeWord(word: string): string {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** First word of a display name (for navbar greeting). */
function firstDisplayWord(value: string): string {
  const w = value.trim().split(/\s+/)[0];
  return w ? capitalizeWord(w) : "";
}

export function getDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};

  const fromFull = meta.full_name;
  if (typeof fromFull === "string" && fromFull.trim()) {
    const fw = firstDisplayWord(fromFull);
    if (fw) return fw;
  }

  const fromName = meta.name;
  if (typeof fromName === "string" && fromName.trim()) {
    const fw = firstDisplayWord(fromName);
    if (fw) return fw;
  }

  const email = user.email || "";
  const username = email.split("@")[0] ?? "";
  const cleaned = username.replace(/[._-]/g, " ").split(" ")[0] ?? "";
  if (!cleaned) return email || "User";
  return capitalizeWord(cleaned);
}

function initialsFromFullNameLike(value: string): string | null {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length === 1) {
    return parts[0]!.toUpperCase();
  }
  return null;
}

export function getInitials(user: User): string {
  const meta = user.user_metadata ?? {};

  const full = meta.full_name;
  if (typeof full === "string" && full.trim()) {
    const initials = initialsFromFullNameLike(full);
    if (initials) return initials;
  }

  const name = meta.name;
  if (typeof name === "string" && name.trim()) {
    const initials = initialsFromFullNameLike(name);
    if (initials) return initials;
  }

  const email = user.email || "";
  return email.slice(0, 2).toUpperCase() || "?";
}
