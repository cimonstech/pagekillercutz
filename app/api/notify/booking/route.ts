/**
 * @deprecated Client-triggered “booking confirmed” notifications are removed.
 * New submissions: DJ-only via POST /api/bookings (server) → sendNewBookingRequestToDj.
 * Admin confirm: POST /api/notify/booking-confirmed
 */
export async function POST() {
  return Response.json(
    {
      error:
        "Deprecated. Booking submission notifies the DJ on the server. Use POST /api/notify/booking-request to test DJ delivery.",
    },
    { status: 410 },
  );
}
