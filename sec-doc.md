# Security Implementation — Page KillerCutz

> This document covers every security layer in the application, from edge middleware to database-level policies.

---

## Table of Contents

1. [HTTP Security Headers](#1-http-security-headers)
2. [Edge Middleware — Route Protection](#2-edge-middleware--route-protection)
3. [Admin Session Cookie (AES-256-GCM)](#3-admin-session-cookie-aes-256-gcm)
4. [Supabase Authentication](#4-supabase-authentication)
5. [Server-Side Admin Authorization (`requireAdmin`)](#5-server-side-admin-authorization-requireadmin)
6. [Client-Side Admin Gate (`AdminGate`)](#6-client-side-admin-gate-admingate)
7. [Input Validation with Zod](#7-input-validation-with-zod)
8. [Rate Limiting](#8-rate-limiting)
9. [File Upload Security](#9-file-upload-security)
10. [Server-Side Price Integrity](#10-server-side-price-integrity)
11. [SQL Injection Hardening](#11-sql-injection-hardening)
12. [Playlist & Booking Scoping](#12-playlist--booking-scoping)
13. [PATCH Allowlists](#13-patch-allowlists)
14. [Supabase Auth Webhook Verification](#14-supabase-auth-webhook-verification)
15. [Open Redirect Mitigation](#15-open-redirect-mitigation)
16. [Play Event Abuse Prevention](#16-play-event-abuse-prevention)
17. [Row-Level Security (RLS) — Supabase](#17-row-level-security-rls--supabase)
18. [Notification & Audit Log Security](#18-notification--audit-log-security)
19. [Account Deletion & Self-Removal Guards](#19-account-deletion--self-removal-guards)
20. [Sign-In Page Hardening](#20-sign-in-page-hardening)
21. [Vulnerability Audit Log (All 4 Rounds)](#21-vulnerability-audit-log-all-4-rounds)

---

## 1. HTTP Security Headers

**File:** `next.config.ts`

Applied globally to all routes via Next.js `headers()`:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` | See below |

**Content-Security-Policy** includes:
- `default-src 'self'`
- `script-src 'self' 'unsafe-inline'` — `'unsafe-eval'` was removed
- `style-src 'self' 'unsafe-inline' fonts.googleapis.com`
- `font-src 'self' fonts.gstatic.com`
- `img-src 'self' data: blob:` + approved CDNs (R2, Supabase, Deezer)
- `connect-src 'self'` + Supabase, Resend, `api.letsfish.africa`, `api.deezer.com`, Supabase WebSocket
- **`frame-ancestors 'none'`** — prevents the app from being embedded in any iframe

Additionally, admin responses from middleware set:
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
```

---

## 2. Edge Middleware — Route Protection

**File:** `middleware.ts`

The middleware runs before every request under `/admin/*` and `/client/*`.

### Admin Area (`/admin/*`)

1. Reads the `admin_session` cookie.
2. Calls `verifyAdminCookie()` to decrypt and validate the AES-256-GCM token.
3. If absent or invalid → **301 redirect to `/admin/login`**.
4. **Super-admin only routes** (`/admin/accounts`, `/admin/audit-log`, `/admin/settings`): if `adminSession.role !== "super_admin"` → redirect to `/admin/overview`.

### Client Area (`/client/*`)

1. Uses `createServerClient` from `@supabase/ssr` to refresh the session cookie.
2. Calls `supabase.auth.getUser()`.
3. If no user → **redirect to `/sign-in?redirect=<path>&notice=login_required`**.

**Matcher:**
```ts
export const config = {
  matcher: ["/admin/:path*", "/client/:path*"],
};
```

---

## 3. Admin Session Cookie (AES-256-GCM)

**File:** `lib/adminCookie.ts`

Admin authentication uses a **custom signed, encrypted session token** in addition to Supabase's JWT, so admin sessions are fully independent of the client auth system.

- **Algorithm:** AES-256-GCM via Web Crypto API
- **Key derivation:** `ADMIN_SESSION_SECRET` environment variable
- **IV:** Randomly generated per token, prepended to the ciphertext
- **Encoding:** Base64URL
- **Payload:** `{ email, role, iat }`
- **Max age:** 8 hours
- **Cookie flags:** `httpOnly`, `secure` (production), `sameSite: "strict"`

If `ADMIN_SESSION_SECRET` is not set, the app throws immediately at startup — no silent fallback to a zero-key.

Any token with invalid JSON, wrong key, or expired `iat` returns `null` — treated as unauthenticated.

---

## 4. Supabase Authentication

**Files:** `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase.ts`

- **Browser (client components):** `createBrowserClient` with anon key — user-scoped.
- **Server (route handlers, RSC):** `createServerClient` from `@supabase/ssr` using `next/headers` — refreshes the session cookie on every request.
- **Privileged operations:** `getSupabaseAdmin()` with the **service role key** — used only server-side in API routes. Never exposed to the client.

All user-facing mutations verify the user's session with `supabase.auth.getUser()` before touching the database.

---

## 5. Server-Side Admin Authorization (`requireAdmin`)

**File:** `lib/requireAdmin.ts`

Every admin-only API route calls `requireAdmin()` or `requireSuperAdmin()` as the first thing, before any logic runs.

```
requireAdmin()
  → getUser()                (Supabase anon session)
  → if no user → 401
  → getSupabaseAdmin()       (service role)
  → query admins by email    (ilike — case-insensitive)
  → if not found → 403
  → if status !== "active" → 403
  → if role not admin|super_admin → 403
  → return { authorized: true, adminRecord }
```

`requireSuperAdmin()` adds an additional check that `role === "super_admin"`.

**Routes protected with `requireAdmin()`:**
- All booking `PATCH`/`DELETE`
- All orders `PATCH`/`DELETE`
- All music `POST`/`PATCH`/`DELETE`
- All events `POST`/`PATCH`/`DELETE`
- All products `POST`/`PATCH`/`DELETE`
- All packages `POST`/`PATCH`/`DELETE`
- All upload routes
- All notification routes (8 routes)
- Playlist list (`GET /api/playlists`), playlist `DELETE`
- Audit log read/write
- Admin management (invite, remove, update)

**Routes protected with `requireSuperAdmin()`:**
- `PATCH /api/admins/[id]` (role/status fields)
- `GET`/`PATCH /api/settings`
- `POST /api/audit-logs/clear`
- Audit archive features

---

## 6. Client-Side Admin Gate (`AdminGate`)

**File:** `components/admin/AdminGate.tsx`

Wraps every admin page client component. On mount:

1. Calls `GET /api/auth/me` to confirm an active admin record.
2. If no valid admin → calls `DELETE /api/auth/admin-session` to clear the cookie, then `supabase.auth.signOut()`, then redirects to `/admin/login`.

This is a **defence-in-depth** complement to the middleware cookie check. The middleware enforces at the edge; `AdminGate` enforces after hydration in the browser.

---

## 7. Input Validation with Zod

**Files:** `lib/validation/schemas.ts`, `lib/validation/validate.ts`

All mutating public endpoints parse their request body through a **Zod schema** before any database operation. Field-level error details are returned in a structured `{ error, details }` response.

| Endpoint | Schema |
|----------|--------|
| `POST /api/bookings` | `bookingSchema` |
| `POST /api/orders` | `orderSchema` |
| `POST /api/playlists` | `playlistCreateSchema` |
| `PATCH /api/playlists/[eventId]` | `playlistPatchSchema` |
| `POST /api/admins/invite` | `adminInviteSchema` |

Any request that fails Zod validation returns `400` immediately — the database is never touched.

---

## 8. Rate Limiting

**File:** `lib/rateLimit.ts`

In-memory **sliding window** rate limiter with an LRU cache. Client IP is derived from `x-forwarded-for` (first hop), then `x-real-ip`, then `"unknown"`.

| Endpoint | Limit |
|----------|-------|
| `POST /api/bookings` | 5 requests / hour / IP |
| `POST /api/orders` | 10 requests / hour / IP |
| `POST /api/contact` | 5 requests / hour / IP |
| `POST /api/plays` | 100 requests / hour / IP |
| `GET /api/music-search` | 30 requests / minute / IP |
| `POST /api/auth/admin-session` | 10 requests / 15 minutes / IP |
| `POST /api/notify/test` | 3 requests / hour / IP |

Exceeding the limit returns **`429 Too Many Requests`** with a `Retry-After` header.

---

## 9. File Upload Security

**File:** `lib/validateFileBytes.ts`

Upload routes do **not trust the `Content-Type` header or file extension**. Every uploaded file is read as `ArrayBuffer` and its **magic bytes** are checked before touching storage.

### Images (`validateImageBytes`)
- JPEG: `FF D8 FF`
- PNG: `89 50 4E 47 0D 0A 1A 0A`
- WebP: `52 49 46 46 … 57 45 42 50`

### Audio (`validateAudioBytes`)
- ID3 tag: `49 44 33`
- MP3 frame sync: `FF Fx`
- WAV: `52 49 46 46 … 57 41 56 45`
- FLAC: `66 4C 61 43`
- MP4/M4A (ISO BMFF `ftyp` atom): checked at offset 4

### Video (`validateVideoBytes`)
- ISO BMFF `ftyp` box at offset 4 (covers MP4, MOV, M4V)

**Additional upload constraints:**
- Audio files: hard cap of **100 MB**
- MIME type and file extension cross-check on audio uploads
- All upload routes require `requireAdmin()` — no public file uploads
- Server body size limit set to **10 MB** (down from 100 MB)

---

## 10. Server-Side Price Integrity

**File:** `app/api/orders/route.ts`

After Zod validation of an order POST, the server:

1. Reloads every `product_id` from the database (service role).
2. Verifies each product's `active` flag — rejects if any product is inactive.
3. **Recomputes unit prices and the total server-side** using the database price.
4. **Never persists** the `price` or `total` values sent by the client.

```ts
const verifiedItems = o.items.map(item => ({
  ...item,
  price: priceMap.get(item.product_id)!.price,
}));
const verifiedTotal = verifiedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
```

This prevents any client-side price manipulation.

---

## 11. SQL Injection Hardening

All database queries use the **Supabase JS client** with parameterized methods (`.eq`, `.ilike`, `.in`, `.select`) — no raw SQL string building in application code.

For free-text search fields that build `ILIKE` expressions, special characters are **explicitly escaped** before use:

```ts
const term = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
```

This prevents wildcard injection via search inputs. Applied in:
- `GET /api/bookings` (admin + client paths)
- `GET /api/orders` (admin + client paths)

---

## 12. Playlist & Booking Scoping

**Files:** `app/api/playlists/[eventId]/route.ts`, `app/api/bookings/route.ts`, `app/api/orders/route.ts`

### Playlists

Non-admin users can only access a playlist if **their authenticated email matches the `client_email` on the booking** (case-insensitive comparison via `emailsMatch`). This check runs via `assertPlaylistAccess()` before returning any playlist data or accepting any update.

- **Locked playlists:** Non-admin users cannot `PATCH` a playlist once it is marked `locked`.
- **Playlist `DELETE`:** Requires `requireAdmin()` — clients cannot delete their own playlists.

### Bookings & Orders (List API)

If the caller is not an admin, the query is **forced** to filter by the authenticated user's email:

```ts
// non-admin: restrict to own records only
query = query.ilike("client_email", forcedEmail);
```

Admins see all records. There is no way for a non-admin to enumerate other users' bookings or orders through the API.

---

## 13. PATCH Allowlists

**Files:** `app/api/bookings/[id]/route.ts`, `app/api/orders/[id]/route.ts`, `app/api/admins/[id]/route.ts`, `app/api/events/[id]/route.ts`, `app/api/music/[id]/route.ts`, `app/api/products/[id]/route.ts`, `app/api/packages/[id]/route.ts`

`PATCH` endpoints only update an explicit allowlist of fields. Any field sent by the client that is not in the allowlist is silently ignored — it is never written to the database.

```ts
const safeUpdate: Record<string, unknown> = {};
for (const key of Object.keys(raw)) {
  if (ALLOWED_*_PATCH_FIELDS.has(key)) {
    safeUpdate[key] = raw[key];
  }
}
```

For `PATCH /api/admins/[id]`, **`role` and `status`** fields are gated behind `requireSuperAdmin()`, preventing regular admins from elevating their own privileges or altering other admin statuses.

---

## 14. Supabase Auth Webhook Verification

**File:** `app/api/auth/send-email/route.ts`

Supabase calls this endpoint to deliver transactional email (email verification, password reset, magic link). The endpoint uses **Standard Webhooks** (`standardwebhooks` package) to verify the payload signature using `SUPABASE_AUTH_HOOK_SECRET`.

- If the secret is not configured → **`503 Service Unavailable`**
- If the signature is invalid → **`401 Unauthorized`**

This ensures that only Supabase's infrastructure can trigger email sends.

---

## 15. Open Redirect Mitigation

**File:** `app/auth/callback/route.ts`

After OAuth / magic link callback, the `next` query parameter is validated before redirecting:

```ts
const next =
  nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
    ? nextRaw
    : "/client/dashboard";
```

Any external URL or protocol-relative URL is discarded — the user is always redirected within the same origin.

The same pattern (`safeRedirectPath`) is applied in the sign-in page for the `redirect` query parameter.

---

## 16. Play Event Abuse Prevention

**File:** `app/api/plays/route.ts`

- If no authenticated user is present, the endpoint returns `{ success: true }` **without writing anything** to the database. This avoids anonymous play-count inflation while keeping the client experience seamless.
- Authenticated play events are **rate-limited** (100 / hour / IP).
- The `musicId` field is parsed through a **`parseUuid`** validator — invalid UUIDs are set to `null` and the insert is skipped, preventing garbage data.

---

## 17. Row-Level Security (RLS) — Supabase

**Directory:** `supabase/migrations`

RLS is enabled on the following tables with these policies:

| Table | Policy | Rule |
|-------|--------|------|
| `play_events` | `users_own_plays` | `auth.uid() = user_id` (users see/write only their own rows) |
| `platform_settings` | `settings_service_all` | `auth.role() = 'service_role'` only |
| `platform_settings` | `settings_admin_read` | `FOR SELECT USING (true)` (read available to authenticated) |
| `admins` | `admins_self_read_by_email` | Authenticated user can SELECT their own admin row |
| `admins` | `admins_read_own` | Same — authenticated sees own row |
| `notifications` | `service_role_all` | Service role only |

Core tables (`bookings`, `music`, `orders`, `playlists`, `events`, `audit_logs`) are accessed exclusively via the **service role key** in server-side route handlers — no direct client access.

---

## 18. Notification & Audit Log Security

### Notifications
- Read and write via `GET`/`PATCH /api/notifications` — requires `requireAdmin()`.
- `POST /api/notifications/[id]/retry` — requires `requireAdmin()`.

### Audit Log
- All writes from the server (`writeAuditLog`) call `POST /api/audit-logs`.
- The API route **overwrites** the `actor` and `actor_role` fields from the verified `requireAdmin()` result — the client cannot spoof who performed an action.
- **Archive and clear** operations require `requireSuperAdmin()`.
- `include_archived` parameter in the list query is only honoured for `super_admin` callers.
- List query `limit` is clamped: `Math.min(Math.max(limit, 1), 500)` — unbounded pagination is not possible.

---

## 19. Account Deletion & Self-Removal Guards

**Files:** `app/api/auth/delete-account/route.ts`, `app/api/admins/remove-self/route.ts`

### Account deletion
- Requires an authenticated Supabase session.
- Calls `admin.auth.admin.deleteUser(userId)` via the service role.

### Admin self-removal
- Requires an authenticated session and a valid active admin record.
- **Blocks removal** if the user is the **only remaining `super_admin`** in the `admins` table — prevents lock-out.
- On success, deletes the `admins` row, writes an audit log entry, and clears the `admin_session` cookie.

---

## 20. Sign-In Page Hardening

**File:** `app/(auth)/sign-in/page.tsx`

- **Google OAuth removed** — no third-party OAuth provider is exposed on the client sign-in page. Authentication is email + password only.
- **Admin login link removed** — the admin portal URL (`/admin/login`) is not advertised anywhere on the public sign-in page.
- **Auth callback hash handling** — if a recovery/token hash lands on the sign-in page, it is consumed and cleared from the URL before the user is redirected.
- **No console leaks** — all `console.log` calls that previously leaked email addresses, auth results, and admin records to the browser console were removed from `app/(auth)/admin/login/page.tsx`.

---

## 21. Vulnerability Audit Log (All 4 Rounds)

### Round 1 — Initial Audit (16 issues)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `app/api/bookings/route.ts` | Unauthenticated `GET` allowed non-admins to enumerate all bookings | Added admin check; non-admins restricted to own email |
| 2 | `app/api/orders/route.ts` | Same — unauthenticated order enumeration | Same pattern applied |
| 3 | `app/api/music/route.ts` | `POST` required no authentication | Added `requireAdmin()` |
| 4 | `app/api/events/route.ts` | `POST` required no authentication | Added `requireAdmin()` |
| 5 | `app/api/products/route.ts` | `POST` required no authentication | Added `requireAdmin()` |
| 6 | `app/api/admins/route.ts` | `GET`/`POST` required no authentication | Added `requireAdmin()` |
| 7 | `app/api/upload/*` | All upload routes unauthenticated | Added `requireAdmin()` to all four upload routes |
| 8 | `lib/adminCookie.ts` | Session token was base64-encoded JSON (no signing, no encryption) | Replaced with AES-256-GCM encrypted token |
| 9 | `middleware.ts` | Admin middleware used localStorage role flag instead of verifying cookie | Rewrote to decrypt and verify AES-256-GCM `admin_session` cookie |
| 10 | `next.config.ts` | No HTTP security headers | Added HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| 11 | `app/(auth)/admin/login/page.tsx` | Admin role stored in `localStorage` — trivially spoofable | Role removed from localStorage; session relies on encrypted cookie only |
| 12 | `app/api/playlists/route.ts` | No ownership check — any user could read any playlist | Added `assertPlaylistAccess()` email-match guard |
| 13 | `app/api/plays/route.ts` | No rate limiting | Added 100/hour rate limit; anonymous writes silently dropped |
| 14 | `lib/validateFileBytes.ts` | No file type validation on uploads (MIME only) | Created magic-byte validator for images, audio, video |
| 15 | `app/api/auth/send-email/route.ts` | Webhook endpoint had no signature verification | Added Standard Webhooks HMAC verification |
| 16 | `app/auth/callback/route.ts` | Open redirect via `next` query parameter | Added `startsWith("/") && !startsWith("//")` guard |

---

### Round 2 — Sub-route & Mass Assignment Audit (8 issues)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 17 | `app/api/bookings/[id]/route.ts` | `GET`/`PATCH`/`DELETE` — no auth on individual booking records | Added `requireAdmin()`; `ALLOWED_BOOKING_PATCH_FIELDS` allowlist |
| 18 | `app/api/orders/[id]/route.ts` | Same for individual order records | Added `requireAdmin()`; `ALLOWED_ORDER_PATCH_FIELDS` allowlist |
| 19 | `app/api/events/[id]/route.ts` | `PATCH`/`DELETE` unprotected | Added `requireAdmin()`; `ALLOWED_EVENT_PATCH_FIELDS` allowlist |
| 20 | `app/api/music/[id]/route.ts` | `PATCH`/`DELETE` unprotected | Added `requireAdmin()`; `ALLOWED_MUSIC_PATCH_FIELDS` allowlist |
| 21 | `app/api/products/[id]/route.ts` | `PATCH`/`DELETE` unprotected | Added `requireAdmin()`; `ALLOWED_PRODUCT_PATCH_FIELDS` allowlist |
| 22 | `app/api/admins/[id]/route.ts` | Privilege escalation — unauthenticated PATCH could change any admin's role | Added `requireAdmin()` for general fields; `requireSuperAdmin()` for role/status |
| 23 | Multiple `[id]` routes | Mass assignment via `{ ...body }` spread — any column could be overwritten | Replaced all spreads with explicit field allowlists |
| 24 | `app/api/packages/route.ts` + `[id]/route.ts` | Package routes had no authentication | Added `requireAdmin()` to `POST`/`PATCH`/`DELETE`; `ALLOWED_PACKAGE_PATCH_FIELDS` |

---

### Round 3 — Notify Routes, CSP, Pricing (9 issues)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 25 | `app/api/notify/order-placed/route.ts` | Unauthenticated — accepted arbitrary `customerPhone`, open SMS proxy | Added `requireAdmin()` |
| 26 | `app/api/notify/booking-confirmed/route.ts` | Unauthenticated notify route | Added `requireAdmin()` |
| 27 | `app/api/notify/booking-request/route.ts` | Unauthenticated notify route | Added `requireAdmin()` |
| 28 | `app/api/notify/order-shipped/route.ts` | Unauthenticated notify route | Added `requireAdmin()` |
| 29 | `app/api/notify/order-delivered/route.ts` | Unauthenticated notify route | Added `requireAdmin()` |
| 30 | `app/api/notify/order-payment-confirmed/route.ts` | Unauthenticated notify route | Added `requireAdmin()` |
| 31 | `app/api/notify/playlist-locked/route.ts` | Unauthenticated notify route | Added `requireAdmin()` |
| 32 | `app/api/music/unfeature-all/route.ts` | Unauthenticated bulk mutation route | Added `requireAdmin()` |
| 33 | `next.config.ts` | CSP `script-src` contained `'unsafe-eval'` | Removed `'unsafe-eval'`; `serverActions.bodySizeLimit` reduced from 100 MB to 10 MB |

---

### Round 4 — Injection, Leaks, Edge Cases (9 issues)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 34 | `app/api/bookings/route.ts` | PostgREST ILIKE injection via unescaped `search` param | Escape `%_\` before interpolation |
| 35 | `app/api/orders/route.ts` | Same injection + client-submitted prices trusted | Escape search; server-side price recomputation |
| 36 | `app/api/admins/route.ts` | `role` field not validated against enum at runtime | Added `if (role !== "admin" && role !== "super_admin")` guard |
| 37 | `app/api/audit-logs/route.ts` | Unbounded `limit` and unvalidated `offset` allowed memory exhaustion | `Math.min(Math.max(limit,1),500)` + `Math.max(offset,0)` |
| 38 | `app/api/admins/invite/route.ts` | Raw Supabase/DB error messages leaked in response | Replaced with generic "Internal server error" |
| 39 | `app/api/admins/route.ts` | `temporaryPassword` and `authUserId` included in API response | Removed both fields from the JSON response |
| 40 | `app/(auth)/admin/login/page.tsx` | `console.log` calls leaked email addresses and admin records | Removed all debug `console.log` calls |
| 41 | `lib/adminCookie.ts` | Missing `ADMIN_SESSION_SECRET` silently fell back to all-zero key | Changed to hard throw on missing secret |
| 42 | `app/api/notify/payment-confirmed/route.ts` | Missed in Round 3 sweep — unauthenticated notify route | Added `requireAdmin()` |

---

## Summary

| Layer | Mechanism |
|-------|-----------|
| Transport | HSTS (2-year preload) |
| Headers | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Edge routing | `middleware.ts` — admin cookie + Supabase session |
| Admin sessions | AES-256-GCM cookie, 8-hour expiry, httpOnly, secure, sameSite:strict |
| API authorization | `requireAdmin()` / `requireSuperAdmin()` on every mutating admin route |
| Client-side guard | `AdminGate` component double-checks admin status after hydration |
| Input validation | Zod schemas on all public POST endpoints |
| Rate limiting | Sliding-window in-memory limiter on all write endpoints |
| File uploads | Magic-byte validation; admin-only; 10 MB body limit cap |
| Price integrity | Server-side price recomputation; client prices never persisted |
| Query safety | Parameterized Supabase client; `%_\` escape on ILIKE inputs |
| Data scoping | Email-scoped booking/order queries for non-admins; playlist access assertion |
| PATCH safety | Explicit field allowlists; role/status changes require super_admin |
| Webhook | Standard Webhooks HMAC verification for Supabase Auth Hook |
| Redirects | `startsWith("/")` + `!startsWith("//")` guard on all `next` params |
| Play events | Anonymous writes silently dropped; UUID validation on musicId |
| Database | RLS on play_events, settings, admins, notifications; service role for core tables |
| Audit | Actor injected server-side; archive/clear requires super_admin |
| Account ops | Lone super_admin removal blocked; delete uses service role |
| Error handling | All error responses use generic messages — no internal details leaked |

---

*Total vulnerabilities found and fixed: **42** across 4 audit rounds.*
