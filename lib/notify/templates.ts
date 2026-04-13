export interface BookingData {
  eventId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventType: string;
  eventDate: string;
  venue: string;
  djPhone: string;
  djEmail: string;
  portalUrl?: string;
  packageName?: string | null;
}

export function formatBookingDate(dateStr: string): string {
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-GH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pagekillercutz.com";

export function sms_bookingConfirmed_client(d: BookingData): string {
  return (
    `Hi ${d.clientName}, your booking with Page KillerCutz is CONFIRMED!\n` +
    `Event ID: ${d.eventId}\n` +
    `${d.eventType} · ${formatBookingDate(d.eventDate)}\n` +
    `${d.venue}\n` +
    `Set up your playlist: ${baseUrl}/sign-in\n` +
    `— Page KillerCutz`
  );
}

/** DJ ping when a booking is confirmed by admin (not new-request). */
export function sms_bookingConfirmed_dj(d: BookingData): string {
  return (
    `[Confirmed] ${d.eventId} — ${d.clientName} confirmed.\n` +
    `${d.eventType} · ${formatBookingDate(d.eventDate)}\n` +
    `${d.venue}`
  );
}

export function sms_reminder7day_client(d: BookingData): string {
  return (
    `Hi ${d.clientName}, your event is in 7 days! ` +
    `(${formatBookingDate(d.eventDate)} · ${d.venue}). ` +
    `Update your playlist: ${baseUrl}/playlist-portal`
  );
}

export function sms_reminder7day_dj(d: BookingData): string {
  return (
    `[7-Day Reminder] ${d.eventId} — ${d.clientName}. ` +
    `${d.eventType} on ${formatBookingDate(d.eventDate)} ` +
    `at ${d.venue}. Admin: ${baseUrl}/admin`
  );
}

export function sms_reminder1day_client(d: BookingData): string {
  return (
    `Hi ${d.clientName}, your event is TOMORROW! ` +
    `(${d.venue}). Last chance to update your playlist: ` +
    `${baseUrl}/sign-in — Page KillerCutz`
  );
}

export function sms_reminder1day_dj(d: BookingData): string {
  return (
    `[Tomorrow] ${d.eventId} — ${d.clientName}. ` +
    `${d.eventType} · ${d.venue}. ` +
    `Review playlist: ${baseUrl}/admin`
  );
}

export function sms_morningOf_dj(d: BookingData): string {
  return (
    `[TODAY] ${d.eventId} — ${d.clientName} ` +
    `(${d.clientPhone}). ${d.eventType} · ${d.venue}. ` +
    `Playlist: ${baseUrl}/admin`
  );
}

export function sms_playlistLocked_client(d: BookingData): string {
  return (
    `Hi ${d.clientName}, your playlist for ` +
    `${formatBookingDate(d.eventDate)} has been locked ` +
    `by Page KillerCutz. See you on the night!`
  );
}

export function sms_paymentConfirmed_client(d: BookingData): string {
  return (
    `Hi ${d.clientName}, your payment for ${d.eventId} has been received and confirmed by Page KillerCutz. ` +
    `You can now set up your playlist: ${baseUrl}/sign-in — Page KillerCutz`
  );
}
