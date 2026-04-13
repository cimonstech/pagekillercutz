import { createServerClient } from "@/lib/supabase/server";

/** PATCH — merge `full_name` and `phone` into the current session user's Auth metadata. */
export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: string;
      phone?: string;
    };
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: Record<string, string> = {};
    if (typeof body.fullName === "string") {
      data.full_name = body.fullName.trim();
    }
    if (typeof body.phone === "string") {
      data.phone = body.phone.trim();
    }

    if (Object.keys(data).length === 0) {
      return Response.json(
        { error: "Provide fullName and/or phone" },
        { status: 400 },
      );
    }

    const { data: updated, error } = await supabase.auth.updateUser({
      data,
    });

    if (error) throw error;

    return Response.json({ success: true, user: updated.user });
  } catch (err) {
    console.error("[api/auth/update-profile]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
