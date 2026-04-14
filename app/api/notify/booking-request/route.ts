import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import type { NewBookingRequestPayload } from "@/lib/notify/newBookingRequest";
import { sendNewBookingRequestToDj } from "@/lib/notify/newBookingRequest";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const body = (await request.json()) as NewBookingRequestPayload;
    if (!body.eventId || !body.clientName) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    await sendNewBookingRequestToDj(body);
    return Response.json({ success: true });
  } catch (err) {
    logger.errorRaw("route", "[api/notify/booking-request]", err);
    return Response.json({ error: "Notification failed" }, { status: 500 });
  }
}
