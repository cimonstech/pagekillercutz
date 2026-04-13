import { authCallbackUrl, getPublicSiteUrl } from "@/lib/auth/site-url";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/notify/email";
import { accountSetupEmail, bookingRequestReceivedEmail } from "@/lib/notify/emailTemplates";
import { sendNewBookingRequestToDj } from "@/lib/notify/newBookingRequest";
import { sendSMS } from "@/lib/notify/sms";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

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
  void sendSMS(row.client_phone, smsBody).then((r) => {
    if (!r.success) logger.errorRaw("route", "[api/bookings] client SMS:", r.error ?? "unknown");
  });

  return "invite_sent";
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
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = Number(searchParams.get("limit") ?? "20");
    const offset = Number(searchParams.get("offset") ?? "0");

    let query = supabase
      .from("bookings")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status as BookingRow["status"]);
    }
    if (search) query = query.or(`client_name.ilike.%${search}%,client_email.ilike.%${search}%,event_id.ilike.%${search}%`);

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
    const body = (await request.json()) as Record<string, unknown>;
    console.log("[api/bookings] Received body:", JSON.stringify(body, null, 2));

    const supabase = getSupabaseAdmin();

    const eventId = `EVT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    console.log("[api/bookings] Generated Event ID:", eventId);

    const required = [
      "clientName",
      "clientEmail",
      "clientPhone",
      "eventType",
      "eventDate",
      "venue",
    ] as const;

    for (const field of required) {
      const v = body[field];
      if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
        console.error("[api/bookings] Missing field:", field);
        return Response.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const clientPhone = normalizeGhanaPhone(String(body.clientPhone));
    if (!clientPhone || clientPhone.length < 10) {
      console.error("[api/bookings] Invalid clientPhone after normalize:", body.clientPhone);
      return Response.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const guestRaw = body.guestCount;
    let guest_count: number | null = null;
    if (guestRaw !== undefined && guestRaw !== null && guestRaw !== "") {
      const n = parseInt(String(guestRaw), 10);
      guest_count = Number.isFinite(n) ? n : null;
    }

    const eventNameRaw = body.eventName;
    const event_name =
      typeof eventNameRaw === "string" && eventNameRaw.trim() ? eventNameRaw.trim() : null;

    const insertRow = {
      event_id: eventId,
      client_name: String(body.clientName).trim(),
      client_email: String(body.clientEmail).trim(),
      client_phone: clientPhone,
      event_type: String(body.eventType).trim(),
      event_name,
      event_date: String(body.eventDate).trim(),
      venue: String(body.venue).trim(),
      guest_count,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
      package_name:
        typeof body.packageName === "string" && body.packageName.trim()
          ? body.packageName.trim()
          : null,
      genres: Array.isArray(body.genres) ? (body.genres as string[]) : [],
      status: "pending" as const,
      payment_status: "unpaid" as const,
    };

    console.log("[api/bookings] Inserting into Supabase...", insertRow);

    const { data, error } = await supabase.from("bookings").insert(insertRow).select("*").single();

    if (error) {
      console.error("[api/bookings] Supabase insert error:", JSON.stringify(error, null, 2));
      return Response.json(
        {
          error: "Database error",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      );
    }

    const row = data as BookingRow;
    console.log("[api/bookings] Success:", row.event_id);

    void sendNewBookingRequestToDj({
      eventId: row.event_id,
      clientName: String(body.clientName).trim(),
      clientEmail: String(body.clientEmail).trim(),
      clientPhone,
      eventType: String(body.eventType).trim(),
      eventDate: String(body.eventDate).trim(),
      venue: String(body.venue).trim(),
      packageName:
        typeof body.packageName === "string" && body.packageName.trim()
          ? body.packageName.trim()
          : null,
    }).catch((err) => console.error("[bookings] DJ notify failed:", err));

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
    console.error("[api/bookings] Unexpected error:", err);
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
