import { logger } from "../logger";
import { sendSMS } from "./sms";
import { sendEmail } from "./email";
import * as ET from "./emailTemplates";
import * as T from "./templates";
import { getDjSmsRecipients, getPrimaryDjPhone } from "./djPhones";

const DJ_EMAIL = process.env.DJ_EMAIL!;

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://pagekillercutz.com").replace(/\/$/, "");
const DJ_MOMO = process.env.NEXT_PUBLIC_DJ_MOMO ?? "+233 24 412 3456";

function portalUrl(d: T.BookingData): string {
  return d.portalUrl || `${BASE_URL}/sign-in`;
}

export async function notifyBookingConfirmed(data: T.BookingData) {
  const djPhones = getDjSmsRecipients();
  const d = { ...data, djPhone: getPrimaryDjPhone(), djEmail: DJ_EMAIL };
  const formattedDate = T.formatBookingDate(d.eventDate);
  const pkg = d.packageName?.trim() || "Signature";
  const results = await Promise.allSettled([
    sendSMS(d.clientPhone, T.sms_bookingConfirmed_client(d)),
    ...(djPhones.length ? [sendSMS(djPhones, T.sms_bookingConfirmed_dj(d))] : []),
    sendEmail({
      to: d.clientEmail,
      subject: `Booking Confirmed — ${d.eventId}`,
      html: ET.bookingConfirmedClient({
        eventId: d.eventId,
        clientName: d.clientName,
        eventType: d.eventType,
        eventDate: formattedDate,
        venue: d.venue,
        packageName: pkg,
        djMomo: DJ_MOMO,
        portalUrl: portalUrl(d),
      }),
    }),
    sendEmail({
      to: DJ_EMAIL,
      subject: `[Confirmed] ${d.eventId} — ${d.clientName}`,
      html: ET.bookingConfirmedDj({
        eventId: d.eventId,
        clientName: d.clientName,
        eventType: d.eventType,
        eventDate: formattedDate,
        venue: d.venue,
        adminUrl: `${BASE_URL}/admin`,
      }),
    }),
  ]);
  logResults("booking_confirmed", results);
}

export async function notifyReminder7Day(data: T.BookingData) {
  const djPhones = getDjSmsRecipients();
  const d = { ...data, djPhone: getPrimaryDjPhone(), djEmail: DJ_EMAIL };
  const formattedDate = T.formatBookingDate(d.eventDate);
  const results = await Promise.allSettled([
    sendSMS(d.clientPhone, T.sms_reminder7day_client(d), {
      type: "reminder7day_client_sms",
      bookingId: d.eventId,
    }),
    ...(djPhones.length
      ? [
          sendSMS(djPhones, T.sms_reminder7day_dj(d), {
            type: "reminder7day_dj_sms",
            bookingId: d.eventId,
          }),
        ]
      : []),
    sendEmail({
      to: d.clientEmail,
      subject: `7 Days to Go — ${d.eventId}`,
      html: ET.reminder7DayClient({
        eventId: d.eventId,
        clientName: d.clientName,
        eventDate: formattedDate,
        venue: d.venue,
        portalUrl: portalUrl(d),
      }),
      type: "reminder7day_client_email",
      bookingId: d.eventId,
    }),
  ]);
  logResults(`reminder_7day:${d.eventId}`, results);
}

export async function notifyReminder1Day(data: T.BookingData) {
  const djPhones = getDjSmsRecipients();
  const d = { ...data, djPhone: getPrimaryDjPhone(), djEmail: DJ_EMAIL };
  const formattedDate = T.formatBookingDate(d.eventDate);
  const results = await Promise.allSettled([
    sendSMS(d.clientPhone, T.sms_reminder1day_client(d), {
      type: "reminder1day_client_sms",
      bookingId: d.eventId,
    }),
    ...(djPhones.length
      ? [
          sendSMS(djPhones, T.sms_reminder1day_dj(d), {
            type: "reminder1day_dj_sms",
            bookingId: d.eventId,
          }),
        ]
      : []),
    sendEmail({
      to: d.clientEmail,
      subject: `Tomorrow! — ${d.eventId}`,
      html: ET.reminder1DayClient({
        eventId: d.eventId,
        clientName: d.clientName,
        eventDate: formattedDate,
        venue: d.venue,
        portalUrl: portalUrl(d),
      }),
      type: "reminder1day_client_email",
      bookingId: d.eventId,
    }),
    sendEmail({
      to: DJ_EMAIL,
      subject: `[Tomorrow] ${d.eventId} — ${d.clientName}`,
      html: ET.reminder1DayDj({
        eventId: d.eventId,
        clientName: d.clientName,
        eventType: d.eventType,
        venue: d.venue,
        adminUrl: `${BASE_URL}/admin`,
      }),
      type: "reminder1day_dj_email",
      bookingId: d.eventId,
    }),
  ]);
  logResults(`reminder_1day:${d.eventId}`, results);
}

export async function notifyMorningOf(data: T.BookingData) {
  const djPhones = getDjSmsRecipients();
  const d = { ...data, djPhone: getPrimaryDjPhone(), djEmail: DJ_EMAIL };
  if (!djPhones.length) {
    logger.infoRaw("dispatch", `[notify][morning_of:${d.eventId}] no DJ recipients`);
    return;
  }
  const result = await sendSMS(djPhones, T.sms_morningOf_dj(d), {
    type: "morning_of_dj_sms",
    bookingId: d.eventId,
  });
  if (!result.success) {
    logger.errorRaw("dispatch", `[notify][morning_of:${d.eventId}] FAILED:`, result.error);
  } else {
    logger.infoRaw("dispatch", `[notify][morning_of:${d.eventId}] ok`);
  }
}

export async function notifyPlaylistLocked(data: T.BookingData) {
  const d = { ...data, djPhone: getPrimaryDjPhone(), djEmail: DJ_EMAIL };
  const formattedDate = T.formatBookingDate(d.eventDate);
  const results = await Promise.allSettled([
    sendSMS(d.clientPhone, T.sms_playlistLocked_client(d), {
      type: "playlist_locked_client_sms",
      bookingId: d.eventId,
    }),
    sendEmail({
      to: d.clientEmail,
      subject: `Playlist Locked — ${d.eventId}`,
      html: ET.playlistLockedClient({
        eventId: d.eventId,
        clientName: d.clientName,
        eventDate: formattedDate,
        venue: d.venue,
        portalUrl: portalUrl(d),
      }),
      type: "playlist_locked_client_email",
      bookingId: d.eventId,
    }),
  ]);
  logResults(`playlist_locked:${d.eventId}`, results);
}

function logResults(
  event: string,
  results: PromiseSettledResult<unknown>[],
) {
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      logger.errorRaw("dispatch", `[notify][${event}][${i}] FAILED:`, r.reason);
    } else {
      logger.infoRaw("dispatch", `[notify][${event}][${i}] ok`);
    }
  });
}
