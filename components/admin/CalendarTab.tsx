"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Database } from "@/lib/database.types";
import { useAdminToast } from "@/hooks/useAdminToast";

type BlockRow = Database["public"]["Tables"]["calendar_blocks"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default function CalendarTab() {
  const { showToast, ToastComponent } = useAdminToast();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [blockType, setBlockType] = useState<"full_day" | "time_range">("full_day");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const startDate = `${viewYear}-${pad2(viewMonth)}-01`;
  const endDateObj = new Date(viewYear, viewMonth, 0);
  const endDate = `${viewYear}-${pad2(viewMonth)}-${pad2(endDateObj.getDate())}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, bkRes] = await Promise.all([
        fetch(`/api/calendar-blocks?from=${startDate}&to=${endDate}`),
        fetch("/api/bookings?limit=500"),
      ]);
      const bJson = (await bRes.json()) as { blocks?: BlockRow[]; error?: string };
      const bkJson = (await bkRes.json()) as { bookings?: BookingRow[] };
      if (!bRes.ok) throw new Error(bJson.error ?? "Failed to load blocks");
      setBlocks(bJson.blocks ?? []);
      const all = bkJson.bookings ?? [];
      setBookings(
        all.filter(
          (x) =>
            x.event_date >= startDate &&
            x.event_date <= endDate &&
            x.status !== "cancelled" &&
            x.status !== "declined",
        ),
      );
    } catch {
      showToast("Failed to load calendar data.", "error");
    } finally {
      setLoading(false);
    }
  }, [endDate, showToast, startDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const daysInMonth = endDateObj.getDate();
  const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();

  const dateBookings = useMemo(() => {
    const m = new Map<string, BookingRow[]>();
    for (const bk of bookings) {
      const list = m.get(bk.event_date) ?? [];
      list.push(bk);
      m.set(bk.event_date, list);
    }
    return m;
  }, [bookings]);

  const dateBlocks = useMemo(() => {
    const m = new Map<string, BlockRow[]>();
    for (const bl of blocks) {
      const list = m.get(bl.block_date) ?? [];
      list.push(bl);
      m.set(bl.block_date, list);
    }
    return m;
  }, [blocks]);

  const monthLabel = new Date(viewYear, viewMonth - 1, 1).toLocaleDateString("en-GH", {
    month: "long",
    year: "numeric",
  });

  const onSubmitBlock = async () => {
    if (!selectedDate) {
      showToast("Select a date on the grid.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/calendar-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block_date: selectedDate,
          block_type: blockType,
          start_time: blockType === "time_range" ? startTime : null,
          end_time: blockType === "time_range" ? endTime : null,
          reason: reason.trim() || null,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      showToast("Date blocked.");
      setReason("");
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save block", "error");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteBlock = async (id: string) => {
    if (!confirm("Remove this block?")) return;
    try {
      const res = await fetch(`/api/calendar-blocks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Block removed.");
      await load();
    } catch {
      showToast("Failed to remove block.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-8 pb-12 pt-24">
      <ToastComponent />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h3 className="font-headline text-[28px] font-semibold text-white">Availability</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-sm bg-white/10 px-3 py-1.5 text-xs text-white"
            onClick={() => {
              if (viewMonth === 1) {
                setViewMonth(12);
                setViewYear((y) => y - 1);
              } else setViewMonth((m) => m - 1);
            }}
          >
            Prev
          </button>
          <span className="font-headline text-sm text-white">{monthLabel}</span>
          <button
            type="button"
            className="rounded-sm bg-white/10 px-3 py-1.5 text-xs text-white"
            onClick={() => {
              if (viewMonth === 12) {
                setViewMonth(1);
                setViewYear((y) => y + 1);
              } else setViewMonth((m) => m + 1);
            }}
          >
            Next
          </button>
        </div>
      </div>

      <p className="font-body text-sm text-on-surface-variant">
        Click a day to block it or manage blocks. Bookings on this month are shown in cyan; manual blocks in red.
      </p>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-sm border border-white/10 bg-white/[0.03] p-4">
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading…</p>
          ) : (
            <div className="flex flex-col items-center">
              <div className="mb-2 grid w-full max-w-[280px] grid-cols-7 gap-1 text-center font-mono text-[10px] text-on-surface-variant">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="grid max-w-[280px] grid-cols-7 gap-1">
                {Array.from({ length: firstDow }).map((_, i) => (
                  <div key={`e-${i}`} className="h-9" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${viewYear}-${pad2(viewMonth)}-${pad2(day)}`;
                  const bl = dateBlocks.get(dateStr) ?? [];
                  const bk = dateBookings.get(dateStr) ?? [];
                  const hasBlock = bl.length > 0;
                  const hasBooking = bk.length > 0;
                  const sel = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className={[
                        "relative flex h-9 w-9 flex-col items-center justify-center rounded-sm text-xs font-medium transition-colors",
                        sel ? "bg-[#00BFFF] text-black" : "bg-white/5 text-white hover:bg-white/10",
                      ].join(" ")}
                    >
                      {day}
                      <span className="absolute bottom-0.5 flex gap-0.5">
                        {hasBooking ? <span className="h-1 w-1 rounded-full bg-[#00BFFF]" /> : null}
                        {hasBlock ? <span className="h-1 w-1 rounded-full bg-[#FF4560]" /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-[11px] text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#00BFFF]" /> Booking
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#FF4560]" /> Block
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-sm border border-white/10 bg-white/[0.03] p-5">
          <h4 className="font-headline text-sm font-semibold text-white">Block date</h4>
          <p className="font-mono text-xs text-on-surface-variant">
            {selectedDate ?? "Select a day on the calendar"}
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="radio"
                name="blockType"
                checked={blockType === "full_day"}
                onChange={() => setBlockType("full_day")}
              />
              Full day
            </label>
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="radio"
                name="blockType"
                checked={blockType === "time_range"}
                onChange={() => setBlockType("time_range")}
              />
              Time range
            </label>
          </div>
          {blockType === "time_range" ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] text-on-surface-variant">
                Start
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
                />
              </label>
              <label className="text-[11px] text-on-surface-variant">
                End
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
                />
              </label>
            </div>
          ) : null}
          <label className="block text-[11px] text-on-surface-variant">
            Reason (optional)
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-sm border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
              placeholder="e.g. Personal commitment"
            />
          </label>
          <button
            type="button"
            disabled={saving || !selectedDate}
            onClick={() => void onSubmitBlock()}
            className="w-full rounded-sm bg-[#FF4560] py-2.5 font-headline text-xs font-bold uppercase text-white disabled:opacity-40"
          >
            {saving ? "Saving…" : "Block date"}
          </button>

          <div className="border-t border-white/10 pt-4">
            <p className="mb-2 font-headline text-xs font-semibold text-on-surface-variant">This month</p>
            <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
              {blocks.map((bl) => (
                <li
                  key={bl.id}
                  className="flex items-start justify-between gap-2 rounded-sm bg-black/20 px-2 py-2 text-on-surface-variant"
                >
                  <span>
                    <span className="font-mono text-[#FF4560]">{bl.block_date}</span> · {bl.block_type}
                    {bl.reason ? <span className="block text-[10px] opacity-80">{bl.reason}</span> : null}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove block"
                    className="shrink-0 text-error hover:opacity-80"
                    onClick={() => void onDeleteBlock(bl.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
              {blocks.length === 0 ? <li className="text-on-surface-variant/70">No blocks this month.</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
