"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { mockPackages } from "@/lib/mockData";

export default function PackagesTab() {
  const [packages, setPackages] = useState(mockPackages);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing] = useState(mockPackages[0]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/packages?all=true");
        const json = (await res.json()) as { packages?: typeof mockPackages };
        if (json.packages) setPackages(json.packages);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="ml-[200px] min-h-screen p-10 relative">
      <header className="flex justify-between items-end mb-12">
        <div><h1 className="text-[28px] font-headline text-white leading-tight">DJ Packages</h1><p className="text-on-surface-variant text-sm mt-1">Configure and manage service tiers for artist bookings.</p></div>
        <button className="hardware-btn bg-primary text-on-primary px-6 py-2.5 text-sm font-bold flex items-center gap-2 rounded-sm shadow-[0_0_20px_rgba(143,214,255,0.3)]" onClick={() => setOpen(true)}><span className="material-symbols-outlined text-lg">add</span>Add New Package</button>
      </header>

      <div className="space-y-4">
        {(loading ? [] : packages).map((p) => (
          <div key={p.id} className="glass-card p-6 flex items-center gap-6 group hover:bg-white/[0.05] transition-colors border-l-2 border-transparent hover:border-primary">
            <div className="cursor-grab active:cursor-grabbing text-outline-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">drag_indicator</span></div>
            <div className="flex-grow grid grid-cols-12 items-center gap-8">
              <div className="col-span-3"><h3 className="text-lg font-headline text-white">{p.name}</h3><div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-mono text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5">ORD: {String(p.order).padStart(3, "0")}</span></div></div>
              <div className="col-span-2"><span className="text-2xl font-syne text-secondary tracking-tight">${p.price}</span><span className="block text-[10px] text-on-surface-variant uppercase">Per Event</span></div>
              <div className="col-span-4">
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {p.inclusions.map((i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-on-surface-variant"><span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>{i}</li>
                  ))}
                </ul>
              </div>
              <div className="col-span-3 flex items-center justify-end gap-6">
                <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${p.active ? "bg-primary-container animate-pulse shadow-[0_0_8px_#00bfff]" : "bg-outline-variant"}`} /><span className="text-[10px] font-bold text-primary uppercase tracking-widest">{p.active ? "Active" : "Inactive"}</span></div>
                <div className="flex items-center gap-3">
                  <Link href="/pricing" className="p-2 hover:bg-white/10 rounded-sm text-primary hover:text-white transition-colors text-[11px] font-bold uppercase tracking-widest">
                    Book This →
                  </Link>
                  <button className="p-2 hover:bg-white/10 rounded-sm text-on-surface-variant hover:text-white transition-colors" onClick={() => setOpen(true)}><span className="material-symbols-outlined text-[20px]">edit</span></button>
                  <button className="p-2 hover:bg-white/10 rounded-sm text-on-surface-variant hover:text-white transition-colors"><span className="material-symbols-outlined text-[20px]">{p.active ? "toggle_on" : "toggle_off"}</span></button>
                  <button className="p-2 hover:bg-error/10 rounded-sm text-error/60 hover:text-error transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-[560px] glass-card border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5"><h2 className="font-headline text-xl text-white">{editing ? "Edit Package" : "Create New Package"}</h2><button className="text-on-surface-variant hover:text-white" onClick={() => setOpen(false)}><span className="material-symbols-outlined">close</span></button></div>
            <form className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="block text-[10px] font-mono text-primary uppercase mb-2">Package Name</label><input className="w-full bg-surface-container border-none focus:ring-1 focus:ring-primary text-sm py-3 px-4 rounded-sm" defaultValue={editing?.name} /></div>
                <div><label className="block text-[10px] font-mono text-primary uppercase mb-2">Price (USD)</label><input className="w-full bg-surface-container border-none focus:ring-1 focus:ring-primary text-sm py-3 px-4 rounded-sm font-syne text-secondary" defaultValue={editing?.price} /></div>
                <div><label className="block text-[10px] font-mono text-primary uppercase mb-2">Display Order</label><input className="w-full bg-surface-container border-none focus:ring-1 focus:ring-primary text-sm py-3 px-4 rounded-sm font-mono" defaultValue={editing?.order} /></div>
              </div>
              <div className="pt-6 border-t border-white/5 flex gap-4 justify-end"><button className="px-6 py-2.5 text-xs font-bold text-on-surface-variant hover:text-white transition-colors" type="button" onClick={() => setOpen(false)}>CANCEL</button><button className="hardware-btn bg-primary text-on-primary px-8 py-2.5 text-xs font-black rounded-sm shadow-[0_0_15px_rgba(143,214,255,0.2)]" type="submit">SAVE PACKAGE</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
