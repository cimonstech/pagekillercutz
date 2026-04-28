import { authCallbackUrl, getPublicSiteUrl } from "@/lib/auth/site-url";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/notify/email";
import {
  accountSetupEmail,
  bookingRequestReceivedEmail,
  urgentRequestEmail,
} from "@/lib/notify/emailTemplates";
import { getDjSmsRecipients } from "@/lib/notify/djPhones";
import { sendNewBookingRequestToDj } from "@/lib/notify/newBookingRequest";
import { sendSMS } from "@/lib/notify/sms";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { bookingSchema } from "@/lib/validation/schemas";
import { validate } from "@/lib/validation/validate";

const bookingLimiter = rateLimit({ interval: 60 * 60 * 1000, limit: 5 });

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

export type ClientAuthProvisionResult = "existing_user" | "invite_sent" | "failed";

async function provisionClientAuthAfterBooking(
  admin: ReturnType<typeof getSupabaseAdmin>,
  row: BookingRow,
  clientName: string,
): Promise<ClientAuthProvisionResult> {
  const emailNorm = row.client_email.trim().toLowerCase();
  const portalUrl = `${getPublicSiteUrl()}/sign-in`;

  const { data: existingUsers, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) {
    logger.errorRaw("route", "[api/bookings] listUsers:", listErr);
    return "failed";
  }

  const alreadyExists =
    existingUsers?.users?.some((u) => u.email?.trim().toLowerCase() === emailNorm) ?? false;

  if (alreadyExists) {
    const emailResult = await sendEmail({
      to: row.client_email.trim(),
      subject: `New Booking — ${row.event_id}`,
      html: bookingRequestReceivedEmail({
        clientName,
        eventId: row.event_id,
        portalUrl,
      }),
    });
    if (!emailResult.success) {
      logger.errorRaw("route", "[api/bookings] existing-user notify email:", emailResult.error);
    }
    return "existing_user";
  }

  const tempPassword =
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2).toUpperCase() +
    "!1";

  const { error: authError } = await admin.auth.admin.createUser({
    email: row.client_email.trim(),
    password: tempPassword,
    email_confirm: false,
    user_metadata: {
      full_name: clientName,
      phone: row.client_phone,
    },
  });

  if (authError) {
    logger.errorRaw("route", "[api/bookings] Auth account creation failed:", authError.message);
    return "failed";
  }

  logger.infoRaw("route", "[api/bookings] Auth account created for:", row.client_email.trim());

  const redirectTo = authCallbackUrl("/reset-password?step=3");
  const { data: resetLink, error: linkErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: row.client_email.trim(),
    options: { redirectTo },
  });

  if (linkErr) {
    logger.errorRaw("route", "[api/bookings] generateLink:", linkErr);
    return "failed";
  }

  const setupUrl = resetLink?.properties?.action_link;
  if (!setupUrl) {
    logger.errorRaw("route", "[api/bookings] generateLink missing action_link");
    return "failed";
  }

  const emailResult = await sendEmail({
    to: row.client_email.trim(),
    subject: "Set up your Page KillerCutz account",
    html: accountSetupEmail({
      clientName,
      eventId: row.event_id,
      setupUrl,
      portalUrl,
    }),
  });
  if (!emailResult.success) {
    logger.errorRaw("route", "[api/bookings] account setup email:", emailResult.error);
  }

  const smsBody = `Page KillerCutz: Check email at ${row.client_email.trim()} to set your password and open your playlist portal. Event ID: ${row.event_id}.`;
  const smsResult = await sendSMS(row.client_phone, smsBody);
  if (!smsResult.success) logger.errorRaw("route", "[api/bookings] client SMS:", smsResult.error ?? "unknown");

  return "invite_sent";
}

function padTimePart(n: string, width = 2): string {
  const d = n.replace(/\D/g, "");
  return d.padStart(width, "0").slice(-width);
}

function eventStartTimeToSqlTime(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const m = input.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return `${padTimePart(m[1]!)}:${padTimePart(m[2]!)}:00`;
}

