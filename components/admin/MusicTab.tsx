"use client";

import { useEffect, useState } from "react";
import { mockMusic } from "@/lib/mockData";

export default function MusicTab() {
  const [type, setType] = useState("Album");
  const [libTab, setLibTab] = useState("All");
  const [music, setMusic] = useState(mockMusic);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/music");
        const json = (await res.json()) as { music?: Array<{ id: string; title: string; type: string }> };
        if (json.music) setMusic(json.music.map((m) => ({ id: m.id, title: m.title, type: m.type })));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <main className="min-h-screen p-10">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-headline font-semibold text-white leading-none">Music Library</h1>
          <p className="text-on-surface-variant text-sm mt-2">Manage catalogs, release schedules, and multi-format uploads.</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <section className="w-full lg:w-[55%] space-y-8">
          <div className="glass p-8 rounded-sm border border-white/5">
            <h2 className="text-xl font-headline text-white mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">cloud_upload</span>Upload New Release</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-4 gap-2">
                {["Album", "Single", "Mix", "Video"].map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)} className={`py-3 px-1 border text-[10px] font-bold uppercase tracking-widest rounded-sm ${type === t ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant hover:border-primary/50"}`}>{t}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Release Title</label><input className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm p-3 text-white" placeholder="e.g. Midnight Pulse" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Genre</label><select className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm p-3 text-on-surface-variant"><option>Afro-Fusion</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[140px] border-2 border-dashed border-outline-variant rounded-sm flex flex-col items-center justify-center gap-2 hover:border-primary/50 cursor-pointer transition-colors group"><span className="material-symbols-outlined text-3xl text-outline group-hover:text-primary">audio_file</span><p className="text-xs font-bold text-white">Audio Drop Zone</p></div>
                <div className="h-[140px] border-2 border-dashed border-outline-variant rounded-sm flex flex-col items-center justify-center gap-2 hover:border-primary/50 cursor-pointer transition-colors group"><span className="material-symbols-outlined text-3xl text-outline group-hover:text-primary">image</span><p className="text-xs font-bold text-white">Cover Drop Zone</p></div>
              </div>
              {type === "Album" && (
                <div className="bg-surface-container-lowest p-5 rounded-sm space-y-4">
                  <div className="flex justify-between items-center"><h3 className="text-xs font-bold uppercase tracking-widest text-primary">Tracklist Builder</h3><button className="text-[10px] font-bold text-white bg-white/5 px-3 py-1" type="button">ADD TRACK</button></div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 bg-surface p-3 rounded-sm"><span className="font-mono text-[10px] text-on-surface-variant">01</span><span className="flex-grow text-xs text-white">Neon Horizon.wav</span><span className="font-mono text-[10px] text-on-surface-variant">04:22</span></div>
                  </div>
                </div>
              )}
              <button className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 font-bold uppercase tracking-widest text-sm rounded-sm active-glow transition-all">Finalize and Publish Release</button>
            </form>
          </div>
        </section>

        <section className="w-full lg:w-[45%] space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-headline text-white">Existing Releases</h2>
            <div className="flex gap-2">
              {["All", "Albums", "Singles", "Mixes", "Videos"].map((t) => (
                <button key={t} onClick={() => setLibTab(t)} className={`text-[10px] font-bold px-3 py-1 ${libTab === t ? "text-primary border border-primary/20 bg-primary/5" : "text-on-surface-variant hover:text-white"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {(loading ? [] : music).map((m) => (
              <div key={m.id} className="group relative flex items-center gap-4 p-4 bg-surface-container-low hover:bg-surface-container-highest transition-all duration-300">
                <div className="w-16 h-16 bg-surface flex-shrink-0 overflow-hidden rounded-sm" />
                <div className="flex-grow"><div className="flex items-center gap-2"><span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-primary/20 text-primary rounded-[2px] tracking-tighter">{m.type}</span><h4 className="text-sm font-semibold text-white">{m.title}</h4></div></div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-on-surface rounded-sm"><span className="material-symbols-outlined text-lg">edit</span></button><button className="w-8 h-8 flex items-center justify-center bg-error/10 hover:bg-error/20 text-error rounded-sm"><span className="material-symbols-outlined text-lg">delete</span></button></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
