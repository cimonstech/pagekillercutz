import { sendEmail } from "./email";
import { sendSMS } from "./sms";
import * as ET from "./emailTemplates";

export type NewBookingRequestPayload = {
  eventId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventType: string;
  eventDate: string;
  venue: string;
  packageName: string | null;
};

const baseUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://pagekillercutz.com";

/** DJ only — new booking request submitted (Trigger 1). */
export async function sendNewBookingRequestToDj(payload: NewBookingRequestPayload): Promise<void> {
  const DJ_PHONE = process.env.DJ_PHONE;
  const DJ_EMAIL = process.env.DJ_EMAIL;
  if (!DJ_PHONE || !DJ_EMAIL) {
    throw new Error("DJ_PHONE or DJ_EMAIL not configured");
  }

  const eventDate = new Date(`${payload.eventDate}T00:00:00`).toLocaleDateString("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sms =
    `[New Booking Request] ${payload.eventId}\n` +
    `${payload.clientName} (${payload.clientPhone})\n` +
    `${payload.eventType} · ${eventDate}\n` +
    `${payload.venue}\n` +
    `Package: ${payload.packageName || "Not selected"}\n` +
    `Review: ${baseUrl()}/admin`;

  await sendSMS(DJ_PHONE, sms);

  await sendEmail({
    to: DJ_EMAIL,
    subject: `[New Booking Request] ${payload.eventId} — ${payload.clientName}`,
    html: ET.bookingRequestDJ({
      eventId: payload.eventId,
      clientName: payload.clientName,
      clientEmail: payload.clientEmail,
      clientPhone: payload.clientPhone,
      eventType: payload.eventType,
      eventDate,
      venue: payload.venue,
      packageName: payload.packageName || "Not selected",
      adminUrl: `${baseUrl().replace(/\/$/, "")}/admin`,
    }),
  });
}