async function notifyAdminsUrgentBookingRequest(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  bookingDbId: string;
  eventId: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  eventStartTime: string;
  venue: string;
  packageName: string | null;
}) {
  const BASE_URL = getPublicSiteUrl().replace(/\/$/, "");
  const adminUrl = `${BASE_URL}/admin/bookings`;
  const { data: regularAdmins } = await params.supabase
    .from("admins")
    .select("email")
    .eq("role", "admin")
    .eq("status", "active");

  const phones = getDjSmsRecipients();
  const smsBody = `URGENT — Booking request for ${params.eventDate} (fully booked / blocked). ${params.clientName}. Review: ${adminUrl}`;
  if (phones.length) {
    const r = await sendSMS(phones, smsBody, {
      type: "urgent_booking_request",
      bookingId: params.bookingDbId,
    });
    if (!r.success) logger.errorRaw("route", "[api/bookings] urgent request SMS:", r.error);
  }

  for (const row of regularAdmins ?? []) {
    const to = row.email?.trim();
    if (!to) continue;
    const result = await sendEmail({
      to,
      subject: `URGENT: Booking Request — ${params.eventDate} may be unavailable`,
      html: urgentRequestEmail({
        eventId: params.eventId,
        clientName: params.clientName,
        clientPhone: params.clientPhone,
        eventDate: params.eventDate,
        eventStartTime: params.eventStartTime,
        venue: params.venue,
        packageName: params.packageName ?? "Not selected",
        adminUrl,
      }),
      type: "urgent_booking_request_email",
      bookingId: params.bookingDbId,
    });
    if (!result.success) logger.errorRaw("route", "[api/bookings] urgent request email:", result.error);
  }
}

function normalizeGhanaPhone(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (t.startsWith("+")) return t.replace(/\s/g, "");
  const digits = t.replace(/\D/g, "");
  if (digits.startsWith("233")) return `+${digits}`;
  return `+233${digits.replace(/^0+/, "")}`;
}

