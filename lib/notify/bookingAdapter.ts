import type { Database } from "@/lib/database.types";
import { getPrimaryDjPhone } from "./djPhones";
import type { BookingData } from "./templates";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

export function bookingRowToData(row: BookingRow): BookingData {
  return {
    eventId: row.event_id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    eventType: row.event_type,
    eventDate: row.event_date,
    venue: row.venue,
    djPhone: getPrimaryDjPhone(),
    djEmail: process.env.DJ_EMAIL ?? "",
    portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pagekillercutz.com"}/sign-in`,
    packageName: row.package_name,
  };
}
