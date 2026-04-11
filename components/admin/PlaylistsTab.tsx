"use client";

import { useEffect, useState } from "react";
import { mockPlaylists } from "@/lib/mockData";
import { useAdminStore } from "@/lib/store/adminStore";

export default function PlaylistsTab() {
  const { playlistEventIdFilter, setPlaylistEventIdFilter } = useAdminStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [playlists, setPlaylists] = useState(mockPlaylists);
  const [selected, setSelected] = useState(mockPlaylists[0]);
  const [filter, setFilter] = useState("All Playlists");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/playlists");
        const json = (await res.json()) as { playlists?: typeof mockPlaylists };
        if (json.playlists && json.playlists.length > 0) {
          setPlaylists(json.playlists);
          setSelected(json.playlists[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!playlistEventIdFilter) return;
    const matched = playlists.find((p) => p.id === playlistEventIdFilter);
    if (matched) {
      setSelected(matched);
      setDrawerOpen(true);
    }
    setPlaylistEventIdFilter(null);
  }, [playlistEventIdFilter, playlists, setPlaylistEventIdFilter]);

  return (
    <div className="min-h-screen relative flex">
      <div className="flex-1 p-8 pr-[512px]">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <h2 className="font-headline font-semibold text-[28px] text-white tracking-tight">Playlists</h2>
            <span className="bg-surface-container-highest/50 text-primary px-3 py-1 rounded-full font-label text-[11px] uppercase tracking-wider">28 playlists</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input className="bg-white/5 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50 transition-all font-body" placeholder="Search playlists..." type="text" />
            </div>
            <div className="relative">
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-white/5 border-none rounded-lg px-4 py-2 text-sm appearance-none pr-10 focus:ring-1 focus:ring-primary font-body text-on-surface-variant">
                <option>All Playlists</option>
                <option>Unlocked</option>
                <option>Locked</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          {(loading ? [] : playlists).map((p) => (
            <div key={p.id} className="glass-panel p-5 rounded-[16px] flex items-center justify-between border-l-4 border-primary transition-all duration-300">
              <div className="flex flex-col gap-1 w-1/4">
                <span className="font-label text-[13px] text-primary tracking-tighter">{p.id}</span>
                <h3 className="font-headline font-semibold text-lg text-white">{p.name}</h3>
                <div className="flex items-center gap-2"><span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">{p.type}</span><span className="text-on-surface-variant text-[12px] font-body">{p.date}</span></div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 border border-primary/20"><span className="w-1.5 h-1.5 rounded-full bg-primary" /><span className="text-[11px] font-semibold text-primary">5 MUST-PLAY</span></div>
                  <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 border border-error/20"><span className="w-1.5 h-1.5 rounded-full bg-error" /><span className="text-[11px] font-semibold text-error">2 DO-NOT-PLAY</span></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase flex items-center gap-2"><span className="material-symbols-outlined text-sm">lock_open</span>Unlocked</span>
                <div className="flex items-center gap-2">
                  <button className="text-primary hover:text-white text-sm font-semibold transition-colors px-3 py-2" onClick={() => { setSelected(p); setDrawerOpen(true); }}>View Full Playlist</button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-container text-on-primary-container hover:bg-primary transition-colors"><span className="material-symbols-outlined">lock</span></button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>

      {drawerOpen && (
        <aside className="w-[480px] h-screen fixed right-0 top-0 glass-panel border-l border-white/10 flex flex-col z-[60] shadow-[-20px_0_50px_rgba(0,0,0,0.4)]">
          <div className="p-6 border-b border-white/5 flex items-start justify-between">
            <div>
              <span className="font-label text-xs text-primary mb-1 block">{selected.id}</span>
              <h2 className="font-headline text-2xl font-bold text-white leading-tight">{selected.name}</h2>
            </div>
            <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors" onClick={() => setDrawerOpen(false)}>
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <section>
              <h4 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] mb-4">Core Genres</h4>
              <div className="flex flex-wrap gap-2">{selected.genres.map((g) => <span key={g} className="bg-primary/10 text-primary text-[11px] px-3 py-1 rounded font-medium border border-primary/20">{g}</span>)}</div>
            </section>
            <section>
              <h4 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] mb-4">Must-Play</h4>
              <ul className="space-y-2">{selected.mustPlay.map((s, i) => <li key={s} className="glass-panel p-3 rounded flex items-center gap-4"><span className="font-label text-primary text-xs">{String(i + 1).padStart(2, "0")}</span><p className="text-sm font-semibold text-white">{s}</p></li>)}</ul>
            </section>
            <section>
              <h4 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] mb-4">Do-Not-Play</h4>
              <ul className="space-y-2">{selected.dontPlay.map((s) => <li key={s} className="bg-error/5 p-3 rounded flex items-center gap-4"><span className="material-symbols-outlined text-error text-sm">close</span><p className="text-sm font-medium text-white/60 line-through">{s}</p></li>)}</ul>
            </section>
          </div>
        </aside>
      )}
    </div>
  );
}
