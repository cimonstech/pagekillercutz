"use client";

import type { Database } from "@/lib/database.types";
import { ChevronDown, Clock, Handshake, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];
type PackageRow = Database["public"]["Tables"]["packages"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

type PlaylistMapRow = Pick<
  PlaylistRow,
  "event_id" | "locked" | "must_play" | "do_not_play" | "timeline"
>;

type EventDataLite = {
  media_urls: string[];
  title: string;
  event_type: string;
};

type DashboardData = {
  booking: BookingRow;
  playlist: PlaylistRow | null;
  package: PackageRow | null;
  daysUntilEvent: number;
  eventData: EventDataLite | null;
  eventDataMap?: Record<string, EventDataLite>;
  upcomingBookings: BookingRow[];
  pastBookings: BookingRow[];
  playlistMap: Record<string, PlaylistMapRow>;
  recentOrders: OrderRow[];
  recentNotifications: {
    id: string;
    icon: "notifications";
    tone: "primary" | "secondary";
    message: string;
    time: string;
  }[];
};

const glass =
  "rounded-[20px] border border-white/[0.08] bg-white/[0.05] p-6 backdrop-blur-[20px]";

const DJ_MOMO = process.env.NEXT_PUBLIC_DJ_MOMO ?? "+233 24 412 3456";

function jsonArrLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortEventDay(iso: string): string {
  try {
    return new Date(`${iso.trim()}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function daysUntilEventDate(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ed = new Date(`${iso.trim().split("T")[0]}T00:00:00`);
  const diff = ed.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function heroTitle(booking: BookingRow): string {
  const name = booking.event_name?.trim();
  if (name) return name;
  return `${booking.event_type} Event`;
}

function eventTypeEmoji(eventType: string): string {
  const x = eventType.toLowerCase();
  if (x.includes("wedd")) return "💍";
  if (x.includes("corporate")) return "💼";
  if (x.includes("festival")) return "🎪";
  if (x.includes("club")) return "🎶";
  if (x.includes("birth")) return "🎂";
  return "🎵";
}

function truncatePillLabel(s: string, max = 20): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function DashboardSkeleton() {
  const sk = "rounded-[20px] border border-white/[0.06] bg-[rgba(255,255,255,0.04)] overflow-hidden";
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6">
      <div className={`col-span-12 min-h-[320px] lg:col-span-8 ${sk}`}>
        <div className="kc-shimmer h-full min-h-[320px] w-full" />
      </div>
      <div className={`col-span-12 min-h-[280px] lg:col-span-4 ${sk}`}>
        <div className="kc-shimmer h-full min-h-[280px] w-full" />
      </div>
      <div className={`col-span-12 min-h-[220px] md:col-span-4 lg:col-span-3 ${sk}`}>
        <div className="kc-shimmer h-full min-h-[220px] w-full" />
      </div>
      <div className={`col-span-12 min-h-[220px] md:col-span-4 lg:col-span-3 ${sk}`}>
        <div className="kc-shimmer h-full min-h-[220px] w-full" />
      </div>
      <div className={`col-span-12 min-h-[200px] md:col-span-12 lg:col-span-6 ${sk}`}>
        <div className="kc-shimmer h-full min-h-[200px] w-full" />
      </div>
      <div className={`col-span-12 min-h-[160px] ${sk}`}>
        <div className="kc-shimmer h-full min-h-[160px] w-full" />
      </div>
    </div>
  );
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [activePackage, setActivePackage] = useState<PackageRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pastExpanded, setPastExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user?.email) {
          router.replace("/sign-in");
          return;
        }

        const { data: adminRecord } = await supabase
          .from("admins")
          .select("role")
          .eq("email", user.email)
          .maybeSingle();

        if (cancelled) return;
        if (adminRecord) {
          router.replace("/admin");
          return;
        }

        const res = await fetch("/api/client/dashboard");
        const json = (await res.json()) as { error?: string } & Partial<DashboardData>;
        if (cancelled) return;
        if (res.status === 401) {
          router.push("/sign-in");
          return;
        }
        if (!res.ok) {
          setError(json.error ?? "Failed to load dashboard");
          setLoading(false);
          return;
        }
        const payload: DashboardData = {
          ...(json as DashboardData),
          upcomingBookings: json.upcomingBookings ?? [],
          pastBookings: json.pastBookings ?? [],
          playlistMap: json.playlistMap ?? {},
          recentOrders: json.recentOrders ?? [],
          recentNotifications: json.recentNotifications ?? [],
        };
        setData(payload);
        setActivePackage(json.package ?? null);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("lock:") || message.includes("Lock ") || message.includes("steal")) return;
        if (!cancelled) setError("Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const activeBooking = useMemo(() => {
    if (!data) return null;
    if (activeBookingId) {
      const found = [...data.upcomingBookings, ...data.pastBookings].find(
        (b) => b.event_id === activeBookingId,
      );
      return found ?? data.booking;
    }
    return data.booking;
  }, [data, activeBookingId]);

  useEffect(() => {
    if (!activeBooking?.package_name?.trim()) {
      setActivePackage(null);
      return;
    }
    const sameAsPrimary = activeBooking.event_id === data?.booking.event_id;
    if (sameAsPrimary && data?.package) {
      setActivePackage(data.package);
      return;
    }

    const ac = new AbortController();
    void (async () => {
      try {
        const res = await fetch(
          `/api/packages?name=${encodeURIComponent(activeBooking.package_name!.trim())}`,
          { signal: ac.signal },
        );
        const d = (await res.json()) as { packages?: PackageRow[] };
        if (!ac.signal.aborted) setActivePackage(d.packages?.[0] ?? null);
      } catch {
        if (!ac.signal.aborted) setActivePackage(null);
      }
    })();
    return () => ac.abort();
  }, [activeBooking, data?.booking?.event_id, data?.package]);

  const activePlaylist = useMemo(() => {
    if (!data || !activeBooking) return null;
    const fromMap = data.playlistMap[activeBooking.event_id];
    if (fromMap) return fromMap;
    if (activeBooking.event_id === data.booking.event_id && data.playlist) {
      return data.playlist as PlaylistMapRow;
    }
    return null;
  }, [data, activeBooking]);

  const activeDaysUntil = useMemo(() => {
    if (!activeBooking) return data?.daysUntilEvent ?? 0;
    return daysUntilEventDate(activeBooking.event_date);
  }, [activeBooking, data?.daysUntilEvent]);

  const copyEventId = useCallback(async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  if (loading) {
    return (
      <main className="relative z-[1] w-full min-w-0 pb-8 text-on-surface">
        <DashboardSkeleton />
      </main>
    );
  }

  if (error === "No booking found") {
    return (
      <main className="relative z-[1] flex min-h-[60vh] w-full min-w-0 items-center justify-center pb-8 text-on-surface">
        <div className={`mx-auto w-full max-w-[480px] text-center ${glass} px-8 py-12`}>
          <Handshake className="mx-auto size-14 text-on-surface-variant/50" strokeWidth={1.25} aria-hidden />
          <h2 className="mt-6 font-headline text-2xl font-semibold text-white">Welcome to Page KillerCutz</h2>
          <p className="mt-3 font-body text-sm leading-relaxed text-on-surface-variant">
            You don&apos;t have any bookings yet. Book Page KillerCutz for your next event to get started.
          </p>
          <button
            type="button"
            onClick={() => router.push("/booking")}
            className="mt-8 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#00BFFF] px-8 py-3.5 font-headline text-sm font-semibold text-black transition-all hover:brightness-110"
          >
            Book the DJ <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/merch")}
            className="mt-3 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-transparent px-8 py-3 font-headline text-sm font-medium text-on-surface-variant transition-colors hover:bg-white/[0.06]"
          >
            Browse Merch
          </button>
        </div>
      </main>
    );
  }

  if (error || !data || !activeBooking) {
    return (
      <main className="relative z-[1] w-full min-w-0 pb-8 text-on-surface">
        <p className="text-center font-body text-sm text-error">{error ?? "Something went wrong."}</p>
      </main>
    );
  }

  const firstName = data.booking.client_name?.trim().split(/\s+/)[0] ?? "there";
  const allActiveBookings = [...data.upcomingBookings];
  const showSwitcher = allActiveBookings.length > 1;

  const eventDataMap = data.eventDataMap ?? {};
  const bgUrl =
    eventDataMap[activeBooking.event_type]?.media_urls?.[0] ??
    data.eventData?.media_urls?.[0] ??
    null;

  const paid = activeBooking.payment_status === "paid";
  const mustPlay = jsonArrLen(activePlaylist?.must_play);
  const doNotPlay = jsonArrLen(activePlaylist?.do_not_play);
  const timeline = jsonArrLen(activePlaylist?.timeline);
  const hasPlaylist = activePlaylist !== null;
  const isLocked = activePlaylist?.locked === true;
  const pkg = activePackage;

  const amount =
    pkg?.price != null
      ? `GHS ${Number(pkg.price).toLocaleString()}`
      : activeBooking.package_name
        ? "—"
        : "—";

  const recentUpdates = data.recentNotifications.slice(0, 6);
  const upcomingN = data.upcomingBookings.length;
  const subline =
    upcomingN === 0
      ? "You have no upcoming events."
      : upcomingN === 1
        ? "You have 1 upcoming event."
        : `You have ${upcomingN} upcoming events.`;

  const playlistHref = `/client/playlist?eventId=${encodeURIComponent(activeBooking.event_id)}`;

  return (
    <main className="relative z-[1] w-full min-w-0 pb-8 text-on-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6">
        {/* Header */}
        <div className="col-span-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-headline text-[22px] font-semibold text-white">Welcome back, {firstName}</h1>
            <p className="mt-1 font-body text-sm text-[#A0A8C0]">{subline}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/booking")}
            className="inline-flex shrink-0 items-center justify-center gap-1 self-start rounded-full border border-[#00BFFF] bg-transparent px-4 py-2 font-headline text-sm font-medium text-[#00BFFF] transition-colors hover:bg-[rgba(0,191,255,0.08)]"
          >
            Book Again <span aria-hidden>→</span>
          </button>
        </div>

        {showSwitcher ? (
          <div
            className="col-span-12 flex max-w-full gap-2 overflow-x-auto pb-4"
            style={{ padding: "0 0 16px" }}
          >
            {allActiveBookings.map((b) => {
              const isActive = activeBooking.event_id === b.event_id;
              const label = truncatePillLabel(b.event_name?.trim() || b.event_type);
              const shortDate = formatShortEventDay(b.event_date);
              const dotClass =
                b.status === "confirmed"
                  ? "bg-[#00BFFF]"
                  : b.status === "pending"
                    ? "bg-[#F5A623]"
                    : "bg-on-surface-variant/40";
              return (
                <button
                  key={b.event_id}
                  type="button"
                  onClick={() => setActiveBookingId(b.event_id)}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 transition-all duration-150 ease-in-out"
                  style={
                    isActive
                      ? {
                          background: "rgba(0,191,255,0.12)",
                          border: "1px solid #00BFFF",
                          color: "white",
                        }
                      : {
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#A0A8C0",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "white";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "#A0A8C0";
                    }
                  }}
                >
                  <span className="text-base leading-none">{eventTypeEmoji(b.event_type)}</span>
                  <span className="font-headline text-[13px] font-medium leading-tight">{label}</span>
                  <span className="font-body text-xs text-on-surface-variant">
                    · {shortDate}
                  </span>
                  <span className={`inline-block h-1 w-1 shrink-0 rounded-full ${dotClass}`} aria-hidden />
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => router.push("/booking")}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-dashed border-[rgba(0,191,255,0.3)] bg-transparent px-4 py-2 font-headline text-sm font-medium text-[#00BFFF] transition-colors hover:bg-[rgba(0,191,255,0.06)]"
            >
              <Plus className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              Book Again →
            </button>
          </div>
        ) : null}

        {/* ROW 1 — Hero + Payment */}
        <div
          className={`group relative col-span-12 flex min-h-[320px] flex-col justify-end overflow-hidden lg:col-span-8 ${glass} border-0 p-8`}
        >
          <div className="absolute inset-0 z-0">
            {bgUrl ? (
              <>
                <Image
                  src={bgUrl}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover opacity-30 transition-transform duration-700 group-hover:scale-105"
                  unoptimized
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#13131a] via-[#13131a]/60 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#13131a] via-[#0a1620] to-[#13131a]" />
            )}
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant">Your Event</span>
              <span className="rounded bg-primary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-primary-container">
                {activeBooking.event_type}
              </span>
            </div>
            <h2 className="font-headline text-[22px] font-semibold leading-tight tracking-tight text-white">
              {heroTitle(activeBooking)}
            </h2>
            <div className="flex flex-wrap gap-6 text-sm font-medium text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">calendar_today</span>
                <span className="font-body">{formatEventDate(activeBooking.event_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                <span className="font-body">{activeBooking.venue}</span>
              </div>
              <button
                type="button"
                onClick={() => void copyEventId(activeBooking.event_id)}
                className="group/id flex items-center gap-2 font-mono text-[#00BFFF] transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-lg">fingerprint</span>
                <span>{activeBooking.event_id}</span>
                <span className="material-symbols-outlined text-sm text-on-surface-variant opacity-70 group-hover/id:opacity-100">
                  content_copy
                </span>
              </button>
            </div>
            {copied ? (
              <p className="font-body text-[11px] text-primary">Copied!</p>
            ) : null}
            <div className="pt-2">
              {!hasPlaylist && (
                <button
                  type="button"
                  onClick={() => router.push(playlistHref)}
                  style={{
                    width: "100%",
                    height: "52px",
                    background: "#00BFFF",
                    color: "#000000",
                    borderRadius: "999px",
                    border: "none",
                    fontFamily: "var(--font-headline), 'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: "15px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  Curate Your Playlist →
                </button>
              )}
              {hasPlaylist && !isLocked && (
                <button
                  type="button"
                  onClick={() => router.push(playlistHref)}
                  style={{
                    width: "100%",
                    height: "52px",
                    background: "transparent",
                    color: "#00BFFF",
                    borderRadius: "999px",
                    border: "1px solid #00BFFF",
                    fontFamily: "var(--font-headline), 'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: "15px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  ✎ Edit My Playlist →
                </button>
              )}
              {hasPlaylist && isLocked && (
                <button
                  type="button"
                  onClick={() => router.push(playlistHref)}
                  style={{
                    width: "100%",
                    height: "52px",
                    background: "rgba(255,255,255,0.05)",
                    color: "#A0A8C0",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.10)",
                    fontFamily: "var(--font-headline), 'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: "15px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  🔒 View My Playlist
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className={`col-span-12 flex min-w-0 flex-col justify-between overflow-hidden border-l-[3px] border-[#F5A623] lg:col-span-4 ${glass}`}
        >
          <div className="min-w-0 space-y-4">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 shrink text-xs uppercase tracking-widest text-on-surface-variant">
                Payment Status
              </span>
              {paid ? (
                <span className="shrink-0 rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                  Confirmed
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-[#F5A623]/30 bg-[#F5A623]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F5A623]">
                  Pending
                </span>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-on-surface-variant">Amount Due</p>
              <p className="min-w-0 break-words font-headline text-[28px] font-bold leading-tight text-[#F5A623]">
                {amount}
              </p>
            </div>
            <div className="min-w-0">
              <p className="font-headline text-[13px] font-semibold text-white">Payment Instructions</p>
              <p
                className="mt-2 font-body text-[12px] leading-snug text-on-surface-variant"
                style={{ overflowWrap: "break-word", wordBreak: "break-word" }}
              >
                Send your service fee via Mobile Money or bank transfer. Use your Event ID as the payment reference or
                narration. Your booking is confirmed once payment is received and verified.
              </p>
              <div className="mt-4 rounded-sm border border-outline-variant/10 bg-surface-container-highest/40 p-4">
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-on-surface-variant">DJ MoMo</span>
                  <span className="font-mono text-lg text-[#00BFFF]">{DJ_MOMO}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2 */}
        <div className={`col-span-12 flex h-[340px] min-w-0 flex-col md:col-span-4 lg:col-span-3 ${glass}`}>
          <h3 className="mb-6 font-headline text-lg font-semibold text-on-surface">Your Playlist</h3>
          <div className="flex flex-1 flex-col space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_#8fd6ff]" />
              <span className="text-sm font-medium text-on-surface">{mustPlay} Must-play songs</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-error shadow-[0_0_8px_#ffb4ab]" />
              <span className="text-sm font-medium text-on-surface">{doNotPlay} Do-not-play</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_8px_#ffb955]" />
              <span className="text-sm font-medium text-on-surface">{timeline} Timeline moments</span>
            </div>
          </div>
          <div className="mt-8 min-w-0">
            {!hasPlaylist && (
              <span
                role="button"
                tabIndex={0}
                onClick={() => router.push(playlistHref)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(playlistHref);
                  }
                }}
                style={{ color: "#00BFFF", cursor: "pointer", fontSize: "13px" }}
                className="font-body inline-block"
              >
                Start building your playlist →
              </span>
            )}
            {hasPlaylist && !isLocked && (
              <span
                role="button"
                tabIndex={0}
                onClick={() => router.push(playlistHref)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(playlistHref);
                  }
                }}
                style={{ color: "#00BFFF", cursor: "pointer", fontSize: "13px" }}
                className="font-body inline-block"
              >
                Edit Playlist →
              </span>
            )}
            {hasPlaylist && isLocked && (
              <span
                role="button"
                tabIndex={0}
                onClick={() => router.push(playlistHref)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(playlistHref);
                  }
                }}
                style={{ color: "#A0A8C0", cursor: "pointer", fontSize: "13px" }}
                className="font-body inline-block"
              >
                View Playlist (Locked)
              </span>
            )}
          </div>
        </div>

        <div
          className={`relative col-span-12 flex h-[340px] flex-col items-center justify-center md:col-span-4 lg:col-span-3 ${glass}`}
          style={{
            boxShadow:
              "0 0 0 1px rgba(0,191,255,0.20), 0 8px 32px rgba(0,191,255,0.08)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-primary/5 blur-3xl" />
          <div className="relative text-center">
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-on-surface-variant">
              Days Until Your Event
            </p>
            {activeDaysUntil < 0 ? (
              <p className="font-headline text-2xl font-semibold text-on-surface-variant">Event passed</p>
            ) : activeDaysUntil === 0 ? (
              <p className="font-headline text-[64px] font-bold leading-none text-[#00BFFF] drop-shadow-[0_0_15px_rgba(143,214,255,0.4)]">
                TODAY!
              </p>
            ) : (
              <>
                <p className="font-headline text-[64px] font-bold leading-none text-[#00BFFF] drop-shadow-[0_0_15px_rgba(143,214,255,0.4)]">
                  {activeDaysUntil}
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-[0.3em] text-on-surface-variant">days to go</p>
              </>
            )}
          </div>
        </div>

        <div className={`col-span-12 flex h-[340px] flex-col md:col-span-12 lg:col-span-6 ${glass}`}>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-lg font-semibold text-on-surface">Recent Updates</h3>
            <span className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-primary">View All</span>
          </div>
          <div className="updates-scrollbar flex-1 space-y-4 overflow-y-auto pr-1">
            {recentUpdates.length === 0 ? (
              <p className="font-body text-sm text-on-surface-variant">No updates yet.</p>
            ) : (
              recentUpdates.map((n) => (
                <div
                  key={n.id}
                  className="group flex items-center gap-4 rounded p-3 transition-colors hover:bg-surface-container-highest/30"
                >
                  <span
                    className={[
                      "material-symbols-outlined rounded p-2",
                      n.tone === "primary" ? "bg-primary/10 text-primary-container" : "bg-secondary/10 text-secondary",
                    ].join(" ")}
                  >
                    {n.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[13px] font-medium text-on-surface">{n.message}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                      {n.time}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100">
                    chevron_right
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ROW 3 — Package */}
        <div className={`col-span-12 overflow-hidden border-l-[3px] border-[#F5A623] ${glass}`}>
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F5A623]">Package</span>
                <h2 className="font-headline text-[18px] font-semibold text-white">
                  {pkg?.name ?? activeBooking.package_name ?? "—"}
                </h2>
              </div>
              {pkg?.inclusions?.length ? (
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  {pkg.inclusions.map((line) => (
                    <div key={line} className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-sm text-primary-container"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      <span className="text-sm text-on-surface-variant">{line}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-body text-sm text-on-surface-variant">
                  Package details will appear here when available.
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
                Included in your booking
              </span>
              <span className="font-headline text-[28px] font-bold text-[#F5A623]">
                {pkg?.price != null ? `GHS ${Number(pkg.price).toLocaleString()}` : "—"}
              </span>
              <Link
                href="/booking"
                className="mt-1 border-b border-primary/30 pb-0.5 text-[12px] font-bold uppercase text-primary transition-all hover:border-primary"
              >
                Details &amp; Contract
              </Link>
            </div>
          </div>
        </div>

        {data.recentOrders.length > 0 ? (
          <div className="col-span-12">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-headline text-[18px] font-semibold text-white">Recent Orders</h2>
              <button
                type="button"
                onClick={() => router.push("/client/orders")}
                className="font-headline text-[13px] font-medium text-[#00BFFF] transition-opacity hover:opacity-90"
              >
                View all →
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="min-w-[280px] shrink-0 rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4 backdrop-blur-[20px]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[12px] text-[#00BFFF]">{order.order_number}</span>
                    <span className="font-body text-[11px] text-[#A0A8C0]">
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 font-body text-[11px] text-on-surface-variant">
                    {order.items.map((it) => `${it.name} · ${it.size}`).join(" · ")}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="font-syne text-[15px] font-bold text-white">
                      GH₵{Number(order.total).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/track-order?id=${encodeURIComponent(order.order_number)}`)
                      }
                      className="shrink-0 font-headline text-[11px] font-medium text-[#00BFFF]"
                    >
                      Track →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {data.pastBookings.length > 0 ? (
          <div className="col-span-12">
            <button
              type="button"
              onClick={() => setPastExpanded((v) => !v)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-left transition-colors hover:bg-white/[0.05]"
            >
              <Clock className="size-4 shrink-0 text-on-surface-variant/60" strokeWidth={2} aria-hidden />
              <span className="font-headline text-sm font-medium text-on-surface-variant">Past Events</span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 font-body text-[11px] text-on-surface-variant">
                {data.pastBookings.length} event{data.pastBookings.length === 1 ? "" : "s"}
              </span>
              <ChevronDown
                className={`ml-auto size-4 shrink-0 text-on-surface-variant transition-transform ${pastExpanded ? "rotate-180" : ""}`}
                strokeWidth={2}
                aria-hidden
              />
            </button>
            {pastExpanded ? (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {data.pastBookings.map((b) => {
                  const hasPl = Boolean(data.playlistMap[b.event_id]);
                  const cancelled = b.status === "cancelled";
                  return (
                    <div
                      key={b.event_id}
                      className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 opacity-60 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-headline text-sm font-medium text-white/80">
                          <span className="mr-1.5">{eventTypeEmoji(b.event_type)}</span>
                          {heroTitle(b)}
                        </p>
                        <p className="mt-1 font-body text-xs text-on-surface-variant">{formatEventDate(b.event_date)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {cancelled ? (
                          <span className="rounded border border-red-500/40 bg-red-500/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-red-400">
                            Cancelled
                          </span>
                        ) : b.payment_status === "paid" ? (
                          <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                            Paid
                          </span>
                        ) : (
                          <span className="rounded-full border border-[#F5A623]/30 bg-[#F5A623]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F5A623]">
                            Unpaid
                          </span>
                        )}
                        {!cancelled && hasPl ? (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/client/playlist?eventId=${encodeURIComponent(b.event_id)}`)
                            }
                            className="font-body text-xs text-on-surface-variant underline-offset-2 transition-colors hover:text-[#00BFFF]"
                          >
                            View Playlist →
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
