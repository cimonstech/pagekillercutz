import { logger } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { getSupabaseAdmin } from "@/lib/supabase";

const contactLimiter = rateLimit({
  interval: 60 * 60 * 1000,
  limit: 5,
});

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success } = contactLimiter.check(ip);
    if (!success) {
      return Response.json(
        { error: "Too many messages. Please try again in an hour." },
        { status: 429, headers: { "Retry-After": "3600" } },
      );
    }

    const body = (await request.json()) as ContactPayload;

    if (!body.name || !body.email || !body.message) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("contact_messages").insert({
      name: body.name,
      email: body.email,
      subject: body.subject ?? "General Inquiry",
      message: body.message,
    });

    if (error) {
      // If the table doesn't exist yet, log but don't surface internal error
      logger.errorRaw("route", "[api/contact] Supabase insert error:", error);
    }

    return Response.json({ success: true });
  } catch (err) {
    logger.errorRaw("route", "[api/contact] Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
