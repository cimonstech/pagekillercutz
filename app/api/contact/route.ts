import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase";

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function POST(request: Request) {
  try {
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
