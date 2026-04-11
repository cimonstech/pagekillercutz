import { logger } from "@/lib/logger";
import { notifyBookingConfirmed } from "@/lib/notify/dispatch";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string>;
    if (!body.eventId || !body.clientEmail || !body.clientPhone) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    notifyBookingConfirmed({
      eventId: body.eventId,
      clientName: body.clientName ?? "",
      clientEmail: body.clientEmail,
      clientPhone: body.clientPhone,
      eventType: body.eventType ?? "",
      eventDate: body.eventDate ?? "",
      venue: body.venue ?? "",
      djPhone: process.env.DJ_PHONE!,
      djEmail: process.env.DJ_EMAIL!,
      portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/sign-in`,
    }).catch((err) => {
      logger.errorRaw("route", "[api/notify/booking] Error:", err);
    });
    return Response.json({ success: true, message: "Notifications queued" });
  } catch (err) {
    logger.errorRaw("route", "[api/notify/booking]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

