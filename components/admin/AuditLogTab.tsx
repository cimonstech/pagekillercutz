"use client";

import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@/lib/database.types";
import { useAdminStore } from "@/lib/store/adminStore";
import { timeAgo } from "@/lib/timeAgo";

type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

function badgeClass(actionType: string): string {
  switch (actionType) {
    case "booking":
      return "border-cyan-400 text-cyan-400 bg-cyan-400/10";
    case "payment":
      return "border-[#F5A623] text-[#F5A623] bg-[#F5A623]/10";
    case "cancellation":
      return "border-red-400 text-red-400 bg-red-400/10";
    case "playlist":
      return "border-green-400 text-green-400 bg-green-400/10";
    case "account":
      return "border-purple-400 text-purple-400 bg-purple-400/10";
    case "order":
      return "border-blue-400 text-blue-400 bg-blue-400/10";
    case "system":
      return "border-slate-500 text-slate-400 bg-slate-500/10";
    default:
      return "border-slate-600 text-slate-400 bg-slate-600/10";
  }
}

export default function AuditLogTab() {
  const staffRole = useAdminStore((s) => s.role);
  const [range, setRange] = useState("All Time");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedNotifications, setFailedNotifications] = useState<NotificationRow[]>([]);
  const [failedLoading, setFailedLoading] = useState(true);
  const [notificationActionId, setNotificationActionId] = useState<string | null>(null);

  const loadFailedNotifications = useCallback(() => {
    setFailedLoading(true);
    fetch("/api/notifications?status=failed&limit=10")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch failed"))))
      .then((d: { notifications?: NotificationRow[] }) => {
        setFailedNotifications(d.notifications ?? []);
      })
      .catch(() => setFailedNotifications([]))
      .finally(() => setFailedLoading(false));
  }, []);

  useEffect(() => {
    loadFailedNotifications();
  }, [loadFailedNotifications]);

  useEffect(() => {
    if (staffRole !== "super_admin" && includeArchived) setIncludeArchived(false);
  }, [staffRole, includeArchived]);

  const loadLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "50");
    if (filter !== "all") params.set("action_type", filter);
    if (includeArchived && staffRole === "super_admin") {
      params.set("include_archived", "true");
    }

    const now = new Date();
    if (range === "7 Days") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      params.set("date_from", d.toISOString());
    } else if (range === "30 Days") {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      params.set("date_from", d.toISOString());
    }

    fetch(`/api/audit-logs?${params.toString()}`)
      .then((r) => r.json())
      .then((d: { logs?: AuditLogRow[]; error?: string }) => {
        setLogs(d.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter, range, includeArchived, staffRole]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const rows = useMemo(
    () =>
      logs.filter((r) =>
        `${r.actor} ${r.description} ${r.target_id ?? ""} ${r.action_type}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [logs, search],
  );

  const exportCSV = () => {
    const headers = ["Date", "Time", "Actor", "Role", "Action", "Description", "Target ID", "IP"];
    const dataRows = rows.map((log) => [
      new Date(log.created_at).toLocaleDateString("en-GH"),
      new Date(log.created_at).toLocaleTimeString("en-GH"),
      log.actor,
      log.actor_role,
      log.action_type,
      log.description,
      log.target_id || "",
      log.ip_address || "",
    ]);
    const csv = [headers, ...dataRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="p-8 flex-1 flex flex-col gap-8">
      {!failedLoading && failedNotifications.length > 0 ? (
        <div
          className="rounded-xl border border-[#FF4560]/35 px-5 py-4"
          style={{
            background: "rgba(255, 69, 96, 0.08)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={22} color="#FF4560" aria-hidden />
            <div className="min-w-0 flex-1">
              <p
                className="font-headline text-[14px] font-semibold leading-snug text-white"
                style={{ fontWeight: 600 }}
              >
                {failedNotifications.length} notification(s) failed to send.
              </p>
              <ul className="mt-4 space-y-3">
                {failedNotifications.map((n) => {
                  const recipient = n.recipient_email || n.recipient_phone || "—";
                  const errShort = (n.error_message || "").length > 120
                    ? `${(n.error_message || "").slice(0, 120)}…`
                    : n.error_message || "—";
                  const busy = notificationActionId === n.id;
                  return (
                    <li
                      key={n.id}
                      className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded border border-white/20 px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wide text-white/90">
                            {n.channel === "sms" ? "SMS" : "EMAIL"}
                          </span>
                          <span className="font-label text-[10px] uppercase tracking-wide text-white/50">
                            {n.type}
                          </span>
                        </div>
                        <p className="truncate font-mono text-xs text-white/80" title={recipient}>
                          {recipient}
                        </p>
                        <p className="line-clamp-2 font-mono text-[11px] text-[#FF4560]/90">{errShort}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded border border-primary/40 px-3 py-1.5 font-label text-[11px] font-bold uppercase tracking-wide text-primary hover:bg-primary/10 disabled:opacity-50"
                          onClick={() => {
                            setNotificationActionId(n.id);
                            void fetch(`/api/notifications/${n.id}/retry`, { method: "POST" })
                              .then(() => {
                                loadFailedNotifications();
                                loadLogs();
                              })
                              .finally(() => setNotificationActionId(null));
                          }}
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded border border-white/20 px-3 py-1.5 font-label text-[11px] font-bold uppercase tracking-wide text-white/70 hover:bg-white/5 disabled:opacity-50"
                          onClick={() => {
                            setNotificationActionId(n.id);
                            void fetch("/api/notifications", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: n.id, status: "dismissed" }),
                            })
                              .then(() => loadFailedNotifications())
                              .finally(() => setNotificationActionId(null));
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-[28px] font-headline font-bold text-white tracking-tight leading-none">Activity Log</h2>
          <p className="text-on-surface-variant text-sm mt-2 max-w-xl">
            Comprehensive system-wide audit of all administrative and automated actions.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-surface-container-low rounded-sm p-1 gap-1">
            {["All Time", "7 Days", "30 Days"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm ${
                  range === r ? "bg-purple-500 text-white" : "text-slate-400 hover:text-white transition-colors"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {staffRole === "super_admin" ? (
            <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded border-slate-500 text-purple-500 focus:ring-purple-500"
              />
              <span className="font-label font-semibold uppercase tracking-wide">Include archived</span>
            </label>
          ) : null}
          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Log
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-label text-slate-500 uppercase flex items-center mr-2">Quick Filters:</span>
        {["all", "booking", "payment", "playlist", "cancellation", "account", "order", "system"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
              filter === f
                ? "border-purple-400 text-purple-400 bg-purple-400/5"
                : "border-primary-container text-primary-container hover:border-primary"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface-container-low border-none focus:ring-1 focus:ring-purple-500 text-sm px-4 py-1.5 w-64 transition-all"
          placeholder="Search logs..."
        />
      </div>

      {filter !== "all" && (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs w-fit">
          Filter: {filter}
          <button type="button" onClick={() => setFilter("all")} className="text-purple-400">
            ×
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[160px_240px_1fr_140px] px-6 py-3 text-[10px] font-label text-slate-500 uppercase tracking-widest border-b border-white/5">
          <div>Timestamp</div>
          <div>Actor</div>
          <div>Action & Description</div>
          <div className="text-right">IP Address</div>
        </div>
        {loading ? (
          <div className="glass-row rounded-sm p-10 text-center text-on-surface-variant">Loading audit entries...</div>
        ) : rows.length === 0 ? (
          <div className="glass-row rounded-sm p-10 text-center text-on-surface-variant">
            No audit entries match the selected filters.
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className={`grid grid-cols-[160px_240px_1fr_140px] px-6 py-4 items-center glass-row rounded-sm ${
                r.archived ? "border-l-2 border-amber-500/40 opacity-90" : ""
              }`}
            >
              <div className="flex flex-col">
                <span className="font-label text-xs text-on-surface">
                  {new Date(r.created_at).toLocaleDateString("en-GH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="font-label text-[10px] text-on-surface-variant">
                  {new Date(r.created_at).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">{timeAgo(r.created_at)}</span>
                {r.archived ? (
                  <span className="mt-1 inline-block rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-label text-[9px] font-bold uppercase tracking-wide text-amber-200/90">
                    Archived
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-white/5">
                  <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{r.actor}</span>
                  <span className="text-[10px] text-on-surface-variant uppercase">{r.actor_role}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border uppercase ${badgeClass(r.action_type)}`}>
                  {r.action_type}
                </span>
                <p className="text-sm text-on-surface-variant">
                  {r.description}{" "}
                  {r.target_id ? <span className="text-primary-container">{r.target_id}</span> : null}
                </p>
              </div>
              <div className="font-label text-[11px] text-slate-500 text-right">{r.ip_address ?? "—"}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
