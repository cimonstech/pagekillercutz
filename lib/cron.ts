import { logger } from "./logger";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import {
  notifyReminder7Day,
  notifyReminder1Day,
  notifyMorningOf,
} from "./notify/dispatch";
import type { BookingData } from "./notify/templates";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

async function fetchBookingsForDate(date: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("event_date", date)
    .eq("status", "confirmed");
  if (error) {
    logger.errorRaw("cron", `[cron] Error fetching bookings for ${date}:`, error);
    return [];
  }
  return data || [];
}

function toBookingData(b: Record<string, unknown>): BookingData {
  return {
    eventId: b.event_id as string,
    clientName: b.client_name as string,
    clientEmail: b.client_email as string,
    clientPhone: b.client_phone as string,
    eventType: b.event_type as string,
    eventDate: b.event_date as string,
    venue: b.venue as string,
    djPhone: process.env.DJ_PHONE!,
    djEmail: process.env.DJ_EMAIL!,
    portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/sign-in`,
  };
}

export function startCronJobs() {
  logger.infoRaw("cron", "[cron] Starting Page KillerCutz scheduler...");

  cron.schedule("0 7 * * *", async () => {
    logger.infoRaw("cron", "[cron] Daily check at", new Date().toISOString());

    const date7 = offsetDate(7);
    const date1 = offsetDate(1);
    const date0 = offsetDate(0);

    const [b7, b1, b0] = await Promise.all([
      fetchBookingsForDate(date7),
      fetchBookingsForDate(date1),
      fetchBookingsForDate(date0),
    ]);

    for (const b of b7) {
      await notifyReminder7Day(toBookingData(b as Record<string, unknown>));
    }
    for (const b of b1) {
      await notifyReminder1Day(toBookingData(b as Record<string, unknown>));
    }
    for (const b of b0) {
      await notifyMorningOf(toBookingData(b as Record<string, unknown>));
    }

    logger.infoRaw("cron", `[cron] Done. 7-day: ${b7.length}, 1-day: ${b1.length}, today: ${b0.length}`);
  }, {
    timezone: "Africa/Accra",
  });

  logger.infoRaw("cron", "[cron] Scheduler running. Daily check at 07:00 Africa/Accra.");
}

