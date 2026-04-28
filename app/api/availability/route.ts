import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type BookingPick = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  "event_date" | "event_start_time_input" | "event_duration_hours" | "status"
>;
type BlockRow = Database["public"]["Tables"]["calendar_blocks"]["Row"];

const BUFFER_HOURS = 3;
const BLOCKED_HOURS_THRESHOLD = 18;

export type DayAvailability = {
  status: "available" | "amber" | "blocked";
  bookingCount: number;
  hasManualBlock: boolean;
  timeSlots: { start: string; end: string; type: "booking" | "block" }[];
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseStartHours(raw: string | null | undefined): number {
  if (!raw?.trim()) return 18;
  const parts = raw.trim().split(":");
  const h = parseInt(parts[0] ?? "18", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  if (Number.isNaN(h)) return 18;
  const mm = Number.isNaN(m) ? 0 : Math.min(59, Math.max(0, m));
  return h + mm / 60;
}

function parseTimeToHours(t: string | null | undefined): number | null {
  if (!t?.trim()) return null;
  return parseStartHours(t);
}

function formatClock(hoursFloat: number): string {
  const totalMins = Math.round(hoursFloat * 60);
  const h = Math.floor(totalMins / 60);
  const m = ((totalMins % 60) + 60) % 60;
  return `${pad2(h)}:${pad2(m)}:00`;
}

function mergeIntervals(intervals: { start: number; end: number }[]): { start: number; end: number }[] {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const out: { start: number; end: number }[] = [{ ...sorted[0]! }];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i]!;
    const last = out[out.length - 1]!;
    if (cur.start <= last.end) last.end = Math.max(last.end, cur.end);
    else out.push({ ...cur });
  }
  return out;
}

function totalHoursClampedToDay(intervals: { start: number; end: number }[]): number {
  let sum = 0;
  for (const iv of intervals) {
    const s = Math.max(0, iv.start);
    const e = Math.min(27, iv.end);
    if (e > s) sum += e - s;
  }
  return sum;
}

function isActiveBookingStatus(s: string): boolean {
  return s !== "cancelled" && s !== "declined";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);
    if (year < 2000 || year > 2100 || month < 1 || month > 12) {
      return Response.json({ error: "Invalid year or month" }, { status: 400 });
    }

    const startDate = `${year}-${pad2(month)}-01`;
    const endDt = new Date(year, month, 0);
    const endDate = `${year}-${pad2(month)}-${pad2(endDt.getDate())}`;

    const supabase = getSupabaseAdmin();

    const { data: bookingsRaw, error: bookingsError } = await supabase
      .from("bookings")
      .select("event_date, event_start_time_input, event_duration_hours, status")
      .gte("event_date", startDate)
      .lte("event_date", endDate);

    if (bookingsError) throw bookingsError;

    const bookings = (bookingsRaw ?? []).filter((b) => isActiveBookingStatus((b as BookingPick).status)) as BookingPick[];

    const { data: blocksRaw, error: blocksError } = await supabase
      .from("calendar_blocks")
      .select("*")
      .gte("block_date", startDate)
      .lte("block_date", endDate);

    if (blocksError) throw blocksError;
    const blocks = (blocksRaw ?? []) as BlockRow[];

    const availability: Record<string, DayAvailability> = {};
    const daysInMonth = endDt.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
      const dayBookings = bookings.filter((b) => b.event_date === dateStr);
      const dayBlocks = blocks.filter((b) => b.block_date === dateStr);

      const hasFullDayBlock = dayBlocks.some((b) => b.block_type === "full_day");
      if (hasFullDayBlock) {
        availability[dateStr] = {
          status: "blocked",
          bookingCount: dayBookings.length,
          hasManualBlock: true,
          timeSlots: [],
        };
        continue;
      }

      const intervals: { start: number; end: number }[] = [];
      const timeSlots: DayAvailability["timeSlots"] = [];

      for (const b of dayBookings) {
        const startH = parseStartHours(b.event_start_time_input);
        const duration = b.event_duration_hours ?? 3;
        const endH = Math.min(startH + duration + BUFFER_HOURS, 27);
        intervals.push({ start: startH, end: endH });
        timeSlots.push({
          start: formatClock(startH),
          end: formatClock(endH),
          type: "booking",
        });
      }

      for (const bl of dayBlocks) {
        if (bl.block_type !== "time_range") continue;
        const sh = parseTimeToHours(bl.start_time);
        const eh = parseTimeToHours(bl.end_time);
        if (sh == null || eh == null) continue;
        const a = Math.min(sh, eh);
        const b = Math.max(sh, eh);
        intervals.push({ start: a, end: b });
        timeSlots.push({
          start: formatClock(a),
          end: formatClock(b),
          type: "block",
        });
      }

      if (dayBookings.length === 0 && intervals.length === 0) {
        availability[dateStr] = {
          status: "available",
          bookingCount: 0,
          hasManualBlock: false,
          timeSlots: [],
        };
        continue;
      }

      const merged = mergeIntervals(intervals);
      const load = totalHoursClampedToDay(merged);

      if (load >= BLOCKED_HOURS_THRESHOLD) {
        availability[dateStr] = {
          status: "blocked",
          bookingCount: dayBookings.length,
          hasManualBlock: false,
          timeSlots,
        };
      } else {
        availability[dateStr] = {
          status: "amber",
          bookingCount: dayBookings.length,
          hasManualBlock: false,
          timeSlots,
        };
      }
    }

    return Response.json({ availability, year, month });
  } catch (error) {
    logger.errorRaw("route", "[api/availability]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
