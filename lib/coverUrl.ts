/** Deezer and other CDNs sometimes return http:; normalize for CSP and mixed content. */
export function normalizeCoverUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const t = url.trim();
  if (t.startsWith("http://")) return `https://${t.slice(7)}`;
  return t;
}
