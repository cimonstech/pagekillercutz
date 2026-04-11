"use client";

import { useEffect, useState } from "react";
import { mockEvents } from "@/lib/mockData";

export default function EventsTab() {
  const [events, setEvents] = useState(mockEvents);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [editing] = useState(mockEvents[0]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/events");
        const json = (await res.json()) as { events?: typeof mockEvents };
        if (json.events) setEvents(json.events);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <main className="p-8 lg:p-12 relative z-10">
      <header className="flex justify-between items-center mb-12">
        <div><h2 className="text-3xl headline-font font-bold tracking-tight text-white">Events</h2><p className="text-on-surface-variant text-sm mt-1">Manage performances, club nights, and global tours.</p></div>
        <div className="flex items-center space-x-4"><button className="w-10 h-10 flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-sm text-on-surface"><span className="material-symbols-outlined text-xl">contrast</span></button><button className="bg-primary-container text-on-primary-container px-5 py-2.5 rounded-sm text-sm font-bold flex items-center space-x-2 active:scale-95 transition-transform" onClick={() => setPanelOpen(true)}><span className="material-symbols-outlined text-lg">add</span><span>Add New Event</span></button></div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {(loading ? [] : events).map((e) => (
              <div key={e.id} className="group relative bg-surface-container-low/40 backdrop-blur-md rounded-sm overflow-hidden transition-all hover:bg-surface-container-low/60 border border-white/5">
                <div className="h-[140px] relative overflow-hidden bg-surface-container" />
                <div className="p-5">
                  <h3 className="text-lg font-bold headline-font mb-1 truncate text-white">{e.title}</h3>
                  <div className="flex items-center text-on-surface-variant text-xs mb-4 mono-font uppercase tracking-tighter"><span>{e.type}</span><span className="mx-2">•</span><span>{e.date}</span></div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center space-x-1"><button className="p-2 text-on-surface-variant hover:text-primary transition-colors" onClick={() => setPanelOpen(true)}><span className="material-symbols-outlined text-lg">edit</span></button><button className="p-2 text-on-surface-variant hover:text-error transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button></div>
                    <div className="flex items-center space-x-2"><span className="text-[10px] font-bold text-on-surface-variant opacity-50 uppercase">Toggle Featured</span><div className={`w-8 h-4 rounded-full relative cursor-pointer ${e.featured ? "bg-secondary-container" : "bg-surface-variant"}`}><div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white ${e.featured ? "right-0.5" : "left-0.5"}`} /></div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {panelOpen && (
          <section className="w-full lg:w-[560px] flex-shrink-0">
            <div className="bg-surface-container-low/60 backdrop-blur-2xl border border-white/10 p-8 rounded-sm sticky top-8">
              <div className="flex items-center justify-between mb-8"><h3 className="text-xl font-bold headline-font text-white flex items-center"><span className="w-1 h-6 bg-primary mr-3" />Edit Event</h3><button onClick={() => setPanelOpen(false)}><span className="material-symbols-outlined text-on-surface-variant">close</span></button></div>
              <form className="space-y-6">
                <div className="h-[160px] border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center cursor-pointer group rounded-sm"><span className="material-symbols-outlined text-3xl text-outline group-hover:text-primary mb-2">cloud_upload</span><p className="text-xs text-on-surface-variant">Drop your event image here</p></div>
                <div className="space-y-4">
                  <input className="w-full bg-surface-container-highest border-none text-on-surface text-sm p-3 focus:ring-1 focus:ring-primary rounded-sm transition-all" defaultValue={editing.title} />
                  <div className="grid grid-cols-2 gap-4"><select className="w-full bg-surface-container-highest border-none text-on-surface text-sm p-3 focus:ring-1 focus:ring-primary rounded-sm transition-all"><option>{editing.type}</option></select><input className="w-full bg-surface-container-highest border-none text-on-surface text-sm p-3 focus:ring-1 focus:ring-primary rounded-sm transition-all" defaultValue="2024-08-12" type="date" /></div>
                  <div className="grid grid-cols-2 gap-4"><input className="w-full bg-surface-container-highest border-none text-on-surface text-sm p-3 focus:ring-1 focus:ring-primary rounded-sm transition-all" defaultValue="Tempelhof Field" /><input className="w-full bg-surface-container-highest border-none text-on-surface text-sm p-3 focus:ring-1 focus:ring-primary rounded-sm transition-all" defaultValue="Berlin, Germany" /></div>
                </div>
                <button className="w-full bg-primary-container text-on-primary-container font-black uppercase tracking-widest text-xs py-4 rounded-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(0,191,255,0.2)]" type="submit">Save Event</button>
              </form>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
