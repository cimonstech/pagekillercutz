import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { z } from "zod";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

const submitSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: z.string().max(2000).optional(),
});

const moderateSchema = z.object({
  status: z.enum(["approved", "hidden", "rejected"]),
  hiddenReason: z.string().max(400).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> },
) {
  try {
    const { identifier } = await params;
    const token = identifier.trim();
    if (!token) return Response.json({ error: "Invalid token" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (error) throw error;
    const review = data as ReviewRow | null;
    if (!review) return Response.json({ error: "Review link not found" }, { status: 404 });

    if (!review.token_expires_at || new Date(review.token_expires_at).getTime() < Date.now()) {
      return Response.json({ error: "Review link expired" }, { status: 410 });
    }

    const alreadySubmitted = typeof review.rating === "number" && review.rating >= 1;
    return Response.json({
      review: {
        token: review.token,
        clientName: review.client_name,
        firstName: review.client_name.trim().split(/\s+/)[0] ?? "Client",
        eventType: review.event_type,
        eventMonth: review.event_month,
        rating: review.rating,
        reviewText: review.review_text,
        alreadySubmitted,
      },
    });
  } catch (error) {
    logger.errorRaw("route", "[api/reviews/[identifier]] GET:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> },
) {
  try {
    const { identifier } = await params;
    const token = identifier.trim();
    if (!token) return Response.json({ error: "Invalid token" }, { status: 400 });

    const body = submitSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (error) throw error;
    const review = data as ReviewRow | null;
    if (!review) return Response.json({ error: "Review link not found" }, { status: 404 });
    if (!review.token_expires_at || new Date(review.token_expires_at).getTime() < Date.now()) {
      return Response.json({ error: "Review link expired" }, { status: 410 });
    }
    if (typeof review.rating === "number" && review.rating >= 1) {
      return Response.json({ error: "Review already submitted" }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        rating: body.rating,
        review_text: body.reviewText?.trim() || null,
        status: "pending",
      })
      .eq("id", review.id);
    if (updateError) throw updateError;

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    logger.errorRaw("route", "[api/reviews/[identifier]] POST:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.errorResponse;

    const { identifier } = await params;
    const id = identifier.trim();
    if (!id) return Response.json({ error: "Invalid review id" }, { status: 400 });

    const body = moderateSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("reviews")
      .update({
        status: body.status,
        hidden_reason: body.status === "hidden" ? body.hiddenReason?.trim() || null : null,
        reviewed_by: auth.email,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;

    await supabase.from("audit_logs").insert({
      actor: auth.email,
      actor_role: auth.role,
      action_type: "review",
      description: `Review ${id} marked as ${body.status}`,
      target_id: id,
      ip_address: null,
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    logger.errorRaw("route", "[api/reviews/[identifier]] PATCH:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
