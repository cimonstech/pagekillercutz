import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

type ClientSummary = {
  key: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  confirmedBookings: number;
  totalSpent: number;
  totalOrders: number;
  lastBookingAt: string | null;
  nextEventDate: string | null;
  lastEventId: string | null;
};

function asISODate(value: string | null): string | null {
  if (!value) return null;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const supabase = getSupabaseAdmin();
    const [bookingsRes, ordersRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("client_name,client_email,client_phone,event_id,event_date,status,created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("orders")
        .select("customer_name,customer_email,customer_phone,total,payment_status,created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    if (bookingsRes.error) throw bookingsRes.error;
    if (ordersRes.error) throw ordersRes.error;

    const bookings = (bookingsRes.data ?? []) as BookingRow[];
    const orders = (ordersRes.data ?? []) as OrderRow[];
    const now = new Date();

    const map = new Map<string, ClientSummary>();
    const getKey = (email: string, phone: string) => {
      const e = (email || "").trim().toLowerCase();
      if (e) return `e:${e}`;
      const p = (phone || "").replace(/\D/g, "");
      return `p:${p || "unknown"}`;
    };

    for (const b of bookings) {
      const key = getKey(b.client_email, b.client_phone);
      const existing = map.get(key);
      const bookingCreated = asISODate(b.created_at) ?? new Date(0).toISOString();
      const eventDate = b.event_date ? new Date(`${b.event_date}T00:00:00`) : null;
      const isFutureEvent = eventDate && eventDate >= now;

      if (!existing) {
        map.set(key, {
          key,
          name: b.client_name || "Unknown",
          email: b.client_email || "—",
          phone: b.client_phone || "—",
          totalBookings: 1,
          confirmedBookings: b.status === "confirmed" ? 1 : 0,
          totalSpent: 0,
          totalOrders: 0,
          lastBookingAt: bookingCreated,
          nextEventDate: isFutureEvent ? b.event_date : null,
          lastEventId: b.event_id || null,
        });
        continue;
      }

      existing.totalBookings += 1;
      if (b.status === "confirmed") existing.confirmedBookings += 1;
      if (existing.lastBookingAt == null || bookingCreated > existing.lastBookingAt) {
        existing.lastBookingAt = bookingCreated;
        existing.lastEventId = b.event_id || existing.lastEventId;
      }
      if (isFutureEvent) {
        if (!existing.nextEventDate || b.event_date < existing.nextEventDate) {
          existing.nextEventDate = b.event_date;
        }
      }
      if (existing.name === "Unknown" && b.client_name) existing.name = b.client_name;
      if (existing.email === "—" && b.client_email) existing.email = b.client_email;
      if (existing.phone === "—" && b.client_phone) existing.phone = b.client_phone;
    }

    for (const o of orders) {
      const key = getKey(o.customer_email, o.customer_phone);
      const existing = map.get(key);
      const paidTotal = o.payment_status === "paid" ? Number(o.total || 0) : 0;
      if (!existing) {
        map.set(key, {
          key,
          name: o.customer_name || "Unknown",
          email: o.customer_email || "—",
          phone: o.customer_phone || "—",
          totalBookings: 0,
          confirmedBookings: 0,
          totalSpent: paidTotal,
          totalOrders: 1,
          lastBookingAt: null,
          nextEventDate: null,
          lastEventId: null,
        });
        continue;
      }

      existing.totalOrders += 1;
      existing.totalSpent += paidTotal;
      if (existing.name === "Unknown" && o.customer_name) existing.name = o.customer_name;
      if (existing.email === "—" && o.customer_email) existing.email = o.customer_email;
      if (existing.phone === "—" && o.customer_phone) existing.phone = o.customer_phone;
    }

    const clients = Array.from(map.values()).sort((a, b) => {
      const aa = a.lastBookingAt ?? "";
      const bb = b.lastBookingAt ?? "";
      if (aa === bb) return b.totalSpent - a.totalSpent;
      return aa < bb ? 1 : -1;
    });

    return Response.json({ clients });
  } catch (error) {
    logger.errorRaw("api/admin/clients", "Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

