"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Database } from "@/lib/database.types";
import { writeAuditLog } from "@/lib/writeAuditLog";
import { useAdminToast } from "@/hooks/useAdminToast";

type PlaylistRow = Database["public"]["Tables"]["playlists"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

function formatUpdated(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function formatEventDate(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function PlaylistsTab() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId");
  const { showToast, ToastComponent } = useAdminToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [bookingMap, setBookingMap] = useState<Record<string, BookingRow>>({});
  const [selected, setSelected] = useState<PlaylistRow | null>(null);
  const [filter, setFilter] = useState("All Playlists");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [pr, br] = await Promise.all([
          fetch("/api/playlists?limit=200").then((r) => r.json()),
          fetch("/api/bookings?limit=200").then((r) => r.json()),
        ]);
        const pl = (pr.playlists || []) as PlaylistRow[];
        const bookings = (br.bookings || []) as BookingRow[];
        const map = bookings.reduce<Record<string, BookingRow>>((acc, b) => {
          acc[b.event_id] = b;
          return acc;
        }, {});
        setPlaylists(pl);
        setBookingMap(map);
        if (pl[0]) setSelected(pl[0]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!eventIdParam) return;
    setSearch(eventIdParam);
  }, [eventIdParam]);

  useEffect(() => {
    if (!eventIdParam || playlists.length === 0) return;
    const matched = playlists.find((p) => p.event_id === eventIdParam);
    if (matched) {
      setSelected(matched);
      setDrawerOpen(true);
    }
  }, [eventIdParam, playlists]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return playlists.filter((p) => {
      const b = bookingMap[p.event_id];
      const matchesSearch =
        !q ||
        p.event_id.toLowerCase().includes(q) ||
        (b?.client_name || "").toLowerCase().includes(q) ||
        (b?.event_type || "").toLowerCase().includes(q);
      const matchesLock =
        filter === "All Playlists" ||
        (filter === "Locked" && p.locked) ||
        (filter === "Unlocked" && !p.locked);
      return matchesSearch && matchesLock;
    });
  }, [playlists, bookingMap, search, filter]);

  const handleLockToggle = async (playlist: PlaylistRow) => {
    const newLocked = !playlist.locked;
    setActionLoading(playlist.id);
    try {
      const res = await fetch(`/api/playlists/${encodeURIComponent(playlist.event_id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: newLocked }),
      });
      if (!res.ok) {
        showToast("Failed to update.", "error");
        return;
      }
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlist.id ? { ...p, locked: newLocked } : p)),
      );
      if (newLocked) {
        writeAuditLog("playlist", `Locked playlist for ${playlist.event_id}`, playlist.event_id);
        showToast("Playlist locked. Client notified.");
      } else {
        writeAuditLog("playlist", `Unlocked playlist for ${playlist.event_id}`, playlist.event_id);
        showToast("Playlist unlocked.");
      }
    } catch {
      showToast("Failed to update.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const sel = selected;

  return (
    <div className="min-h-screen relative flex">
      <ToastComponent />
      <div className="flex-1 p-8 pr-[512px]">
        <header className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h2 className="font-headline font-semibold text-[28px] text-white tracking-tight">Playlists</h2>
            <span className="bg-surface-container-highest/50 text-primary px-3 py-1 rounded-full font-label text-[11px] uppercase tracking-wider">
              {playlists.length} Playlist{playlists.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50 transition-all font-body"
                placeholder="Search playlists..."
                type="text"
              />
            </div>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm appearance-none pr-10 focus:ring-1 focus:ring-primary font-body text-on-surface-variant"
              >
                <option>All Playlists</option>
                <option>Unlocked</option>
                <option>Locked</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                expand_more
              </span>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          {loading ? (
            <p className="text-on-surface-variant text-sm">Loading playlists…</p>
          ) : (
            filtered.map((p) => {
              const b = bookingMap[p.event_id];
              const busy = actionLoading === p.id;
              return (
                <div
                  key={p.id}
                  className="glass-panel p-5 rounded-[16px] flex flex-col xl:flex-row xl:items-center justify-between border-l-4 border-primary transition-all duration-300 gap-4"
                >
                  <div className="flex flex-col gap-1.5 xl:w-1/4 min-w-0">
                    <span className="font-mono text-[13px] text-[#00BFFF] tracking-tight">{p.event_id}</span>
                    {b ? (
                      <>
                        <h3 className="text-base font-semibold text-white leading-snug">{b.client_name}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                            {b.event_type}
                          </span>
                          <span className="text-on-surface-variant text-[12px]">
                            {b.event_date ? formatEventDate(b.event_date) : "—"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-on-surface-variant font-mono break-all">{p.event_id}</p>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <div className="flex gap-2 flex-wrap items-center">
                      <span className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-on-surface-variant">
                        {p.must_play?.length ?? 0} Must-Play
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-on-surface-variant">
                        {p.do_not_play?.length ?? 0} Do-Not-Play
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-on-surface-variant">
                        {p.timeline?.length ?? 0} Moments
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(p.genres || []).slice(0, 4).map((g) => (
                        <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-on-surface-variant">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col xl:items-end gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase flex items-center gap-2 w-fit ${
                        p.locked ? "bg-error/20 text-error" : "bg-primary/20 text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{p.locked ? "lock" : "lock_open"}</span>
                      {p.locked ? "Locked" : "Unlocked"}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">Updated {formatUpdated(p.updated_at)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-primary hover:text-white text-sm font-semibold transition-colors px-3 py-2"
                        onClick={() => {
                          setSelected(p);
                          setDrawerOpen(true);
                        }}
                      >
                        View Full Playlist
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-container text-on-primary-container hover:bg-primary transition-colors disabled:opacity-40"
                        onClick={() => void handleLockToggle(p)}
                        title={p.locked ? "Unlock" : "Lock"}
                      >
                        <span className="material-symbols-outlined">{p.locked ? "lock_open" : "lock"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      {drawerOpen && sel && (
        <aside className="w-[480px] h-screen fixed right-0 top-0 glass-panel border-l border-white/10 flex flex-col z-[60] shadow-[-20px_0_50px_rgba(0,0,0,0.4)]">
          <div className="p-6 border-b border-white/5 flex items-start justify-between">
            <div>
              <span className="font-label text-xs text-primary mb-1 block font-mono">{sel.event_id}</span>
              <h2 className="font-headline text-2xl font-bold text-white leading-tight">
                {bookingMap[sel.event_id]?.client_name ?? "Playlist"}
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">{bookingMap[sel.event_id]?.event_type}</p>
            </div>
            <button
              type="button"
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              onClick={() => setDrawerOpen(false)}
            >
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <section>
              <h4 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] mb-4">Vibe</h4>
              {sel.vibe ? (
                <span className="bg-primary/10 text-primary text-[11px] px-3 py-1 rounded font-medium border border-primary/20">
                  {sel.vibe}
                </span>
              ) : (
                <span className="text-on-surface-variant text-sm">—</span>
              )}
            </section>
            <section>
              <h4 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] mb-4">Core Genres</h4>
              <div className="flex flex-wrap gap-2">
                {sel.genres.map((g) => (
                  <span key={g} className="bg-primary/10 text-primary text-[11px] px-3 py-1 rounded font-medium border border-primary/20">
                    {g}
                  </span>
                ))}
              </div>
            </section>
            <section>
              <h4 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] mb-4">Must-Play</h4>
              <ul className="space-y-2">
                {sel.must_play.map((s, i) => (
                  <li key={`${s.title}-${i}`} className="glass-panel p-3 rounded flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                      <span className="font-label text-primary text-xs">{String(i + 1).padStart(2, "0")}</span>
                      <p className="text-sm font-semibold text-white flex-1">{s.title}</p>
                    </div>
                    <p className="text-xs text-on-surface-variant pl-8">{s.artist}</p>
                    {s.note ? <p className="text-[11px] text-on-surface-variant/70 italic pl-8">{s.note}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h4 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] mb-4">Do-Not-Play</h4>
              <ul className="space-y-2">
                {sel.do_not_play.map((s, i) => (
                  <li key={`${s.title}-dn-${i}`} className="bg-error/5 p-3 rounded flex items-start gap-3">
                    <span className="material-symbols-outlined text-error text-sm">close</span>
                    <div>
                      <p className="text-sm font-medium text-white/80 line-through">{s.title}</p>
                      <p className="text-xs text-on-surface-variant">{s.artist}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h4 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] mb-4">Timeline</h4>
              <ul className="space-y-3">
                {sel.timeline.map((moment, i) => (
                  <li key={`${moment.moment}-${i}`} className="flex gap-3">
                    <span className="text-[10px] font-mono text-primary shrink-0 px-2 py-0.5 rounded bg-primary/10">
                      {moment.time ?? "—"}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{moment.moment}</p>
                      {moment.notes ? <p className="text-xs text-on-surface-variant mt-0.5">{moment.notes}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            {sel.extra_notes ? (
              <section>
                <h4 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] mb-2">Notes</h4>
                <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{sel.extra_notes}</p>
              </section>
            ) : null}
          </div>
        </aside>
      )}
    </div>
  );
}
