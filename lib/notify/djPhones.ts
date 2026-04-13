/**
 * Phone numbers that receive DJ-facing SMS (booking alerts, reminders, orders).
 *
 * Configure either:
 * - `DJ_PHONE` (primary) and optionally `DJ_PHONE_2` (second line), or
 * - `DJ_PHONES` — comma- or semicolon-separated list (overrides DJ_PHONE / DJ_PHONE_2 when set)
 *
 * Numbers may include +233 or local digits; they are normalised when sending via `sendSMS`.
 */

function splitPhones(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function dedupeByDigits(phones: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of phones) {
    const k = p.replace(/\D/g, "");
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}

/** All DJ handsets that should receive the same operational SMS. */
export function getDjSmsRecipients(): string[] {
  const override = process.env.DJ_PHONES?.trim();
  if (override) return dedupeByDigits(splitPhones(override));

  const out: string[] = [];
  const p1 = process.env.DJ_PHONE?.trim();
  const p2 = process.env.DJ_PHONE_2?.trim();
  if (p1) out.push(p1);
  if (p2) out.push(p2);
  return dedupeByDigits(out);
}

/** Primary number for template metadata / emails (first configured DJ line). */
export function getPrimaryDjPhone(): string {
  const all = getDjSmsRecipients();
  return all[0] ?? "";
}
