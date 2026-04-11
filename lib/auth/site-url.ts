/**
 * Absolute site origin for auth redirect URLs (must match Supabase Auth URL allow-list).
 */
export function getPublicSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export function authCallbackUrl(nextPath: string): string {
  const site = getPublicSiteUrl();
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${site}/auth/callback?next=${encodeURIComponent(next)}`;
}
