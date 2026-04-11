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
}

function formatDate(dateStr: string): string {
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
    `Hi ${d.clientName}, your booking with Page KillerCutz ` +
    `is CONFIRMED! Event ID: ${d.eventId}. ` +
    `${d.eventType} on ${formatDate(d.eventDate)} ` +
    `at ${d.venue}. ` +
    `Curate your playlist: ${baseUrl}/sign-in`
  );
}

export function sms_bookingConfirmed_dj(d: BookingData): string {
  return (
    `[New Booking] ${d.eventId} — ${d.clientName} ` +
    `(${d.clientPhone}). ${d.eventType} · ` +
    `${formatDate(d.eventDate)} · ${d.venue}. ` +
    `Check admin: ${baseUrl}/admin`
  );
}

export function sms_reminder7day_client(d: BookingData): string {
  return (
    `Hi ${d.clientName}, your event is in 7 days! ` +
    `(${formatDate(d.eventDate)} · ${d.venue}). ` +
    `Update your playlist: ${baseUrl}/playlist-portal`
  );
}

export function sms_reminder7day_dj(d: BookingData): string {
  return (
    `[7-Day Reminder] ${d.eventId} — ${d.clientName}. ` +
    `${d.eventType} on ${formatDate(d.eventDate)} ` +
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
    `${formatDate(d.eventDate)} has been locked ` +
    `by Page KillerCutz. See you on the night!`
  );
}

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080808;">
  <table width="100%" cellpadding="0" cellspacing="0"
    style="background:#080808;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="font-family:Arial,sans-serif;
               background:#0f0f0f;
               color:#f0ede8;
               max-width:600px;">
        <tr>
          <td style="background:#0f0f0f;
                     border-bottom:2px solid #00BFFF;
                     padding:24px 32px;">
            <span style="font-size:22px;
                         font-weight:900;
                         letter-spacing:4px;
                         color:#f0ede8;">
              PAGE <span style="color:#00BFFF;">KILLER</span>CUTZ
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;
                     background:#0f0f0f;
                     border:1px solid rgba(240,237,232,0.08);
                     border-top:none;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;
                     background:#080808;
                     border-top:1px solid rgba(240,237,232,0.08);">
            <p style="margin:0;
                      color:#6b6b6b;
                      font-size:11px;">
              Page KillerCutz · Accra, Ghana ·
              <a href="${baseUrl}"
                style="color:#6b6b6b;">
                pagekillercutz.com
              </a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function email_bookingConfirmed_client(
  d: BookingData,
): { subject: string; html: string } {
  return {
    subject: `Booking Confirmed — ${d.eventId} · Page KillerCutz`,
    html: emailWrapper(`
      <h1 style="font-size:28px;color:#f0ede8;margin:0 0 24px;">
        You're Booked.
      </h1>
      <p style="color:#aaa;font-size:15px;line-height:1.7;
                margin:0 0 24px;">
        Hi ${d.clientName}, your event has been confirmed.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:10px 0;
                     border-bottom:1px solid rgba(240,237,232,0.08);
                     color:#6b6b6b;font-size:12px;width:40%;">
            EVENT ID
          </td>
          <td style="padding:10px 0;
                     border-bottom:1px solid rgba(240,237,232,0.08);
                     color:#00BFFF;font-family:monospace;
                     font-size:16px;">
            ${d.eventId}
          </td>
        </tr>
      </table>
      <a href="${baseUrl}/sign-in"
        style="display:inline-block;margin-top:12px;
               background:#00BFFF;color:#000;
               font-weight:900;font-size:13px;
               letter-spacing:2px;text-transform:uppercase;
               padding:14px 32px;text-decoration:none;">
        Sign in to your portal →
      </a>
    `),
  };
}

export function email_bookingConfirmed_dj(
  d: BookingData,
): { subject: string; html: string } {
  return {
    subject: `[New Booking] ${d.eventId} — ${d.clientName}`,
    html: emailWrapper(`
      <h1 style="font-size:28px;color:#f0ede8;margin:0 0 24px;">
        New Booking
      </h1>
      <p style="color:#aaa;font-size:15px;line-height:1.7;">
        ${d.clientName} · ${d.eventType} · ${d.venue}
      </p>
      <a href="${baseUrl}/admin"
        style="display:inline-block;margin-top:24px;
               background:#00BFFF;color:#000;
               font-weight:900;font-size:13px;
               letter-spacing:2px;text-transform:uppercase;
               padding:14px 32px;text-decoration:none;">
        View in Admin →
      </a>
    `),
  };
}

export function email_reminder7day_client(
  d: BookingData,
): { subject: string; html: string } {
  return {
    subject: `7 Days to Go — Update Your Playlist · ${d.eventId}`,
    html: emailWrapper(`
      <h1 style="font-size:28px;color:#f0ede8;margin:0 0 16px;">
        7 Days to Go.
      </h1>
      <p style="color:#aaa;font-size:15px;line-height:1.7;">
        Hi ${d.clientName}, your event is coming up in one week.
      </p>
    `),
  };
}

export function email_reminder1day_client(
  d: BookingData,
): { subject: string; html: string } {
  return {
    subject: `Tomorrow! Final Check — ${d.eventId}`,
    html: emailWrapper(`
      <h1 style="font-size:28px;color:#f0ede8;margin:0 0 16px;">Tomorrow.</h1>
      <p style="color:#aaa;font-size:15px;line-height:1.7;">Hi ${d.clientName}, the big day is tomorrow.</p>
    `),
  };
}

export function email_reminder1day_dj(
  d: BookingData,
): { subject: string; html: string } {
  return {
    subject: `[Tomorrow] ${d.eventId} — ${d.clientName}`,
    html: emailWrapper(`
      <h1 style="font-size:28px;color:#f0ede8;margin:0 0 16px;">Event Tomorrow.</h1>
      <p style="color:#aaa;font-size:15px;line-height:1.7;">${d.clientName} · ${d.eventType} · ${d.venue}</p>
    `),
  };
}

export function email_playlistLocked_client(
  d: BookingData,
): { subject: string; html: string } {
  return {
    subject: `Your Playlist is Locked — ${d.eventId}`,
    html: emailWrapper(`
      <h1 style="font-size:28px;color:#f0ede8;margin:0 0 16px;">Playlist Locked.</h1>
      <p style="color:#aaa;font-size:15px;line-height:1.7;">Hi ${d.clientName}, your playlist has been finalised.</p>
    `),
  };
}
