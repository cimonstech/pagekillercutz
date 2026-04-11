import { logger } from "../logger";
import { sendSMS } from "./sms";
import { sendEmail } from "./email";
import * as T from "./templates";

const DJ_PHONE = process.env.DJ_PHONE!;
const DJ_EMAIL = process.env.DJ_EMAIL!;

export async function notifyBookingConfirmed(
  data: T.BookingData,
) {
  const d = { ...data, djPhone: DJ_PHONE, djEmail: DJ_EMAIL };
  const results = await Promise.allSettled([
    sendSMS(d.clientPhone, T.sms_bookingConfirmed_client(d)),
    sendSMS(DJ_PHONE, T.sms_bookingConfirmed_dj(d)),
    sendEmail({
      to: d.clientEmail,
      ...T.email_bookingConfirmed_client(d),
    }),
    sendEmail({
      to: DJ_EMAIL,
      ...T.email_bookingConfirmed_dj(d),
    }),
  ]);
  logResults("booking_confirmed", results);
}

export async function notifyReminder7Day(
  data: T.BookingData,
) {
  const d = { ...data, djPhone: DJ_PHONE, djEmail: DJ_EMAIL };
  await Promise.allSettled([
    sendSMS(d.clientPhone, T.sms_reminder7day_client(d)),
    sendSMS(DJ_PHONE, T.sms_reminder7day_dj(d)),
    sendEmail({
      to: d.clientEmail,
      ...T.email_reminder7day_client(d),
    }),
  ]);
}

export async function notifyReminder1Day(
  data: T.BookingData,
) {
  const d = { ...data, djPhone: DJ_PHONE, djEmail: DJ_EMAIL };
  await Promise.allSettled([
    sendSMS(d.clientPhone, T.sms_reminder1day_client(d)),
    sendSMS(DJ_PHONE, T.sms_reminder1day_dj(d)),
    sendEmail({
      to: d.clientEmail,
      ...T.email_reminder1day_client(d),
    }),
    sendEmail({
      to: DJ_EMAIL,
      ...T.email_reminder1day_dj(d),
    }),
  ]);
}

export async function notifyMorningOf(
  data: T.BookingData,
) {
  const d = { ...data, djPhone: DJ_PHONE, djEmail: DJ_EMAIL };
  await sendSMS(DJ_PHONE, T.sms_morningOf_dj(d));
}

export async function notifyPlaylistLocked(
  data: T.BookingData,
) {
  const d = { ...data, djPhone: DJ_PHONE, djEmail: DJ_EMAIL };
  await Promise.allSettled([
    sendSMS(d.clientPhone, T.sms_playlistLocked_client(d)),
    sendEmail({
      to: d.clientEmail,
      ...T.email_playlistLocked_client(d),
    }),
    sendSMS(DJ_PHONE, `[Playlist Locked] ${d.eventId} — ${d.clientName}`),
  ]);
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

