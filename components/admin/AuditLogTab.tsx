"use client";

import { useEffect, useMemo, useState } from "react";
import { mockAuditLog } from "@/lib/mockData";

export default function AuditLogTab() {
  const [range, setRange] = useState("All Time");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState(mockAuditLog);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/audit-logs");
        const json = (await res.json()) as { logs?: typeof mockAuditLog };
        if (json.logs) setLogs(json.logs);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const rows = useMemo(
    () =>
      logs.filter(
        (r) =>
          (filter === "all" || r.action.toLowerCase().includes(filter)) &&
          `${r.actor} ${r.description} ${r.targetId}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [filter, logs, search],
  );

  return (
    <section className="p-8 flex-1 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div><h2 className="text-[28px] font-headline font-bold text-white tracking-tight leading-none">Activity Log</h2><p className="text-on-surface-variant text-sm mt-2 max-w-xl">Comprehensive system-wide audit of all administrative and automated actions.</p></div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface-container-low rounded-sm p-1 gap-1">
            {["All Time", "7 Days", "30 Days"].map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 text-xs font-medium rounded-sm ${range === r ? "bg-purple-500 text-white" : "text-slate-400 hover:text-white transition-colors"}`}>{r}</button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/5 transition-colors"><span className="material-symbols-outlined text-sm">download</span>Export Log</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-label text-slate-500 uppercase flex items-center mr-2">Quick Filters:</span>
        {["all", "booking", "payment", "playlist", "cancellation", "account"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition-colors ${filter === f ? "border-purple-400 text-purple-400 bg-purple-400/5" : "border-primary-container text-primary-container hover:border-primary"}`}>{f.toUpperCase()}</button>
        ))}
      </div>

      <div className="relative max-w-md">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="bg-surface-container-low border-none focus:ring-1 focus:ring-purple-500 text-sm px-4 py-1.5 w-64 transition-all" placeholder="Search logs..." />
      </div>

      {filter !== "all" && <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs w-fit">Filter: {filter}<button onClick={() => setFilter("all")} className="text-purple-400">×</button></div>}

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[160px_240px_1fr_140px] px-6 py-3 text-[10px] font-label text-slate-500 uppercase tracking-widest border-b border-white/5">
          <div>Timestamp</div><div>Actor</div><div>Action & Description</div><div className="text-right">IP Address</div>
        </div>
        {loading ? (
          <div className="glass-row rounded-sm p-10 text-center text-on-surface-variant">Loading audit entries...</div>
        ) : rows.length === 0 ? (
          <div className="glass-row rounded-sm p-10 text-center text-on-surface-variant">No audit entries match the selected filters.</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="grid grid-cols-[160px_240px_1fr_140px] px-6 py-4 items-center glass-row rounded-sm">
              <div className="flex flex-col"><span className="font-label text-xs text-on-surface">{r.timestamp.split(" ")[0]}</span><span className="font-label text-[10px] text-on-surface-variant">{r.timestamp.split(" ")[1]} UTC</span></div>
              <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-white/5"><span className="material-symbols-outlined text-slate-400 text-sm">person</span></div><div className="flex flex-col"><span className="text-sm font-medium text-white">{r.actor}</span></div></div>
              <div className="flex items-center gap-4"><span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded-sm border border-purple-500/30 uppercase">{r.action}</span><p className="text-sm text-on-surface-variant">{r.description} <span className="text-primary-container">{r.targetId}</span></p></div>
              <div className="font-label text-[11px] text-slate-500 text-right">{r.ip}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
