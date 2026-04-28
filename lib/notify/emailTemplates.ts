/**
 * Branded transactional HTML emails — shared base + all templates.
 * Used by dispatch, API routes, and auth hook; Supabase dashboard copies in docs.
 */

import { PAGE_ICON_URL } from "../constants";

function esc(s: string | undefined | null): string {
  if (s == null || s === "") return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function baseTemplate(previewText: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Page KillerCutz</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #080810;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background: #080810;
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      padding-bottom: 32px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 32px;
    }
    .brand {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: #ffffff;
      text-transform: uppercase;
    }
    .brand span {
      color: #00BFFF;
    }
    .card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 16px;
    }
    .card-cyan {
      border-left: 3px solid #00BFFF;
    }
    .card-gold {
      border-left: 3px solid #F5A623;
    }
    .card-red {
      border-left: 3px solid #FF4560;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }
    p {
      font-size: 14px;
      color: #A0A8C0;
      line-height: 1.7;
      margin-bottom: 16px;
    }
    .label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #5A6080;
      margin-bottom: 4px;
      font-family: 'Courier New', monospace;
    }
    .value {
      font-size: 14px;
      color: #ffffff;
    }
    .event-id {
      font-family: 'Courier New', monospace;
      font-size: 22px;
      font-weight: 700;
      color: #00BFFF;
      letter-spacing: 0.05em;
    }
    .detail-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: #5A6080;
      width: 120px;
      flex-shrink: 0;
      font-family: 'Courier New', monospace;
      padding-top: 2px;
    }
    .detail-value {
      font-size: 14px;
      color: #ffffff;
      flex: 1;
    }
    .btn {
      display: inline-block;
      background: #00BFFF;
      color: #000000 !important;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 999px;
      margin-top: 8px;
    }
    .btn-outline {
      display: inline-block;
      background: transparent;
      color: #00BFFF !important;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 999px;
      border: 1px solid #00BFFF;
      margin-top: 8px;
    }
    .btn-gold {
      background: #F5A623;
      color: #000000 !important;
    }
    .momo-number {
      font-family: 'Courier New', monospace;
      font-size: 18px;
      color: #00BFFF;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .divider {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.06);
      margin: 24px 0;
    }
    .footer {
      text-align: center;
      padding-top: 32px;
      border-top: 1px solid rgba(255,255,255,0.06);
      margin-top: 32px;
    }
    .footer p {
      font-size: 11px;
      color: #5A6080;
      line-height: 1.6;
    }
    .footer a {
      color: #5A6080;
      text-decoration: none;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      font-family: 'Courier New', monospace;
    }
    .badge-cyan {
      background: rgba(0,191,255,0.12);
      border: 1px solid rgba(0,191,255,0.30);
      color: #00BFFF;
    }
    .badge-gold {
      background: rgba(245,166,35,0.12);
      border: 1px solid rgba(245,166,35,0.30);
      color: #F5A623;
    }
    .badge-green {
      background: rgba(34,197,94,0.12);
      border: 1px solid rgba(34,197,94,0.30);
      color: #22c55e;
    }
    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 6px 0;
    }
    .check-icon {
      color: #00BFFF;
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .check-text {
      font-size: 13px;
      color: #A0A8C0;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;overflow:hidden;color:#080810;">${esc(previewText)}</div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div style="margin-bottom:12px">
          <img
            src="${PAGE_ICON_URL}"
            alt="Page KillerCutz"
            width="44"
            height="44"
            style="
              display:inline-block;
              width:44px;
              height:44px;
              border-radius:12px;
            "
          />
        </div>
        <div class="brand">
          PAGE <span>KILLER</span>CUTZ
        </div>
      </div>
      ${content}
      <div class="footer">
        <p>
          Page KillerCutz · Accra, Ghana<br>
          <a href="https://pagekillercutz.com">
            pagekillercutz.com
          </a>
          &nbsp;·&nbsp;
          <a href="https://pagekillercutz.com/contact">
            Contact
          </a>
        </p>
        <p style="margin-top:8px;">
          You received this email because you
          have a booking or account with
          Page KillerCutz.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function emailVerification(confirmationUrl: string, name?: string): string {
  const greet = name ? `Hi ${esc(name)},` : "Hi there,";
  return baseTemplate(
    "Verify your Page KillerCutz account",
    `
    <div class="card">
      <p class="label">Account Verification</p>
      <h1>Verify Your Email</h1>
      <p>
        ${greet}
        welcome to Page KillerCutz.
        Click the button below to verify your
        email address and activate your account.
      </p>
      <p>
        Once verified, you can log in to your
        Playlist Portal and start curating
        your event music.
      </p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${confirmationUrl}" class="btn">
          Verify Email Address →
        </a>
      </div>
      <hr class="divider">
      <p style="font-size:12px;color:#5A6080;
        text-align:center;">
        This link expires in 24 hours.<br>
        If you didn't create this account,
        you can safely ignore this email.
      </p>
    </div>
    `,
  );
}

export function passwordReset(resetUrl: string, name?: string): string {
  const greet = name ? `Hi ${esc(name)},` : "Hi there,";
  return baseTemplate(
    "Reset your Page KillerCutz password",
    `
    <div class="card">
      <p class="label">Password Reset</p>
      <h1>Reset Your Password</h1>
      <p>
        ${greet}
        we received a request to reset your
        Page KillerCutz password.
        Click the button below to set a
        new password.
      </p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${resetUrl}" class="btn">
          Reset Password →
        </a>
      </div>
      <hr class="divider">
      <p style="font-size:12px;color:#5A6080;
        text-align:center;">
        This link expires in 1 hour.<br>
        If you didn't request a password reset,
        you can safely ignore this email.<br>
        Your password will not be changed.
      </p>
    </div>
    `,
  );
}

/** Magic link / OTP sign-in — same visual language as verification. */
export function emailMagicLink(confirmationUrl: string, name?: string): string {
  const greet = name ? `Hi ${esc(name)},` : "Hi there,";
  return baseTemplate(
    "Your Page KillerCutz sign in link",
    `
    <div class="card">
      <p class="label">Sign In</p>
      <h1>Your Sign-In Link</h1>
      <p>
        ${greet}
        click the button below to sign in to your Page KillerCutz account.
      </p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${confirmationUrl}" class="btn">
          Sign In →
        </a>
      </div>
      <hr class="divider">
      <p style="font-size:12px;color:#5A6080;
        text-align:center;">
        This link expires soon.<br>
        If you didn't request this email, you can safely ignore it.
      </p>
    </div>
    `,
  );
}

export function bookingRequestDJ(data: {
  eventId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventType: string;
  eventDate: string;
  venue: string;
  packageName: string;
  adminUrl: string;
}): string {
  return baseTemplate(
    `New Booking Request — ${esc(data.eventId)}`,
    `
    <div class="card card-cyan">
      <p class="label">New Booking Request</p>
      <h1>New Booking</h1>
      <p style="margin-bottom:0">
        A new booking request has been submitted.
        Review the details below and confirm
        or decline in the admin portal.
      </p>
    </div>
    <div class="card">
      <div class="detail-row">
        <span class="detail-label">Event ID</span>
        <span class="detail-value event-id">
          ${esc(data.eventId)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Client</span>
        <span class="detail-value">
          ${esc(data.clientName)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email</span>
        <span class="detail-value">
          ${esc(data.clientEmail)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phone</span>
        <span class="detail-value">
          ${esc(data.clientPhone)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Event Type</span>
        <span class="detail-value">
          ${esc(data.eventType)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">
          ${esc(data.eventDate)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Venue</span>
        <span class="detail-value">
          ${esc(data.venue)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Package</span>
        <span class="detail-value">
          ${esc(data.packageName || "Not selected")}
        </span>
      </div>
    </div>
    <div style="text-align:center">
      <a href="${esc(data.adminUrl)}" class="btn">
        Review in Admin Portal →
      </a>
    </div>
    `,
  );
}

/** DJ / admin — booking confirmed (not the same as new request). */
export function bookingConfirmedDj(data: {
  eventId: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  venue: string;
  adminUrl: string;
}): string {
  return baseTemplate(
    `Booking Confirmed — ${esc(data.eventId)}`,
    `
    <div class="card card-cyan">
      <p class="label">Booking Confirmed</p>
      <h1>Booking Confirmed</h1>
      <p style="margin-bottom:0">
        ${esc(data.clientName)}&apos;s booking has been confirmed.
      </p>
    </div>
    <div class="card">
      <div class="detail-row">
        <span class="detail-label">Event ID</span>
        <span class="detail-value event-id">${esc(data.eventId)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Type</span>
        <span class="detail-value">${esc(data.eventType)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">${esc(data.eventDate)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Venue</span>
        <span class="detail-value">${esc(data.venue)}</span>
      </div>
    </div>
    <div style="text-align:center">
      <a href="${esc(data.adminUrl)}" class="btn">View in Admin →</a>
    </div>
    `,
  );
}

export function bookingConfirmedClient(data: {
  eventId: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  venue: string;
  packageName: string;
  djMomo: string;
  portalUrl: string;
}): string {
  return baseTemplate(
    `Booking Confirmed — ${esc(data.eventId)}`,
    `
    <div class="card card-cyan">
      <p class="label">Booking Confirmed</p>
      <h1>You're Booked! 🎧</h1>
      <p>
        Hi ${esc(data.clientName)}, your booking
        with Page KillerCutz has been confirmed.
        Here are your event details.
      </p>
    </div>
    <div class="card">
      <p class="label" style="margin-bottom:8px;">
        Your Event ID
      </p>
      <div class="event-id"
        style="margin-bottom:20px;font-size:26px;">
        ${esc(data.eventId)}
      </div>
      <p style="font-size:12px;color:#5A6080;
        margin-bottom:20px;">
        Save this ID. You will need it to make
        payment and access your Playlist Portal.
      </p>
      <div class="detail-row">
        <span class="detail-label">Event</span>
        <span class="detail-value">
          ${esc(data.eventType)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">
          ${esc(data.eventDate)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Venue</span>
        <span class="detail-value">
          ${esc(data.venue)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Package</span>
        <span class="detail-value">
          ${esc(data.packageName)}
        </span>
      </div>
    </div>
    <div class="card card-gold">
      <h2>How to Complete Payment</h2>
      <p>
        Send your service fee via Mobile Money
        or bank transfer. Use your Event ID as
        the payment reference or narration.
      </p>
      <p class="label">DJ Mobile Money</p>
      <div class="momo-number">
        ${esc(data.djMomo)}
      </div>
      <p style="font-size:12px;color:#5A6080;
        margin-top:8px;margin-bottom:0">
        Reference: ${esc(data.eventId)}
      </p>
    </div>
    <div class="card">
      <h2>Next Step: Curate Your Playlist</h2>
      <p>
        Log in to your Playlist Portal to add
        must-play songs, block tracks you don't
        want, and set your event timeline.
      </p>
      <div class="checklist-item">
        <span class="check-icon">✓</span>
        <span class="check-text">
          Add your must-play songs
        </span>
      </div>
      <div class="checklist-item">
        <span class="check-icon">✓</span>
        <span class="check-text">
          Block songs you don't want played
        </span>
      </div>
      <div class="checklist-item">
        <span class="check-icon">✓</span>
        <span class="check-text">
          Set your event timeline and key moments
        </span>
      </div>
      <div style="text-align:center;margin-top:20px">
        <a href="${esc(data.portalUrl)}" class="btn">
          Open Playlist Portal →
        </a>
      </div>
    </div>
    `,
  );
}

export function paymentConfirmedClient(data: {
  eventId: string;
  clientName: string;
  eventDate: string;
  venue: string;
  packageName: string;
  portalUrl: string;
}): string {
  return baseTemplate(
    `Payment Confirmed — ${esc(data.eventId)}`,
    `
    <div class="card card-cyan">
      <p class="label">Payment Confirmed</p>
      <h1>Payment Received ✓</h1>
      <p>
        Hi ${esc(data.clientName)}, we have received
        and confirmed your payment for
        ${esc(data.eventId)}.
        Your booking is now fully confirmed.
      </p>
    </div>
    <div class="card">
      <div class="detail-row">
        <span class="detail-label">Event ID</span>
        <span class="detail-value event-id"
          style="font-size:16px;">
          ${esc(data.eventId)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">
          ${esc(data.eventDate)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Venue</span>
        <span class="detail-value">
          ${esc(data.venue)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Package</span>
        <span class="detail-value">
          ${esc(data.packageName)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value">
          <span class="status-badge badge-green">
            Paid
          </span>
        </span>
      </div>
    </div>
    <div style="text-align:center">
      <p style="color:#A0A8C0;font-size:14px;">
        Make sure your playlist is ready
        before the event.
      </p>
      <a href="${esc(data.portalUrl)}" class="btn">
        Open Playlist Portal →
      </a>
    </div>
    `,
  );
}

export function playlistLockedClient(data: {
  eventId: string;
  clientName: string;
  eventDate: string;
  venue: string;
  portalUrl: string;
}): string {
  return baseTemplate(
    `Your Playlist is Locked — ${esc(data.eventId)}`,
    `
    <div class="card card-cyan">
      <p class="label">Playlist Locked</p>
      <h1>Your Playlist is Set 🎵</h1>
      <p>
        Hi ${esc(data.clientName)}, Page KillerCutz
        has reviewed and finalised your playlist
        for ${esc(data.eventDate)} at ${esc(data.venue)}.
      </p>
      <p>
        Everything is locked in and ready.
        See you on the night!
      </p>
    </div>
    <div class="card">
      <div class="detail-row">
        <span class="detail-label">Event ID</span>
        <span class="detail-value event-id"
          style="font-size:16px;">
          ${esc(data.eventId)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">
          ${esc(data.eventDate)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Venue</span>
        <span class="detail-value">
          ${esc(data.venue)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value">
          <span class="status-badge badge-cyan">
            Locked
          </span>
        </span>
      </div>
    </div>
    <div style="text-align:center">
      <p style="color:#A0A8C0;font-size:14px;">
        You can still view your playlist
        in the portal.
      </p>
      <a href="${esc(data.portalUrl)}" class="btn-outline">
        View My Playlist →
      </a>
    </div>
    `,
  );
}

export function reminder7DayClient(data: {
  eventId: string;
  clientName: string;
  eventDate: string;
  venue: string;
  portalUrl: string;
}): string {
  return baseTemplate(
    `7 Days to Go — ${esc(data.eventId)}`,
    `
    <div class="card card-cyan">
      <p class="label">Event Reminder</p>
      <h1>7 Days to Go! 🎧</h1>
      <p>
        Hi ${esc(data.clientName)}, your event is
        coming up in one week.
        Make sure your playlist is ready
        before it gets locked.
      </p>
    </div>
    <div class="card">
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">
          ${esc(data.eventDate)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Venue</span>
        <span class="detail-value">
          ${esc(data.venue)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Event ID</span>
        <span class="detail-value event-id"
          style="font-size:16px;">
          ${esc(data.eventId)}
        </span>
      </div>
    </div>
    <div style="text-align:center">
      <a href="${esc(data.portalUrl)}" class="btn">
        Update My Playlist →
      </a>
    </div>
    `,
  );
}

export function reminder1DayClient(data: {
  eventId: string;
  clientName: string;
  eventDate: string;
  venue: string;
  portalUrl: string;
}): string {
  return baseTemplate(
    `Tomorrow! Final Check — ${esc(data.eventId)}`,
    `
    <div class="card card-cyan">
      <p class="label">Event Tomorrow</p>
      <h1>Tomorrow is the Night! 🎉</h1>
      <p>
        Hi ${esc(data.clientName)}, the big day
        is tomorrow at ${esc(data.venue)}.
        This is your last chance to update
        your playlist before it gets locked.
      </p>
    </div>
    <div class="card">
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">
          ${esc(data.eventDate)}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Venue</span>
        <span class="detail-value">
          ${esc(data.venue)}
        </span>
      </div>
    </div>
    <div style="text-align:center">
      <a href="${esc(data.portalUrl)}" class="btn">
        Final Playlist Check →
      </a>
      <p style="margin-top:16px;font-size:13px;
        color:#5A6080;">
        See you tomorrow. — Page KillerCutz
      </p>
    </div>
    `,
  );
}

export function reminder1DayDj(data: {
  eventId: string;
  clientName: string;
  eventType: string;
  venue: string;
  adminUrl: string;
}): string {
  return baseTemplate(
    `[Tomorrow] ${esc(data.eventId)} — ${esc(data.clientName)}`,
    `
    <div class="card card-cyan">
      <p class="label">Event Tomorrow</p>
      <h1>Event Tomorrow</h1>
      <p>
        ${esc(data.clientName)} · ${esc(data.eventType)} · ${esc(data.venue)}
      </p>
    </div>
    <div style="text-align:center">
      <a href="${esc(data.adminUrl)}" class="btn">Review in Admin →</a>
    </div>
    `,
  );
}

export function orderPlacedClient(data: {
  orderNumber: string;
  customerName: string;
  items: {
    name: string;
    size: string;
    colour: string;
    qty: number;
    price: number;
  }[];
  total: number;
  djMomo: string;
  trackUrl: string;
}): string {
  const itemRows = data.items
    .map((item) => {
      const line = `${item.qty}× — Size: ${esc(item.size)} · ${esc(item.colour)} · GHS ${item.price.toLocaleString("en-GH")}`;
      return `
    <div class="detail-row">
      <span class="detail-label">
        ${esc(item.name)}
      </span>
      <span class="detail-value">
        ${line}
      </span>
    </div>
  `;
    })
    .join("");

  return baseTemplate(
    `Order Placed — ${esc(data.orderNumber)}`,
    `
    <div class="card card-cyan">
      <p class="label">Order Placed</p>
      <h1>Order Received ✓</h1>
      <p>
        Hi ${esc(data.customerName)}, your
        Page KillerCutz merch order has been
        placed. Complete your payment to
        confirm the order.
      </p>
    </div>
    <div class="card">
      <p class="label" style="margin-bottom:8px">
        Your Order ID
      </p>
      <div class="event-id"
        style="margin-bottom:20px">
        ${esc(data.orderNumber)}
      </div>
      ${itemRows}
      <div class="detail-row"
        style="border-top:1px solid rgba(255,255,255,0.10);
               margin-top:8px;padding-top:12px;">
        <span class="detail-label"
          style="color:#ffffff;font-size:12px">
          Total
        </span>
        <span class="detail-value"
          style="font-size:18px;font-weight:700;
                 color:#F5A623">
          GHS ${data.total.toLocaleString("en-GH")}
        </span>
      </div>
    </div>
    <div class="card card-gold">
      <h2>Complete Your Payment</h2>
      <p>
        Send payment via Mobile Money or bank
        transfer. Use your Order ID as the
        payment reference or narration.
      </p>
      <p class="label">Mobile Money</p>
      <div class="momo-number">${esc(data.djMomo)}</div>
      <p style="font-size:12px;color:#5A6080;
        margin-top:8px;margin-bottom:0">
        Reference: ${esc(data.orderNumber)}
      </p>
    </div>
    <div style="text-align:center">
      <a href="${esc(data.trackUrl)}" class="btn-outline">
        Track My Order →
      </a>
    </div>
    `,
  );
}

export function orderShippedClient(data: {
  orderNumber: string;
  customerName: string;
  trackUrl: string;
}): string {
  return baseTemplate(
    `Your Order is On Its Way — ${esc(data.orderNumber)}`,
    `
    <div class="card card-cyan">
      <p class="label">Order Shipped</p>
      <h1>It's On Its Way! 📦</h1>
      <p>
        Hi ${esc(data.customerName)}, your
        Page KillerCutz order
        ${esc(data.orderNumber)} has been
        dispatched and is on its way to you.
      </p>
      <p>
        Expected delivery: 1–3 business days
        within Accra. Longer for other regions.
      </p>
    </div>
    <div style="text-align:center">
      <a href="${esc(data.trackUrl)}" class="btn">
        Track My Order →
      </a>
    </div>
    `,
  );
}

export function orderDeliveredClient(data: {
  orderNumber: string;
  customerName: string;
}): string {
  return baseTemplate(
    `Order Delivered — ${esc(data.orderNumber)}`,
    `
    <div class="card card-cyan">
      <p class="label">Order Delivered</p>
      <h1>Delivered! 🎉</h1>
      <p>
        Hi ${esc(data.customerName)}, your
        Page KillerCutz order
        ${esc(data.orderNumber)} has been delivered.
      </p>
      <p>
        We hope you love it. Tag us when
        you wear it —
        @pagekillercutz
      </p>
    </div>
    <div style="text-align:center">
      <p style="color:#A0A8C0;font-size:14px;
        margin-bottom:16px">
        Thank you for supporting
        Page KillerCutz.
      </p>
    </div>
    `,
  );
}

export function orderPaymentConfirmedClient(data: {
  orderNumber: string;
  customerName: string;
  trackUrl: string;
}): string {
  return baseTemplate(
    `Payment confirmed — ${esc(data.orderNumber)}`,
    `
    <div class="card card-gold">
      <p class="label">Payment received</p>
      <h1>Thanks, ${esc(data.customerName)}</h1>
      <p>
        Your payment for order ${esc(data.orderNumber)} has been
        confirmed. Your order is being processed.
      </p>
    </div>
    <div style="text-align:center">
      <a href="${esc(data.trackUrl)}" class="btn">
        Track My Order →
      </a>
    </div>
    `,
  );
}

export function adminWelcomeEmail(data: {
  email: string;
  role: string;
  loginUrl: string;
  temporaryPassword: string;
}): string {
  return baseTemplate(
    `You've been added as an admin`,
    `
    <div class="card card-cyan">
      <h1>Admin access</h1>
      <p>
        An account was created for
        <strong>${esc(data.email)}</strong>
        with role <strong>${esc(data.role)}</strong>.
      </p>
      <p class="label">Temporary password</p>
      <p style="font-family:monospace;font-size:16px;
        letter-spacing:0.05em">
        ${esc(data.temporaryPassword)}
      </p>
      <p>
        Sign in at
        <a href="${esc(data.loginUrl)}">${esc(data.loginUrl)}</a>
        and change your password after first login.
      </p>
    </div>
    `,
  );
}

export function adminInviteEmail(data: {
  email: string;
  role: string;
  invitedBy: string;
  setupUrl: string;
  loginUrl: string;
}): string {
  const roleLabel = data.role === "super_admin" ? "Super Admin" : "Admin";
  const roleDescription =
    data.role === "super_admin"
      ? "Full access to all admin features including accounts management, audit logs, and platform settings."
      : "Access to bookings, playlists, orders, packages, music, events, and merch management.";

  return baseTemplate(
    "You've been invited to Page KillerCutz Admin",
    `
    <div class="card" style="border-left:3px solid #a78bfa;">
      <p class="label" style="color:#a78bfa;">Admin Invite</p>
      <h1>You're Invited</h1>
      <p>
        You've been added as a
        <strong style="color:#ffffff;">${esc(roleLabel)}</strong>
        on the Page KillerCutz Admin Console by ${esc(data.invitedBy)}.
      </p>
    </div>

    <div class="card">
      <div class="detail-row">
        <span class="detail-label">Email</span>
        <span class="detail-value">${esc(data.email)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Role</span>
        <span class="detail-value">
          <span style="
            display:inline-block;
            padding:3px 10px;
            border-radius:999px;
            font-size:11px;
            font-weight:700;
            letter-spacing:0.10em;
            text-transform:uppercase;
            font-family:'Courier New',monospace;
            background:rgba(167,139,250,0.12);
            border:1px solid rgba(167,139,250,0.30);
            color:#a78bfa;
          ">${esc(roleLabel)}</span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Access</span>
        <span class="detail-value" style="font-size:13px;color:#A0A8C0;">${esc(roleDescription)}</span>
      </div>
    </div>

    <div style="
      background:rgba(167,139,250,0.06);
      border:1px solid rgba(167,139,250,0.15);
      border-radius:16px;
      padding:32px;
      margin-bottom:16px;
      text-align:center;
    ">
      <p style="color:#A0A8C0;margin-bottom:20px;">
        Click the button below to set your password and activate your admin account.
        No email confirmation required.
      </p>
      <a href="${esc(data.setupUrl)}" style="
        display:inline-block;
        background:#a78bfa;
        color:#000000;
        font-size:13px;
        font-weight:700;
        letter-spacing:0.08em;
        text-transform:uppercase;
        text-decoration:none;
        padding:14px 32px;
        border-radius:999px;
      ">
        Set My Password →
      </a>
      <p style="font-size:12px;color:#5A6080;margin-top:16px;margin-bottom:0;">
        This link expires in 24 hours.
      </p>
    </div>

    <div class="card" style="background:rgba(255,255,255,0.02);">
      <p style="font-size:13px;color:#A0A8C0;margin:0;text-align:center;">
        After setting your password, sign in at<br>
        <a href="${esc(data.loginUrl)}" style="color:#a78bfa;">
          ${esc(data.loginUrl.replace(/^https?:\/\//, ""))}
        </a>
      </p>
    </div>
    `,
  );
}

export function accountSetupEmail(data: {
  clientName: string;
  eventId: string;
  setupUrl: string;
  portalUrl: string;
}): string {
  return baseTemplate(
    "Set up your Page KillerCutz account",
    `
    <div class="card card-cyan">
      <p class="label">Account Setup</p>
      <h1>Set Up Your Account</h1>
      <p>
        Hi ${esc(data.clientName)}, your booking
        with Page KillerCutz has created
        an account for you.
      </p>
      <p>
        Click the button below to set your
        password and access your
        Playlist Portal.
      </p>
    </div>
    <div class="card">
      <p class="label" style="margin-bottom:8px">
        Your Event ID
      </p>
      <div class="event-id" style="margin-bottom:16px">
        ${esc(data.eventId)}
      </div>
      <p style="font-size:13px;
        color:#A0A8C0;margin-bottom:0">
        Use this ID to access your
        playlist portal and as your
        payment reference.
      </p>
    </div>
    <div style="text-align:center;
      margin-bottom:24px">
      <a href="${esc(data.setupUrl)}" class="btn">
        Set My Password →
      </a>
      <p style="font-size:12px;
        color:#5A6080;margin-top:12px">
        This link expires in 24 hours.
      </p>
    </div>
    <div class="card"
      style="background:rgba(0,191,255,0.04)">
      <p style="font-size:13px;
        color:#A0A8C0;margin:0">
        After setting your password,
        sign in at
        <a href="${esc(data.portalUrl)}"
          style="color:#00BFFF">
          ${esc(data.portalUrl.replace(/^https?:\/\//, ""))}
        </a>
        to curate your event playlist.
      </p>
    </div>
    `,
  );
}

export function contractSigningEmail(data: {
  clientName: string;
  eventId: string;
  eventDate: string;
  dashboardUrl: string;
  expiresIn?: string;
}): string {
  return baseTemplate(
    "Please sign your service agreement",
    `
    <div class="card">
      <h1>Your booking is confirmed</h1>
      <p>
        Hi ${esc(data.clientName)},
      </p>
      <p>
        Your booking for
        <strong>${esc(data.eventId)}</strong>
        on ${esc(data.eventDate)} has been
        confirmed by PAGE KillerCutz.
      </p>
      <p>
        Before you can curate your playlist,
        please review and sign your service
        agreement. This takes less than
        2 minutes.
      </p>
    </div>

    <div class="card" style="border-left: 3px solid #00BFFF;">
      <p class="label">Next step</p>
      <p>
        Click the button below to go to
        your dashboard. Your service
        agreement will be ready to sign
        there.
      </p>
    </div>

    <div style="text-align:center; margin: 24px 0;">
      <a href="${esc(data.dashboardUrl)}" class="btn">
        Sign My Agreement &amp; Get Started →
      </a>
    </div>

    <div class="card" style="background: rgba(0,0,0,0.04);">
      <div class="detail-row">
        <span class="detail-label">Event ID</span>
        <span class="detail-value event-id">${esc(data.eventId)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Event Date</span>
        <span class="detail-value">${esc(data.eventDate)}</span>
      </div>
    </div>

    <p style="text-align:center; color: #888; font-size: 12px;">
      If you have already signed your
      agreement, clicking this button
      will take you straight to your
      playlist portal.
    </p>
    `,
  );
}

export function bookingRequestReceivedEmail(data: {
  clientName: string;
  eventId: string;
  portalUrl: string;
}): string {
  return baseTemplate(
    `New booking — ${esc(data.eventId)}`,
    `
    <div class="card card-cyan">
      <p class="label">Booking received</p>
      <h1>Hi ${esc(data.clientName)}</h1>
      <p>
        Your booking request has been received.
        We&apos;ll be in touch to confirm the details.
      </p>
    </div>
    <div class="card">
      <p class="label" style="margin-bottom:8px">Your Event ID</p>
      <div class="event-id">${esc(data.eventId)}</div>
      <p style="font-size:13px;color:#A0A8C0;margin-bottom:0;margin-top:12px">
        Save this ID for your payment reference and playlist portal.
      </p>
    </div>
    <div style="text-align:center;margin-top:8px">
      <a href="${esc(data.portalUrl)}" class="btn">
        Sign in to manage your playlist →
      </a>
    </div>
    `,
  );
}

export function urgentRequestEmail(data: {
  eventId: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  eventStartTime: string;
  venue: string;
  packageName: string;
  adminUrl: string;
}): string {
  return baseTemplate(`URGENT: Booking Request — ${esc(data.eventDate)}`, `
    <div class="card card-red">
      <p class="label" style="color:#FF4560;">URGENT — DATE ALREADY BOOKED</p>
      <h1>New Booking Request</h1>
      <p>
        A client has requested this date which is already heavily committed or blocked.
        Please review and decide quickly.
      </p>
    </div>
    <div class="card">
      <div class="detail-row">
        <span class="detail-label">Event ID</span>
        <span class="detail-value event-id">${esc(data.eventId)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Client</span>
        <span class="detail-value">${esc(data.clientName)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phone</span>
        <span class="detail-value">${esc(data.clientPhone)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">${esc(data.eventDate)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Start Time</span>
        <span class="detail-value">${esc(data.eventStartTime || "Not specified")}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Venue</span>
        <span class="detail-value">${esc(data.venue)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Package</span>
        <span class="detail-value">${esc(data.packageName || "Not selected")}</span>
      </div>
    </div>
    <div style="text-align:center">
      <a href="${esc(data.adminUrl)}" class="btn" style="background:#FF4560;color:#fff;">
        Review Request Now →
      </a>
    </div>
    `);
}

export function bookingRequestAcceptedClient(data: {
  clientName: string;
  eventId: string;
  eventDate: string;
  venue: string;
  packageName: string;
  djMomo: string;
  portalUrl: string;
}): string {
  const pkg = esc(data.packageName || "Your package");
  return baseTemplate(`Your booking request was accepted — ${esc(data.eventId)}`, `
    <div class="card card-cyan">
      <p class="label">Request accepted</p>
      <h1>Hi ${esc(data.clientName)}</h1>
      <p>
        Great news — Page KillerCutz can accommodate your event. Your booking is now pending payment.
        Complete payment using your Event ID as the reference to secure the date.
      </p>
    </div>
    <div class="card">
      <div class="detail-row">
        <span class="detail-label">Event ID</span>
        <span class="detail-value event-id">${esc(data.eventId)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">${esc(data.eventDate)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Venue</span>
        <span class="detail-value">${esc(data.venue)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Package</span>
        <span class="detail-value">${pkg}</span>
      </div>
    </div>
    <div class="card card-gold">
      <p class="label">DJ Mobile Money</p>
      <div class="momo-number">${esc(data.djMomo)}</div>
      <p style="font-size:12px;color:#5A6080;margin-top:8px;margin-bottom:0">
        Reference: ${esc(data.eventId)}
      </p>
    </div>
    <div style="text-align:center">
      <a href="${esc(data.portalUrl)}" class="btn">Open Playlist Portal →</a>
    </div>
    `);
}

export function bookingRequestDeclinedClient(data: {
  clientName: string;
  eventId: string;
  eventDate: string;
}): string {
  return baseTemplate(`Update on your booking request — ${esc(data.eventId)}`, `
    <div class="card">
      <p class="label">Booking request</p>
      <h1>Hi ${esc(data.clientName)}</h1>
      <p>
        Thank you for your interest in Page KillerCutz. Unfortunately we are unable to accommodate
        your request for <strong>${esc(data.eventDate)}</strong> (Event ID ${esc(data.eventId)}).
      </p>
      <p>
        If you would like to explore another date, please submit a new booking on our website.
      </p>
    </div>
    `);
}

export function reviewRequestEmail(data: {
  clientName: string;
  eventType: string | null;
  reviewUrl: string;
}): string {
  return baseTemplate("How was your Page KillerCutz experience?", `
    <div class="card card-cyan">
      <p class="label">Post-event feedback</p>
      <h1>How was your event?</h1>
      <p>
        Hi ${esc(data.clientName)}, thanks again for booking Page KillerCutz${data.eventType ? ` for your ${esc(data.eventType)}` : ""}.
        We would love to hear your feedback.
      </p>
      <p>
        Your review helps future clients and helps us keep improving.
      </p>
    </div>
    <div style="text-align:center">
      <a href="${esc(data.reviewUrl)}" class="btn">
        Leave a Review →
      </a>
    </div>
    `);
}
