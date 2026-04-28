"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Info, Loader2, Lock, Pencil, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type { Database } from "@/lib/database.types";
import { normalizeCoverUrl } from "@/lib/coverUrl";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useStaffAdmin } from "@/hooks/useStaffAdmin";

type BookingsRow = Database["public"]["Tables"]["bookings"]["Row"];
type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];
type PlaylistSong = Database["public"]["Tables"]["playlists"]["Row"]["must_play"][number];
type TimelineMoment = Database["public"]["Tables"]["playlists"]["Row"]["timeline"][number];

/** Stored in playlist JSON — may include Deezer cover art */
type TrackRow = PlaylistSong & { coverUrl?: string };

type DeezerTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: number;
  previewUrl: string;
};

const glass = "rounded-[20px] border border-white/[0.08] bg-white/[0.05] p-6 backdrop-blur-[20px]";

const VIBE_OPTIONS = ["Chill", "High Energy", "Old School", "Late Night", "Soulful"] as const;

const VIBE_TOOLTIP_LINES: { name: string; desc: string }[] = [
  {
    name: "Chill",
    desc: "Smooth and relaxed background music. Perfect for dinners and lounges.",
  },
  {
    name: "High Energy",
    desc: "Full crowd-hyping mode. Loud, fast BPM, non-stop energy.",
  },
  {
    name: "Old School",
    desc: "Throwbacks and classics from the 80s, 90s, and 2000s.",
  },
  {
    name: "Late Night",
    desc: "After-party vibes. Darker, deeper, more intimate selections.",
  },
  {
    name: "Soulful",
    desc: "Emotional and meaningful tracks. Great for weddings and celebrations.",
  },
];

/** Event-night order: 06:00 → 23:30, then 00:00 → 05:30 (30-minute steps) */
const EVENT_TIME_OPTIONS: { value: string; ampm: string }[] = (() => {
  const out: { value: string; ampm: string }[] = [];
  const push = (totalMin: number) => {
    const h24 = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    const value = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const period = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 || 12;
    const ampm = `${h12}:${String(m).padStart(2, "0")} ${period}`;
    out.push({ value, ampm });
  };
  for (let t = 6 * 60; t < 24 * 60; t += 30) push(t);
  for (let t = 0; t <= 5 * 60 + 30; t += 30) push(t);
  return out;
})();

const PREDEFINED_GENRES = [
  "Afrobeats",
  "Highlife",
  "Amapiano",
  "Hip-Hop",
  "R&B",
  "Trap",
  "House",
  "Afro-soul",
  "Dancehall",
  "Reggae",
  "Gospel",
  "Old School",
  "Jazz",
  "Electronic",
  "Drill",
  "Pop",
  "Funk",
  "Neo-Soul",
] as const;

const PREDEFINED_GENRE_SET = new Set<string>(PREDEFINED_GENRES);

const plusCyanClass =
  "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#00BFFF]/30 bg-[rgba(0,191,255,0.12)] text-[20px] font-light leading-none text-[#00BFFF] transition-all duration-150 ease-in-out hover:border-[#00BFFF] hover:bg-[rgba(0,191,255,0.20)] disabled:cursor-not-allowed disabled:opacity-40";

const plusRedClass =
  "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[rgba(255,69,96,0.30)] bg-[rgba(255,69,96,0.12)] text-[20px] font-light leading-none text-[#FF4560] transition-all duration-150 ease-in-out hover:border-[#FF4560] hover:bg-[rgba(255,69,96,0.20)] disabled:cursor-not-allowed disabled:opacity-40";

/** Minutes since midnight for sorting; invalid/missing sorts last */
function timeSortKey(time?: string | null): number {
  const t = time?.trim();
  if (!t) return 24 * 60 + 999;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 24 * 60 + 998;
  const h = Math.min(23, Math.max(0, parseInt(m[1]!, 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2]!, 10)));
  return h * 60 + min;
}

function sortTimelineMoments(items: TimelineMoment[]): TimelineMoment[] {
  return [...items].sort((a, b) => timeSortKey(a.time) - timeSortKey(b.time));
}

function formatEventDate(iso: string): string {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Stable JSON for dirty detection vs last load/save */
function playlistStateSignature(
  genres: string[],
  vibe: string | null,
  mustPlay: TrackRow[],
  doNotPlay: TrackRow[],
  timeline: TimelineMoment[],
  notes: string,
) {
  return JSON.stringify({
    genres,
    vibe,
    must_play: mustPlay,
    do_not_play: doNotPlay,
    timeline,
    extra_notes: notes.trim() || null,
  });
}

function PlaylistSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className={`${glass} h-32`} />
      <div className={`${glass} h-40`} />
      <div className={`${glass} h-48`} />
      <div className={`${glass} h-48`} />
      <div className={`${glass} h-56`} />
      <div className={`${glass} h-32`} />
    </div>
  );
}

function InfoTooltip({ children, placement = "below" }: { children: ReactNode; placement?: "below" | "beside-right" }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 140) as number;
  }, [cancelClose]);

  const measure = useCallback(() => {
    const root = wrapRef.current;
    const btn = root?.querySelector("button");
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const pad = 8;
    const w = 300;
    let left = placement === "beside-right" ? r.right + pad : r.left;
    let top = placement === "beside-right" ? r.top : r.bottom + pad;
    if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
    if (top + 320 > window.innerHeight - 8) top = Math.max(8, r.top - 320 - pad);
    setCoords({ top, left });
  }, [placement]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => measure();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, measure]);

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            role="tooltip"
            className="fixed z-[100000] w-[min(300px,calc(100vw-16px))] max-h-[min(60vh,420px)] overflow-y-auto rounded-xl border border-white/[0.12] bg-[rgba(10,10,18,0.98)] p-3 text-left shadow-[0_24px_64px_rgba(0,0,0,0.65)] backdrop-blur-[24px]"
            style={{ top: coords.top, left: coords.left }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            {children}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={wrapRef}
        className="relative inline-flex"
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
          requestAnimationFrame(measure);
        }}
        onMouseLeave={scheduleClose}
        onFocus={() => {
          cancelClose();
          setOpen(true);
          requestAnimationFrame(measure);
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) scheduleClose();
        }}
      >
        <button
          type="button"
          className="rounded p-0.5 text-on-surface-variant/50 outline-none transition-colors hover:text-on-surface-variant focus-visible:ring-1 focus-visible:ring-primary-container"
          aria-label="More information"
          aria-expanded={open}
        >
          <Info className="size-3.5" strokeWidth={2} />
        </button>
      </div>
      {panel}
    </>
  );
}

