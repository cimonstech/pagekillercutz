# Page KillerCutz — Project Documentation

> Full technical and product documentation for the Page KillerCutz web application.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema](#5-database-schema)
6. [Authentication & Roles](#6-authentication--roles)
7. [Public-Facing Pages](#7-public-facing-pages)
8. [Client Portal](#8-client-portal)
9. [Admin Dashboard](#9-admin-dashboard)
10. [API Reference](#10-api-reference)
11. [File Uploads (Cloudflare R2)](#11-file-uploads-cloudflare-r2)
12. [Email & SMS Notifications](#12-email--sms-notifications)
13. [Music Streaming](#13-music-streaming)
14. [Booking & Payment Flow](#14-booking--payment-flow)
15. [Merch Store Flow](#15-merch-store-flow)
16. [Playlist Portal](#16-playlist-portal)
17. [Cron Jobs](#17-cron-jobs)
18. [Deployment](#18-deployment)
19. [Design System](#19-design-system)
20. [Known Limitations & Future Work](#20-known-limitations--future-work)

---

## 1. Project Overview

**Page KillerCutz** is the official web platform for a Ghana-based scratch DJ. It serves as a combined marketing site, music catalog, booking system, merch store, client portal, and staff dashboard — all in a single Next.js application.

### Core User Journeys

| User | Journey |
|------|---------|
| **Visitor** | Browse music, events, merch, pricing → book the DJ |
| **Client** | Sign in → view booking status, submit playlist preferences, track orders |
| **Admin / Staff** | Manage bookings, music, events, merch, orders, playlists, accounts |
| **Super Admin** | All of the above + manage staff accounts, platform settings, audit log |

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 (App Router, `output: standalone`) |
| Language | TypeScript 5 |
| UI | React 19.2.4, Tailwind CSS 3 |
| Animation | GSAP, Three.js |
| Charts | Recharts |
| Database / Auth | Supabase (PostgreSQL + GoTrue) |
| Supabase client | `@supabase/ssr`, `@supabase/supabase-js` |
| Validation | Zod 4 |
| State management | Zustand |
| File storage | Cloudflare R2 (via AWS SDK S3) |
| Email | Resend |
| SMS | Custom via `api.letsfish.africa` |
| Webhooks | `standardwebhooks` |
| Audio metadata | `music-metadata` |
| Cron | `node-cron` |
| Server | Custom `server.ts` — `http.createServer` wrapping Next.js + cron init |

---

## 3. Directory Structure

```
/
├── app/
│   ├── (auth)/              # Sign-in, register, reset-password, admin login
│   ├── (public)/            # Home, about, booking, contact, events, music, pricing
│   ├── (app)/               # Authenticated client area (dashboard, merch, orders)
│   ├── (playlist-portal)/   # Standalone playlist submission portal
│   ├── admin/               # Admin dashboard (all tabs)
│   ├── api/                 # All API route handlers
│   ├── auth/                # OAuth callback
│   ├── globals.css          # Design tokens + Tailwind base
│   └── layout.tsx           # Root layout (fonts, providers)
│
├── components/
│   ├── admin/               # Admin tab components
│   ├── home/                # Public home page sections
│   ├── layout/              # Sidebars, player bar, top bars
│   ├── merch/               # Cart, checkout, order UI
│   ├── music/               # Music cards, hero player
│   └── ui/                  # Shared primitives (SpinningVinyl, AnimateIn, etc.)
│
├── hooks/                   # useAuth, useStaffAdmin, etc.
├── lib/
│   ├── auth/                # Site URL helpers, email HTML
│   ├── notify/              # Email + SMS send functions, templates
│   ├── store/               # Zustand stores (player, cart, admin)
│   ├── supabase/            # Supabase client/server factories
│   ├── validation/          # Zod schemas + validate() helper
│   ├── adminCookie.ts       # AES-256-GCM session cookie
│   ├── cron.ts              # Booking reminder cron
│   ├── r2.ts                # R2 upload helper
│   ├── rateLimit.ts         # Sliding window rate limiter
│   ├── requireAdmin.ts      # API auth guard
│   ├── validateFileBytes.ts # Magic-byte upload validation
│   └── writeAuditLog.ts     # Fire-and-forget audit log writer
│
├── supabase/
│   └── migrations/          # SQL migration files
│
├── middleware.ts             # Edge route protection
├── next.config.ts            # Security headers, image domains
├── server.ts                 # Custom HTTP server entry point
├── tailwind.config.ts        # Theme tokens, fonts, spacing
├── SECURITY.md               # Security implementation reference
└── DOCUMENTATION.md          # This file
```

---

## 4. Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **server only, never expose** |
| `SUPABASE_AUTH_HOOK_SECRET` | Standard Webhooks secret for the auth email hook |
| `ADMIN_SESSION_SECRET` | AES-256-GCM key for admin session cookies |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `LETS_FISH_API_KEY` | SMS gateway API key |
| `CLOUDFLARE_R2_ACCOUNT_ID` | R2 account ID |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 access key |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 secret key |
| `CLOUDFLARE_R2_BUCKET_NAME` | R2 bucket name |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Public base URL for R2 assets |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (used for auth redirects) |

---

## 5. Database Schema

All tables live in a Supabase (PostgreSQL) project. Core tables were set up outside the tracked migrations; the `supabase/migrations` directory contains incremental changes.

### `bookings`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `event_id` | text | Human-readable ID, e.g. `EVT-XXXXX` |
| `event_name` | text | Optional event name |
| `client_name` | text | |
| `client_email` | text | Links to auth user |
| `client_phone` | text | |
| `event_type` | text | |
| `event_date` | date | |
| `venue` | text | |
| `guest_count` | int | |
| `notes` | text | |
| `package_name` | text | |
| `genres` | text[] | |
| `status` | text | `pending`, `confirmed`, `completed`, `cancelled` |
| `payment_status` | text | `unpaid`, `paid` |
| `tracking_number` | text | |
| `created_at` | timestamptz | |

### `playlists`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `event_id` | text | FK to bookings.event_id |
| `client_email` | text | Owner email |
| `genres` | text[] | |
| `vibe` | text | |
| `must_play` | text[] | |
| `do_not_play` | text[] | |
| `notes` | text | |
| `locked` | boolean | Set by admin; prevents client edits |
| `created_at` | timestamptz | |

### `music`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `title` | text | |
| `type` | text | `album`, `single`, `mix` |
| `cover_url` | text | R2 URL |
| `audio_url` | text | R2 URL |
| `duration` | int | Seconds |
| `release_date` | date | |
| `description` | text | |
| `featured` | boolean | One featured at a time |
| `tracks` | jsonb | Array of `{ title, duration, audio_url }` |

### `events`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `title` | text | |
| `slug` | text | URL segment |
| `event_type` | text | |
| `date` | date | |
| `venue` | text | |
| `description` | text | |
| `media_urls` | text[] | R2 URLs |
| `featured` | boolean | |

### `products` (Merch)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `name` | text | |
| `description` | text | |
| `price` | numeric | GHS — authoritative price |
| `image_url` | text | R2 URL |
| `category` | text | |
| `active` | boolean | Hidden if false |
| `stock` | int | |

### `orders`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `customer_email` | text | |
| `customer_name` | text | |
| `customer_phone` | text | |
| `items` | jsonb | `[{ product_id, title, qty, unit_price, subtotal }]` |
| `total` | numeric | Server-computed |
| `status` | text | `unpaid`, `paid`, `shipped`, `delivered`, `cancelled` |
| `payment_status` | text | |
| `tracking_number` | text | |
| `notes` | text | |
| `created_at` | timestamptz | |

### `packages`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `name` | text | |
| `description` | text | |
| `price` | numeric | GHS |
| `features` | text[] | Bullet points for pricing page |
| `active` | boolean | |

### `admins`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `email` | text | Must match Supabase auth email |
| `role` | text | `admin` \| `super_admin` |
| `status` | text | `active` \| `suspended` |
| `last_login` | timestamptz | |
| `created_at` | timestamptz | |

### `audit_logs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `actor` | text | Email of admin who performed the action |
| `actor_role` | text | Role at time of action |
| `action` | text | Short description, e.g. `Updated booking EVT-12345` |
| `entity_type` | text | `booking`, `order`, `music`, etc. |
| `entity_id` | text | |
| `metadata` | jsonb | Before/after data |
| `archived` | boolean | |
| `archived_at` | timestamptz | |
| `archived_by` | text | |
| `created_at` | timestamptz | |

### `play_events`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK to auth.users |
| `music_id` | uuid | FK to music |
| `played_at` | timestamptz | |

### `notifications`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `type` | text | Email / SMS |
| `recipient` | text | |
| `subject` | text | |
| `body` | text | |
| `status` | text | `sent`, `failed`, `pending` |
| `created_at` | timestamptz | |

### `platform_settings`

| Column | Type | Notes |
|--------|------|-------|
| `key` | text | PK |
| `value` | text | |

### `password_resets`, `contact_messages`

Supporting tables for password flow and the contact form.

---

## 6. Authentication & Roles

### Client Authentication

- Email + password via Supabase Auth.
- Session stored in cookies via `@supabase/ssr`.
- Protected routes: `/client/*` — gated by middleware.
- Password reset: Supabase magic link → `/reset-password`.
- Email verification: custom HTML via Supabase Auth Hook → `POST /api/auth/send-email`.

### Admin Authentication

- Two-factor session: Supabase user session **plus** a separate **AES-256-GCM admin session cookie**.
- Login flow: `/admin/login` → verify Supabase credentials → verify `admins` table row → issue `admin_session` cookie.
- Middleware enforces the cookie on every `/admin/*` request (except `/admin/login`).
- `AdminGate` component enforces at hydration time.

### Roles

| Role | Access |
|------|--------|
| (unauthenticated) | Public pages, booking form, merch store |
| `client` | Own bookings, playlist portal, order history |
| `admin` | Full dashboard: bookings, music, merch, events, packages, playlists, notifications |
| `super_admin` | All of the above + staff accounts, audit log archive, platform settings |

---

## 7. Public-Facing Pages

| Route | Description |
|-------|-------------|
| `/` | Home — hero, popular tracks player, artist stats, how it works, recent events, booking CTA |
| `/about` | Artist biography, stats, philosophy |
| `/booking` | Multi-step booking request form |
| `/events` | Event listing |
| `/events/[slug]` | Individual event detail with media |
| `/music` | Music catalog — discography / mixes / singles tabs, featured album |
| `/music/[slug]` | Individual release page with tracklist |
| `/pricing` | DJ packages |
| `/contact` | Contact form |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/maintenance` | Maintenance screen (toggle in platform settings) |

---

## 8. Client Portal

Accessible after sign-in at `/client/*`.

| Route | Description |
|-------|-------------|
| `/client/dashboard` | Upcoming booking, active playlist, recent orders, stats |
| `/client/playlist` | Submit / edit playlist preferences for their event |
| `/client/orders` | Order history and status |
| `/client/profile` | Update name, email, phone, password |

### Client Data Scoping

All client API calls scope data by the **authenticated user's email** (`client_email` / `customer_email`). There is no way for a client to read another client's data through the API — the filter is enforced server-side regardless of what the client sends.

---

## 9. Admin Dashboard

Accessible at `/admin/*` (requires admin session cookie + Supabase session).

| Tab / Route | Description |
|-------------|-------------|
| `/admin/overview` | Stats summary, recent bookings and orders needing action |
| `/admin/bookings` | Full booking list with search, status filters, inline PATCH |
| `/admin/orders` | Order list, status management, tracking number |
| `/admin/music` | Upload music, set featured, manage tracklists |
| `/admin/events` | Create / edit events, upload event media |
| `/admin/merch` | Product catalogue CRUD |
| `/admin/packages` | DJ package CRUD (drives pricing page) |
| `/admin/playlists` | View all client playlists, lock playlists |
| `/admin/settings` | Platform settings (super_admin only) |
| `/admin/accounts` | Staff account management — invite, suspend, set role (super_admin only) |
| `/admin/audit-log` | Full audit trail with archive/clear (super_admin only) |
| `/admin/profile` | Admin's own profile + password |

---

## 10. API Reference

All routes live under `/api`. Methods not listed are not implemented.

### Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/auth/me` | User | Returns current user + admin record |
| PATCH | `/api/auth/update-profile` | User | Update display name, phone |
| DELETE | `/api/auth/delete-account` | User | Permanently delete own auth account |
| POST | `/api/auth/admin-session` | User + admins row | Issue admin session cookie |
| GET | `/api/auth/admin-session` | Admin cookie | Check session role |
| DELETE | `/api/auth/admin-session` | — | Clear admin session cookie |
| POST | `/api/auth/send-email` | HMAC webhook | Transactional email via Supabase Auth Hook |

### Bookings

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/bookings` | Public (rate limited) | Create booking + provision client account |
| GET | `/api/bookings` | Admin (or scoped client) | List bookings |
| GET | `/api/bookings/[id]` | Admin | Get single booking |
| PATCH | `/api/bookings/[id]` | Admin | Update status, payment, details |
| DELETE | `/api/bookings/[id]` | Admin | Delete booking |

### Music

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/music` | Public | List music (filter by type, featured, limit) |
| POST | `/api/music` | Admin | Create music record |
| GET | `/api/music/[id]` | Public | Get single release |
| PATCH | `/api/music/[id]` | Admin | Update release |
| DELETE | `/api/music/[id]` | Admin | Delete release |
| GET | `/api/music/popular` | Public | Top plays from `music_play_stats` view |
| POST | `/api/music/unfeature-all` | Admin | Clear featured flag on all releases |
| GET | `/api/music-search` | Public (rate limited) | Deezer-powered search proxy |

### Plays

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/plays` | User (silent no-op if anon) | Record a play event |
| GET | `/api/plays/stats` | Admin | Aggregated play statistics |

### Events

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/events` | Public | List events |
| POST | `/api/events` | Admin | Create event |
| GET | `/api/events/[id]` | Public | Get event detail |
| PATCH | `/api/events/[id]` | Admin | Update event |
| DELETE | `/api/events/[id]` | Admin | Delete event |

### Packages

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/packages` | Public | List DJ packages |
| POST | `/api/packages` | Admin | Create package |
| PATCH | `/api/packages/[id]` | Admin | Update package |
| DELETE | `/api/packages/[id]` | Admin | Delete package |

### Products (Merch)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/products` | Public | List active products |
| POST | `/api/products` | Admin | Create product |
| PATCH | `/api/products/[id]` | Admin | Update product |
| DELETE | `/api/products/[id]` | Admin | Delete product |

### Orders

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/orders` | Public (rate limited, validated, server-priced) | Place order |
| GET | `/api/orders` | Admin / scoped client | List orders |
| GET | `/api/orders/[id]` | Admin | Get order detail |
| PATCH | `/api/orders/[id]` | Admin | Update status, tracking |
| DELETE | `/api/orders/[id]` | Admin | Delete order |

### Playlists

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/playlists` | Admin | List all playlists |
| POST | `/api/playlists` | User + booking match | Create playlist |
| GET | `/api/playlists/[eventId]` | User + booking match or Admin | Get playlist |
| PATCH | `/api/playlists/[eventId]` | User + booking match (not if locked) or Admin | Update playlist |
| DELETE | `/api/playlists/[eventId]` | Admin | Delete playlist |

### Admin Management

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/admins` | Super admin | Create admin account |
| POST | `/api/admins/invite` | Super admin | Invite admin (Zod validated) |
| GET | `/api/admins/[id]` | Admin | Get admin record |
| PATCH | `/api/admins/[id]` | Admin (role/status: super_admin only) | Update admin |
| DELETE | `/api/admins/[id]` | Super admin | Remove admin |
| DELETE | `/api/admins/remove-self` | Admin | Self-removal (blocks if lone super_admin) |

### Audit Logs

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/audit-logs` | Admin (archived: super_admin only) | List logs |
| POST | `/api/audit-logs` | Admin | Write log entry |
| POST | `/api/audit-logs/clear` | Super admin | Archive / clear old logs |

### Settings

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/settings` | Super admin | Get platform settings |
| PATCH | `/api/settings` | Super admin | Update setting |

### Notifications

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/notifications` | Admin | List notifications |
| PATCH | `/api/notifications/[id]` | Admin | Update notification record |
| POST | `/api/notifications/[id]/retry` | Admin | Retry failed notification |

### Notify (Trigger Transactional Messages)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/notify/booking-request` | Admin | Notify client of new booking |
| POST | `/api/notify/booking-confirmed` | Admin | Notify client of confirmation |
| POST | `/api/notify/payment-confirmed` | Admin | Notify client of payment received |
| POST | `/api/notify/playlist-locked` | Admin | Notify client playlist is locked |
| POST | `/api/notify/order-placed` | Admin | Order receipt to client |
| POST | `/api/notify/order-payment-confirmed` | Admin | Order payment confirmed |
| POST | `/api/notify/order-shipped` | Admin | Shipping notification |
| POST | `/api/notify/order-delivered` | Admin | Delivery notification |
| POST | `/api/notify/test` | Admin (rate limited) | Send test email/SMS |

### Uploads

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/upload/merch-image` | Admin | Upload product image to R2 |
| POST | `/api/upload/music-cover` | Admin | Upload album cover to R2 |
| POST | `/api/upload/music-audio` | Admin | Upload audio file to R2 (max 100MB) |
| POST | `/api/upload/event-media` | Admin | Upload event image or video to R2 |

### Client Data

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/client/booking` | User | Get own booking by eventId |
| GET | `/api/client/dashboard` | User | Dashboard data (booking + playlist + orders) |

### Contact

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/contact` | Public (rate limited) | Submit contact message |

---

## 11. File Uploads (Cloudflare R2)

**Files:** `lib/r2.ts`, `lib/validateFileBytes.ts`

All media is stored on **Cloudflare R2** (S3-compatible). Uploads are processed entirely server-side in admin-only API routes.

**Upload path conventions:**

| Asset type | R2 prefix |
|-----------|-----------|
| Music cover | `music/covers/` |
| Music audio | `music/audio/` |
| Merch product image | `merch/` |
| Event media | `events/` |

All R2 URLs are stored in the database. The `NEXT_PUBLIC_R2_PUBLIC_URL` env var is the CDN base used for public access.

---

## 12. Email & SMS Notifications

### Email — Resend

**Files:** `lib/notify/email.ts`, `lib/notify/emailTemplates.ts`

- Sent via **Resend** API (`RESEND_API_KEY`).
- Transactional emails use a branded dark-mode HTML template.
- Supabase Auth emails (verify email, password reset) are routed through the **Auth Hook** (`POST /api/auth/send-email`) with Standard Webhooks signature verification.

### SMS — LetsF.ish

**File:** `lib/notify/sms.ts`

- Sent via `api.letsfish.africa` with `LETS_FISH_API_KEY`.
- Ghana (`+233`) numbers. SMS text is a stripped version of the email copy.

### Notification Log

Every sent notification is written to the `notifications` table. Failed sends can be retried from the admin dashboard (`POST /api/notifications/[id]/retry`).

---

## 13. Music Streaming

**Files:** `app/(public)/music/page.tsx`, `app/api/music-search/route.ts`, `lib/store/playerStore.ts`, `components/layout/PlayerAudioEngine.tsx`

- Hosted audio files (uploaded to R2) stream directly from the R2 CDN.
- **Deezer search proxy** (`GET /api/music-search`) proxies track searches to `api.deezer.com` for preview discovery (rate-limited to 30 req/min/IP; Deezer CDN is allowlisted in CSP).
- The global **audio player** (bottom bar) runs as a singleton via `PlayerAudioEngine` mounted in the root layout, controlled by **Zustand** (`playerStore`).
- Authenticated play events are written via `POST /api/plays` and aggregated in the `music_play_stats` view.

---

## 14. Booking & Payment Flow

```
Visitor fills /booking form
  → POST /api/bookings (rate limited, Zod validated)
    → Creates bookings row (status: pending, payment_status: unpaid)
    → Creates / provisions Supabase auth user
    → Sends "setup your account" email with auth link
    → Sends SMS confirmation
    → Returns { eventId }

Client signs in → /client/dashboard
  → Sees booking card with event_id
  → Submits payment offline (Mobile Money / bank transfer)
    using event_id as reference

Admin marks payment received in dashboard
  → PATCH /api/bookings/[id] (payment_status: paid)
  → POST /api/notify/payment-confirmed
    → Email + SMS to client

Admin confirms event
  → PATCH /api/bookings/[id] (status: confirmed)
  → POST /api/notify/booking-confirmed

Playlist portal
  → Client submits song preferences via /client/playlist
  → Admin locks playlist when ready
  → POST /api/notify/playlist-locked
```

**Payment provider:** None (manual). The platform is designed around **Mobile Money and bank transfer**, with admin confirmation as the authorisation step.

---

## 15. Merch Store Flow

```
Visitor browses /merch (or logged-in client)
  → Adds items to cart (CartDrawer — Zustand cartStore)
  → Checks out at /merch/checkout

POST /api/orders (rate limited, Zod validated)
  → Server reloads product prices from DB
  → Recomputes total server-side (client price ignored)
  → Creates orders row (status: unpaid)
  → Returns { orderId }

Admin receives order notification
  → POST /api/notify/order-placed

Client pays offline (Mobile Money)

Admin confirms payment
  → PATCH /api/orders/[id] (payment_status: paid)
  → POST /api/notify/order-payment-confirmed

Admin ships
  → PATCH /api/orders/[id] (status: shipped, tracking_number)
  → POST /api/notify/order-shipped

Admin marks delivered
  → POST /api/notify/order-delivered
```

---

## 16. Playlist Portal

**Route:** `/(playlist-portal)/playlist-portal`

A focused, single-purpose portal for clients to:
1. Enter their **event ID** to look up their booking.
2. Submit or update their **genre preferences, vibe, must-play, do-not-play, and notes**.

Access is controlled via `assertPlaylistAccess()` — the client's authenticated email must match the `client_email` on the booking. Locked playlists are read-only.

---

## 17. Cron Jobs

**Files:** `server.ts`, `lib/cron.ts`

On server start, `startCronJobs()` initialises `node-cron` tasks. Current scheduled jobs:

- **Booking reminders:** Periodically checks for upcoming events and sends reminder notifications to clients. (Exact schedule defined in `cron.ts`.)

Cron runs only in the custom server process — not in Vercel serverless functions. For production deployments that don't use a persistent server, consider migrating these to a Supabase `pg_cron` job or a separate worker.

---

## 18. Deployment

### Build

```bash
npm run build
```

Produces a **standalone** Next.js build (`output: "standalone"` in `next.config.ts`).

### Run (custom server)

```bash
node server.ts
```

or via the compiled output:

```bash
node .next/standalone/server.js
```

The custom server is needed for **cron job initialization**.

### Recommended environment

- Node.js 20+
- Always-on process (not serverless) if cron is required
- Cloudflare R2 bucket with public access on the asset prefix
- Supabase project with Auth Hook pointing to `POST <your-domain>/api/auth/send-email`

### Supabase setup checklist

- [ ] Enable email auth, disable phone auth (unless needed)
- [ ] **Disable Google OAuth** (removed from app)
- [ ] Configure Auth Hook → custom email → `POST /api/auth/send-email` with the webhook secret
- [ ] Set `SUPABASE_AUTH_HOOK_SECRET` in env
- [ ] Run all migrations in `supabase/migrations/` in order
- [ ] Confirm RLS is enabled on `play_events`, `notifications`, `platform_settings`, `admins`
- [ ] Create first super_admin row manually in `admins` table, then invite others via dashboard

---

## 19. Design System

**Files:** `tailwind.config.ts`, `app/globals.css`

### Typography

| Token | Font | Use |
|-------|------|-----|
| `font-display` | Barlow Condensed | Headlines, artist name, event titles |
| `font-headline` | Space Grotesk | UI headings, buttons, labels |
| `font-body` | Inter | Body copy, form inputs |
| `font-label` | Space Mono | Tags, metadata, monospaced labels |
| `font-mono` | Space Mono | Code-style values |

**`tracking-display-title`**: `0.0375em` — the custom letter-spacing token used on all `font-display` headings for an opened-up, readable uppercase treatment.

### Colour Tokens (dark mode only)

| Role | Value |
|------|-------|
| Background | `#08080F` |
| Surface | `#08080F` |
| Primary (cyan) | `#00BFFF` |
| Secondary (gold) | `#F5A623` |
| On Surface | `#E4E1EC` |
| Muted text | `#A0A8C0` |
| Ghost text | `#5A6080` |

### Utilities

- `.glass` — `backdrop-filter: blur(20px)` with subtle white/5 background
- `.glow-btn` — cyan box-shadow on primary buttons
- `.text-glow-cyan` — cyan text glow

---

## 20. Known Limitations & Future Work

| Item | Notes |
|------|-------|
| **Payment processing** | Currently manual (Mobile Money / bank transfer + admin confirmation). Integrating Paystack or Flutterwave would automate the payment confirmation step. |
| **Cron on serverless** | `node-cron` requires a persistent process. On Vercel or similar, move reminders to Supabase `pg_cron` or a Supabase Edge Function on a schedule. |
| **In-memory rate limiter** | `lib/rateLimit.ts` uses process memory. On multi-instance deployments, state is not shared. Replace with Redis or Upstash for distributed limiting. |
| **RLS coverage** | Core tables (`bookings`, `orders`, `music`, etc.) rely on service-role-only access via API routes. Direct Supabase client access is not restricted by RLS on those tables. Adding explicit RLS policies would add defence-in-depth. |
| **`dangerouslySetInnerHTML`** | No dedicated HTML sanitiser (DOMPurify) is present. Any future feature rendering user-provided HTML must sanitise on input. |
| **Video streaming** | Event media videos are served directly from R2. Large video files may benefit from a CDN or streaming-optimised delivery (e.g. Cloudflare Stream). |
| **Search** | Music search is proxied through Deezer. Full-text search on the platform's own catalog uses Supabase `ilike` — could be replaced with `pg_trgm` or Supabase's built-in full-text search for better results. |
| **Offline support** | No PWA / service worker. Adding a manifest and caching strategy would improve mobile experience. |
