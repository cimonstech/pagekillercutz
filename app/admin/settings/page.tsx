"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SuperAdminSettingsPage() {
  const router = useRouter();
  const [accessOk, setAccessOk] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("adminRole");
    if (stored !== "super_admin") {
      router.replace("/admin");
      return;
    }
    setAccessOk(true);
  }, [router]);

  const [showSmsKey, setShowSmsKey] = useState(false);
  const [showEmailKey, setShowEmailKey] = useState(false);
  const [flags, setFlags] = useState({
    bookings: true,
    merch: false,
    portal: true,
    maintenance: false,
    pricing: true,
    streaming: false,
  });
  const [message, setMessage] = useState("Page KillerCutz is currently under scheduled maintenance. We'll be back at 04:00 UTC.");

  const toggleFlag = (k: keyof typeof flags) => setFlags((p) => ({ ...p, [k]: !p[k] }));

  if (!accessOk) {
    return null;
  }

  return (
    <main className="ml-[200px] pt-24 pb-20 px-10 max-w-7xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Admin
      </Link>
      <div className="flex items-center justify-between mb-12 border-l-[3px] border-[#A855F7] pl-6">
        <div><h1 className="text-[20px] font-headline font-bold text-on-surface tracking-tight uppercase">Platform Settings</h1><p className="text-on-surface-variant text-sm mt-1">Configure global application behavior and core integrations.</p></div>
        <div className="bg-[#A855F7] text-white px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase">SUPER ADMIN</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass-card p-8 border-l border-white/5 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-8"><span className="material-symbols-outlined text-primary">api</span><h2 className="text-lg font-headline font-semibold">Integrations</h2></div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-on-surface-variant">Fish Africa (SMS API)</label>
                <div className="flex gap-2">
                  <input className="w-full bg-surface-container-lowest border-none text-sm p-3 font-mono text-primary rounded-sm focus:ring-1 focus:ring-primary" type={showSmsKey ? "text" : "password"} defaultValue="FA-77283-XM-29384-KJ" />
                  <button type="button" onClick={() => setShowSmsKey((s) => !s)} className="px-3 bg-surface-container-lowest"><span className="material-symbols-outlined text-on-surface-variant">{showSmsKey ? "visibility_off" : "visibility"}</span></button>
                </div>
                <input className="w-full bg-surface-container-lowest border-none text-sm p-3 rounded-sm" placeholder="Sender ID" defaultValue="KILLERCUTZ" />
                <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary">Test SMS</button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-on-surface-variant">Resend (Email API)</label>
                <div className="flex gap-2">
                  <input className="w-full bg-surface-container-lowest border-none text-sm p-3 font-mono text-primary rounded-sm focus:ring-1 focus:ring-primary" type={showEmailKey ? "text" : "password"} defaultValue="RE-90021-LP-11223-ZZ" />
                  <button type="button" onClick={() => setShowEmailKey((s) => !s)} className="px-3 bg-surface-container-lowest"><span className="material-symbols-outlined text-on-surface-variant">{showEmailKey ? "visibility_off" : "visibility"}</span></button>
                </div>
                <input className="w-full bg-surface-container-lowest border-none text-sm p-3 rounded-sm" placeholder="From address" defaultValue="support@pagekillercutz.com" />
                <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary">Test Email</button>
              </div>
            </div>
            <div className="bg-secondary/10 border-l-2 border-secondary p-4 flex gap-4 items-start"><span className="material-symbols-outlined text-secondary">warning</span><p className="text-xs text-secondary-fixed leading-relaxed"><span className="font-bold">Amber Warning:</span> Modifying these credentials will immediately disconnect production messaging services.</p></div>
          </div>
        </div>

        <div className="lg:col-span-4 glass-card p-8 border-l border-white/5">
          <div className="flex items-center gap-3 mb-8"><span className="material-symbols-outlined text-secondary">flag</span><h2 className="text-lg font-headline font-semibold">Feature Flags</h2></div>
          <div className="space-y-5">
            {[
              ["bookings", "Accept bookings"],
              ["merch", "Merch store active"],
              ["portal", "Playlist portal open"],
              ["maintenance", "Maintenance mode"],
              ["pricing", "Show pricing on homepage"],
              ["streaming", "Music streaming enabled"],
            ].map(([k, label]) => (
              <div key={k} className="flex items-center justify-between group cursor-pointer" onClick={() => toggleFlag(k as keyof typeof flags)}>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">{label}</span>
                <div className={`w-10 h-5 rounded-full relative p-1 flex ${flags[k as keyof typeof flags] ? "items-center justify-end bg-primary-container" : "items-center justify-start bg-surface-container-highest"}`}>
                  <div className={`w-3 h-3 rounded-full ${flags[k as keyof typeof flags] ? "bg-white" : "bg-outline"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {flags.maintenance && (
          <div className="lg:col-span-6 glass-card p-8 border-l-[3px] border-error relative">
            <div className="flex items-center gap-3 mb-6"><span className="material-symbols-outlined text-error">construction</span><h2 className="text-lg font-headline font-semibold text-error">Maintenance Mode</h2></div>
            <div className="space-y-6">
              <textarea className="w-full bg-surface-container-lowest border-none text-sm p-4 font-body text-on-surface rounded-sm focus:ring-1 focus:ring-error" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
              <button className="bg-error px-4 py-2 text-[10px] font-black uppercase text-white rounded-sm hover:opacity-90 active:scale-95 transition-all" onClick={() => toggleFlag("maintenance")}>Turn Off Maintenance Mode</button>
            </div>
          </div>
        )}

        <div className="lg:col-span-6 glass-card p-8 border-l-[3px] border-error">
          <div className="flex items-center gap-3 mb-8"><span className="material-symbols-outlined text-error">priority_high</span><h2 className="text-lg font-headline font-semibold">Danger Zone</h2></div>
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-highest flex items-center justify-between"><div><p className="text-sm font-semibold">Clear audit logs</p></div><button className="border border-error text-error text-[10px] font-bold px-4 py-1.5 uppercase hover:bg-error hover:text-white transition-colors">Clear</button></div>
            <div className="p-4 bg-surface-container-highest border border-error/30 relative"><div className="flex items-center justify-between mb-3"><div><p className="text-sm font-semibold">Reset feature flags</p></div></div><div className="flex gap-2"><button className="flex-1 bg-error text-white text-[10px] font-black py-2 uppercase">Confirm Reset</button><button className="px-4 py-2 text-[10px] font-bold text-on-surface-variant uppercase">Cancel</button></div></div>
            <div className="p-4 bg-surface-container-highest flex items-center justify-between"><div><p className="text-sm font-semibold">Force sign out all users</p></div><button className="border border-error text-error text-[10px] font-bold px-4 py-1.5 uppercase hover:bg-error hover:text-white transition-colors">Execute</button></div>
          </div>
        </div>
      </div>
    </main>
  );
}