export async function GET(request: Request) {
  try {
    const userSupabase = await createServerClient();
    const {
      data: { user },
    } = await userSupabase.auth.getUser();

    const adminClient = getSupabaseAdmin();

    let isAdmin = false;
    if (user?.email) {
      const { data: adminRecord } = await adminClient
        .from("admins")
        .select("role, status")
        .ilike("email", user.email)
        .maybeSingle();
      isAdmin = !!(adminRecord && adminRecord.status === "active");
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = Number(searchParams.get("limit") ?? "20");
    const offset = Number(searchParams.get("offset") ?? "0");

    if (!isAdmin) {
      if (!user?.email) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const forcedEmail = user.email.trim();

      let query = adminClient
        .from("bookings")
        .select("*", { count: "exact" })
        .ilike("client_email", forcedEmail)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq("status", status as BookingRow["status"]);
      }
      if (search) {
        const term = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
        query = query.or(
          `client_name.ilike.${term},client_email.ilike.${term},event_id.ilike.${term}`,
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return Response.json({ bookings: (data ?? []) as BookingRow[], count: count ?? 0 });
    }

    let query = adminClient
      .from("bookings")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status as BookingRow["status"]);
    }
    if (search) {
      const term = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
      query = query.or(`client_name.ilike.${term},client_email.ilike.${term},event_id.ilike.${term}`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return Response.json({ bookings: (data ?? []) as BookingRow[], count: count ?? 0 });
  } catch (error) {
    logger.errorRaw("route", "[api/bookings] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success: underLimit } = bookingLimiter.check(ip);
    if (!underLimit) {
      logger.warn("bookings", `Rate limit exceeded for IP: ${ip}`);
      return Response.json(
        { error: "Too many booking attempts. Please try again in an hour." },
        {
          status: 429,
          headers: {
            "Retry-After": "3600",
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    const raw = await request.json();
    const validation = validate(bookingSchema, raw);
    if (!validation.success) {
      return Response.json({ error: validation.error, details: validation.details }, { status: 400 });
    }
    const b = validation.data;

    const supabase = getSupabaseAdmin();

    const eventId = `EVT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const clientPhone = normalizeGhanaPhone(b.clientPhone);
    if (!clientPhone || clientPhone.length < 10) {
      return Response.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const guest_count = b.guestCount ?? null;
    const event_name = b.eventName?.trim() ? b.eventName.trim() : null;
    const isRequest = Boolean(b.isRequest);
    const bookingStatus = isRequest ? ("request" as const) : ("pending" as const);
    const booking_type = isRequest ? "request" : "normal";
    const duration = b.eventDurationHours ?? 3;
    const startInput = b.eventStartTime?.trim() ? b.eventStartTime.trim() : null;
    const event_start_time = eventStartTimeToSqlTime(startInput);

    const packageName = b.packageName?.trim() ? b.packageName.trim() : null;
    const { data: pkg } = packageName
      ? await supabase
          .from("packages")
          .select("price")
          .ilike("name", packageName)
          .maybeSingle()
      : { data: null };

    const insertRow = {
      event_id: eventId,
      client_name: b.clientName.trim(),
      client_email: b.clientEmail.trim(),
      client_phone: clientPhone,
      event_type: b.eventType.trim(),
      event_name,
      event_date: b.eventDate.trim(),
      venue: b.venue.trim(),
      guest_count,
      notes: b.notes?.trim() ? b.notes.trim() : null,
      package_name: packageName,
      package_price: pkg?.price ?? null,
      genres: b.genres ?? [],
      status: bookingStatus,
      payment_status: "unpaid" as const,
      event_start_time_input: startInput,
      event_start_time,
      event_duration_hours: duration,
      booking_type,
      is_company: Boolean(b.isCompany),
      company_name: b.isCompany ? (b.companyName?.trim() ?? null) : null,
      rep_title: b.isCompany ? (b.repTitle?.trim() ?? null) : null,
    };

    const { data, error } = await supabase.from("bookings").insert(insertRow).select("*").single();

    if (error) {
      logger.errorRaw("route", "[api/bookings] Supabase insert error:", error);
      return Response.json({ error: "Failed to create booking. Please try again." }, { status: 500 });
    }

    const row = data as BookingRow;
    logger.infoRaw("route", "[api/bookings] Success:", row.event_id);

    if (!isRequest) {
      await sendNewBookingRequestToDj({
        eventId: row.event_id,
        clientName: b.clientName.trim(),
        clientEmail: b.clientEmail.trim(),
        clientPhone,
        eventType: b.eventType.trim(),
        eventDate: b.eventDate.trim(),
        venue: b.venue.trim(),
        packageName: b.packageName?.trim() ? b.packageName.trim() : null,
      }).catch((err) => logger.errorRaw("route", "[bookings] DJ notify failed:", err));
    } else {
      await notifyAdminsUrgentBookingRequest({
        supabase,
        bookingDbId: row.id,
        eventId: row.event_id,
        clientName: b.clientName.trim(),
        clientPhone,
        eventDate: b.eventDate.trim(),
        eventStartTime: startInput ?? "",
        venue: b.venue.trim(),
        packageName: b.packageName?.trim() ? b.packageName.trim() : null,
      }).catch((err) => logger.errorRaw("route", "[bookings] urgent admin notify failed:", err));
    }

    let clientAuth: ClientAuthProvisionResult = "failed";
    try {
      clientAuth = await provisionClientAuthAfterBooking(supabase, row, insertRow.client_name);
    } catch (authFlowErr) {
      logger.errorRaw("route", "[api/bookings] provisionClientAuthAfterBooking:", authFlowErr);
    }

    return Response.json(
      {
        success: true,
        booking: row,
        eventId: row.event_id,
        clientAuth,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.errorRaw("route", "[api/bookings] Unexpected:", err);
    return Response.json(
      {
        error: "Internal server error",
        details: message,
      },
      { status: 500 },
    );
  }
}
