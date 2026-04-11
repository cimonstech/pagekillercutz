"use client";

import { useEffect, useState } from "react";
import { mockAdmins } from "@/lib/mockData";

export default function AccountsTab() {
  const [admins, setAdmins] = useState(mockAdmins);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admins");
        const json = (await res.json()) as { admins?: typeof mockAdmins };
        if (json.admins) setAdmins(json.admins);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <main className="min-h-screen">
      <div className="pt-24 px-10 pb-12">
        <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-2 border-purple-500 pl-4">
          <div><h2 className="text-[28px] font-headline text-white mb-2">Admin Accounts</h2><p className="text-on-surface-variant text-sm max-w-xl">Configure administrative access levels and secure credentials.</p></div>
          <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-headline text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)]" onClick={() => setModal(true)}><span className="material-symbols-outlined text-lg">add</span>Create New Admin</button>
        </section>

        <div className="glass-effect overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-xs font-label uppercase tracking-widest text-slate-400">Name</th>
                <th className="px-6 py-4 text-xs font-label uppercase tracking-widest text-slate-400">Email</th>
                <th className="px-6 py-4 text-xs font-label uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-6 py-4 text-xs font-label uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-xs font-label uppercase tracking-widest text-slate-400">Last Login</th>
                <th className="px-6 py-4 text-xs font-label uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(loading ? [] : admins).map((a) => (
                <>
                  <tr key={a.id} className="group hover:bg-purple-500/[0.03] transition-colors cursor-default">
                    <td className="px-6 py-5"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-surface-container-highest flex items-center justify-center border border-outline-variant text-[10px] font-bold">{a.name.split(" ").map((n) => n[0]).join("")}</div><span className="text-sm font-medium text-white">{a.name}</span></div></td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant font-label">{a.email}</td>
                    <td className="px-6 py-5"><span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter border ${a.role === "super_admin" ? "bg-purple-900/20 text-purple-400 border-purple-500/30" : "bg-cyan-900/20 text-cyan-400 border-cyan-500/30"}`}>{a.role}</span></td>
                    <td className="px-6 py-5"><div className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${a.status === "active" ? "bg-emerald-500" : "bg-error"}`} /><span className={`text-xs ${a.status === "active" ? "text-emerald-400" : "text-error"}`}>{a.status}</span></div></td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant font-label">{a.lastLogin}</td>
                    <td className="px-6 py-5 text-right"><div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity"><button className="text-on-surface-variant hover:text-purple-400" onClick={() => setExpanded(expanded === a.id ? null : a.id)}><span className="material-symbols-outlined text-lg">lock_reset</span></button><button className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-lg">block</span></button></div></td>
                  </tr>
                  {expanded === a.id && (
                    <tr><td colSpan={6} className="px-6 py-4 bg-white/5"><div className="flex gap-3"><button className="px-3 py-1 text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">Reset Password</button><button className="px-3 py-1 text-xs bg-error/20 text-error border border-error/30">Suspend</button></div></td></tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-surface/80 backdrop-blur-sm">
          <div className="w-full max-w-[500px] bg-surface-container shadow-2xl border border-white/5 p-8">
            <div className="flex justify-between items-center mb-8"><div><h3 className="text-xl font-headline text-white">Create New Admin</h3><p className="text-xs text-on-surface-variant mt-1">Assign roles and initial credentials.</p></div><button className="text-on-surface-variant hover:text-white transition-colors" onClick={() => setModal(false)}><span className="material-symbols-outlined">close</span></button></div>
            <div className="space-y-6">
              <input className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-purple-500 py-3 px-4 text-sm" placeholder="Full Name" />
              <input className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-purple-500 py-3 px-4 text-sm" placeholder="Email Address" />
              <div className="flex gap-4">
                <button className="flex-1 h-12 border border-cyan-500 text-cyan-400 bg-cyan-500/5 text-xs">Standard Admin</button>
                <button className="flex-1 h-12 border border-purple-500 text-purple-400 bg-purple-500/5 text-xs">Super Admin</button>
              </div>
            </div>
            <div className="mt-10 flex gap-3"><button className="flex-1 py-3 text-sm font-headline text-on-surface-variant bg-white/5" onClick={() => setModal(false)}>Cancel</button><button className="flex-1 py-3 text-sm font-headline text-white bg-purple-600">Provision Account</button></div>
          </div>
        </div>
      )}
    </main>
  );
}