function TimelineTimeDropdown({
  value,
  onChange,
  disabled,
  triggerRef,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) setOpen(false);
  }, [value]);

  useEffect(() => {
    if (!open || !wrapRef.current) return;
    const measure = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const panelMax = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < panelMax && spaceAbove > spaceBelow);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selectedAmpm = EVENT_TIME_OPTIONS.find((o) => o.value === value)?.ampm;

  return (
    <div ref={wrapRef} className="relative h-10 w-[130px] shrink-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between gap-1 rounded-sm border border-white/10 bg-surface-container-lowest px-2.5 text-left font-mono text-sm outline-none transition-colors focus:ring-1 focus:ring-primary-container disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={value ? "text-[#00BFFF]" : "text-on-surface-variant/40"}>{value || "21:00"}</span>
        {selectedAmpm ? <span className="max-w-[4.5rem] truncate font-body text-[10px] text-on-surface-variant/60">{selectedAmpm}</span> : null}
      </button>
      {open ? (
        <ul
          className={[
            "absolute left-0 z-[9999] max-h-[280px] min-w-[220px] overflow-y-auto rounded-md border border-white/[0.10] py-1 shadow-[0_16px_48px_rgba(0,0,0,0.60)] backdrop-blur-[20px]",
            openUpward ? "bottom-full mb-1" : "top-full mt-1",
          ].join(" ")}
          style={{ background: "rgba(12,12,20,0.96)" }}
          role="listbox"
        >
          {EVENT_TIME_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span className="font-mono text-sm text-[#00BFFF]">{opt.value}</span>
                <span className="shrink-0 font-body text-[11px] text-on-surface-variant/70">{opt.ampm}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StickySkeleton() {
  return (
    <div className={`${glass} animate-pulse p-8`}>
      <div className="mb-4 h-8 w-3/4 rounded bg-white/10" />
      <div className="mb-6 h-4 w-1/2 rounded bg-white/10" />
      <div className="mb-8 h-6 w-full rounded bg-white/10" />
      <div className="mb-8 grid grid-cols-3 gap-2">
        <div className="h-16 rounded bg-white/10" />
        <div className="h-16 rounded bg-white/10" />
        <div className="h-16 rounded bg-white/10" />
      </div>
      <div className="h-14 w-full rounded bg-primary-container/30" />
    </div>
  );
}

function useDeezerSearch(genreBias?: string[]) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DeezerTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<DeezerTrack | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const genreKey = genreBias?.length ? genreBias.join("|") : "";

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
        setShowDropdown(false);
        setSearching(false);
        return;
      }
      setSearching(true);
      const genreContext = (genreBias ?? []).slice(0, 2).join(" ");
      const biasedQuery = genreContext ? `${q} ${genreContext}` : q;
      void (async () => {
        try {
          const res = await fetch(`/api/music-search?q=${encodeURIComponent(biasedQuery)}`);
          const data = (await res.json()) as { results?: DeezerTrack[] };
          setResults(data.results || []);
          setShowDropdown(true);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 400);
    return () => clearTimeout(timer);
  }, [query, genreKey]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const reset = useCallback(() => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setSelected(null);
    setSearching(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    searching,
    showDropdown,
    setShowDropdown,
    selected,
    setSelected,
    ref,
    reset,
  };
}

function ClientPlaylistContent() {
  const router = useRouter();
  const { settings } = usePlatformSettings();

  const searchParams = useSearchParams();
  const { user } = useAuth();
  const staffAdmin = useStaffAdmin(user);

  useEffect(() => {
    if (staffAdmin) router.replace("/admin");
  }, [staffAdmin, router]);

  const [booking, setBooking] = useState<BookingsRow | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { settings: paymentSettings } = usePaymentSettings();
  const [saveError, setSaveError] = useState<string | null>(null);
  /** Brief highlight after a successful save (distinct from the persistent “synced” strip). */
  const [recentlySavedAt, setRecentlySavedAt] = useState<number | null>(null);
  /** Last known server-aligned snapshot; when current state matches, show synced UI. */
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  const [genres, setGenres] = useState<string[]>([]);
  const [vibe, setVibe] = useState<string | null>(null);
  const [mustPlay, setMustPlay] = useState<TrackRow[]>([]);
  const [doNotPlay, setDoNotPlay] = useState<TrackRow[]>([]);
  const [timeline, setTimeline] = useState<TimelineMoment[]>([]);
  const [notes, setNotes] = useState("");

  const [tlTime, setTlTime] = useState("");
  const [tlMoment, setTlMoment] = useState("");
  const [tlNotes, setTlNotes] = useState("");
  const tlTimeTriggerRef = useRef<HTMLButtonElement>(null);

  const [flashMustDup, setFlashMustDup] = useState<number | null>(null);
  const [flashDontDup, setFlashDontDup] = useState<number | null>(null);

  const mustSearch = useDeezerSearch(genres);
  const dontSearch = useDeezerSearch(undefined);

  const locked = playlist?.locked === true;

  useEffect(() => {
    if (staffAdmin) {
      setLoading(false);
      return;
    }
    const eventIdParam = searchParams.get("eventId")?.trim() ?? "";
    const stored =
      typeof window !== "undefined" ? sessionStorage.getItem("lastEventId") : null;
    const lastEventId = eventIdParam || stored;
    const url = lastEventId
      ? `/api/client/dashboard?eventId=${encodeURIComponent(lastEventId)}`
      : "/api/client/dashboard";

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d) => {
            throw new Error((d as { error?: string }).error || "Failed to load");
          });
        }
        return res.json() as Promise<{
          booking?: BookingsRow;
          playlist?: PlaylistRow | null;
        }>;
      })
      .then((data) => {
        if (data.booking) {
          setBooking(data.booking);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("lastEventId", data.booking.event_id);
          }
        }
        if (data.playlist) {
          const p = data.playlist;
          setGenres((p.genres || []).filter((g) => PREDEFINED_GENRE_SET.has(g)));
          setVibe(p.vibe ?? null);
          setMustPlay((p.must_play || []) as TrackRow[]);
          setDoNotPlay((p.do_not_play || []) as TrackRow[]);
          setTimeline(sortTimelineMoments(p.timeline || []));
          setNotes(p.extra_notes ?? "");
          setPlaylist(p);
        }
        setLoading(false);
      })
      .catch((e: unknown) => {
        setFetchError(e instanceof Error ? e.message : "Failed to load");
        setLoading(false);
      });
  }, [staffAdmin, searchParams]);

  useEffect(() => {
    if (staffAdmin || loading || !booking) return;
    setSavedSnapshot(playlistStateSignature(genres, vibe, mustPlay, doNotPlay, timeline, notes));
    // Intentionally not depending on genres/… — only re-baseline after load or event switch, not on each keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot matches server after fetch, not live edits
  }, [staffAdmin, loading, booking?.event_id]);

  useEffect(() => {
    if (staffAdmin) return;
    const id = searchParams.get("eventId")?.trim();
    if (!id) return;
    fetch(`/api/client/booking?eventId=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { booking?: BookingsRow } | null) => {
        if (body?.booking) setBooking(body.booking);
      })
      .catch(() => {});
  }, [staffAdmin, searchParams]);

  const handleSave = useCallback(async () => {
    if (!booking) return;
    setSaving(true);
    setSaveError(null);

    try {
      const eventId = booking.event_id;
      const method = playlist ? "PATCH" : "POST";
      const url = playlist ? `/api/playlists/${encodeURIComponent(eventId)}` : "/api/playlists";

      const body = {
        event_id: eventId,
        genres,
        vibe,
        must_play: mustPlay,
        do_not_play: doNotPlay,
        timeline,
        extra_notes: notes.trim() || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { playlist?: PlaylistRow; error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Failed to save playlist");
      }

      if (data.playlist) setPlaylist(data.playlist);

      const sig = playlistStateSignature(genres, vibe, mustPlay, doNotPlay, timeline, notes);
      setSavedSnapshot(sig);
      setRecentlySavedAt(Date.now());
      window.setTimeout(() => setRecentlySavedAt(null), 3200);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [booking, playlist, genres, vibe, mustPlay, doNotPlay, timeline, notes]);

  const eventTitle =
    booking?.event_name?.trim() ||
    booking?.event_type ||
    "Your Event";

  const isInSyncWithServer = useMemo(() => {
    if (savedSnapshot === null) return false;
    return playlistStateSignature(genres, vibe, mustPlay, doNotPlay, timeline, notes) === savedSnapshot;
  }, [savedSnapshot, genres, vibe, mustPlay, doNotPlay, timeline, notes]);

  const hasPlaylistContent = useMemo(() => {
    const hasVibe = Boolean((vibe ?? "").trim());
    const hasGenres = genres.length > 0;
    const hasTracks = mustPlay.length > 0 || doNotPlay.length > 0;
    const hasTimeline = timeline.length > 0;
    const hasNotes = Boolean((notes ?? "").trim());
    return hasVibe || hasGenres || hasTracks || hasTimeline || hasNotes;
  }, [vibe, genres, mustPlay, doNotPlay, timeline, notes]);

  const toggleGenre = (g: string) => {
    if (locked) return;
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const commitMustPlayFromDeezer = useCallback(
    (track: DeezerTrack) => {
      if (locked) return;
      const dupIndex = mustPlay.findIndex((t) => t.title === track.title && t.artist === track.artist);
      if (dupIndex >= 0) {
        setFlashMustDup(dupIndex);
        setTimeout(() => setFlashMustDup(null), 1500);
        return;
      }
      setMustPlay((prev) => [
        ...prev,
        {
          title: track.title,
          artist: track.artist,
          note: "",
          coverUrl: normalizeCoverUrl(track.coverUrl) ?? track.coverUrl,
        },
      ]);
      mustSearch.reset();
    },
    [locked, mustPlay, mustSearch.reset],
  );

  const commitDoNotPlayFromDeezer = useCallback(
    (track: DeezerTrack) => {
      if (locked) return;
      const dupIndex = doNotPlay.findIndex((t) => t.title === track.title && t.artist === track.artist);
      if (dupIndex >= 0) {
        setFlashDontDup(dupIndex);
        setTimeout(() => setFlashDontDup(null), 1500);
        return;
      }
      setDoNotPlay((prev) => [
        ...prev,
        {
          title: track.title,
          artist: track.artist,
          note: "",
          coverUrl: normalizeCoverUrl(track.coverUrl) ?? track.coverUrl,
        },
      ]);
      dontSearch.reset();
    },
    [locked, doNotPlay, dontSearch.reset],
  );

  const removeMustPlay = (i: number) => {
    if (locked) return;
    setMustPlay((prev) => prev.filter((_, idx) => idx !== i));
  };

  const removeDoNotPlay = (i: number) => {
    if (locked) return;
    setDoNotPlay((prev) => prev.filter((_, idx) => idx !== i));
  };

  const canAddTimeline = Boolean(tlTime.trim() && tlMoment.trim());

  const addTimelineRow = () => {
    const timeValue = tlTime.trim();
    const momentValue = tlMoment.trim();
    if (!timeValue || !momentValue) return;
    const notesValue = tlNotes.trim();
    setTimeline((prev) =>
      sortTimelineMoments([
        ...prev,
        {
          time: timeValue,
          moment: momentValue,
          notes: notesValue || undefined,
        },
      ]),
    );
    setTlTime("");
    setTlMoment("");
    setTlNotes("");
    requestAnimationFrame(() => tlTimeTriggerRef.current?.focus());
  };

  const editTimelineEntry = (i: number) => {
    if (locked) return;
    const row = timeline[i];
    if (!row) return;
    setTlTime(row.time?.trim() ?? "");
    setTlMoment(row.moment ?? "");
    setTlNotes(row.notes ?? "");
    setTimeline((prev) => prev.filter((_, idx) => idx !== i));
    requestAnimationFrame(() => tlTimeTriggerRef.current?.focus());
  };

  const removeTimeline = (i: number) => {
    if (locked) return;
    setTimeline((prev) => prev.filter((_, idx) => idx !== i));
  };

  if (staffAdmin) {
    return (
      <main className="relative z-[1] flex min-h-[40vh] w-full items-center justify-center pb-8 text-on-surface">
        <p className="font-body text-sm text-on-surface-variant">Redirecting…</p>
      </main>
    );
  }

  if (settings && !settings.playlist_portal_open) {
    return (
      <main className="relative z-[1] flex min-h-[40vh] w-full items-center justify-center pb-8 text-on-surface">
        <div style={{ textAlign: "center", padding: "80px 32px" }}>
          <Lock size={48} color="rgba(255,255,255,0.20)" />
          <h2 style={{ fontFamily: "Space Grotesk", color: "white", marginTop: "16px" }}>Playlist Portal Closed</h2>
          <p style={{ fontFamily: "Inter", color: "#A0A8C0" }}>
            The playlist portal is temporarily closed. Your playlist data is safe.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-[1] w-full min-w-0 pb-8 text-on-surface">
      <header className="sticky top-0 z-[95] -mx-8 mb-6 border-b border-white/[0.08] bg-[#08080F]/90 px-8 py-4 backdrop-blur-xl supports-[backdrop-filter]:bg-[#08080F]/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-headline text-2xl font-bold tracking-tight text-[#00BFFF]">Playlist Portal</h1>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              Curate your event playlist — changes sync to Page KillerCutz.
            </p>
          </div>
          <Link
            href="/client/dashboard"
            className="inline-flex shrink-0 items-center gap-2 rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2 font-headline text-xs font-semibold text-primary shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-colors hover:border-primary/30 hover:bg-primary/10"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to dashboard
          </Link>
        </div>
      </header>

      {fetchError ? (
        <div className="mb-6 rounded-sm border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {fetchError}
        </div>
      ) : null}

      <div>
        {!loading && !locked ? (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-white/10 bg-white/[0.03] px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">edit_note</span>
              <span className="font-body text-sm text-on-surface">You can edit your playlist until the DJ locks it before the event.</span>
            </div>
          </div>
        ) : null}

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 lg:grid-cols-[62%_38%]">
          <div className="relative order-2 flex flex-col gap-6 overflow-visible lg:order-1">
            {!loading && locked ? (
              <div className="w-full border-l-[3px] border-[#00BFFF] bg-white/[0.03] px-6 py-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined shrink-0 text-[#00BFFF]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    lock
                  </span>
                  <div>
                    <p className="font-headline text-sm font-medium text-on-surface">
                      Your playlist has been locked by Page KillerCutz.
                    </p>
                    <p className="mt-1 font-body text-[13px] text-on-surface-variant">Contact us if you need to make changes.</p>
                  </div>
                </div>
              </div>
            ) : null}
            {loading ? (
              <>
                <PlaylistSkeleton />
                <p className="text-center font-body text-sm text-on-surface-variant">Loading your playlist...</p>
              </>
            ) : (
              <>
                {/* Genres — z above must-play so Info tooltips aren’t covered */}
                <section className={`${glass} relative z-[54]`}>
                  {locked ? (
                    <span className="material-symbols-outlined absolute right-6 top-6 text-on-surface-variant/40">lock</span>
                  ) : null}
                  <div className="mb-4 flex items-center gap-2">
                    <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">Genres</label>
                    <InfoTooltip>
                      <p className="font-headline text-sm font-semibold text-white">What are genres for?</p>
                      <p className="mt-2 font-body text-xs leading-relaxed text-[#A0A8C0]">
                        Select the music styles you want at your event. The DJ uses these to guide song selection throughout the night.
                        Your choices also help filter music suggestions in the must-play search.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {["Afrobeats", "Highlife", "Amapiano"].map((g) => (
                          <span
                            key={g}
                            className="rounded-full border border-[#00BFFF] bg-[rgba(0,191,255,0.12)] px-2 py-0.5 font-headline text-[10px] font-semibold text-[#00BFFF]"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </InfoTooltip>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {locked && genres.length === 0 ? (
                      <span className="text-sm text-on-surface-variant/60">No genres selected.</span>
                    ) : null}
                    {PREDEFINED_GENRES.map((g) => {
                      const selected = genres.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          disabled={locked}
                          onClick={() => toggleGenre(g)}
                          className={[
                            "rounded-full border px-[14px] py-1.5 font-headline text-xs transition-all duration-150 ease-in-out",
                            locked ? "cursor-default" : "cursor-pointer select-none",
                            selected
                              ? "border-[#00BFFF] bg-[rgba(0,191,255,0.12)] font-semibold text-[#00BFFF]"
                              : "border-white/10 bg-white/[0.05] font-medium text-[#A0A8C0] hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white",
                            locked && !selected ? "hidden" : "",
                          ].join(" ")}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                  {genres.length > 0 ? (
                    <p className="mt-2 font-mono text-[10px] text-[#5A6080]">
                      {genres.length} genre{genres.length === 1 ? "" : "s"} selected
                    </p>
                  ) : null}
                </section>

                {/* Vibe */}
                <section className={`${glass} relative z-[55]`}>
                  {locked ? (
                    <span className="material-symbols-outlined absolute right-6 top-6 text-on-surface-variant/40">lock</span>
                  ) : null}
                  <div className="mb-4 flex items-center gap-2">
                    <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">Pulse Vibe</label>
                    <InfoTooltip placement="beside-right">
                      <p className="font-headline text-sm font-semibold text-white">What is Pulse Vibe?</p>
                      <p className="mt-2 font-body text-xs leading-relaxed text-[#A0A8C0]">
                        Tell Page KillerCutz the overall energy and feel you want for your event. This guides how the DJ reads the room — from song
                        selection to transitions and volume levels throughout the night.
                      </p>
                      <ul className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
                        {VIBE_TOOLTIP_LINES.map((line) => (
                          <li key={line.name} className="font-body text-xs leading-relaxed text-[#A0A8C0]">
                            <span className="font-semibold text-white">{line.name}</span>
                            {" — "}
                            {line.desc}
                          </li>
                        ))}
                      </ul>
                    </InfoTooltip>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {VIBE_OPTIONS.map((v) => {
                      const selected = (vibe || "").toLowerCase() === v.toLowerCase();
                      return (
                        <button
                          key={v}
                          type="button"
                          disabled={locked}
                          onClick={() => !locked && setVibe(v)}
                          className={[
                            "rounded-full border px-6 py-2 text-xs font-semibold transition-colors",
                            selected
                              ? "border-primary-container text-primary-container"
                              : "border-outline-variant/30 text-on-surface-variant/50",
                            locked ? "cursor-not-allowed opacity-80" : "",
                          ].join(" ")}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Must-play — keep above blacklist + timeline when dropdowns overlap */}
                <section className={`${glass} relative z-50 overflow-visible`}>
                  {locked ? (
                    <span className="material-symbols-outlined absolute right-6 top-6 text-on-surface-variant/40">lock</span>
                  ) : null}
                  <label className="mb-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">Must-Play Songs</label>

                  <div className="space-y-0">
                    {mustPlay.map((song, i) => (
                      <div
                        key={`${song.title}-${i}`}
                        className={[
                          "flex items-center gap-2.5 border-b border-white/[0.05] py-2.5",
                          flashMustDup === i ? "rounded-sm border border-[#00BFFF] px-2" : "",
                        ].join(" ")}
                      >
                        <span className="w-6 shrink-0 text-center font-mono text-xs text-[#00BFFF]">{String(i + 1).padStart(2, "0")}</span>
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-white/[0.06]">
                          {song.coverUrl ? (
                            <Image
                              src={normalizeCoverUrl(song.coverUrl) ?? song.coverUrl}
                              alt=""
                              width={32}
                              height={32}
                              unoptimized
                              referrerPolicy="no-referrer"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-headline text-[13px] font-medium text-white">{song.title}</p>
                          <p className="font-body text-xs text-[#A0A8C0]">{song.artist}</p>
                        </div>
                        {!locked ? (
                          <button
                            type="button"
                            className="shrink-0 text-[rgba(255,255,255,0.25)] hover:text-white"
                            onClick={() => removeMustPlay(i)}
                            aria-label="Remove"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {!locked ? (
                    <div ref={mustSearch.ref} className="relative z-[9999] mt-4">
                      <div className="flex items-center gap-2">
                        <div className="relative min-w-0 flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/50" aria-hidden />
                          <input
                            className="w-full rounded-sm border border-white/10 bg-surface-container-lowest py-2.5 pl-10 pr-10 text-sm text-on-surface outline-none ring-0 focus:ring-1 focus:ring-primary-container"
                            placeholder="Search song or artist…"
                            value={mustSearch.query}
                            onChange={(e) => mustSearch.setQuery(e.target.value)}
                            onFocus={() => {
                              if (mustSearch.results.length > 0) mustSearch.setShowDropdown(true);
                            }}
                          />
                          {mustSearch.searching ? (
                            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-on-surface-variant/60" />
                          ) : null}
                        </div>
                        <button
                          type="button"
                          disabled={!mustSearch.selected}
                          className={plusCyanClass}
                          title="Add selected track"
                          onClick={() => {
                            if (mustSearch.selected) commitMustPlayFromDeezer(mustSearch.selected);
                          }}
                        >
                          +
                        </button>
                      </div>
                      {genres.length > 0 ? (
                        <p className="mt-2 font-mono text-[10px] italic text-[#5A6080]">
                          Results filtered by: {genres.join(" · ")}
                        </p>
                      ) : null}

                      {mustSearch.showDropdown && (mustSearch.searching || mustSearch.results.length > 0 || mustSearch.query.trim().length >= 2) ? (
                        <div
                          className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-[320px] overflow-y-auto rounded-[12px] border border-white/[0.10] p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.60)] backdrop-blur-[20px]"
                          style={{ background: "rgba(12,12,20,0.96)" }}
                        >
                          {mustSearch.searching ? (
                            <div className="space-y-2 p-2">
                              {[1, 2, 3].map((k) => (
                                <div key={k} className="flex animate-pulse gap-2.5 rounded-lg p-2">
                                  <div className="size-9 rounded-md bg-white/10" />
                                  <div className="flex-1 space-y-2">
                                    <div className="h-3 w-3/4 rounded bg-white/10" />
                                    <div className="h-2 w-1/2 rounded bg-white/10" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : mustSearch.results.length === 0 ? (
                            <p className="px-4 py-4 text-center font-body text-[13px] text-[#5A6080]">
                              No results for &ldquo;{mustSearch.query.trim()}&rdquo;
                            </p>
                          ) : (
                            mustSearch.results.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  mustSearch.setSelected(r);
                                }}
                                className={[
                                  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                                  mustSearch.selected?.id === r.id ? "bg-white/[0.08]" : "hover:bg-white/[0.06]",
                                ].join(" ")}
                              >
                                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-white/[0.06]">
                                  {r.coverUrl ? (
                                    <Image
                                      src={normalizeCoverUrl(r.coverUrl) ?? r.coverUrl}
                                      alt=""
                                      width={36}
                                      height={36}
                                      unoptimized
                                      referrerPolicy="no-referrer"
                                      className="object-cover"
                                    />
                                  ) : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-headline text-sm font-medium text-white">{r.title}</p>
                                  <p className="truncate font-body text-xs text-[#A0A8C0]">{r.artist}</p>
                                  <p className="truncate font-body text-[11px] text-[#5A6080]">{r.album}</p>
                                </div>
                                <span className="shrink-0 font-mono text-[11px] text-[#5A6080]">{formatDuration(r.duration)}</span>
                              </button>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </section>

                {/* Do-not-play — above Event Timeline so search dropdown isn’t covered */}
                <section className={`${glass} relative z-40 overflow-visible`}>
                  {locked ? (
                    <span className="material-symbols-outlined absolute right-6 top-6 text-on-surface-variant/40">lock</span>
                  ) : null}
                  <label className="mb-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-error">Do-Not-Play (Blacklist)</label>

                  <div className="space-y-0">
                    {doNotPlay.map((song, i) => (
                      <div
                        key={`${song.title}-dn-${i}`}
                        className={[
                          "flex items-center gap-2.5 border-b border-white/[0.05] bg-[rgba(255,69,96,0.04)] py-2.5",
                          flashDontDup === i ? "rounded-sm border border-[#FF4560] px-2" : "",
                        ].join(" ")}
                      >
                        <span className="w-6 shrink-0 text-center font-mono text-xs text-[#FF4560]">{String(i + 1).padStart(2, "0")}</span>
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-white/[0.06]">
                          {song.coverUrl ? (
                            <Image
                              src={normalizeCoverUrl(song.coverUrl) ?? song.coverUrl}
                              alt=""
                              width={32}
                              height={32}
                              unoptimized
                              referrerPolicy="no-referrer"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-headline text-[13px] font-medium text-on-surface/80 line-through">{song.title}</p>
                          <p className="font-body text-xs text-[#A0A8C0]">{song.artist}</p>
                        </div>
                        {!locked ? (
                          <button
                            type="button"
                            className="shrink-0 text-[rgba(255,255,255,0.25)] hover:text-[#FF4560]"
                            onClick={() => removeDoNotPlay(i)}
                            aria-label="Remove"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {!locked ? (
                    <div ref={dontSearch.ref} className="relative z-[9999] mt-4">
                      <div className="flex items-center gap-2">
                        <div className="relative min-w-0 flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/50" aria-hidden />
                          <input
                            className="w-full rounded-sm border border-error/20 bg-surface-container-lowest py-2.5 pl-10 pr-10 text-sm text-on-surface outline-none ring-0 focus:ring-1 focus:ring-error"
                            placeholder="Search song or artist…"
                            value={dontSearch.query}
                            onChange={(e) => dontSearch.setQuery(e.target.value)}
                            onFocus={() => {
                              if (dontSearch.results.length > 0) dontSearch.setShowDropdown(true);
                            }}
                          />
                          {dontSearch.searching ? (
                            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-on-surface-variant/60" />
                          ) : null}
                        </div>
                        <button
                          type="button"
                          disabled={!dontSearch.selected}
                          className={plusRedClass}
                          title="Add selected track"
                          onClick={() => {
                            if (dontSearch.selected) commitDoNotPlayFromDeezer(dontSearch.selected);
                          }}
                        >
                          +
                        </button>
                      </div>

                      {dontSearch.showDropdown && (dontSearch.searching || dontSearch.results.length > 0 || dontSearch.query.trim().length >= 2) ? (
                        <div
                          className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-[320px] overflow-y-auto rounded-[12px] border border-white/[0.10] p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.60)] backdrop-blur-[20px]"
                          style={{ background: "rgba(12,12,20,0.96)" }}
                        >
                          {dontSearch.searching ? (
                            <div className="space-y-2 p-2">
                              {[1, 2, 3].map((k) => (
                                <div key={k} className="flex animate-pulse gap-2.5 rounded-lg p-2">
                                  <div className="size-9 rounded-md bg-white/10" />
                                  <div className="flex-1 space-y-2">
                                    <div className="h-3 w-3/4 rounded bg-white/10" />
                                    <div className="h-2 w-1/2 rounded bg-white/10" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : dontSearch.results.length === 0 ? (
                            <p className="px-4 py-4 text-center font-body text-[13px] text-[#5A6080]">
                              No results for &ldquo;{dontSearch.query.trim()}&rdquo;
                            </p>
                          ) : (
                            dontSearch.results.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => dontSearch.setSelected(r)}
                                className={[
                                  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                                  dontSearch.selected?.id === r.id ? "bg-white/[0.08]" : "hover:bg-white/[0.06]",
                                ].join(" ")}
                              >
                                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-white/[0.06]">
                                  {r.coverUrl ? (
                                    <Image
                                      src={normalizeCoverUrl(r.coverUrl) ?? r.coverUrl}
                                      alt=""
                                      width={36}
                                      height={36}
                                      unoptimized
                                      referrerPolicy="no-referrer"
                                      className="object-cover"
                                    />
                                  ) : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-headline text-sm font-medium text-white">{r.title}</p>
                                  <p className="truncate font-body text-xs text-[#A0A8C0]">{r.artist}</p>
                                  <p className="truncate font-body text-[11px] text-[#5A6080]">{r.album}</p>
                                </div>
                                <span className="shrink-0 font-mono text-[11px] text-[#5A6080]">{formatDuration(r.duration)}</span>
                              </button>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </section>

                {/* Timeline — below must-play + blacklist stacking so time picker doesn’t paint over them */}
                <section className={`${glass} relative z-30`}>
                  {locked ? (
                    <span className="material-symbols-outlined absolute right-6 top-6 text-on-surface-variant/40">lock</span>
                  ) : null}
                  <label className="mb-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">Event Timeline</label>

                  {!locked ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <TimelineTimeDropdown
                        value={tlTime}
                        onChange={setTlTime}
                        disabled={locked}
                        triggerRef={tlTimeTriggerRef}
                      />
                      <input
                        type="text"
                        autoComplete="off"
                        className="h-10 min-w-[140px] flex-1 rounded-sm border border-white/10 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary-container"
                        placeholder="e.g. Grand Entrance"
                        value={tlMoment}
                        onChange={(e) => setTlMoment(e.target.value)}
                      />
                      <input
                        type="text"
                        autoComplete="off"
                        className="h-10 min-w-[160px] flex-[1.5] rounded-sm border border-white/10 bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary-container"
                        placeholder="e.g. Play something slow and smooth"
                        value={tlNotes}
                        onChange={(e) => setTlNotes(e.target.value)}
                      />
                      <button
                        type="button"
                        disabled={!canAddTimeline}
                        className={plusCyanClass}
                        title="Add moment"
                        onClick={addTimelineRow}
                      >
                        +
                      </button>
                    </div>
                  ) : null}

                  {!locked && timeline.length === 0 ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-4">
                      <span className="font-mono text-[10px] text-on-surface-variant/50">e.g.</span>
                      <span className="rounded-md border border-[#00BFFF]/25 bg-[rgba(0,191,255,0.12)] px-2 py-0.5 font-mono text-xs text-[#00BFFF]">
                        21:00
                      </span>
                      <span className="font-body text-xs text-on-surface-variant/70">Grand Entrance</span>
                      <span className="font-body text-xs text-on-surface-variant/50">Switch to high energy Afrobeats</span>
                      <ArrowRight className="size-3.5 shrink-0 text-on-surface-variant/40" aria-hidden />
                    </div>
                  ) : null}

                  {timeline.length > 0 ? (
                    <div className="mt-6 space-y-0">
                      {timeline.map((row, i) => (
                        <div
                          key={`${row.time}-${row.moment}-${i}`}
                          className="flex items-start gap-3 border-b border-white/[0.05] py-3"
                        >
                          <span className="min-w-[64px] shrink-0 rounded-md border border-[#00BFFF]/25 bg-[rgba(0,191,255,0.12)] px-2.5 py-1 text-center font-mono text-[13px] text-[#00BFFF]">
                            {row.time ?? "—"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-headline text-sm font-semibold text-white">{row.moment}</p>
                            {row.notes ? (
                              <p className="mt-0.5 font-body text-xs leading-relaxed text-[#A0A8C0]">{row.notes}</p>
                            ) : null}
                          </div>
                          {!locked ? (
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                className="rounded p-1 text-on-surface-variant/45 transition-colors hover:text-primary-container"
                                aria-label="Edit moment"
                                onClick={() => editTimelineEntry(i)}
                              >
                                <Pencil className="size-3.5" strokeWidth={2} />
                              </button>
                              <button
                                type="button"
                                className="rounded p-1 text-on-surface-variant/45 transition-colors hover:text-[#FF4560]"
                                aria-label="Remove moment"
                                onClick={() => removeTimeline(i)}
                              >
                                <X className="size-3.5" strokeWidth={2} />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-col items-center px-4 py-8 text-center">
                      <Clock className="mb-3 size-6 text-on-surface-variant/35" strokeWidth={1.5} aria-hidden />
                      <p className="font-body text-[13px] text-on-surface-variant/70">No timeline moments yet.</p>
                      <p className="mt-2 max-w-md font-body text-xs leading-relaxed text-[#5A6080]">
                        Add key moments like First Dance, Cake Cutting, or Grand Entrance.
                      </p>
                    </div>
                  )}
                </section>

                {/* Notes */}
                <section className={`${glass} relative`}>
                  {locked ? (
                    <span className="material-symbols-outlined absolute right-6 top-6 text-on-surface-variant/40">lock</span>
                  ) : null}
                  <label className="mb-4 block font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">Additional Instructions</label>
                  <textarea
                    className="custom-scrollbar w-full rounded-sm border-none bg-surface-container-lowest p-4 text-sm text-on-surface outline-none ring-0 focus:ring-1 focus:ring-primary-container disabled:opacity-60"
                    disabled={locked}
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes for the DJ…"
                  />
                </section>
              </>
            )}
          </div>

          {/* Summary: first on mobile so sticky event bar + save are reachable; sticky on lg */}
          <aside className="order-1 self-start lg:order-2 lg:sticky lg:top-6 lg:z-10">
            {loading ? (
              <StickySkeleton />
            ) : booking ? (
              <>
                <div className="sticky top-0 z-[90] mb-4 flex items-start justify-between gap-3 rounded-2xl border border-white/[0.10] bg-[#0a0a14]/95 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:hidden">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-headline text-base font-semibold leading-tight text-white">{eventTitle}</p>
                    <p className="mt-1 font-mono text-[10px] text-[#00BFFF]">{booking.event_id}</p>
                  </div>
                  <span className="shrink-0 rounded-sm border border-secondary/25 bg-secondary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-secondary">
                    {booking.event_type}
                  </span>
                </div>
                <div className={`${glass} relative overflow-hidden border-white/10 p-8 shadow-2xl`}>
                <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 bg-primary/10 blur-[100px]" />
                <div className="relative z-10">
                  <div className="mb-6 hidden flex-wrap items-start justify-between gap-3 lg:flex">
                    <div>
                      <h2 className="mb-1 font-headline text-3xl font-semibold tracking-tight text-on-surface">{eventTitle}</h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-sm border border-secondary/20 bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                          {booking.event_type}
                        </span>
                        <span className="text-xs text-on-surface-variant">{formatEventDate(booking.event_date)}</span>
                      </div>
                    </div>
                    <span className="rounded-sm bg-primary-container/10 px-2 py-1 font-mono text-[10px] text-[#00BFFF]">
                      {booking.event_id}
                    </span>
                  </div>
                  <div className="mb-8 flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span className="text-sm">{booking.venue}</span>
                  </div>
                  <div className="mb-8 grid grid-cols-3 gap-2">
                    <div className="rounded-sm border border-white/5 bg-surface-container-low p-3 text-center">
                      <p className="font-mono text-xl font-bold text-primary-container">{mustPlay.length}</p>
                      <p className="mt-1 font-mono text-[8px] uppercase tracking-widest text-on-surface-variant">Must-Play</p>
                    </div>
                    <div className="rounded-sm border border-white/5 bg-surface-container-low p-3 text-center">
                      <p className="font-mono text-xl font-bold text-error">{doNotPlay.length}</p>
                      <p className="mt-1 font-mono text-[8px] uppercase tracking-widest text-on-surface-variant">Skip</p>
                    </div>
                    <div className="rounded-sm border border-white/5 bg-surface-container-low p-3 text-center">
                      <p className="font-mono text-xl font-bold text-secondary">{timeline.length}</p>
                      <p className="mt-1 font-mono text-[8px] uppercase tracking-widest text-on-surface-variant">Moments</p>
                    </div>
                  </div>
                  <div className="mb-8 border-y border-white/5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {booking.payment_status === "paid" ? (
                        <>
                          <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-green-500">Payment confirmed</span>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">Payment pending</span>
                        </>
                      )}
                    </div>
                    {booking.payment_status === "unpaid" ? (
                      <div className="mt-3 space-y-1">
                        <p className="font-body text-[11px] leading-relaxed text-on-surface-variant">
                          Send payment via MoMo using your Event ID as reference.
                        </p>
                        <p className="font-mono text-xs text-[#00BFFF]">
                          {paymentSettings?.momo_number
                            ? `${paymentSettings.momo_network} ${paymentSettings.momo_number}`
                            : "Payment details available in your dashboard"}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {locked ? (
                    <div className="flex w-full items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/[0.04] py-4 font-headline text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                      <span className="material-symbols-outlined text-base">lock</span>
                      Playlist Locked
                    </div>
                  ) : (
                    <>
                      {isInSyncWithServer && hasPlaylistContent && !saving ? (
                        <div
                          className={[
                            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border px-4 py-5 text-center transition-[box-shadow,transform] duration-300",
                            recentlySavedAt
                              ? "border-emerald-400/50 bg-emerald-950/50 shadow-[0_0_32px_rgba(52,211,153,0.2)]"
                              : "border-emerald-500/25 bg-emerald-950/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                          ].join(" ")}
                        >
                          <span className="material-symbols-outlined text-3xl text-emerald-400/90" style={{ fontVariationSettings: "'FILL' 1" }}>
                            cloud_done
                          </span>
                          <div>
                            <p className="font-headline text-sm font-bold uppercase tracking-[0.2em] text-emerald-100/95">Playlist saved</p>
                            <p className="mt-1 font-body text-xs leading-relaxed text-emerald-200/70">
                              In sync with Page KillerCutz — edit anytime, then save again to update.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={saving || !booking}
                          onClick={() => void handleSave()}
                          className={[
                            "flex w-full items-center justify-center gap-2 rounded-xl py-4 font-headline text-lg font-bold uppercase tracking-widest transition-transform active:scale-[0.98]",
                            saving
                              ? "cursor-not-allowed bg-primary-container/40 text-on-primary-container opacity-70"
                              : "bg-primary-container text-on-primary-container shadow-[0_0_24px_rgba(0,191,255,0.35)] hover:shadow-[0_0_32px_rgba(0,191,255,0.45)]",
                          ].join(" ")}
                        >
                          {saving ? (
                            <>
                              <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                              Saving…
                            </>
                          ) : (
                            "Save playlist"
                          )}
                        </button>
                      )}
                      {saveError ? (
                        <p className="mt-3 text-center font-body text-xs text-error">{saveError}</p>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
              </>
            ) : (
              <div className={`${glass} p-8 text-sm text-on-surface-variant`}>No booking data.</div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function ClientPlaylistPage() {
  return (
    <Suspense
      fallback={
        <main className="relative z-[1] w-full min-w-0 pb-8 text-on-surface">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <PlaylistSkeleton />
          </div>
        </main>
      }
    >
      <ClientPlaylistContent />
    </Suspense>
  );
}
